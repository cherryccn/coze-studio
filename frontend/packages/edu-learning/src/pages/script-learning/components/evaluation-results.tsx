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

import React from 'react';
import { Card, Button, Progress, Tag } from '@coze-arch/coze-design';
import { I18n } from '@coze-arch/i18n';
import ReactMarkdown from 'react-markdown';
import styles from './evaluation-results.module.less';

interface EvaluationResultsProps {
  evaluation: {
    total_score: number;
    max_score: number;
    dimension_scores?: Record<string, {
      name: string;
      score: number;
      max_score: number;
      weight: number;
      feedback?: string;
    }>;
    strengths?: string[];
    improvements?: string[];
    feedback?: string;
  };
  onNext: () => void;
  isLastStage: boolean;
}

/**
 * 评估结果展示组件
 */
const EvaluationResults: React.FC<EvaluationResultsProps> = ({
  evaluation,
  onNext,
  isLastStage,
}) => {
  const scorePercent = (evaluation.total_score / evaluation.max_score) * 100;

  const getScoreLevel = (percent: number) => {
    if (percent >= 90) return { color: 'green', text: I18n.t('edu.evaluation.excellent', {}, '优秀') };
    if (percent >= 80) return { color: 'blue', text: I18n.t('edu.evaluation.good', {}, '良好') };
    if (percent >= 70) return { color: 'orange', text: I18n.t('edu.evaluation.pass', {}, '合格') };
    return { color: 'red', text: I18n.t('edu.evaluation.need.improve', {}, '需改进') };
  };

  const scoreLevel = getScoreLevel(scorePercent);

  return (
    <div className={styles.evaluationResults}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {I18n.t('edu.evaluation.results.title', {}, '阶段评估结果')}
          </h2>
          <Tag color={scoreLevel.color} size="large">
            {scoreLevel.text}
          </Tag>
        </div>

        <div className={styles.scoreSection}>
          <div className={styles.totalScore}>
            <span className={styles.scoreValue}>{evaluation.total_score.toFixed(1)}</span>
            <span className={styles.scoreMax}>/ {evaluation.max_score}</span>
          </div>
          <Progress
            percent={scorePercent}
            showInfo={false}
            stroke={scoreLevel.color}
            size="large"
          />
        </div>

        {evaluation.dimension_scores && (
          <div className={styles.dimensionsSection}>
            <h3 className={styles.sectionTitle}>
              {I18n.t('edu.evaluation.dimensions', {}, '各维度得分')}
            </h3>
            <div className={styles.dimensions}>
              {Object.entries(evaluation.dimension_scores).map(([key, dimension]) => (
                <div key={key} className={styles.dimension}>
                  <div className={styles.dimensionHeader}>
                    <span className={styles.dimensionName}>{dimension.name}</span>
                    <span className={styles.dimensionScore}>
                      {dimension.score.toFixed(1)} / {dimension.max_score}
                      <span className={styles.dimensionWeight}>
                        ({(dimension.weight * 100).toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <Progress
                    percent={(dimension.score / dimension.max_score) * 100}
                    showInfo={false}
                    size="small"
                  />
                  {dimension.feedback && (
                    <div className={styles.dimensionFeedback}>{dimension.feedback}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {I18n.t('edu.evaluation.strengths', {}, '优点')}
            </h3>
            <ul className={styles.list}>
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className={styles.listItem}>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.improvements && evaluation.improvements.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {I18n.t('edu.evaluation.improvements', {}, '改进建议')}
            </h3>
            <ul className={styles.list}>
              {evaluation.improvements.map((improvement, index) => (
                <li key={index} className={styles.listItem}>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.feedback && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {I18n.t('edu.evaluation.feedback', {}, '综合评语')}
            </h3>
            <div className={styles.feedback}>
              <ReactMarkdown>{evaluation.feedback}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Button type="primary" size="large" onClick={onNext}>
            {isLastStage
              ? I18n.t('edu.evaluation.back.to.projects', {}, '返回我的项目')
              : I18n.t('edu.evaluation.next.stage', {}, '进入下一阶段')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default EvaluationResults;
