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

import { I18n } from '@coze-arch/i18n';
import { IconCozMagnifier } from '@coze-arch/coze-design/icons';
import { Input, Typography } from '@coze-arch/coze-design';

interface ModelFilterBarProps {
  resultCount: number;
  searchKeyword: string;
  onSearchKeywordChange: (value: string) => void;
}

export const ModelFilterBar = ({
  resultCount,
  searchKeyword,
  onSearchKeywordChange,
}: ModelFilterBarProps) => (
  <div className="flex flex-wrap items-center justify-between gap-[12px]">
    <Typography.Text className="text-[14px] leading-[20px] coz-fg-primary">
      {I18n.t(
        'space_config_model_result_count',
        { count: resultCount },
        `模型列表${resultCount} 条结果`,
      )}
    </Typography.Text>
    <Input
      value={searchKeyword}
      onChange={onSearchKeywordChange}
      className="w-[220px] md:w-[300px]"
      showClear
      prefix={<IconCozMagnifier className="text-[16px] coz-fg-secondary" />}
      placeholder={I18n.t(
        'space_config_model_search_placeholder',
        {},
        '搜索模型',
      )}
    />
  </div>
);
