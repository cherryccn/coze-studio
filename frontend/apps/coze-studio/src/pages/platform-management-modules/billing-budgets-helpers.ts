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

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

interface PlatformApiResponse<TData> {
  code?: number;
  msg?: string;
  data?: TData;
}

export interface BillingBudgetSpaceOption {
  value: string;
  label: string;
}

export type BillingBudgetOverLimitPolicy = 'warn' | 'reject';

export interface BillingBudgetItem {
  id?: number;
  space_id?: number;
  space_name?: string;
  monthly_budget?: string;
  alarm_thresholds?: number[];
  over_limit_policy?: BillingBudgetOverLimitPolicy;
  enabled?: boolean;
  updated_at?: number;
}

interface BillingBudgetSaveError {
  space_id?: number;
  msg?: string;
}

export interface BillingBudgetsResponseData {
  page?: number;
  size?: number;
  total?: number;
  list?: BillingBudgetItem[];
}

interface BillingBudgetsSaveResponseData {
  success_count?: number;
  failed?: BillingBudgetSaveError[];
}

export interface BillingBudgetEditableRow {
  id?: number;
  key: string;
  spaceId: number;
  spaceName: string;
  monthlyBudget?: number;
  alarmThresholds: number[];
  overLimitPolicy: BillingBudgetOverLimitPolicy;
  enabled: boolean;
  updatedAt?: number;
}

const DEFAULT_BILLING_BUDGETS_PAGE_SIZE = 50;
const DEFAULT_BILLING_THRESHOLD_NOTICE = 70;
const DEFAULT_BILLING_THRESHOLD_WARNING = 90;
const DEFAULT_BILLING_THRESHOLD_CRITICAL = 100;
const BILLING_BUDGET_MAX_THRESHOLD = 100;
const BILLING_BUDGET_AMOUNT_PRECISION = 2;
const DEFAULT_BILLING_BUDGET_THRESHOLDS = [
  DEFAULT_BILLING_THRESHOLD_NOTICE,
  DEFAULT_BILLING_THRESHOLD_WARNING,
  DEFAULT_BILLING_THRESHOLD_CRITICAL,
];

const UPDATED_AT_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Shanghai',
});

class PlatformRequestError extends Error {}

const sanitizeThresholds = (thresholds: number[] | undefined) => {
  const normalized = (thresholds ?? [])
    .map(item => Number(item))
    .filter(
      item =>
        Number.isInteger(item) &&
        item > 0 &&
        item <= BILLING_BUDGET_MAX_THRESHOLD,
    );
  const uniqueThresholds = Array.from(new Set(normalized));

  return uniqueThresholds.sort((left, right) => left - right);
};

const parseBudgetAmount = (value: string | number | undefined) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeBillingBudgetsData = (
  data?: BillingBudgetsResponseData,
): BillingBudgetsResponseData => ({
  page: data?.page ?? 1,
  size: data?.size ?? DEFAULT_BILLING_BUDGETS_PAGE_SIZE,
  total: data?.total ?? 0,
  list: data?.list ?? [],
});

const normalizeBillingBudgetsSaveData = (
  data?: BillingBudgetsSaveResponseData,
): BillingBudgetsSaveResponseData => ({
  success_count: data?.success_count ?? 0,
  failed: data?.failed ?? [],
});

const parseBillingBudgetsPayload = async (
  response: Response,
): Promise<PlatformApiResponse<BillingBudgetsResponseData>> => {
  try {
    return (await response.json()) as PlatformApiResponse<BillingBudgetsResponseData>;
  } catch (error) {
    console.warn('Failed to parse billing budgets response', error);
    return {};
  }
};

const parseBillingBudgetsSavePayload = async (
  response: Response,
): Promise<PlatformApiResponse<BillingBudgetsSaveResponseData>> => {
  try {
    return (await response.json()) as PlatformApiResponse<BillingBudgetsSaveResponseData>;
  } catch (error) {
    console.warn('Failed to parse billing budgets save response', error);
    return {};
  }
};

const buildBillingBudgetsUrl = (spaceId: string, size: number) => {
  const searchParams = new URLSearchParams({
    page: '1',
    size: String(size),
  });

  if (spaceId !== 'all') {
    searchParams.set('space_ids', spaceId);
  }

  return `/api/platform/billing/budgets?${searchParams.toString()}`;
};

const createBillingBudgetEditableRow = (
  spaceId: number,
  spaceName: string,
  budget?: BillingBudgetItem,
): BillingBudgetEditableRow => {
  const normalizedThresholds = sanitizeThresholds(budget?.alarm_thresholds);

  return {
    id: budget?.id,
    key: String(spaceId),
    spaceId,
    spaceName: budget?.space_name || spaceName || String(spaceId),
    monthlyBudget: parseBudgetAmount(budget?.monthly_budget),
    alarmThresholds:
      normalizedThresholds.length > 0
        ? normalizedThresholds
        : DEFAULT_BILLING_BUDGET_THRESHOLDS,
    overLimitPolicy: budget?.over_limit_policy === 'reject' ? 'reject' : 'warn',
    enabled: Boolean(budget?.enabled),
    updatedAt: budget?.updated_at ?? 0,
  };
};

const matchesSpaceFilter = (spaceId: number, selectedSpaceId: string) =>
  selectedSpaceId === 'all' || String(spaceId) === selectedSpaceId;

