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

import { Typography } from '@coze-arch/coze-design';

import type { FilterSummaryItem } from './types';

interface FilterSummaryChipsProps {
  filterSummary: FilterSummaryItem[];
}

export const FilterSummaryChips: FC<FilterSummaryChipsProps> = ({
  filterSummary,
}) => (
  <div className="flex flex-wrap gap-[8px]">
    {filterSummary.map(item => (
      <div
        key={item.key}
        className="rounded-[8px] px-[10px] py-[6px] border border-solid coz-stroke-primary bg-[rgba(31,35,41,0.04)]"
      >
        <Typography.Text className="text-[12px] coz-fg-secondary">
          {item.label}：{item.value}
        </Typography.Text>
      </div>
    ))}
  </div>
);
