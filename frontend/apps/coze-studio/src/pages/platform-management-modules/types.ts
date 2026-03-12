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

export type TimeRangeKey = 'today' | 'last_7_days' | 'last_30_days' | 'custom';
export type ProjectTypeKey = 'all' | 'agent' | 'app' | 'workflow';

export interface PlatformFilters {
  timeRange: TimeRangeKey;
  spaceId: string;
  projectType: ProjectTypeKey;
}

export interface FilterSummaryItem {
  key: string;
  label: string;
  value: string;
}
