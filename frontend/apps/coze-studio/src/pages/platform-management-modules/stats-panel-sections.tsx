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

import { type FC, useMemo } from 'react';

import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import {
  Button,
  Select,
  Table,
  Typography,
  type ColumnProps,
} from '@coze-arch/coze-design';

import {
  formatStatsCurrency,
  formatStatsDuration,
  formatStatsNumber,
  formatStatsPercentage,
  formatStatsProjectType,
  resolveStatsMetricLabel,
  STATS_METRIC_OPTIONS,
  type StatsOverviewResponseData,
  type StatsRankingItem,
  type StatsRankingMetric,
  type StatsRankingsResponseData,
} from './stats-helpers';
import {
  PlatformEmptyState,
  PlatformErrorState,
} from './platform-request-states';

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

const STATS_RANKINGS_TABLE_STYLE = `
.stats-rankings-table table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.stats-rankings-table thead th {
  background: #F7F8FA;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 14px;
  border-bottom: 1px solid #E2E8F0;
}

.stats-rankings-table th,
.stats-rankings-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #F1F5F9;
  color: #1F2937;
  font-size: 14px;
}

.stats-rankings-table tbody tr:last-child td {
  border-bottom: none;
}

.stats-rankings-table tbody tr:hover td {
  background: #F8FAFC;
}
`;

interface StatsHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

interface StatsMetricCardProps {
  title: string;
  value: string;
  description?: string;
}

interface StatsRankingsSectionProps {
  currentPage: number;
  currentSize: number;
  loading: boolean;
  metric: StatsRankingMetric;
  onMetricChange: (value: unknown) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  rankings: StatsRankingsResponseData;
  rankingsErrorText: string;
  totalPages: number;
}

interface StatsRankingsHeaderProps {
  loading: boolean;
  metric: StatsRankingMetric;
  total: number;
  onMetricChange: (value: unknown) => void;
  onRefresh: () => void;
}

interface StatsRankingsPaginationProps {
  page: number;
  size: number;
  totalPages: number;
  loading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const StatsHeader: FC<StatsHeaderProps> = ({ loading, onRefresh }) => (
  <div className="flex flex-wrap items-start justify-between gap-[12px]">
    <div className="flex flex-col gap-[4px]">
      <Typography.Title
        heading={5}
        className="!mb-0 text-[16px] font-semibold text-gray-900"
      >
        {tNoOptions('platform_management_stats_title', '统计概览')}
      </Typography.Title>
      <Typography.Text className="text-[12px] text-gray-500">
        {tNoOptions(
          'platform_management_stats_subtitle',
          '查看活跃度、调用质量与项目排行。',
        )}
      </Typography.Text>
    </div>
    <Button size="small" loading={loading} onClick={onRefresh}>
      {tNoOptions('platform_management_refresh', '刷新')}
    </Button>
  </div>
);

interface StatsMetricCardExtendedProps extends StatsMetricCardProps {
  accentColor?: string;
  valueColor?: string;
}

const StatsMetricCard: FC<StatsMetricCardExtendedProps> = ({
  title,
  value,
  description,
  accentColor,
  valueColor,
}) => (
  <div className="rounded-[10px] border border-solid coz-stroke-primary overflow-hidden flex">
    {accentColor ? (
      <div
        className="w-[3px] flex-shrink-0"
        style={{ backgroundColor: accentColor }}
      />
    ) : null}
    <div className="px-[14px] py-[12px] flex-1 min-w-0">
      <Typography.Text className="text-[12px] coz-fg-secondary">
        {title}
      </Typography.Text>
      <Typography.Title
        heading={4}
        className="!mb-0 mt-[8px]"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Typography.Title>
      {description ? (
        <Typography.Text className="mt-[4px] text-[12px] coz-fg-secondary">
          {description}
        </Typography.Text>
      ) : null}
    </div>
  </div>
);

const SUCCESS_RATE_HIGH = 0.9;
const SUCCESS_RATE_LOW = 0.8;

const resolveSuccessRateColor = (
  rate: string | undefined,
): string | undefined => {
  const parsed = Number(rate ?? 0);
  if (!parsed) {
    return undefined;
  }
  if (parsed >= SUCCESS_RATE_HIGH) {
    return '#00B42A';
  }
  if (parsed < SUCCESS_RATE_LOW) {
    return '#F53F3F';
  }
  return '#FF7D00';
};

export const StatsOverviewCardsGrid: FC<{
  overview: StatsOverviewResponseData;
}> = ({ overview }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[12px]">
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_active_space',
        '活跃空间 DAU / WAU',
      )}
      value={`${formatStatsNumber(overview.active_space_dau)} / ${formatStatsNumber(
        overview.active_space_wau,
      )}`}
      description={tNoOptions(
        'platform_management_stats_card_active_space_desc',
        '日活空间 / 周活空间',
      )}
      accentColor="#3370FF"
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_active_project',
        '活跃项目数',
      )}
      value={formatStatsNumber(overview.active_project_count)}
      accentColor="#3370FF"
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_total_calls',
        '调用总量',
      )}
      value={formatStatsNumber(overview.total_calls)}
      accentColor="#7B61FF"
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_success_rate',
        '成功率',
      )}
      value={formatStatsPercentage(overview.success_rate)}
      accentColor="#00B42A"
      valueColor={resolveSuccessRateColor(overview.success_rate)}
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_avg_latency',
        '平均时延',
      )}
      value={formatStatsDuration(overview.avg_latency_ms)}
      accentColor="#F77234"
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_total_tokens',
        '总 Token',
      )}
      value={formatStatsNumber(overview.total_tokens)}
      accentColor="#7B61FF"
    />
  </div>
);

