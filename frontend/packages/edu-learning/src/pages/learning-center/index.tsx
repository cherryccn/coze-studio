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

import React, { useState, useMemo } from 'react';
import { Input, Tabs, Select, Empty, Spin } from '@coze-arch/coze-design';
import { I18n } from '@coze-arch/i18n';
import { ScenarioCategory } from '@coze-edu/common/types';
import { SCENARIO_CATEGORY_LABELS } from '@coze-edu/common/constants';
import ScriptList from './components/script-list';
import TemplateList from './components/template-list';
import styles from './index.module.less';

const { TabPane } = Tabs;
const { Option } = Select;

/**
 * 学习中心 - 剧本库和模板库入口
 */
const LearningCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scripts' | 'templates'>('scripts');
  const [keyword, setKeyword] = useState('');
  const [scenarioCategory, setScenarioCategory] = useState<ScenarioCategory | undefined>();

  return (
    <div className={styles.learningCenter}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {I18n.t('edu.learning.center.title', {}, '学习中心')}
        </h1>
        <p className={styles.subtitle}>
          {I18n.t(
            'edu.learning.center.subtitle',
            {},
            '选择剧本或模板开始你的AI智能体开发学习之旅'
          )}
        </p>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={I18n.t('edu.learning.center.search.placeholder', {}, '搜索剧本或模板...')}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          style={{ width: 300 }}
          showClear
        />

        <Select
          placeholder={I18n.t('edu.learning.center.filter.scenario', {}, '场景类别')}
          value={scenarioCategory}
          onChange={value => setScenarioCategory(value)}
          style={{ width: 200, marginLeft: 16 }}
          allowClear
        >
          {Object.entries(SCENARIO_CATEGORY_LABELS).map(([key, label]) => (
            <Option key={key} value={key}>
              {I18n.t(label, {}, label)}
            </Option>
          ))}
        </Select>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as 'scripts' | 'templates')}
        className={styles.tabs}
      >
        <TabPane
          tab={I18n.t('edu.learning.center.tab.scripts', {}, '剧本引导学习')}
          itemKey="scripts"
        >
          <ScriptList keyword={keyword} scenarioCategory={scenarioCategory} />
        </TabPane>

        <TabPane
          tab={I18n.t('edu.learning.center.tab.templates', {}, '模板定制开发')}
          itemKey="templates"
        >
          <TemplateList keyword={keyword} scenarioCategory={scenarioCategory} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default LearningCenter;
