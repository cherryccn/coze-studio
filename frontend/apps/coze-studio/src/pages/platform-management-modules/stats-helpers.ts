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

import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';

import type { PlatformFilters, TimeRangeKey } from './types';

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

interface PlatformApiResponse<TData> {
  code?: number;
  msg?: string;
  data?: TData;
}

export interface StatsOverviewResponseData {
  active_space_dau?: number;
  active_space_wau?: number;
  active_project_count?: number;
  total_calls?: number;
  success_rate?: string;
  avg_latency_ms?: number;
  total_tokens?: number;
}

export type StatsRankingMetric = 'calls' | 'tokens' | 'cost' | 'fail_rate';

export interface StatsRankingItem {
  project_id?: number;
  project_name?: string;
  project_type?: string;
  calls?: number;
  tokens?: number;
  cost?: string;
  fail_rate?: string;
}

export interface StatsRankingsResponseData {
  page?: number;
  size?: number;
  total?: number;
  list?: StatsRankingItem[];
}

export interface StatsRankingsQueryState {
  metric: StatsRankingMetric;
  page: number;
  size: number;
}

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLIS_PER_SECOND;
const LAST_7_DAYS_OFFSET = 6;
const LAST_30_DAYS_OFFSET = 29;

const NUMBER_FORMATTER = new Intl.NumberFormat('zh-CN');
const CURRENCY_FORMATTER = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});
const PERCENTAGE_FORMATTER = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const PERCENTAGE_MULTIPLIER = 100;

export const DEFAULT_STATS_PAGE_SIZE = 10;

export const DEFAULT_STATS_RANKINGS_QUERY: StatsRankingsQueryState = {
  metric: 'calls',
  page: 1,
  size: DEFAULT_STATS_PAGE_SIZE,
};

export const EMPTY_STATS_OVERVIEW: StatsOverviewResponseData = {
  active_space_dau: 0,
  active_space_wau: 0,
  active_project_count: 0,
  total_calls: 0,
  success_rate: '0.0000',
  avg_latency_ms: 0,
  total_tokens: 0,
};

export const EMPTY_STATS_RANKINGS: StatsRankingsResponseData = {
  page: 1,
  size: DEFAULT_STATS_PAGE_SIZE,
  total: 0,
  list: [],
};

export const STATS_METRIC_OPTIONS: Array<{
  value: StatsRankingMetric;
  label: string;
}> = [
  {
    value: 'calls',
    label: tNoOptions('platform_management_stats_metric_calls', '调用量'),
  },
  {
    value: 'tokens',
    label: tNoOptions('platform_management_stats_metric_tokens', 'Token'),
  },
  {
    value: 'cost',
    label: tNoOptions('platform_management_stats_metric_cost', '费用'),
  },
  {
    value: 'fail_rate',
    label: tNoOptions('platform_management_stats_metric_fail_rate', '失败率'),
  },
];

class PlatformRequestError extends Error {}

const getDayStartMs = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const resolveTimeRange = (timeRange: TimeRangeKey) => {
  const now = Date.now();
  const todayStart = getDayStartMs(new Date(now));
  switch (timeRange) {
    case 'today':
      return { start_time: todayStart, end_time: now };
    case 'last_30_days':
    case 'custom':
      return {
        start_time: todayStart - LAST_30_DAYS_OFFSET * MILLIS_PER_DAY,
        end_time: now,
      };
    case 'last_7_days':
    default:
      return {
        start_time: todayStart - LAST_7_DAYS_OFFSET * MILLIS_PER_DAY,
        end_time: now,
      };
  }
};

