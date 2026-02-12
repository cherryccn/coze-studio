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
	"strings"

	"github.com/coze-dev/coze-studio/backend/domain/edulearning/entity"
)

// AIEvaluator AI评估器
type AIEvaluator struct {
	// TODO: 集成真实的Bot API
	// botClient BotClient
}

// NewAIEvaluator 创建AI评估器实例
func NewAIEvaluator() *AIEvaluator {
	return &AIEvaluator{}
}

// EvaluateStageOutput 评估阶段产出
func (e *AIEvaluator) EvaluateStageOutput(ctx context.Context, req *StageEvaluationRequest) (*StageEvaluationResult, error) {
	// 根据阶段选择评估标准
	criteria := e.getEvaluationCriteria(req.StageOrder)

	// 生成评估 prompt
	_ = e.buildEvaluationPrompt(req, criteria)

	// TODO: 调用 Bot API 获取评估结果
	// response, err := e.botClient.Chat(ctx, &BotChatRequest{
	//     BotID:   req.BotID,
	//     Message: prompt,
	// })
	// if err != nil {
	//     return nil, fmt.Errorf("bot chat failed: %w", err)
	// }

	// 临时：使用模拟评估结果
	result := e.mockEvaluation(req, criteria)

	return result, nil
}

// StageEvaluationRequest 阶段评估请求
type StageEvaluationRequest struct {
	ProjectID     int64
	StageOrder    int
	StageName     string
	OutputContent string
	ScriptTitle   string
	StageGoal     string
}

// StageEvaluationResult 阶段评估结果
type StageEvaluationResult struct {
	DimensionScores map[string]entity.DimensionScore
	TotalScore      float64
	Strengths       []string
	Improvements    []string
	Feedback        string
}

// getEvaluationCriteria 获取评估标准（根据阶段）
func (e *AIEvaluator) getEvaluationCriteria(stageOrder int) map[string]EvaluationCriterion {
	// 三个阶段的评估标准
	allCriteria := map[int]map[string]EvaluationCriterion{
		1: { // 阶段1: 概念理解
			"understanding": {
				Name:        "概念理解",
				Description: "对AI智能体和应用场景的理解程度",
				MaxScore:    100,
				Weight:      0.35,
			},
			"clarity": {
				Name:        "表达清晰度",
				Description: "概念阐述的清晰度和准确性",
				MaxScore:    100,
				Weight:      0.25,
			},
			"completeness": {
				Name:        "内容完整性",
				Description: "是否覆盖了所有关键概念",
				MaxScore:    100,
				Weight:      0.25,
			},
			"insight": {
				Name:        "思考深度",
				Description: "是否有深入的思考和独特见解",
				MaxScore:    100,
				Weight:      0.15,
			},
		},
		2: { // 阶段2: 功能设计
			"requirement": {
				Name:        "需求分析",
				Description: "对用户需求的分析准确性",
				MaxScore:    100,
				Weight:      0.25,
			},
			"design": {
				Name:        "功能设计",
				Description: "功能设计的合理性和完整性",
				MaxScore:    100,
				Weight:      0.35,
			},
			"feasibility": {
				Name:        "可行性",
				Description: "设计方案的可实施性",
				MaxScore:    100,
				Weight:      0.20,
			},
			"innovation": {
				Name:        "创新性",
				Description: "设计中的创新点",
				MaxScore:    100,
				Weight:      0.20,
			},
		},
		3: { // 阶段3: Bot开发
			"functionality": {
				Name:        "功能实现",
				Description: "Bot功能的完整性和正确性",
				MaxScore:    100,
				Weight:      0.40,
			},
			"quality": {
				Name:        "实现质量",
				Description: "代码质量、prompt设计等",
				MaxScore:    100,
				Weight:      0.30,
			},
			"usability": {
				Name:        "易用性",
				Description: "Bot的用户体验",
				MaxScore:    100,
				Weight:      0.20,
			},
			"documentation": {
				Name:        "文档说明",
				Description: "说明文档的完整性",
				MaxScore:    100,
				Weight:      0.10,
			},
		},
	}

	return allCriteria[stageOrder]
}

