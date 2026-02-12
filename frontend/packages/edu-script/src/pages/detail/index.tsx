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

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Tag, Typography, Steps, Modal } from '@coze-arch/coze-design';
import { IconButton } from '@coze-arch/coze-design';
import { IconArrowLeft } from '@coze-arch/bot-icons';
import { I18n } from '@coze-arch/i18n';
import axios from 'axios';
import styles from './index.module.less';

const { Title, Text, Paragraph } = Typography;

interface ScriptStage {
  order: number;
  name: string;
  description: string;
  duration: number;
  bot_ids: number[];
  output_type: string;
  output_template: string;
  weight: number;
}

interface ScriptDetail {
  id: number;
  name: string;
  nameEn?: string;
  difficulty: number;
  duration: number;
  icon: string;
  description: string;
  background: string;
  objectives: string[];
  stages: ScriptStage[];
}

const difficultyMap = {
  1: { text: '简单', color: 'green' },
  2: { text: '中等', color: 'orange' },
  3: { text: '困难', color: 'red' },
};

const ScriptDetailPage: React.FC = () => {
  const { id, space_id } = useParams<{ id: string; space_id: string }>();
  const navigate = useNavigate();
  const [script, setScript] = useState<ScriptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [startModalVisible, setStartModalVisible] = useState(false);

  useEffect(() => {
    fetchScriptDetail();
  }, [id]);

  const fetchScriptDetail = async () => {
    try {
      const response = await axios.get(`/api/space/${space_id}/edu/scripts/${id}`);
      if (response.data.code === 0) {
        setScript(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch script detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScript = async () => {
    try {
      const response = await axios.post(`/api/space/${space_id}/edu/projects`, {
        script_id: Number(id),
        title: `${script?.name} - 项目`,
      });

      if (response.data.code === 0) {
        const projectId = response.data.data.project_id;
        navigate(`/space/${space_id}/project-ide/${projectId}`);
      }
    } catch (error) {
      console.error('Failed to start script:', error);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: '100px' }} />;
  }

  if (!script) {
    return <div>Script not found</div>;
  }

  return (
    <div className={styles.container}>
      {/* 返回按钮 */}
      <IconButton
        color="secondary"
        icon={<IconArrowLeft />}
        onClick={() => navigate(`/space/${space_id}/edu/scripts`)}
        className={styles.backButton}
      />

      {/* 头部信息 */}
      <div className={styles.headerCard}>
        <div className={styles.header}>
          <span className={styles.icon}>{script.icon}</span>
          <div className={styles.headerContent}>
            <div className={styles.titleRow}>
              <Title heading={2} className={styles.title}>
                {script.name}
              </Title>
              <Tag color={difficultyMap[script.difficulty as 1 | 2 | 3].color}>
                {difficultyMap[script.difficulty as 1 | 2 | 3].text}
              </Tag>
            </div>
            {script.nameEn && (
              <Text type="secondary">{script.nameEn}</Text>
            )}
            <Paragraph type="secondary" className={styles.description}>
              {script.description}
            </Paragraph>
            <div className={styles.meta}>
              <Text type="tertiary">
                ⏱️ 预计时长：{script.duration} 分钟
              </Text>
            </div>
          </div>
        </div>

        <Button
          type="primary"
          size="large"
          onClick={() => setStartModalVisible(true)}
          className={styles.startButton}
        >
          {I18n.t('edu_start_script', {}, '开始剧本')}
        </Button>
      </div>

      {/* 背景故事 */}
      <div className={styles.section}>
        <Title heading={4}>{I18n.t('edu_background', {}, '背景故事')}</Title>
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {script.background}
        </Paragraph>
      </div>

      {/* 学习目标 */}
      <div className={styles.section}>
        <Title heading={4}>{I18n.t('edu_objectives', {}, '学习目标')}</Title>
        <ul className={styles.objectivesList}>
          {script.objectives.map((objective, index) => (
            <li key={index}>
              <Text>{objective}</Text>
            </li>
          ))}
        </ul>
      </div>

      {/* 阶段流程 */}
      <div className={styles.section}>
        <Title heading={4}>{I18n.t('edu_stages', {}, '阶段流程')}</Title>
        <Steps direction="vertical" current={-1}>
          {script.stages.map((stage, index) => (
            <Steps.Step
              key={index}
              title={`阶段 ${stage.order}: ${stage.name}`}
              description={
                <div className={styles.stageDescription}>
                  <div className={styles.stageDescriptionText}>{stage.description}</div>
                  <div className={styles.stageMeta}>
                    <Text type="tertiary" size="small">
                      ⏱️ {stage.duration} 分钟
                    </Text>
                    <Text type="tertiary" size="small">
                      📝 产出：{stage.output_template}
                    </Text>
                  </div>
                </div>
              }
            />
          ))}
        </Steps>
      </div>

      {/* 确认开始弹窗 */}
      <Modal
        title={I18n.t('edu_confirm_start', {}, '确认开始剧本')}
        visible={startModalVisible}
        onOk={handleStartScript}
        onCancel={() => setStartModalVisible(false)}
        okText={I18n.t('common_confirm', {}, '确认')}
        cancelText={I18n.t('common_cancel', {}, '取消')}
      >
        <Paragraph>
          确认开始《{script.name}》剧本吗？
        </Paragraph>
        <Paragraph type="secondary">
          {I18n.t('edu_start_tip', {}, '开始后，系统将为你创建一个新的项目，你可以在项目中与智能体协作完成任务。')}
        </Paragraph>
      </Modal>
    </div>
  );
};

export default ScriptDetailPage;
