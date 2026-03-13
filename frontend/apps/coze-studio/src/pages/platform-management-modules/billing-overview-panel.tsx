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

import { type FC, useCallback, useEffect, useState } from 'react';

import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import { Typography } from '@coze-arch/coze-design';

import type { FilterSummaryItem, PlatformFilters, TimeRangeKey } from './types';
import { TrendLineChart } from './trend-line-chart';
import {
  PlatformEmptyState,
  PlatformErrorState,
  PlatformLoadingState,
} from './platform-request-states';
import {
  BillingTopSpacesSection,
  type TopSpacesOrder,
  type BillingTopSpaceItem,
} from './billing-top-spaces';

interface PlatformApiResponse<TData> {
  code?: number;
  msg?: string;
  data?: TData;
}

interface BillingOverviewCards {
  today_cost?: string;
  month_cost?: string;
  token_consumption?: number;
  active_space_count?: number;
}

interface BillingCostTrendItem {
  date?: string;
  amount?: string;
}

interface BillingTokenTrendItem {
  date?: string;
  tokens?: number;
}

interface BillingOverviewResponseData {
  cards?: BillingOverviewCards;
  cost_trend?: BillingCostTrendItem[];
  token_trend?: BillingTokenTrendItem[];
  top_spaces?: BillingTopSpaceItem[];
}

interface BillingOverviewPanelProps {
  filters: PlatformFilters;
  filterSummary: FilterSummaryItem[];
  onResetFilters: () => void;
}

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLIS_PER_SECOND;
const LAST_7_DAYS_OFFSET = 6;
const LAST_30_DAYS_OFFSET = 29;

const CURRENCY_FORMATTER = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const NUMBER_FORMATTER = new Intl.NumberFormat('zh-CN');

const EMPTY_BILLING_OVERVIEW: BillingOverviewResponseData = {
  cards: {
    today_cost: '0',
    month_cost: '0',
    token_consumption: 0,
    active_space_count: 0,
  },
  cost_trend: [],
  token_trend: [],
  top_spaces: [],
};

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

