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

import { type FC } from 'react';

import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import { Typography, Select, Button } from '@coze-arch/coze-design';

import type { PlatformFilters, TimeRangeKey, ProjectTypeKey } from './types';

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

interface PlatformManagementHeaderProps {
  draftFilters: PlatformFilters;
  timeRangeOptions: Array<{ value: TimeRangeKey; label: string }>;
  spaceOptions: Array<{ value: string; label: string }>;
  projectTypeOptions: Array<{ value: ProjectTypeKey; label: string }>;
  onDraftFilterChange: (patch: Partial<PlatformFilters>) => void;
  onApply: () => void;
  onReset: () => void;
}

export const PlatformManagementHeader: FC<PlatformManagementHeaderProps> = ({
  draftFilters,
  timeRangeOptions,
  spaceOptions,
  projectTypeOptions,
  onDraftFilterChange,
  onApply,
  onReset,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-3">
        <Typography.Text className="text-gray-600 text-sm whitespace-nowrap">
          {tNoOptions('platform_management_filter_label_time', '时间范围')}
        </Typography.Text>
        <Select
          className="w-[160px]"
          value={draftFilters.timeRange}
          optionList={timeRangeOptions}
          onChange={value =>
            onDraftFilterChange({ timeRange: value as TimeRangeKey })
          }
        />
      </div>
      <div className="flex items-center gap-3">
        <Typography.Text className="text-gray-600 text-sm whitespace-nowrap">
          {tNoOptions('platform_management_filter_label_space', '空间')}
        </Typography.Text>
        <Select
          className="w-[200px]"
          value={draftFilters.spaceId}
          optionList={spaceOptions}
          onChange={value => onDraftFilterChange({ spaceId: String(value) })}
          showSearch
        />
      </div>
      <div className="flex items-center gap-3">
        <Typography.Text className="text-gray-600 text-sm whitespace-nowrap">
          {tNoOptions('platform_management_filter_label_project', '项目类型')}
        </Typography.Text>
        <Select
          className="w-[160px]"
          value={draftFilters.projectType}
          optionList={projectTypeOptions}
          onChange={value =>
            onDraftFilterChange({ projectType: value as ProjectTypeKey })
          }
        />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Button onClick={onReset} className="px-5">
        {tNoOptions('platform_management_filter_reset', '重置')}
      </Button>
      <Button
        type="primary"
        onClick={onApply}
        className="px-5 bg-[#3370FF] hover:bg-[#245BDB]"
      >
        {tNoOptions('platform_management_filter_apply', '查询')}
      </Button>
    </div>
  </div>
);