// buildEvaluationPrompt 构建评估 prompt
func (e *AIEvaluator) buildEvaluationPrompt(req *StageEvaluationRequest, criteria map[string]EvaluationCriterion) string {
	var sb strings.Builder

	sb.WriteString("# AI智能体学习评估任务\n\n")
	sb.WriteString("请作为一名专业的AI智能体开发教师，评估学生在学习过程中的产出内容。\n\n")

	sb.WriteString(fmt.Sprintf("## 学习项目信息\n"))
	sb.WriteString(fmt.Sprintf("- 项目：%s\n", req.ScriptTitle))
	sb.WriteString(fmt.Sprintf("- 当前阶段：阶段%d - %s\n", req.StageOrder, req.StageName))
	sb.WriteString(fmt.Sprintf("- 阶段目标：%s\n\n", req.StageGoal))

	sb.WriteString("## 评估标准\n")
	for _, criterion := range criteria {
		sb.WriteString(fmt.Sprintf("### %s (权重: %.0f%%)\n", criterion.Name, criterion.Weight*100))
		sb.WriteString(fmt.Sprintf("%s\n\n", criterion.Description))
	}

	sb.WriteString("## 学生产出内容\n")
	sb.WriteString("```\n")
	sb.WriteString(req.OutputContent)
	sb.WriteString("\n```\n\n")

	sb.WriteString("## 评估要求\n")
	sb.WriteString("请按照以下格式输出评估结果：\n\n")
	sb.WriteString("1. **各维度得分**（每个维度0-100分）\n")
	for _, criterion := range criteria {
		sb.WriteString(fmt.Sprintf("   - %s: [分数]\n", criterion.Name))
	}
	sb.WriteString("\n2. **优点**（列出3-5个具体优点）\n\n")
	sb.WriteString("3. **改进建议**（列出3-5个具体改进建议）\n\n")
	sb.WriteString("4. **综合评语**（100-200字）\n")

	return sb.String()
}

// mockEvaluation 模拟评估结果（用于测试）
func (e *AIEvaluator) mockEvaluation(req *StageEvaluationRequest, criteria map[string]EvaluationCriterion) *StageEvaluationResult {
	// 根据内容长度和质量生成模拟分数
	contentLength := len(req.OutputContent)
	baseScore := 70.0

	// 内容越长，基础分越高（但有上限）
	if contentLength > 500 {
		baseScore = 85.0
	} else if contentLength > 200 {
		baseScore = 75.0
	}

	dimensionScores := make(map[string]entity.DimensionScore)
	var totalWeightedScore float64

	// 为每个维度生成分数
	for dimKey, criterion := range criteria {
		score := baseScore + float64((contentLength%10)-5) // 添加一些随机性
		if score > criterion.MaxScore {
			score = criterion.MaxScore
		}
		if score < 60 {
			score = 60
		}

		feedback := fmt.Sprintf("在%s方面表现良好", criterion.Name)
		dimensionScores[dimKey] = entity.DimensionScore{
			Name:     criterion.Name,
			Score:    score,
			MaxScore: criterion.MaxScore,
			Weight:   criterion.Weight,
			Feedback: &feedback,
		}

		totalWeightedScore += score * criterion.Weight
	}

	// 生成优点和改进建议
	strengths := e.generateStrengths(req.StageOrder, totalWeightedScore)
	improvements := e.generateImprovements(req.StageOrder, totalWeightedScore)

	// 生成综合反馈
	feedback := e.generateFeedback(req.StageName, totalWeightedScore, dimensionScores)

	return &StageEvaluationResult{
		DimensionScores: dimensionScores,
		TotalScore:      totalWeightedScore,
		Strengths:       strengths,
		Improvements:    improvements,
		Feedback:        feedback,
	}
}

