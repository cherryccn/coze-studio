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
import { Card, Button, Tag, Empty, Spin } from '@coze-arch/coze-design';
import { I18n } from '@coze-arch/i18n';
import { useNavigate } from 'react-router-dom';
import { ScenarioCategory } from '@coze-edu/common/types';
import styles from './script-list.module.less';

interface ScriptListProps {
  keyword?: string;
  scenarioCategory?: ScenarioCategory;
}

/**
 * 剧本列表组件
 */
const ScriptList: React.FC<ScriptListProps> = ({ keyword, scenarioCategory }) => {
  const navigate = useNavigate();

  // TODO: 使用真实的 API 获取剧本列表
  // const { data, loading } = useScripts({ keyword, scenarioCategory });

  // 模拟数据
  const scripts = [
    {
      id: 1,
      title: '社交媒体营销助手',
      description: '学习如何设计和开发一个社交媒体内容策划Bot',
      difficulty: 2,
      duration: 120,
      scenario_category: 'marketing',
      icon: '📱',
    },
    {
      id: 2,
      title: '客户服务智能助手',
      description: '构建一个能够处理常见客户问题的AI助手',
      difficulty: 1,
      duration: 90,
      scenario_category: 'customer_service',
      icon: '💬',
    },
  ];

  const handleStartLearning = (scriptId: number) => {
    // 跳转到剧本详情或直接创建项目
    navigate(`/edu/scripts/${scriptId}/start`);
  };

  if (!scripts || scripts.length === 0) {
    return (
      <Empty
        description={I18n.t('edu.learning.center.empty.scripts', {}, '暂无可用剧本')}
      />
    );
  }

  return (
    <div className={styles.scriptList}>
      {scripts.map(script => (
        <Card key={script.id} className={styles.scriptCard} bordered>
          <div className={styles.cardHeader}>
            <span className={styles.icon}>{script.icon}</span>
            <h3 className={styles.title}>{script.title}</h3>
          </div>

          <p className={styles.description}>{script.description}</p>

          <div className={styles.metadata}>
            <Tag color="blue">
              {I18n.t(`edu.difficulty.${script.difficulty}`, {}, `难度 ${script.difficulty}`)}
            </Tag>
            <span className={styles.duration}>
              {I18n.t('edu.duration.minutes', { minutes: script.duration }, `${script.duration}分钟`)}
            </span>
          </div>

          <div className={styles.actions}>
            <Button
              type="primary"
              onClick={() => handleStartLearning(script.id)}
            >
              {I18n.t('edu.learning.center.button.start', {}, '开始学习')}
            </Button>
            <Button
              type="tertiary"
              onClick={() => navigate(`/edu/scripts/${script.id}`)}
            >
              {I18n.t('edu.learning.center.button.detail', {}, '查看详情')}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ScriptList;