const getDayStartMs = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const resolveOverviewTimeRange = (timeRange: TimeRangeKey) => {
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

const formatCurrency = (value: string | number | undefined) =>
  `¥${CURRENCY_FORMATTER.format(toFiniteNumber(value))}`;

const formatNumber = (value: string | number | undefined) =>
  NUMBER_FORMATTER.format(toFiniteNumber(value));

const normalizeBillingOverviewCards = (
  cards?: BillingOverviewCards,
): BillingOverviewCards => ({
  today_cost: cards?.today_cost ?? '0',
  month_cost: cards?.month_cost ?? '0',
  token_consumption: cards?.token_consumption ?? 0,
  active_space_count: cards?.active_space_count ?? 0,
});

const normalizeBillingOverviewData = (
  data?: BillingOverviewResponseData,
): BillingOverviewResponseData => ({
  cards: normalizeBillingOverviewCards(data?.cards),
  cost_trend: data?.cost_trend ?? [],
  token_trend: data?.token_trend ?? [],
  top_spaces: data?.top_spaces ?? [],
});

class PlatformRequestError extends Error {}

const resolveRequestErrorText = (error: unknown) => {
  if (error instanceof PlatformRequestError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return tNoOptions('platform_management_overview_load_failed', '数据加载失败');
};

const buildBillingOverviewUrl = (
  filters: PlatformFilters,
  topSpacesOrder: TopSpacesOrder = 'desc',
) => {
  const timeRangeParams = resolveOverviewTimeRange(filters.timeRange);
  const searchParams = new URLSearchParams({
    start_time: String(timeRangeParams.start_time),
    end_time: String(timeRangeParams.end_time),
    project_type: filters.projectType,
    top_spaces_order: topSpacesOrder,
  });

  if (filters.spaceId !== 'all') {
    searchParams.set('space_ids', filters.spaceId);
  }

  return `/api/platform/billing/overview?${searchParams.toString()}`;
};

const parseBillingOverviewPayload = async (
  response: Response,
): Promise<PlatformApiResponse<BillingOverviewResponseData>> => {
  try {
    return (await response.json()) as PlatformApiResponse<BillingOverviewResponseData>;
  } catch (error) {
    console.warn('Failed to parse billing overview response', error);
    return {};
  }
};

const fetchBillingOverview = async (
  filters: PlatformFilters,
  topSpacesOrder: TopSpacesOrder = 'desc',
) => {
  const response = await fetch(
    buildBillingOverviewUrl(filters, topSpacesOrder),
    {
      credentials: 'include',
    },
  );
  const payload = await parseBillingOverviewPayload(response);

  if (!response.ok) {
    throw new PlatformRequestError(
      payload.msg ||
        `HTTP ${response.status} ${response.statusText || 'request failed'}`,
    );
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new PlatformRequestError(
      payload.msg || 'load billing overview failed',
    );
  }

  return normalizeBillingOverviewData(payload.data);
};

const useBillingOverviewData = (filters: PlatformFilters) => {
  const [data, setData] = useState<BillingOverviewResponseData>(
    EMPTY_BILLING_OVERVIEW,
  );
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [topSpacesOrder, setTopSpacesOrder] = useState<TopSpacesOrder>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    try {
      const nextData = await fetchBillingOverview(filters, topSpacesOrder);
      setData(nextData);
    } catch (error) {
      setErrorText(resolveRequestErrorText(error));
      setData(EMPTY_BILLING_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, [filters, topSpacesOrder]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleTopSpacesOrder = useCallback(() => {
    setTopSpacesOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  }, []);

  return {
    data,
    loading,
    errorText,
    reload: load,
    topSpacesOrder,
    toggleTopSpacesOrder,
  };
};

const isBillingOverviewEmpty = (data: BillingOverviewResponseData) =>
  !toFiniteNumber(data.cards?.today_cost) &&
  !toFiniteNumber(data.cards?.month_cost) &&
  !toFiniteNumber(data.cards?.token_consumption) &&
  !toFiniteNumber(data.cards?.active_space_count) &&
  !(data.cost_trend ?? []).length &&
  !(data.token_trend ?? []).length &&
  !(data.top_spaces ?? []).length;

interface BillingCardsGridProps {
  cards?: BillingOverviewCards;
}

const KpiCard: FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div
    className="rounded-[12px] bg-white border border-gray-100 p-6 flex flex-col justify-center"
    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
  >
    <Typography.Text className="text-[14px] text-gray-500 font-medium">
      {label}
    </Typography.Text>
    <Typography.Title
      heading={2}
      className="!mb-0 !mt-2 text-[28px] font-bold text-gray-900"
    >
      {value}
    </Typography.Title>
  </div>
);

const BillingCardsGrid: FC<BillingCardsGridProps> = ({ cards }) => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
    <KpiCard
      label={tNoOptions('platform_management_card_today_cost', '今日费用')}
      value={formatCurrency(cards?.today_cost)}
    />
    <KpiCard
      label={tNoOptions('platform_management_card_month_cost', '本月累计费用')}
      value={formatCurrency(cards?.month_cost)}
    />
    <KpiCard
      label={tNoOptions('platform_management_card_tokens', 'Token 消耗')}
      value={formatNumber(cards?.token_consumption)}
    />
    <KpiCard
      label={tNoOptions('platform_management_card_active_spaces', '活跃空间数')}
      value={formatNumber(cards?.active_space_count)}
    />
  </div>
);

export const BillingOverviewPanel: FC<BillingOverviewPanelProps> = ({
  filters,
  filterSummary,
  onResetFilters,
}) => {
  const {
    data,
    loading,
    errorText,
    reload,
    topSpacesOrder,
    toggleTopSpacesOrder,
  } = useBillingOverviewData(filters);
  const isEmpty = isBillingOverviewEmpty(data);
  const shouldShowContent = !loading && !errorText && !isEmpty;

  return (
    <div className="py-[4px] flex flex-col gap-6">
      {loading ? <PlatformLoadingState /> : null}
      {errorText ? (
        <PlatformErrorState
          errorText={errorText}
          onRetry={() => void reload()}
        />
      ) : null}
      {!loading && !errorText && isEmpty ? (
        <PlatformEmptyState onAction={onResetFilters} />
      ) : null}
      {shouldShowContent ? (
        <>
          <div>
            <Typography.Title
              heading={5}
              className="!mb-4 text-[18px] font-semibold text-gray-900"
            >
              {tNoOptions('platform_management_overview_title', '计费总览')}
            </Typography.Title>
            <BillingCardsGrid cards={data.cards} />
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2 flex flex-col gap-5">
              <div className="bg-white rounded-[12px] border border-gray-100 p-5 shadow-sm h-full">
                <TrendLineChart
                  title={tNoOptions(
                    'platform_management_cost_trend',
                    '费用趋势',
                  )}
                  data={(data.cost_trend || []).map(item => ({
                    label: item.date || '',
                    value: toFiniteNumber(item.amount),
                  }))}
                  valueFormatter={v => formatCurrency(v)}
                  color="#3370FF"
                />
              </div>
              <div className="bg-white rounded-[12px] border border-gray-100 p-5 shadow-sm h-full">
                <TrendLineChart
                  title={tNoOptions(
                    'platform_management_token_trend',
                    'Token 趋势',
                  )}
                  data={(data.token_trend || []).map(item => ({
                    label: item.date || '',
                    value: toFiniteNumber(item.tokens),
                  }))}
                  valueFormatter={v => formatNumber(v)}
                  color="#7B61FF"
                />
              </div>
            </div>
            <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm xl:col-span-1 overflow-hidden">
              <BillingTopSpacesSection
                topSpaces={data.top_spaces || []}
                order={topSpacesOrder}
                loading={loading}
                onToggleOrder={toggleTopSpacesOrder}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                toFiniteNumber={toFiniteNumber}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
