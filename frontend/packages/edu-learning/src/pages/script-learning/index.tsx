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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Steps, Card, Spin, Toast } from '@coze-arch/coze-design';
import { I18n } from '@coze-arch/i18n';
import { useProject, useUpdateStageOutput, useCompleteStage } from '../../hooks';
import StageGuidance from './components/stage-guidance';
import BotChat from './components/bot-chat';
import OutputEditor from './components/output-editor';
import EvaluationResults from './components/evaluation-results';
import styles from './index.module.less';

const { Header, Content, Sider } = Layout;
const { Step } = Steps;

/**
 * 剧本学习页面 - 三阶段学习工作区
 */
const ScriptLearning: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // TODO: 从路由或context获取 spaceId
  const spaceId = 1;

  const { data: project, loading, refresh } = useProject(spaceId, projectId ? parseInt(projectId) : null);
  const { run: updateOutput, loading: updating } = useUpdateStageOutput();
  const { run: completeStage, loading: completing } = useCompleteStage();

  const [outputContent, setOutputContent] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<any>(null);

  // 加载当前阶段的输出内容
  useEffect(() => {
    if (project?.stages) {
      const currentStage = project.stages.find(s => s.stage_order === project.current_stage);
      if (currentStage?.output_content) {
        setOutputContent(currentStage.output_content);
      }
    }
  }, [project]);

  const handleSaveOutput = async () => {
    if (!project || !projectId) return;

    try {
      await updateOutput({
        spaceId,
        projectId: parseInt(projectId),
        stageOrder: project.current_stage,
        outputContent,
      });
      Toast.success(I18n.t('edu.script.learning.save.success', {}, '保存成功'));
    } catch (error) {
      Toast.error(I18n.t('edu.script.learning.save.error', {}, '保存失败'));
    }
  };

  const handleCompleteStage = async () => {
    if (!project || !projectId) return;

    if (!outputContent.trim()) {
      Toast.warning(I18n.t('edu.script.learning.output.required', {}, '请先完成当前阶段的产出内容'));
      return;
    }

    try {
      const result = await completeStage({
        spaceId,
        projectId: parseInt(projectId),
        stageOrder: project.current_stage,
        outputContent,
      });

      setLatestEvaluation(result.evaluation);
      setShowEvaluation(true);

      Toast.success(I18n.t('edu.script.learning.complete.success', {}, '阶段完成！查看评估结果'));

      // 刷新项目数据
      refresh();
    } catch (error) {
      Toast.error(I18n.t('edu.script.learning.complete.error', {}, '提交失败，请重试'));
    }
  };

  const handleNextStage = () => {
    setShowEvaluation(false);
    setLatestEvaluation(null);
    setOutputContent('');
    refresh();
  };

  const handleBackToProjects = () => {
    navigate('/edu/my-projects');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.error}>
        <p>{I18n.t('edu.script.learning.project.not.found', {}, '项目不存在')}</p>
        <Button onClick={handleBackToProjects}>
          {I18n.t('edu.script.learning.back.to.projects', {}, '返回我的项目')}
        </Button>
      </div>
    );
  }

  const currentStage = project.stages?.find(s => s.stage_order === project.current_stage);
  const isLastStage = project.current_stage === 3;
  const isCompleted = project.status === 'completed';

  return (
    <Layout className={styles.scriptLearning}>
      <Header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button type="tertiary" onClick={handleBackToProjects}>
            {I18n.t('edu.script.learning.back', {}, '返回')}
          </Button>
          <h1 className={styles.title}>{project.title}</h1>
        </div>
        <div className={styles.headerRight}>
          <Button onClick={handleSaveOutput} loading={updating}>
            {I18n.t('edu.script.learning.save', {}, '保存草稿')}
          </Button>
          <Button
            type="primary"
            onClick={handleCompleteStage}
            loading={completing}
            disabled={isCompleted}
          >
            {isLastStage
              ? I18n.t('edu.script.learning.submit.project', {}, '提交项目')
              : I18n.t('edu.script.learning.complete.stage', {}, '完成当前阶段')}
          </Button>
        </div>
      </Header>

      <Layout className={styles.mainLayout}>
        <Sider width={300} className={styles.sider}>
          <Card className={styles.stageCard}>
            <h3 className={styles.stageTitle}>
              {I18n.t('edu.script.learning.progress', {}, '学习进度')}
            </h3>
            <Steps current={project.current_stage - 1} direction="vertical">
              {project.stages?.map(stage => (
                <Step
                  key={stage.id}
                  title={I18n.t(`edu.script.stage.${stage.stage_order}.title`, {}, stage.stage_name)}
                  description={
                    stage.completed_at
                      ? I18n.t('edu.script.stage.completed', {}, '已完成')
                      : stage.stage_order === project.current_stage
                      ? I18n.t('edu.script.stage.in.progress', {}, '进行中')
                      : I18n.t('edu.script.stage.pending', {}, '未开始')
                  }
                />
              ))}
            </Steps>
          </Card>

          <StageGuidance stage={currentStage} />
        </Sider>

        <Content className={styles.content}>
          {showEvaluation && latestEvaluation ? (
            <EvaluationResults
              evaluation={latestEvaluation}
              onNext={isLastStage ? handleBackToProjects : handleNextStage}
              isLastStage={isLastStage}
            />
          ) : (
            <div className={styles.workspace}>
              <div className={styles.chatSection}>
                <BotChat projectId={project.id} stageOrder={project.current_stage} />
              </div>
              <div className={styles.editorSection}>
                <OutputEditor
                  value={outputContent}
                  onChange={setOutputContent}
                  placeholder={I18n.t(
                    'edu.script.learning.output.placeholder',
                    {},
                    '请在此输入你的学习产出...'
                  )}
                  disabled={isCompleted}
                />
              </div>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ScriptLearning;
