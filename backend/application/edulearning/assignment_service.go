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

package edulearning

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"

	"github.com/coze-dev/coze-studio/backend/domain/edulearning/entity"
	"github.com/coze-dev/coze-studio/backend/domain/edulearning/repository"
)

// AssignmentService 作业服务
type AssignmentService struct {
	assignmentRepo repository.AssignmentRepository
	projectRepo    repository.ProjectRepository
	classRepo      repository.ClassRepository
	db             *gorm.DB
}

// CreateAssignmentRequest 创建作业请求
type CreateAssignmentRequest struct {
	ClassID        int64
	TeacherID      int64
	AssignmentType entity.ProjectType
	SourceID       int64
	Title          string
	Description    *string
	DueDate        *time.Time
}

// CreateAssignment 创建作业
func (s *AssignmentService) CreateAssignment(ctx context.Context, req *CreateAssignmentRequest) (*entity.Assignment, error) {
	assignment := &entity.Assignment{
		ClassID:        req.ClassID,
		TeacherID:      req.TeacherID,
		AssignmentType: req.AssignmentType,
		SourceID:       req.SourceID,
		Title:          req.Title,
		Description:    req.Description,
		DueDate:        req.DueDate,
	}

	if err := s.assignmentRepo.Create(ctx, assignment); err != nil {
		return nil, fmt.Errorf("create assignment failed: %w", err)
	}

	return assignment, nil
}

// GetAssignment 获取作业详情
func (s *AssignmentService) GetAssignment(ctx context.Context, assignmentID int64) (*entity.Assignment, error) {
	return s.assignmentRepo.GetByID(ctx, assignmentID)
}

// UpdateAssignment 更新作业
func (s *AssignmentService) UpdateAssignment(ctx context.Context, assignment *entity.Assignment) error {
	return s.assignmentRepo.Update(ctx, assignment)
}

// DeleteAssignment 删除作业
func (s *AssignmentService) DeleteAssignment(ctx context.Context, assignmentID int64) error {
	return s.assignmentRepo.Delete(ctx, assignmentID)
}

// ListAssignments 获取作业列表
func (s *AssignmentService) ListAssignments(ctx context.Context, query *repository.AssignmentQuery) ([]*entity.Assignment, int64, error) {
	return s.assignmentRepo.List(ctx, query)
}

// GetClassAssignments 获取班级的所有作业
func (s *AssignmentService) GetClassAssignments(ctx context.Context, classID int64) ([]*entity.Assignment, error) {
	return s.assignmentRepo.GetByClassID(ctx, classID)
}

// GetUpcomingAssignments 获取即将到期的作业
func (s *AssignmentService) GetUpcomingAssignments(ctx context.Context, classID int64, days int) ([]*entity.Assignment, error) {
	return s.assignmentRepo.GetUpcoming(ctx, classID, days)
}

// AssignmentSubmission 作业提交信息
type AssignmentSubmission struct {
	Assignment *entity.Assignment
	Project    *entity.StudentProject
	IsSubmitted bool
	IsOverdue  bool
}

// GetStudentAssignmentStatus 获取学生的作业状态
func (s *AssignmentService) GetStudentAssignmentStatus(ctx context.Context, assignmentID int64, userID int64) (*AssignmentSubmission, error) {
	// 获取作业信息
	assignment, err := s.assignmentRepo.GetByID(ctx, assignmentID)
	if err != nil {
		return nil, fmt.Errorf("get assignment failed: %w", err)
	}

	// 查找学生的项目
	projects, err := s.projectRepo.GetByAssignment(ctx, assignmentID)
	if err != nil {
		return nil, fmt.Errorf("get student projects failed: %w", err)
	}

	var studentProject *entity.StudentProject
	for _, p := range projects {
		if p.UserID == userID {
			studentProject = p
			break
		}
	}

	submission := &AssignmentSubmission{
		Assignment:  assignment,
		Project:     studentProject,
		IsSubmitted: studentProject != nil && studentProject.SubmittedAt != nil,
		IsOverdue:   false,
	}

	// 检查是否逾期
	if assignment.DueDate != nil && time.Now().After(*assignment.DueDate) {
		submission.IsOverdue = true
	}

	return submission, nil
}
