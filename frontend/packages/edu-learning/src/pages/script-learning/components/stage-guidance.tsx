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
import { Card, Collapse } from '@coze-arch/coze-design';
import { I18n } from '@coze-arch/i18n';
import styles from './stage-guidance.module.less';

interface StageGuidanceProps {
  stage?: {
    stage_order: number;
    stage_name: string;
    stage_goal?: string;
    guidance_content?: string;
  } | null;
}

/**
 * 阶段指导组件
 */
const StageGuidance: React.FC<StageGuidanceProps> = ({ stage }) => {
  if (!stage) return null;

  return (
    <Card className={styles.guidanceCard}>
      <h3 className={styles.title}>
        {I18n.t('edu.script.guidance.title', {}, '阶段指导')}
      </h3>

      <Collapse defaultActiveKey={['goal', 'guidance']}>
        <Collapse.Panel
          header={I18n.t('edu.script.guidance.goal', {}, '学习目标')}
          itemKey="goal"
        >
          <div className={styles.content}>
            {stage.stage_goal || I18n.t('edu.script.guidance.no.goal', {}, '暂无学习目标')}
          </div>
        </Collapse.Panel>

        <Collapse.Panel
          header={I18n.t('edu.script.guidance.content', {}, '指导内容')}
          itemKey="guidance"
        >
          <div className={styles.content}>
            {stage.guidance_content || I18n.t('edu.script.guidance.no.content', {}, '暂无指导内容')}
          </div>
        </Collapse.Panel>
      </Collapse>
    </Card>
  );
};

export default StageGuidance;
