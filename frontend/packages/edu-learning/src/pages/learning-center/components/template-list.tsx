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
import { Empty } from '@coze-arch/coze-design';
import { I18n } from '@coze-arch/i18n';
import { ScenarioCategory } from '@coze-edu/common/types';

interface TemplateListProps {
  keyword?: string;
  scenarioCategory?: ScenarioCategory;
}

/**
 * 模板列表组件（占位）
 */
const TemplateList: React.FC<TemplateListProps> = () => {
  return (
    <Empty
      description={I18n.t('edu.learning.center.empty.templates', {}, '模板库功能即将上线')}
    />
  );
};

export default TemplateList;