// generateStrengths 生成优点
func (e *AIEvaluator) generateStrengths(stageOrder int, score float64) []string {
	strengthsMap := map[int][][]string{
		1: {
			{"对AI智能体的核心概念理解准确", "清晰阐述了应用场景的特点", "具有良好的逻辑思维能力"},
			{"概念表述清晰易懂", "分析角度多元", "展现了初步的创新思考"},
			{"内容结构合理", "理解深入透彻", "表达简洁有力"},
		},
		2: {
			{"需求分析全面细致", "功能设计合理可行", "考虑了用户实际使用场景"},
			{"设计思路清晰", "功能模块划分合理", "具有一定的创新性"},
			{"方案可行性强", "考虑周全", "设计细节完善"},
		},
		3: {
			{"Bot功能实现完整", "代码质量较高", "用户体验良好"},
			{"技术实现规范", "功能设计合理", "文档说明清晰"},
			{"交互流程顺畅", "错误处理得当", "整体完成度高"},
		},
	}

	index := 0
	if score >= 85 {
		index = 0
	} else if score >= 75 {
		index = 1
	} else {
		index = 2
	}

	return strengthsMap[stageOrder][index]
}

// generateImprovements 生成改进建议
func (e *AIEvaluator) generateImprovements(stageOrder int, score float64) []string {
	improvementsMap := map[int][][]string{
		1: {
			{"可以补充更多实际应用案例", "建议深入分析潜在挑战", "可以增加对竞品的对比分析"},
			{"部分概念可以阐述得更深入", "建议增加更多场景分析", "可以补充技术实现的思考"},
			{"内容还可以更加丰富", "建议加强逻辑论证", "可以提供更多具体例子"},
		},
		2: {
			{"功能设计可以更加细化", "建议补充异常情况的处理方案", "可以增加更多创新功能"},
			{"部分功能点可以再优化", "建议完善边界情况考虑", "可以增强方案的可扩展性"},
			{"设计文档可以更详细", "建议补充实现细节", "可以增加更多设计说明"},
		},
		3: {
			{"部分功能可以进一步优化", "建议增强错误处理机制", "可以提升用户交互体验"},
			{"代码注释可以更完善", "建议优化prompt设计", "可以增加更多测试用例"},
			{"文档说明可以更详细", "建议完善使用指南", "可以增加功能演示"},
		},
	}

	index := 0
	if score >= 85 {
		index = 0
	} else if score >= 75 {
		index = 1
	} else {
		index = 2
	}

	return improvementsMap[stageOrder][index]
}

// generateFeedback 生成综合反馈
func (e *AIEvaluator) generateFeedback(stageName string, score float64, dimensions map[string]entity.DimensionScore) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("## %s 阶段评估\n\n", stageName))
	sb.WriteString(fmt.Sprintf("**综合得分**: %.1f/100\n\n", score))

	sb.WriteString("### 各维度得分\n")
	for _, dimension := range dimensions {
		sb.WriteString(fmt.Sprintf("- **%s**: %.1f/%.0f (权重: %.0f%%)\n",
			dimension.Name, dimension.Score, dimension.MaxScore, dimension.Weight*100))
		if dimension.Feedback != nil {
			sb.WriteString(fmt.Sprintf("  %s\n", *dimension.Feedback))
		}
	}

	sb.WriteString("\n### 综合评语\n")
	if score >= 90 {
		sb.WriteString("表现优秀！在本阶段的学习中展现了扎实的理解能力和出色的产出质量。")
		sb.WriteString("继续保持这样的学习态度和工作标准，你一定能在AI智能体开发领域取得更大的进步。")
	} else if score >= 80 {
		sb.WriteString("表现良好！较好地完成了本阶段的学习任务，展现了不错的理解能力。")
		sb.WriteString("如果能在细节方面再多下功夫，相信你会有更大的提升空间。")
	} else if score >= 70 {
		sb.WriteString("达到了基本要求，完成了本阶段的主要学习任务。")
		sb.WriteString("建议参考改进建议进一步优化，深入理解相关概念，提升产出质量。")
	} else {
		sb.WriteString("基本理解了本阶段的内容，但还有较大的提升空间。")
		sb.WriteString("建议认真查看改进建议，加强相关知识的学习，并尝试完善你的产出内容。")
	}

	return sb.String()
}

// EvaluationCriterion 评估标准
type EvaluationCriterion struct {
	Name        string
	Description string
	MaxScore    float64
	Weight      float64
}
