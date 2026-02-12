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
	"fmt"
	"os"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	edumodel "github.com/coze-dev/coze-studio/backend/api/model/edu"
	"github.com/coze-dev/coze-studio/backend/domain/eduscript/entity"
	"github.com/coze-dev/coze-studio/backend/pkg/logs"
)

var db *gorm.DB

// InitDB initializes database connection
func InitDB() error {
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		// Default DSN for development
		dsn = "coze:coze123@tcp(mysql:3306)/opencoze?charset=utf8mb4&parseTime=True&loc=Local"
	}

	var err error
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		logs.Errorf("[edu] Failed to connect to database: %v", err)
		return err
	}

	logs.Infof("[edu] Database connection established successfully")
	return nil
}

// ListScripts 获取剧本列表
// @router /api/space/:space_id/edu/scripts [GET]
func ListScripts(ctx context.Context, c *app.RequestContext) {
	// Get space_id from URL params
	spaceIDStr := c.Param("space_id")
	if spaceIDStr == "" {
		c.JSON(consts.StatusBadRequest, edumodel.ListScriptsResponse{
			Code: 400,
			Msg:  "space_id is required",
		})
		return
	}

	var spaceID int64
	if _, err := fmt.Sscanf(spaceIDStr, "%d", &spaceID); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.ListScriptsResponse{
			Code: 400,
			Msg:  "invalid space_id",
		})
		return
	}

	var req edumodel.ListScriptsRequest
	err := c.BindAndValidate(&req)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.ListScriptsResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// Ensure DB is initialized
	if db == nil {
		if err := InitDB(); err != nil {
			c.JSON(consts.StatusInternalServerError, edumodel.ListScriptsResponse{
				Code: 500,
				Msg:  "Database connection failed",
			})
			return
		}
	}

	// Query from database with space_id filter
	var scripts []*entity.Script
	var total int64

	// Filter by space_id and visibility
	// Show scripts that are:
	// 1. In the current space with team/public visibility
	// 2. Public scripts from any space
	query := db.WithContext(ctx).Model(&entity.Script{}).Where("status = 1").
		Where("(space_id = ? AND visibility IN ('team', 'public')) OR visibility = 'public'", spaceID)

	// Keyword search
	if req.Keyword != "" {
		keyword := "%" + req.Keyword + "%"
		query = query.Where("name LIKE ? OR description LIKE ?", keyword, keyword)
	}

	// Difficulty filter
	if req.Difficulty != nil {
		query = query.Where("difficulty = ?", *req.Difficulty)
	}

	// Count
	if err := query.Count(&total).Error; err != nil {
		logs.Errorf("[ListScripts] Count failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.ListScriptsResponse{
			Code: 500,
			Msg:  "Query failed",
		})
		return
	}

	// Pagination
	page := req.Page
	if page < 1 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	// Fetch data
	if err := query.Offset(offset).Limit(pageSize).Find(&scripts).Error; err != nil {
		logs.Errorf("[ListScripts] Query failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.ListScriptsResponse{
			Code: 500,
			Msg:  "Query failed",
		})
		return
	}

	// Convert to response format
	items := make([]*edumodel.ScriptItem, len(scripts))
	for i, script := range scripts {
		items[i] = &edumodel.ScriptItem{
			ID:          script.ID,
			Name:        script.Name,
			NameEn:      script.NameEn,
			Difficulty:  script.Difficulty,
			Duration:    script.Duration,
			Icon:        script.Icon,
			Description: script.Description,
			CreatedAt:   script.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	c.JSON(consts.StatusOK, edumodel.ListScriptsResponse{
		Code: 0,
		Msg:  "success",
		Data: &edumodel.ScriptListData{
			List:     items,
			Total:    total,
			Page:     page,
			PageSize: pageSize,
		},
	})
}

// GetScript 获取剧本详情
// @router /api/space/:space_id/edu/scripts/:id [GET]
func GetScript(ctx context.Context, c *app.RequestContext) {
	// Get space_id from URL params
	spaceIDStr := c.Param("space_id")
	if spaceIDStr == "" {
		c.JSON(consts.StatusBadRequest, edumodel.GetScriptResponse{
			Code: 400,
			Msg:  "space_id is required",
		})
		return
	}

	var spaceID int64
	if _, err := fmt.Sscanf(spaceIDStr, "%d", &spaceID); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetScriptResponse{
			Code: 400,
			Msg:  "invalid space_id",
		})
		return
	}

	var req edumodel.GetScriptRequest
	err := c.BindAndValidate(&req)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetScriptResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// Ensure DB is initialized
	if db == nil {
		if err := InitDB(); err != nil {
			c.JSON(consts.StatusInternalServerError, edumodel.GetScriptResponse{
				Code: 500,
				Msg:  "Database connection failed",
			})
			return
		}
	}

	var script entity.Script
	// Check access permission based on space and visibility
	if err := db.WithContext(ctx).
		Where("id = ? AND status = 1", req.ID).
		Where("(space_id = ? AND visibility IN ('team', 'public')) OR visibility = 'public'", spaceID).
		First(&script).Error; err != nil {
		logs.Errorf("[GetScript] Query failed: %v", err)
		c.JSON(consts.StatusNotFound, edumodel.GetScriptResponse{
			Code: 404,
			Msg:  "Script not found or no permission",
		})
		return
	}

	// Convert stages
	stages := make([]edumodel.ScriptStageInfo, len(script.Stages))
	for i, stage := range script.Stages {
		stages[i] = edumodel.ScriptStageInfo{
			Order:          stage.Order,
			Name:           stage.Name,
			Description:    stage.Description,
			Duration:       stage.Duration,
			BotIDs:         stage.BotIDs,
			OutputType:     stage.OutputType,
			OutputTemplate: stage.OutputTemplate,
			Weight:         stage.Weight,
		}
	}

	// Convert evaluation config
	var evalConfig *edumodel.EvaluationConfig
	if len(script.EvaluationConfig.Dimensions) > 0 {
		dimensions := make([]edumodel.EvaluationDimension, len(script.EvaluationConfig.Dimensions))
		for i, dim := range script.EvaluationConfig.Dimensions {
			dimensions[i] = edumodel.EvaluationDimension{
				Name:   dim.Name,
				Weight: dim.Weight,
			}
		}
		evalConfig = &edumodel.EvaluationConfig{
			Dimensions: dimensions,
		}
	}

	c.JSON(consts.StatusOK, edumodel.GetScriptResponse{
		Code: 0,
		Msg:  "success",
		Data: &edumodel.ScriptDetail{
			ID:               script.ID,
			Name:             script.Name,
			NameEn:           script.NameEn,
			Difficulty:       script.Difficulty,
			Duration:         script.Duration,
			Icon:             script.Icon,
			Description:      script.Description,
			Background:       script.Background,
			Objectives:       []string(script.Objectives),
			Stages:           stages,
			EvaluationConfig: evalConfig,
		},
	})
}

