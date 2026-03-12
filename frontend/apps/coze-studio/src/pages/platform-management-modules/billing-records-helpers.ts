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

export interface BillingRecordsResponseData {
  page?: number;
  size?: number;
  total?: number;
  list?: BillingRecordItem[];
}

export interface BillingRecordItem {
  id?: number;
  request_id?: string;
  space_id?: number | string;
  space_name?: string;
  project_type?: string;
  project_id?: number;
  project_name?: string;
  model_id?: string;
  usage_tokens?: number;
  unit_price?: string;
  amount?: string;
  status?: string;
  occurred_at?: number;
  created_at?: number;
}

export type BillingRecordsExportStatus = 'processing' | 'success' | 'failed';

export type BillingRecordSortField = 'occurred_at' | 'amount' | 'usage_tokens';

export type BillingRecordSortDirection = 'asc' | 'desc';

export interface BillingRecordsQueryState {
  keyword: string;
  page: number;
  size: number;
  orderBy: BillingRecordSortField;
  orderDirection: BillingRecordSortDirection;
}

export interface BillingRecordsExportTaskData {
  task_id?: string;
  status?: BillingRecordsExportStatus;
}

export interface BillingRecordsExportStatusData {
  task_id?: string;
  status?: BillingRecordsExportStatus;
  download_url?: string;
  expire_at?: number;
}

export const DEFAULT_PAGE_SIZE = 20;

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLIS_PER_SECOND;
const LAST_7_DAYS_OFFSET = 6;
const LAST_30_DAYS_OFFSET = 29;

const MONEY_FORMATTER = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const UNIT_PRICE_FORMATTER = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 6,
  maximumFractionDigits: 8,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('zh-CN');

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Shanghai',
});

export const DEFAULT_QUERY_STATE: BillingRecordsQueryState = {
  keyword: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
  orderBy: 'occurred_at',
  orderDirection: 'desc',
};

export const EMPTY_BILLING_RECORDS: BillingRecordsResponseData = {
  page: 1,
  size: DEFAULT_PAGE_SIZE,
  total: 0,
  list: [],
};

export const SORT_FIELD_OPTIONS: Array<{
  value: BillingRecordSortField;
  label: string;
}> = [
  {
    value: 'occurred_at',
    label: tNoOptions('platform_management_sort_time', '时间'),
  },
  {
    value: 'amount',
    label: tNoOptions('platform_management_sort_amount', '金额'),
  },
  {
    value: 'usage_tokens',
    label: tNoOptions('platform_management_sort_usage', '用量'),
  },
];