const StatsRankingsHeader: FC<StatsRankingsHeaderProps> = ({
  loading,
  metric,
  total,
  onMetricChange,
  onRefresh,
}) => (
  <div className="flex flex-wrap items-start justify-between gap-[12px]">
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-[8px]">
        <Typography.Title heading={5} className="!mb-0">
          {tNoOptions('platform_management_stats_rankings_title', '项目排行')}
        </Typography.Title>
        <span
          className="rounded-[10px] px-[8px] py-[1px] text-[11px] font-[500]"
          style={{
            backgroundColor: 'rgba(123,97,255,0.08)',
            color: '#7B61FF',
          }}
        >
          {total}
        </span>
      </div>
      <Typography.Text className="text-[12px] coz-fg-secondary">
        {tNoOptions(
          'platform_management_stats_rankings_subtitle',
          `当前按 ${resolveStatsMetricLabel(metric)} 排序`,
        )}
      </Typography.Text>
    </div>
    <div className="flex flex-wrap items-center gap-[10px]">
      <div className="flex items-center gap-[6px]">
        <Typography.Text className="text-[12px] coz-fg-secondary whitespace-nowrap">
          {tNoOptions(
            'platform_management_stats_rankings_metric_label',
            '指标',
          )}
        </Typography.Text>
        <Select
          className="w-[140px]"
          value={metric}
          optionList={STATS_METRIC_OPTIONS}
          onChange={onMetricChange}
        />
      </div>
      <Button size="small" loading={loading} onClick={onRefresh}>
        {tNoOptions('platform_management_refresh', '刷新')}
      </Button>
    </div>
  </div>
);

const StatsRankingsPagination: FC<StatsRankingsPaginationProps> = ({
  page,
  size,
  totalPages,
  loading,
  onPrevPage,
  onNextPage,
}) => (
  <div className="mt-[12px] flex flex-wrap items-center justify-between gap-[12px]">
    <Typography.Text className="text-[12px] coz-fg-secondary">
      {tNoOptions(
        'platform_management_stats_rankings_pagination',
        `第 ${page} / ${totalPages} 页，每页 ${size} 条`,
      )}
    </Typography.Text>
    <div className="flex items-center gap-[8px]">
      <Button size="small" disabled={page <= 1 || loading} onClick={onPrevPage}>
        {tNoOptions('platform_management_records_prev_page', '上一页')}
      </Button>
      <Button
        size="small"
        disabled={page >= totalPages || loading}
        onClick={onNextPage}
      >
        {tNoOptions('platform_management_records_next_page', '下一页')}
      </Button>
    </div>
  </div>
);

