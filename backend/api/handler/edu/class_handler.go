/*
 * Copyright 2025 coze-dev Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package edu

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"

	edumodel "github.com/coze-dev/coze-studio/backend/api/model/edu"
	"github.com/coze-dev/coze-studio/backend/domain/educlass/entity"
	classrepo "github.com/coze-dev/coze-studio/backend/domain/educlass/repository"
	"github.com/coze-dev/coze-studio/backend/infra/database/repository"
	"github.com/coze-dev/coze-studio/backend/pkg/logs"
)

var classRepo classrepo.ClassRepository

func initClassRepo() error {
	if db == nil {
		if err := InitDB(); err != nil {
			return fmt.Errorf("init database failed: %w", err)
		}
	}
	if classRepo == nil {
		classRepo = repository.NewClassRepository(db)
		logs.Infof("[edu] Class repository initialized")
	}
	return nil
}

// CreateClass 创建班级
// @router /api/space/:space_id/edu/classes [POST]
func CreateClass(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.CreateClassResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 space_id
	spaceID, err := getSpaceIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.CreateClassResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 获取当前用户ID（从context或session获取）
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(consts.StatusUnauthorized, edumodel.CreateClassResponse{
			Code: 401,
			Msg:  "未授权",
		})
		return
	}

	// 绑定并验证请求
	var req edumodel.CreateClassRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.CreateClassResponse{
			Code: 400,
			Msg:  fmt.Sprintf("参数错误: %v", err),
		})
		return
	}

	// 检查班级代码是否已存在
	existingClass, _ := classRepo.GetByCode(ctx, req.Code)
	if existingClass != nil {
		c.JSON(consts.StatusBadRequest, edumodel.CreateClassResponse{
			Code: 400,
			Msg:  "班级代码已存在",
		})
		return
	}

	// 解析日期
	var startDate, endDate *time.Time
	if req.StartDate != nil {
		t, err := time.Parse("2006-01-02", *req.StartDate)
		if err == nil {
			startDate = &t
		}
	}
	if req.EndDate != nil {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			endDate = &t
		}
	}

	// 创建班级实体
	class := &entity.Class{
		SpaceID:     spaceID,
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		TeacherID:   userID,
		Semester:    req.Semester,
		StartDate:   startDate,
		EndDate:     endDate,
		Status:      entity.ClassStatusActive,
	}

	// 保存到数据库
	if err := classRepo.Create(ctx, class); err != nil {
		logs.Errorf("[edu] Failed to create class: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.CreateClassResponse{
			Code: 500,
			Msg:  "创建班级失败",
		})
		return
	}

	// 自动添加教师为班级成员
	member := &entity.ClassMember{
		ClassID:  class.ID,
		UserID:   userID,
		Role:     entity.MemberRoleTeacher,
	}
	if err := classRepo.AddMember(ctx, member); err != nil {
		logs.Warnf("[edu] Failed to add teacher as member: %v", err)
	}

	// 返回成功响应
	c.JSON(consts.StatusOK, edumodel.CreateClassResponse{
		Code: 0,
		Msg:  "success",
		Data: convertClassToInfo(class),
	})
}

// GetMyClasses 获取我教的班级列表
// @router /api/space/:space_id/edu/classes/my [GET]
func GetMyClasses(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.GetMyClassesResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 space_id
	spaceID, err := getSpaceIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetMyClassesResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 获取当前用户ID
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(consts.StatusUnauthorized, edumodel.GetMyClassesResponse{
			Code: 401,
			Msg:  "未授权",
		})
		return
	}

	// 查询班级列表
	classes, err := classRepo.GetByTeacherID(ctx, userID, spaceID)
	if err != nil {
		logs.Errorf("[edu] Failed to get classes: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.GetMyClassesResponse{
			Code: 500,
			Msg:  "获取班级列表失败",
		})
		return
	}

	// 转换为响应格式
	items := make([]*edumodel.ClassItem, 0, len(classes))
	for _, class := range classes {
		// 获取学生人数
		members, _ := classRepo.GetMembers(ctx, class.ID, entity.MemberRoleStudent)
		studentCount := len(members)

		items = append(items, &edumodel.ClassItem{
			ID:           class.ID,
			Name:         class.Name,
			Code:         class.Code,
			Description:  class.Description,
			Semester:     class.Semester,
			StudentCount: studentCount,
			MemberCount:  studentCount, // 兼容前端字段
			Status:       class.Status,
			CreatedAt:    class.CreatedAt.Format(time.RFC3339),
		})
	}

	c.JSON(consts.StatusOK, edumodel.GetMyClassesResponse{
		Code: 0,
		Msg:  "success",
		Data: &edumodel.ClassListData{
			List:  items,
			Total: len(items),
		},
	})
}

// GetClass 获取班级详情
// @router /api/space/:space_id/edu/classes/:class_id [GET]
func GetClass(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.GetClassResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 class_id
	classID, err := getClassIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetClassResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 查询班级信息
	class, err := classRepo.GetByID(ctx, classID)
	if err != nil {
		logs.Errorf("[edu] Failed to get class: %v", err)
		c.JSON(consts.StatusNotFound, edumodel.GetClassResponse{
			Code: 404,
			Msg:  "班级不存在",
		})
		return
	}

	c.JSON(consts.StatusOK, edumodel.GetClassResponse{
		Code: 0,
		Msg:  "success",
		Data: convertClassToInfo(class),
	})
}

// UpdateClass 更新班级信息
// @router /api/space/:space_id/edu/classes/:class_id [PUT]
func UpdateClass(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.UpdateClassResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 class_id
	classID, err := getClassIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.UpdateClassResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 获取当前用户ID
	userID := getUserIDFromContext(c)

	// 查询班级信息
	class, err := classRepo.GetByID(ctx, classID)
	if err != nil {
		c.JSON(consts.StatusNotFound, edumodel.UpdateClassResponse{
			Code: 404,
			Msg:  "班级不存在",
		})
		return
	}

	// 权限检查：只有教师可以更新
	if class.TeacherID != userID {
		c.JSON(consts.StatusForbidden, edumodel.UpdateClassResponse{
			Code: 403,
			Msg:  "无权限",
		})
		return
	}

	// 绑定请求
	var req edumodel.UpdateClassRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.UpdateClassResponse{
			Code: 400,
			Msg:  fmt.Sprintf("参数错误: %v", err),
		})
		return
	}

	// 更新字段
	if req.Name != nil {
		class.Name = *req.Name
	}
	if req.Description != nil {
		class.Description = *req.Description
	}
	if req.Semester != nil {
		class.Semester = *req.Semester
	}
	if req.Status != nil {
		class.Status = *req.Status
	}
	if req.StartDate != nil {
		t, _ := time.Parse("2006-01-02", *req.StartDate)
		class.StartDate = &t
	}
	if req.EndDate != nil {
		t, _ := time.Parse("2006-01-02", *req.EndDate)
		class.EndDate = &t
	}

	// 保存更新
	if err := classRepo.Update(ctx, class); err != nil {
		logs.Errorf("[edu] Failed to update class: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.UpdateClassResponse{
			Code: 500,
			Msg:  "更新班级失败",
		})
		return
	}

	c.JSON(consts.StatusOK, edumodel.UpdateClassResponse{
		Code: 0,
		Msg:  "success",
		Data: convertClassToInfo(class),
	})
}

// AddClassMembers 添加班级成员
// @router /api/space/:space_id/edu/classes/:class_id/members [POST]
func AddClassMembers(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.AddClassMembersResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 class_id
	classID, err := getClassIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.AddClassMembersResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 绑定请求
	var req edumodel.AddClassMembersRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.AddClassMembersResponse{
			Code: 400,
			Msg:  fmt.Sprintf("参数错误: %v", err),
		})
		return
	}

	// 转换为实体
	members := make([]*entity.ClassMember, 0, len(req.Members))
	failedUsers := make([]int64, 0)
	successCount := 0

	for _, input := range req.Members {
		// 检查用户是否已经是成员
		existing, _ := classRepo.GetMemberByUserID(ctx, classID, input.UserID)
		if existing != nil {
			failedUsers = append(failedUsers, input.UserID)
			continue
		}

		members = append(members, &entity.ClassMember{
			ClassID:   classID,
			UserID:    input.UserID,
			Role:      input.Role,
			StudentNo: input.StudentNo,
		})
	}

	// 批量添加
	if len(members) > 0 {
		if err := classRepo.BatchAddMembers(ctx, members); err != nil {
			logs.Errorf("[edu] Failed to add members: %v", err)
			c.JSON(consts.StatusInternalServerError, edumodel.AddClassMembersResponse{
				Code: 500,
				Msg:  "添加成员失败",
			})
			return
		}
		successCount = len(members)
	}

	c.JSON(consts.StatusOK, edumodel.AddClassMembersResponse{
		Code: 0,
		Msg:  "success",
		Data: &edumodel.AddMembersResultData{
			Success:     successCount,
			Failed:      len(failedUsers),
			FailedUsers: failedUsers,
		},
	})
}

// GetClassMembers 获取班级成员列表
// @router /api/space/:space_id/edu/classes/:class_id/members [GET]
func GetClassMembers(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.GetClassMembersResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 class_id
	classID, err := getClassIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetClassMembersResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 获取查询参数
	var req edumodel.GetClassMembersRequest
	c.BindAndValidate(&req)

	// 查询成员列表
	members, err := classRepo.GetMembers(ctx, classID, req.Role)
	if err != nil {
		logs.Errorf("[edu] Failed to get members: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.GetClassMembersResponse{
			Code: 500,
			Msg:  "获取成员列表失败",
		})
		return
	}

	// 转换为响应格式
	items := make([]*edumodel.MemberInfo, 0, len(members))
	for _, member := range members {
		items = append(items, &edumodel.MemberInfo{
			ID:        member.ID,
			UserID:    member.UserID,
			Role:      member.Role,
			StudentNo: member.StudentNo,
			JoinedAt:  member.JoinedAt.Format(time.RFC3339),
		})
	}

	c.JSON(consts.StatusOK, edumodel.GetClassMembersResponse{
		Code: 0,
		Msg:  "success",
		Data: items,
	})
}

// RemoveClassMember 移除班级成员
// @router /api/space/:space_id/edu/classes/:class_id/members/:user_id [DELETE]
func RemoveClassMember(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.RemoveClassMemberResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 class_id
	classID, err := getClassIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.RemoveClassMemberResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 获取 user_id
	userIDStr := c.Param("user_id")
	var userID int64
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.RemoveClassMemberResponse{
			Code: 400,
			Msg:  "user_id 参数错误",
		})
		return
	}

	// 移除成员
	if err := classRepo.RemoveMember(ctx, classID, userID); err != nil {
		logs.Errorf("[edu] Failed to remove member: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.RemoveClassMemberResponse{
			Code: 500,
			Msg:  "移除成员失败",
		})
		return
	}

	c.JSON(consts.StatusOK, edumodel.RemoveClassMemberResponse{
		Code: 0,
		Msg:  "success",
	})
}

// CreateInviteCode 创建邀请码
// @router /api/space/:space_id/edu/classes/:class_id/invite-codes [POST]
func CreateInviteCode(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.CreateInviteCodeResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 class_id
	classID, err := getClassIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.CreateInviteCodeResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 获取当前用户ID
	userID := getUserIDFromContext(c)

	// 绑定请求
	var req edumodel.CreateInviteCodeRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.CreateInviteCodeResponse{
			Code: 400,
			Msg:  fmt.Sprintf("参数错误: %v", err),
		})
		return
	}

	// 生成邀请码
	code := generateInviteCode()

	// 解析过期时间
	var expiresAt *time.Time
	if req.ExpiresAt != nil {
		t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err == nil {
			expiresAt = &t
		}
	}

	// 创建邀请码实体
	inviteCode := &entity.ClassInviteCode{
		ClassID:   classID,
		Code:      code,
		Role:      req.Role,
		MaxUses:   req.MaxUses,
		UsedCount: 0,
		ExpiresAt: expiresAt,
		CreatedBy: userID,
	}

	// 保存到数据库
	if err := classRepo.CreateInviteCode(ctx, inviteCode); err != nil {
		logs.Errorf("[edu] Failed to create invite code: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.CreateInviteCodeResponse{
			Code: 500,
			Msg:  "创建邀请码失败",
		})
		return
	}

	c.JSON(consts.StatusOK, edumodel.CreateInviteCodeResponse{
		Code: 0,
		Msg:  "success",
		Data: convertInviteCodeToInfo(inviteCode),
	})
}

// GetInviteCodes 获取班级邀请码列表
// @router /api/space/:space_id/edu/classes/:class_id/invite-codes [GET]
func GetInviteCodes(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.GetInviteCodesResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 class_id
	classID, err := getClassIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetInviteCodesResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 查询邀请码列表
	codes, err := classRepo.GetInviteCodesByClassID(ctx, classID)
	if err != nil {
		logs.Errorf("[edu] Failed to get invite codes: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.GetInviteCodesResponse{
			Code: 500,
			Msg:  "获取邀请码列表失败",
		})
		return
	}

	// 转换为响应格式
	items := make([]*edumodel.InviteCodeInfo, 0, len(codes))
	for _, code := range codes {
		items = append(items, convertInviteCodeToInfo(code))
	}

	c.JSON(consts.StatusOK, edumodel.GetInviteCodesResponse{
		Code: 0,
		Msg:  "success",
		Data: items,
	})
}

// ==================== 辅助函数 ====================

func getSpaceIDFromParam(c *app.RequestContext) (int64, error) {
	spaceIDStr := c.Param("space_id")
	if spaceIDStr == "" {
		return 0, fmt.Errorf("space_id is required")
	}
	var spaceID int64
	if _, err := fmt.Sscanf(spaceIDStr, "%d", &spaceID); err != nil {
		return 0, fmt.Errorf("invalid space_id")
	}
	return spaceID, nil
}

func getClassIDFromParam(c *app.RequestContext) (int64, error) {
	classIDStr := c.Param("class_id")
	if classIDStr == "" {
		return 0, fmt.Errorf("class_id is required")
	}
	var classID int64
	if _, err := fmt.Sscanf(classIDStr, "%d", &classID); err != nil {
		return 0, fmt.Errorf("invalid class_id")
	}
	return classID, nil
}

func getUserIDFromContext(c *app.RequestContext) int64 {
	// TODO: 从 session 或 JWT token 中获取用户ID
	// 暂时返回固定值用于测试
	return 1
}

func generateInviteCode() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func convertClassToInfo(class *entity.Class) *edumodel.ClassInfo {
	info := &edumodel.ClassInfo{
		ID:          class.ID,
		SpaceID:     class.SpaceID,
		Name:        class.Name,
		Code:        class.Code,
		Description: class.Description,
		TeacherID:   class.TeacherID,
		Semester:    class.Semester,
		Status:      class.Status,
		CreatedAt:   class.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   class.UpdatedAt.Format(time.RFC3339),
	}

	if class.TeamSpaceID != 0 {
		info.TeamSpaceID = &class.TeamSpaceID
	}

	if class.StartDate != nil {
		dateStr := class.StartDate.Format("2006-01-02")
		info.StartDate = &dateStr
	}
	if class.EndDate != nil {
		dateStr := class.EndDate.Format("2006-01-02")
		info.EndDate = &dateStr
	}

	return info
}

func convertInviteCodeToInfo(code *entity.ClassInviteCode) *edumodel.InviteCodeInfo {
	info := &edumodel.InviteCodeInfo{
		ID:        code.ID,
		ClassID:   code.ClassID,
		Code:      code.Code,
		Role:      code.Role,
		MaxUses:   code.MaxUses,
		UsedCount: code.UsedCount,
		CreatedBy: code.CreatedBy,
		CreatedAt: code.CreatedAt.Format(time.RFC3339),
	}

	if code.ExpiresAt != nil {
		expiresStr := code.ExpiresAt.Format(time.RFC3339)
		info.ExpiresAt = &expiresStr
	}

	return info
}

// JoinClass 学生使用邀请码加入班级
// @router /api/space/:space_id/edu/classes/join [POST]
func JoinClass(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.JoinClassByCodeResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 space_id
	spaceID, err := getSpaceIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.JoinClassByCodeResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 获取当前用户ID
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(consts.StatusUnauthorized, edumodel.JoinClassByCodeResponse{
			Code: 401,
			Msg:  "未授权",
		})
		return
	}

	// 绑定并验证请求
	var req edumodel.JoinClassByCodeRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.JoinClassByCodeResponse{
			Code: 400,
			Msg:  fmt.Sprintf("参数错误: %v", err),
		})
		return
	}

	// 验证邀请码
	inviteCode, err := classRepo.GetInviteCodeByCode(ctx, req.InviteCode)
	if err != nil || inviteCode == nil {
		c.JSON(consts.StatusBadRequest, edumodel.JoinClassByCodeResponse{
			Code: 400,
			Msg:  "邀请码无效",
		})
		return
	}

	// 检查邀请码是否过期
	if inviteCode.ExpiresAt != nil && inviteCode.ExpiresAt.Before(time.Now()) {
		c.JSON(consts.StatusBadRequest, edumodel.JoinClassByCodeResponse{
			Code: 400,
			Msg:  "邀请码已过期",
		})
		return
	}

	// 检查邀请码使用次数
	if inviteCode.MaxUses > 0 && inviteCode.UsedCount >= inviteCode.MaxUses {
		c.JSON(consts.StatusBadRequest, edumodel.JoinClassByCodeResponse{
			Code: 400,
			Msg:  "邀请码已达最大使用次数",
		})
		return
	}

	// 获取班级信息
	class, err := classRepo.GetByID(ctx, inviteCode.ClassID)
	if err != nil || class == nil {
		c.JSON(consts.StatusNotFound, edumodel.JoinClassByCodeResponse{
			Code: 404,
			Msg:  "班级不存在",
		})
		return
	}

	// 检查班级是否在当前space
	if class.SpaceID != spaceID {
		c.JSON(consts.StatusBadRequest, edumodel.JoinClassByCodeResponse{
			Code: 400,
			Msg:  "班级不属于当前空间",
		})
		return
	}

	// 检查用户是否已经在班级中
	existingMembers, _ := classRepo.GetMembers(ctx, class.ID, "")
	for _, member := range existingMembers {
		if member.UserID == userID {
			c.JSON(consts.StatusBadRequest, edumodel.JoinClassByCodeResponse{
				Code: 400,
				Msg:  "您已经在该班级中",
			})
			return
		}
	}

	// 添加成员到班级
	member := &entity.ClassMember{
		ClassID:   class.ID,
		UserID:    userID,
		Role:      inviteCode.Role, // 使用邀请码指定的角色
		StudentNo: req.StudentNo,
		JoinedAt:  time.Now(),
	}

	if err := classRepo.AddClassMember(ctx, member); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.JoinClassByCodeResponse{
			Code: 500,
			Msg:  fmt.Sprintf("加入班级失败: %v", err),
		})
		return
	}

	// 更新邀请码使用次数
	inviteCode.UsedCount++
	if err := classRepo.UpdateInviteCode(ctx, inviteCode); err != nil {
		logs.Warnf("[edu] Failed to update invite code used count: %v", err)
	}

	// 返回班级信息
	classInfo := convertClassToInfo(class)
	c.JSON(consts.StatusOK, edumodel.JoinClassByCodeResponse{
		Code: 0,
		Msg:  "加入班级成功",
		Data: classInfo,
	})
}

// GetStudentClasses 获取学生已加入的班级列表
// @router /api/space/:space_id/edu/student/classes [GET]
func GetStudentClasses(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.GetMyClassesResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 space_id
	spaceID, err := getSpaceIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetMyClassesResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// 获取当前用户ID
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(consts.StatusUnauthorized, edumodel.GetMyClassesResponse{
			Code: 401,
			Msg:  "未授权",
		})
		return
	}

	// 获取学生作为成员的所有班级
	classes, err := classRepo.GetClassesByMemberID(ctx, userID, spaceID)
	if err != nil {
		logs.Errorf("[edu] Failed to get student classes: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.GetMyClassesResponse{
			Code: 500,
			Msg:  "获取班级列表失败",
		})
		return
	}

	// 构建响应数据
	classItems := make([]*edumodel.ClassItem, 0, len(classes))
	for _, class := range classes {
		// 获取班级成员数
		members, _ := classRepo.GetMembers(ctx, class.ID, "")
		studentCount := 0
		for _, member := range members {
			if member.Role == "student" {
				studentCount++
			}
		}

		classItem := &edumodel.ClassItem{
			ID:           class.ID,
			Name:         class.Name,
			Code:         class.Code,
			Description:  class.Description,
			Semester:     class.Semester,
			StudentCount: studentCount,
			MemberCount:  len(members),
			Status:       class.Status,
			CreatedAt:    class.CreatedAt.Format(time.RFC3339),
		}
		classItems = append(classItems, classItem)
	}

	// 返回成功响应
	c.JSON(consts.StatusOK, edumodel.GetMyClassesResponse{
		Code: 0,
		Msg:  "success",
		Data: &edumodel.ClassListData{
			List:  classItems,
			Total: len(classItems),
		},
	})
}

// GetStudentClassDetail 获取学生班级详情（学生视角）
// @router /api/space/:space_id/edu/student/classes/:class_id [GET]
func GetStudentClassDetail(ctx context.Context, c *app.RequestContext) {
	// 初始化 repository
	if err := initClassRepo(); err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.StudentClassDetailResponse{
			Code: 500,
			Msg:  "初始化失败",
		})
		return
	}

	// 获取 space_id 和 class_id
	spaceID, err := getSpaceIDFromParam(c)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.StudentClassDetailResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	classID, err := getInt64Param(c, "class_id")
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.StudentClassDetailResponse{
			Code: 400,
			Msg:  "无效的班级ID",
		})
		return
	}

	// 获取当前用户ID
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(consts.StatusUnauthorized, edumodel.StudentClassDetailResponse{
			Code: 401,
			Msg:  "未授权",
		})
		return
	}

	// 获取班级信息
	class, err := classRepo.GetByID(ctx, classID)
	if err != nil || class == nil {
		c.JSON(consts.StatusNotFound, edumodel.StudentClassDetailResponse{
			Code: 404,
			Msg:  "班级不存在",
		})
		return
	}

	// 检查班级是否在当前space
	if class.SpaceID != spaceID {
		c.JSON(consts.StatusBadRequest, edumodel.StudentClassDetailResponse{
			Code: 400,
			Msg:  "班级不属于当前空间",
		})
		return
	}

	// 验证学生是否在该班级中
	member, err := classRepo.GetMemberByUserID(ctx, classID, userID)
	if err != nil || member == nil {
		c.JSON(consts.StatusForbidden, edumodel.StudentClassDetailResponse{
			Code: 403,
			Msg:  "您不是该班级的成员",
		})
		return
	}

	// 获取班级成员列表
	members, err := classRepo.GetMembers(ctx, classID, "")
	if err != nil {
		logs.Warnf("[edu] Failed to get class members: %v", err)
		members = []*entity.ClassMember{} // 如果获取失败，返回空列表
	}

	// 构建成员信息列表
	memberInfos := make([]*edumodel.MemberInfo, 0, len(members))
	for _, m := range members {
		memberInfo := &edumodel.MemberInfo{
			ID:        m.ID,
			UserID:    m.UserID,
			UserName:  m.UserName,
			UserEmail: m.UserEmail,
			Role:      m.Role,
			StudentNo: m.StudentNo,
			JoinedAt:  m.JoinedAt.Format(time.RFC3339),
		}
		memberInfos = append(memberInfos, memberInfo)
	}

	// 返回班级信息和成员列表
	classInfo := convertClassToInfo(class)
	c.JSON(consts.StatusOK, edumodel.StudentClassDetailResponse{
		Code: 0,
		Msg:  "success",
		Data: &edumodel.StudentClassDetailData{
			Class:   classInfo,
			Members: memberInfos,
		},
	})
}