export const SORT_DIRECTION_OPTIONS: Array<{
  value: BillingRecordSortDirection;
  label: string;
}> = [
  {
    value: 'desc',
    label: tNoOptions('platform_management_sort_desc', '降序'),
  },
  {
    value: 'asc',
    label: tNoOptions('platform_management_sort_asc', '升序'),
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

const buildBillingRecordsUrl = (
  filters: PlatformFilters,
  query: BillingRecordsQueryState,
) => {
  const timeRangeParams = resolveTimeRange(filters.timeRange);
  const searchParams = new URLSearchParams({
    start_time: String(timeRangeParams.start_time),
    end_time: String(timeRangeParams.end_time),
    page: String(query.page),
    size: String(query.size),
    project_type: filters.projectType,
    order_by: query.orderBy,
    order_direction: query.orderDirection,
  });

  if (filters.spaceId !== 'all') {
    searchParams.set('space_ids', filters.spaceId);
  }
  if (query.keyword) {
    searchParams.set('keyword', query.keyword);
  }

  return `/api/platform/billing/records?${searchParams.toString()}`;
};

const buildBillingRecordsExportBody = (
  filters: PlatformFilters,
  query: BillingRecordsQueryState,
) => {
  const timeRangeParams = resolveTimeRange(filters.timeRange);
  const spaceIDs: number[] = [];

  if (filters.spaceId !== 'all') {
    const parsedSpaceId = Number(filters.spaceId);
    if (Number.isFinite(parsedSpaceId) && parsedSpaceId > 0) {
      spaceIDs.push(parsedSpaceId);
    }
  }

  return {
    start_time: timeRangeParams.start_time,
    end_time: timeRangeParams.end_time,
    keyword: query.keyword,
    space_ids: spaceIDs,
    project_type: filters.projectType,
    order_by: query.orderBy,
    order_direction: query.orderDirection,
  };
};

const normalizeBillingRecordsData = (
  data?: BillingRecordsResponseData,
): BillingRecordsResponseData => ({
  page: data?.page ?? 1,
  size: data?.size ?? DEFAULT_PAGE_SIZE,
  total: data?.total ?? 0,
  list: data?.list ?? [],
});

const normalizeBillingRecordsExportTask = (
  data?: BillingRecordsExportTaskData,
): BillingRecordsExportTaskData => ({
  task_id: data?.task_id ?? '',
  status: data?.status ?? 'processing',
});

const normalizeBillingRecordsExportStatus = (
  data?: BillingRecordsExportStatusData,
): BillingRecordsExportStatusData => ({
  task_id: data?.task_id ?? '',
  status: data?.status ?? 'processing',
  download_url: data?.download_url ?? '',
  expire_at: data?.expire_at ?? 0,
});

const parseBillingRecordsPayload = async (
  response: Response,
): Promise<PlatformApiResponse<BillingRecordsResponseData>> => {
  try {
    return (await response.json()) as PlatformApiResponse<BillingRecordsResponseData>;
  } catch (error) {
    console.warn('Failed to parse billing records response', error);
    return {};
  }
};

const parseBillingRecordsExportPayload = async (
  response: Response,
): Promise<PlatformApiResponse<BillingRecordsExportTaskData>> => {
  try {
    return (await response.json()) as PlatformApiResponse<BillingRecordsExportTaskData>;
  } catch (error) {
    console.warn('Failed to parse billing records export response', error);
    return {};
  }
};

const parseBillingRecordsExportStatusPayload = async (
  response: Response,
): Promise<PlatformApiResponse<BillingRecordsExportStatusData>> => {
  try {
    return (await response.json()) as PlatformApiResponse<BillingRecordsExportStatusData>;
  } catch (error) {
    console.warn(
      'Failed to parse billing records export status response',
      error,
    );
    return {};
  }
};

export const formatBillingRecordCurrency = (
  value: string | number | undefined,
) => `¥${MONEY_FORMATTER.format(toFiniteNumber(value))}`;

export const formatBillingRecordUnitPrice = (
  value: string | number | undefined,
) => UNIT_PRICE_FORMATTER.format(toFiniteNumber(value));

export const formatBillingRecordNumber = (value: string | number | undefined) =>
  NUMBER_FORMATTER.format(toFiniteNumber(value));

export const formatBillingRecordDateTime = (value: number | undefined) => {
  if (!value) {
    return '--';
  }

  return DATE_TIME_FORMATTER.format(new Date(value));
};

export const formatBillingRecordProjectType = (value: string | undefined) => {
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

export const fetchBillingRecords = async (
  filters: PlatformFilters,
  query: BillingRecordsQueryState,
) => {
  const response = await fetch(buildBillingRecordsUrl(filters, query), {
    credentials: 'include',
  });
  const payload = await parseBillingRecordsPayload(response);

  if (!response.ok) {
    throw new PlatformRequestError(
      payload.msg ||
        `HTTP ${response.status} ${response.statusText || 'request failed'}`,
    );
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new PlatformRequestError(
      payload.msg || 'load billing records failed',
    );
  }

  return normalizeBillingRecordsData(payload.data);
};

export const fetchBillingRecordsExportTask = async (
  filters: PlatformFilters,
  query: BillingRecordsQueryState,
) => {
  const response = await fetch('/api/platform/billing/records/export', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildBillingRecordsExportBody(filters, query)),
  });
  const payload = await parseBillingRecordsExportPayload(response);

  if (!response.ok) {
    throw new PlatformRequestError(
      payload.msg ||
        `HTTP ${response.status} ${response.statusText || 'request failed'}`,
    );
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new PlatformRequestError(payload.msg || 'create export task failed');
  }

  return normalizeBillingRecordsExportTask(payload.data);
};

export const fetchBillingRecordsExportStatus = async (taskID: string) => {
  const searchParams = new URLSearchParams({ task_id: taskID });
  const response = await fetch(
    `/api/platform/billing/records/export/status?${searchParams.toString()}`,
    {
      credentials: 'include',
    },
  );
  const payload = await parseBillingRecordsExportStatusPayload(response);

  if (!response.ok) {
    throw new PlatformRequestError(
      payload.msg ||
        `HTTP ${response.status} ${response.statusText || 'request failed'}`,
    );
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new PlatformRequestError(payload.msg || 'load export status failed');
  }

  return normalizeBillingRecordsExportStatus(payload.data);
};

export const resolveBillingRecordsRequestErrorText = (error: unknown) => {
  if (error instanceof PlatformRequestError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return tNoOptions(
    'platform_management_records_load_failed',
    '账单明细加载失败',
  );
};

export const resolveBillingRecordsExportRequestErrorText = (error: unknown) => {
  if (error instanceof PlatformRequestError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return tNoOptions(
    'platform_management_records_export_failed',
    '账单导出失败',
  );
};