// CreateProject 创建项目（开始剧本）
// @router /api/edu/projects [POST]
func CreateProject(ctx context.Context, c *app.RequestContext) {
	var req edumodel.CreateProjectRequest
	err := c.BindAndValidate(&req)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.CreateProjectResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// TODO: 实现项目创建逻辑
	// 临时返回示例数据
	c.JSON(consts.StatusOK, edumodel.CreateProjectResponse{
		Code: 0,
		Msg:  "success",
		Data: &edumodel.ProjectData{
			ProjectID:    123,
			ScriptID:     req.ScriptID,
			CurrentStage: 1,
			Status:       "in_progress",
		},
	})
}

// GetMyProjects 获取我的项目列表
// @router /api/edu/projects/my [GET]
func GetMyProjects(ctx context.Context, c *app.RequestContext) {
	// TODO: 从context获取当前用户ID
	// userID := getUserID(ctx)

	// TODO: 调用repository获取数据
	// 临时返回空列表
	c.JSON(consts.StatusOK, edumodel.GetMyProjectsResponse{
		Code: 0,
		Msg:  "success",
		Data: []*edumodel.ProjectItem{},
	})
}

// SendMessage 发送消息给Bot
// @router /api/edu/chat/send [POST]
func SendMessage(ctx context.Context, c *app.RequestContext) {
	var req edumodel.SendMessageRequest
	err := c.BindAndValidate(&req)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.SendMessageResponse{
			Code: 400,
			Msg:  err.Error(),
		})
		return
	}

	// TODO: 调用Bot对话API
	// 临时返回示例数据
	c.JSON(consts.StatusOK, edumodel.SendMessageResponse{
		Code: 0,
		Msg:  "success",
		Data: &edumodel.MessageData{
			MessageID: 456,
			BotReply: &edumodel.BotReply{
				Content:   "这是Bot的回复...",
				CreatedAt: "2024-01-01T10:00:00Z",
			},
		},
	})
}