export const resolveBillingBudgetsQuerySize = (
  spaceOptions: BillingBudgetSpaceOption[],
) =>
  Math.max(
    DEFAULT_BILLING_BUDGETS_PAGE_SIZE,
    spaceOptions.filter(option => option.value !== 'all').length,
  );

export const fetchBillingBudgets = async (spaceId: string, size: number) => {
  const response = await fetch(buildBillingBudgetsUrl(spaceId, size), {
    credentials: 'include',
  });
  const payload = await parseBillingBudgetsPayload(response);

  if (!response.ok) {
    throw new PlatformRequestError(
      payload.msg ||
        `HTTP ${response.status} ${response.statusText || 'request failed'}`,
    );
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new PlatformRequestError(
      payload.msg || 'load billing budgets failed',
    );
  }

  return normalizeBillingBudgetsData(payload.data);
};

export const saveBillingBudget = async (row: BillingBudgetEditableRow) => {
  const response = await fetch('/api/platform/billing/budgets', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rules: [
        {
          space_id: row.spaceId,
          monthly_budget:
            row.monthlyBudget?.toFixed(BILLING_BUDGET_AMOUNT_PRECISION) ?? '',
          alarm_thresholds: sanitizeThresholds(row.alarmThresholds),
          over_limit_policy: row.overLimitPolicy,
          enabled: row.enabled,
        },
      ],
    }),
  });
  const payload = await parseBillingBudgetsSavePayload(response);

  if (!response.ok) {
    throw new PlatformRequestError(
      payload.msg ||
        `HTTP ${response.status} ${response.statusText || 'request failed'}`,
    );
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new PlatformRequestError(payload.msg || 'save billing budget failed');
  }

  return normalizeBillingBudgetsSaveData(payload.data);
};

export const buildBillingBudgetRows = ({
  budgetItems,
  selectedSpaceId,
  spaceOptions,
}: {
  budgetItems: BillingBudgetItem[];
  selectedSpaceId: string;
  spaceOptions: BillingBudgetSpaceOption[];
}) => {
  const budgetMap = new Map<number, BillingBudgetItem>();
  budgetItems.forEach(item => {
    const spaceId = Number(item.space_id ?? 0);
    if (spaceId > 0) {
      budgetMap.set(spaceId, item);
    }
  });

  const rows: BillingBudgetEditableRow[] = [];
  const seenSpaceIDs = new Set<number>();

  spaceOptions
    .filter(option => option.value !== 'all')
    .forEach(option => {
      const spaceId = Number(option.value);
      if (!Number.isFinite(spaceId) || spaceId <= 0) {
        return;
      }
      if (!matchesSpaceFilter(spaceId, selectedSpaceId)) {
        return;
      }

      rows.push(
        createBillingBudgetEditableRow(
          spaceId,
          option.label,
          budgetMap.get(spaceId),
        ),
      );
      seenSpaceIDs.add(spaceId);
    });

  budgetItems.forEach(item => {
    const spaceId = Number(item.space_id ?? 0);
    if (!Number.isFinite(spaceId) || spaceId <= 0) {
      return;
    }
    if (
      seenSpaceIDs.has(spaceId) ||
      !matchesSpaceFilter(spaceId, selectedSpaceId)
    ) {
      return;
    }

    rows.push(
      createBillingBudgetEditableRow(
        spaceId,
        item.space_name || String(spaceId),
        item,
      ),
    );
  });

  return rows.sort((left, right) =>
    left.spaceName.localeCompare(right.spaceName, 'zh-CN'),
  );
};

export const resolveBillingBudgetThresholdOptions = (thresholds: number[]) =>
  Array.from(
    new Set([
      ...DEFAULT_BILLING_BUDGET_THRESHOLDS,
      ...sanitizeThresholds(thresholds),
    ]),
  ).sort((left, right) => left - right);

export const formatBillingBudgetUpdatedAt = (updatedAt: number | undefined) => {
  if (!updatedAt) {
    return tNoOptions('platform_management_budgets_not_saved', '尚未保存');
  }

  return UPDATED_AT_FORMATTER.format(new Date(updatedAt));
};

export const validateBillingBudgetRow = (row: BillingBudgetEditableRow) => {
  if (!row.spaceId) {
    return tNoOptions(
      'platform_management_budgets_invalid_space',
      '空间信息无效，请刷新后重试',
    );
  }

  if (row.monthlyBudget === undefined || Number.isNaN(row.monthlyBudget)) {
    return tNoOptions(
      'platform_management_budgets_budget_required',
      '请填写月预算',
    );
  }

  if (row.monthlyBudget < 0) {
    return tNoOptions(
      'platform_management_budgets_budget_negative',
      '月预算不能小于 0',
    );
  }

  if (sanitizeThresholds(row.alarmThresholds).length === 0) {
    return tNoOptions(
      'platform_management_budgets_threshold_required',
      '请至少选择一个告警阈值',
    );
  }

  if (!['warn', 'reject'].includes(row.overLimitPolicy)) {
    return tNoOptions(
      'platform_management_budgets_policy_invalid',
      '超限策略无效，请刷新后重试',
    );
  }

  return '';
};

export const resolveBillingBudgetRequestErrorText = (error: unknown) => {
  if (error instanceof PlatformRequestError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return tNoOptions(
    'platform_management_budgets_request_failed',
    '预算规则请求失败',
  );
};
