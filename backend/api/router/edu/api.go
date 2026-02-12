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
	"github.com/cloudwego/hertz/pkg/app/server"
	eduhandler "github.com/coze-dev/coze-studio/backend/api/handler/edu"
)

// Register registers education platform routes
func Register(r *server.Hertz) {
	// Initialize education services
	if err := eduhandler.InitEduServices(); err != nil {
		// Log error but continue - services will be lazy initialized
	}

	// Education platform API group - space-based routes
	edu := r.Group("/api/space/:space_id/edu")
	{
		// Script routes (existing)
		edu.GET("/scripts", eduhandler.ListScripts)
		edu.GET("/scripts/:id", eduhandler.GetScript)

		// Project routes
		edu.POST("/projects", eduhandler.CreateProject)
		edu.GET("/projects", eduhandler.ListProjects)
		edu.GET("/projects/:project_id", eduhandler.GetProject)
		edu.GET("/projects/my", eduhandler.GetMyProjects)

		// Stage routes
		edu.PUT("/stages/output", eduhandler.UpdateStageOutput)
		edu.POST("/stages/complete", eduhandler.CompleteStage)

		// Evaluation routes
		edu.POST("/evaluations", eduhandler.CreateTeacherEvaluation)
		edu.GET("/projects/:project_id/evaluations", eduhandler.GetEvaluations)

		// Chat routes (existing)
		edu.POST("/chat/send", eduhandler.SendMessage)

		// Class management routes
		edu.POST("/classes", eduhandler.CreateClass)
		edu.GET("/classes/my", eduhandler.GetMyClasses)
		edu.GET("/classes/:class_id", eduhandler.GetClass)
		edu.PUT("/classes/:class_id", eduhandler.UpdateClass)
		edu.POST("/classes/join", eduhandler.JoinClass) // 学生加入班级

		// Class members routes
		edu.POST("/classes/:class_id/members", eduhandler.AddClassMembers)
		edu.GET("/classes/:class_id/members", eduhandler.GetClassMembers)
		edu.DELETE("/classes/:class_id/members/:user_id", eduhandler.RemoveClassMember)

		// Invite code routes
		edu.POST("/classes/:class_id/invite-codes", eduhandler.CreateInviteCode)
		edu.GET("/classes/:class_id/invite-codes", eduhandler.GetInviteCodes)

		// Student routes
		edu.GET("/student/classes", eduhandler.GetStudentClasses)           // 学生班级列表
		edu.GET("/student/classes/:class_id", eduhandler.GetStudentClassDetail) // 学生班级详情
	}
}