const toFiniteNumber = (value: string | number | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatsOverviewData = (
  data?: StatsOverviewResponseData,
): StatsOverviewResponseData => ({
  active_space_dau: data?.active_space_dau ?? 0,
  active_space_wau: data?.active_space_wau ?? 0,
  active_project_count: data?.active_project_count ?? 0,
  total_calls: data?.total_calls ?? 0,
  success_rate: data?.success_rate ?? '0.0000',
  avg_latency_ms: data?.avg_latency_ms ?? 0,
  total_tokens: data?.total_tokens ?? 0,
});

const normalizeStatsRankingItem = (
  item?: StatsRankingItem,
): StatsRankingItem => ({
  project_id: item?.project_id ?? 0,
  project_name: item?.project_name ?? '',
  project_type: item?.project_type ?? '',
  calls: item?.calls ?? 0,
  tokens: item?.tokens ?? 0,
  cost: item?.cost ?? '0',
  fail_rate: item?.fail_rate ?? '0.0000',
});

const normalizeStatsRankingsData = (
  data?: StatsRankingsResponseData,
): StatsRankingsResponseData => ({
  page: data?.page ?? 1,
  size: data?.size ?? DEFAULT_STATS_PAGE_SIZE,
  total: data?.total ?? 0,
  list: (data?.list ?? []).map(item => normalizeStatsRankingItem(item)),
});

const buildStatsOverviewUrl = (filters: PlatformFilters) => {
  const timeRangeParams = resolveTimeRange(filters.timeRange);
  const searchParams = new URLSearchParams({
    start_time: String(timeRangeParams.start_time),
    end_time: String(timeRangeParams.end_time),
    project_type: filters.projectType,
  });

  if (filters.spaceId !== 'all') {
    searchParams.set('space_ids', filters.spaceId);
  }

  return `/api/platform/stats/overview?${searchParams.toString()}`;
};

const buildStatsRankingsUrl = (
  filters: PlatformFilters,
  query: StatsRankingsQueryState,
) => {
  const timeRangeParams = resolveTimeRange(filters.timeRange);
  const searchParams = new URLSearchParams({
    start_time: String(timeRangeParams.start_time),
    end_time: String(timeRangeParams.end_time),
    metric: query.metric,
    page: String(query.page),
    size: String(query.size),
    project_type: filters.projectType,
  });

  if (filters.spaceId !== 'all') {
    searchParams.set('space_ids', filters.spaceId);
  }

  return `/api/platform/stats/rankings?${searchParams.toString()}`;
};

const parseStatsOverviewPayload = async (
  response: Response,
): Promise<PlatformApiResponse<StatsOverviewResponseData>> => {
  try {
    return (await response.json()) as PlatformApiResponse<StatsOverviewResponseData>;
  } catch (error) {
    console.warn('Failed to parse stats overview response', error);
    return {};
  }
};

const parseStatsRankingsPayload = async (
  response: Response,
): Promise<PlatformApiResponse<StatsRankingsResponseData>> => {
  try {
    return (await response.json()) as PlatformApiResponse<StatsRankingsResponseData>;
  } catch (error) {
    console.warn('Failed to parse stats rankings response', error);
    return {};
  }
};

export const fetchStatsOverview = async (filters: PlatformFilters) => {
  const response = await fetch(buildStatsOverviewUrl(filters), {
    credentials: 'include',
  });
  const payload = await parseStatsOverviewPayload(response);

  if (!response.ok) {
    throw new PlatformRequestError(
      payload.msg ||
        `HTTP ${response.status} ${response.statusText || 'request failed'}`,
    );
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new PlatformRequestError(payload.msg || 'load stats overview failed');
  }

  return normalizeStatsOverviewData(payload.data);
};

export const fetchStatsRankings = async (
  filters: PlatformFilters,
  query: StatsRankingsQueryState,
) => {
  const response = await fetch(buildStatsRankingsUrl(filters, query), {
    credentials: 'include',
  });
  const payload = await parseStatsRankingsPayload(response);

  if (!response.ok) {
    throw new PlatformRequestError(
      payload.msg ||
        `HTTP ${response.status} ${response.statusText || 'request failed'}`,
    );
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new PlatformRequestError(payload.msg || 'load stats rankings failed');
  }

  return normalizeStatsRankingsData(payload.data);
};

export const resolveStatsRequestErrorText = (error: unknown) => {
  if (error instanceof PlatformRequestError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return tNoOptions('platform_management_stats_load_failed', '数据加载失败');
};

export const formatStatsNumber = (value: string | number | undefined) =>
  NUMBER_FORMATTER.format(toFiniteNumber(value));

export const formatStatsCurrency = (value: string | number | undefined) =>
  `¥${CURRENCY_FORMATTER.format(toFiniteNumber(value))}`;

export const formatStatsPercentage = (value: string | number | undefined) => {
  const parsed = toFiniteNumber(value);
  const percentage = parsed <= 1 ? parsed * PERCENTAGE_MULTIPLIER : parsed;
  return `${PERCENTAGE_FORMATTER.format(percentage)}%`;
};

export const formatStatsDuration = (value: string | number | undefined) =>
  `${NUMBER_FORMATTER.format(toFiniteNumber(value))} ms`;

export const formatStatsProjectType = (value: string | undefined) => {
  switch (value) {
    case 'agent':
      return tNoOptions('platform_management_project_type_agent', '智能体');
    case 'app':
      return tNoOptions('platform_management_project_type_app', '应用');
    case 'workflow':
      return tNoOptions('platform_management_project_type_workflow', '工作流');
    default:
      return value || '--';
  }
};

export const resolveStatsMetricLabel = (metric: StatsRankingMetric) =>
  STATS_METRIC_OPTIONS.find(option => option.value === metric)?.label || metric;