const getStatsRankingColumns = (
  page: number,
  size: number,
): ColumnProps<StatsRankingItem>[] => [
  {
    title: '#',
    dataIndex: 'project_id',
    key: 'rank',
    width: 72,
    render: (_value, _record, index) => (page - 1) * size + (index ?? 0) + 1,
  },
  {
    title: tNoOptions(
      'platform_management_stats_rankings_project_name',
      '项目名称',
    ),
    dataIndex: 'project_name',
    key: 'project_name',
    width: 220,
    render: value => value || '--',
  },
  {
    title: tNoOptions(
      'platform_management_stats_rankings_project_type',
      '项目类型',
    ),
    dataIndex: 'project_type',
    key: 'project_type',
    width: 140,
    render: value => formatStatsProjectType(value as string | undefined),
  },
  {
    title: tNoOptions('platform_management_stats_rankings_calls', '调用量'),
    dataIndex: 'calls',
    key: 'calls',
    width: 140,
    align: 'right',
    render: value => formatStatsNumber(value as number | undefined),
  },
  {
    title: tNoOptions('platform_management_stats_rankings_tokens', 'Token'),
    dataIndex: 'tokens',
    key: 'tokens',
    width: 160,
    align: 'right',
    render: value => formatStatsNumber(value as number | undefined),
  },
  {
    title: tNoOptions('platform_management_stats_rankings_cost', '费用'),
    dataIndex: 'cost',
    key: 'cost',
    width: 160,
    align: 'right',
    render: value => formatStatsCurrency(value as string | number | undefined),
  },
  {
    title: tNoOptions('platform_management_stats_rankings_fail_rate', '失败率'),
    dataIndex: 'fail_rate',
    key: 'fail_rate',
    width: 120,
    align: 'right',
    render: value =>
      formatStatsPercentage(value as string | number | undefined),
  },
];

export const StatsRankingsSection: FC<StatsRankingsSectionProps> = ({
  currentPage,
  currentSize,
  loading,
  metric,
  onMetricChange,
  onNextPage,
  onPrevPage,
  onRefresh,
  onResetFilters,
  rankings,
  rankingsErrorText,
  totalPages,
}) => {
  const columns = useMemo(
    () => getStatsRankingColumns(currentPage, currentSize),
    [currentPage, currentSize],
  );
  const hasRows = Boolean((rankings.list ?? []).length);

  return (
    <div className="rounded-[12px] bg-white border border-gray-100 px-5 pt-6 pb-5 shadow-sm">
      <style>{STATS_RANKINGS_TABLE_STYLE}</style>
      <StatsRankingsHeader
        loading={loading}
        metric={metric}
        total={rankings.total ?? 0}
        onMetricChange={onMetricChange}
        onRefresh={onRefresh}
      />

      {rankingsErrorText ? (
        <div className="mt-4">
          <PlatformErrorState
            errorText={rankingsErrorText}
            onRetry={onRefresh}
          />
        </div>
      ) : null}

      {!loading && !rankingsErrorText && !hasRows ? (
        <div className="mt-4">
          <PlatformEmptyState
            title={tNoOptions(
              'platform_management_stats_rankings_empty',
              '暂无排行数据',
            )}
            onAction={onResetFilters}
          />
        </div>
      ) : null}

      {hasRows ? (
        <>
          <div className="stats-rankings-table mt-4 overflow-hidden">
            <Table
              scrollX={1012}
              tableProps={{
                columns,
                dataSource: rankings.list ?? [],
                loading,
                pagination: false,
                rowKey: (record: StatsRankingItem) =>
                  `${record.project_type || 'unknown'}-${record.project_id || 0}`,
              }}
            />
          </div>

          <StatsRankingsPagination
            page={currentPage}
            size={currentSize}
            totalPages={totalPages}
            loading={loading}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
          />
        </>
      ) : null}
    </div>
  );
};
