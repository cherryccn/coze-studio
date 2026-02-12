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

// ==================== 创建班级 ====================

// CreateClassRequest 创建班级请求
type CreateClassRequest struct {
	Name        string  `json:"name" vd:"len($)>0&&len($)<=100"`              // 班级名称
	Code        string  `json:"code" vd:"len($)>0&&len($)<=50"`               // 班级代码
	Description string  `json:"description"`                                  // 班级描述
	Semester    string  `json:"semester"`                                     // 学期
	StartDate   *string `json:"start_date"`                                   // 开课日期 (YYYY-MM-DD)
	EndDate     *string `json:"end_date"`                                     // 结课日期 (YYYY-MM-DD)
}

// CreateClassResponse 创建班级响应
type CreateClassResponse struct {
	Code int        `json:"code"`
	Msg  string     `json:"msg"`
	Data *ClassInfo `json:"data"`
}

// ClassInfo 班级信息
type ClassInfo struct {
	ID          int64   `json:"id"`
	SpaceID     int64   `json:"space_id"`
	Name        string  `json:"name"`
	Code        string  `json:"code"`
	Description string  `json:"description"`
	TeacherID   int64   `json:"teacher_id"`
	TeamSpaceID *int64  `json:"team_space_id,omitempty"`
	Semester    string  `json:"semester"`
	StartDate   *string `json:"start_date,omitempty"`
	EndDate     *string `json:"end_date,omitempty"`
	Status      string  `json:"status"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

// ==================== 获取班级列表 ====================

// GetMyClassesResponse 获取我的班级列表响应
type GetMyClassesResponse struct {
	Code int              `json:"code"`
	Msg  string           `json:"msg"`
	Data *ClassListData   `json:"data"`
}

// ClassListData 班级列表数据
type ClassListData struct {
	List  []*ClassItem `json:"list"`   // 班级列表
	Total int          `json:"total"`  // 总数
}

// ClassItem 班级项
type ClassItem struct {
	ID            int64  `json:"id"`
	Name          string `json:"name"`
	Code          string `json:"code"`
	Description   string `json:"description"`
	Semester      string `json:"semester"`
	StudentCount  int    `json:"student_count"`  // 学生人数
	MemberCount   int    `json:"memberCount"`    // 成员总数（兼容前端字段）
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
}

// ==================== 获取班级详情 ====================

// GetClassResponse 获取班级详情响应
type GetClassResponse struct {
	Code int        `json:"code"`
	Msg  string     `json:"msg"`
	Data *ClassInfo `json:"data"`
}

// ==================== 更新班级信息 ====================

// UpdateClassRequest 更新班级信息请求
type UpdateClassRequest struct {
	Name        *string `json:"name" vd:"len($)<=100"`     // 班级名称
	Description *string `json:"description"`               // 班级描述
	Semester    *string `json:"semester"`                  // 学期
	StartDate   *string `json:"start_date"`                // 开课日期
	EndDate     *string `json:"end_date"`                  // 结课日期
	Status      *string `json:"status" vd:"in($,'active','archived')"` // 状态
}

// UpdateClassResponse 更新班级信息响应
type UpdateClassResponse struct {
	Code int        `json:"code"`
	Msg  string     `json:"msg"`
	Data *ClassInfo `json:"data"`
}

// ==================== 添加班级成员 ====================

// AddClassMembersRequest 添加班级成员请求
type AddClassMembersRequest struct {
	Members []ClassMemberInput `json:"members" vd:"len($)>0"` // 成员列表
}

// ClassMemberInput 班级成员输入
type ClassMemberInput struct {
	UserID    int64  `json:"user_id" vd:"$>0"`                           // 用户ID
	Role      string `json:"role" vd:"in($,'student','assistant')"`      // 角色
	StudentNo string `json:"student_no"`                                 // 学号（可选）
}

// AddClassMembersResponse 添加班级成员响应
type AddClassMembersResponse struct {
	Code int                   `json:"code"`
	Msg  string                `json:"msg"`
	Data *AddMembersResultData `json:"data"`
}

// AddMembersResultData 添加成员结果数据
type AddMembersResultData struct {
	Success      int      `json:"success"`       // 成功添加数量
	Failed       int      `json:"failed"`        // 失败数量
	FailedUsers  []int64  `json:"failed_users"`  // 失败的用户ID列表
}

// ==================== 获取班级成员 ====================

// GetClassMembersRequest 获取班级成员请求
type GetClassMembersRequest struct {
	Role string `json:"role" query:"role"` // 角色筛选（可选）
}

// GetClassMembersResponse 获取班级成员响应
type GetClassMembersResponse struct {
	Code int            `json:"code"`
	Msg  string         `json:"msg"`
	Data []*MemberInfo  `json:"data"`
}

// MemberInfo 成员信息
type MemberInfo struct {
	ID        int64  `json:"id"`
	UserID    int64  `json:"user_id"`
	Role      string `json:"role"`
	StudentNo string `json:"student_no,omitempty"`
	JoinedAt  string `json:"joined_at"`
	// 可以扩展用户基本信息（需要关联 user 表）
	UserName  string `json:"user_name,omitempty"`
	UserEmail string `json:"user_email,omitempty"`
}

// ==================== 移除班级成员 ====================

// RemoveClassMemberRequest 移除班级成员请求
type RemoveClassMemberRequest struct {
	UserID int64 `json:"user_id" vd:"$>0"` // 用户ID
}

// RemoveClassMemberResponse 移除班级成员响应
type RemoveClassMemberResponse struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
}

// ==================== 创建邀请码 ====================

// CreateInviteCodeRequest 创建邀请码请求
type CreateInviteCodeRequest struct {
	Role      string  `json:"role" vd:"in($,'student','assistant')"`  // 角色
	MaxUses   int     `json:"max_uses"`                               // 最大使用次数，0表示无限制
	ExpiresAt *string `json:"expires_at"`                             // 过期时间 (ISO 8601格式)
}

// CreateInviteCodeResponse 创建邀请码响应
type CreateInviteCodeResponse struct {
	Code int             `json:"code"`
	Msg  string          `json:"msg"`
	Data *InviteCodeInfo `json:"data"`
}

// InviteCodeInfo 邀请码信息
type InviteCodeInfo struct {
	ID        int64   `json:"id"`
	ClassID   int64   `json:"class_id"`
	Code      string  `json:"code"`
	Role      string  `json:"role"`
	MaxUses   int     `json:"max_uses"`
	UsedCount int     `json:"used_count"`
	ExpiresAt *string `json:"expires_at,omitempty"`
	CreatedBy int64   `json:"created_by"`
	CreatedAt string  `json:"created_at"`
}

// ==================== 获取班级邀请码列表 ====================

// GetInviteCodesResponse 获取邀请码列表响应
type GetInviteCodesResponse struct {
	Code int               `json:"code"`
	Msg  string            `json:"msg"`
	Data []*InviteCodeInfo `json:"data"`
}

// ==================== 通过邀请码加入班级 ====================

// JoinClassByCodeRequest 通过邀请码加入班级请求
type JoinClassByCodeRequest struct {
	InviteCode string `json:"invite_code" vd:"len($)>0"` // 邀请码
	StudentNo  string `json:"student_no"`                // 学号（可选）
}

// JoinClassByCodeResponse 通过邀请码加入班级响应
type JoinClassByCodeResponse struct {
	Code int        `json:"code"`
	Msg  string     `json:"msg"`
	Data *ClassInfo `json:"data"`
}

// ==================== 学生班级详情（含成员列表） ====================

// StudentClassDetailResponse 学生班级详情响应
type StudentClassDetailResponse struct {
	Code int                   `json:"code"`
	Msg  string                `json:"msg"`
	Data *StudentClassDetailData `json:"data"`
}

// StudentClassDetailData 学生班级详情数据
type StudentClassDetailData struct {
	Class   *ClassInfo    `json:"class"`   // 班级信息
	Members []*MemberInfo `json:"members"` // 成员列表
}
