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
      <Typography.Title heading={5} className="!mb-0">
        {tNoOptions('platform_management_stats_title', '统计概览')}
      </Typography.Title>
      <Typography.Text className="text-[12px] coz-fg-secondary">
        {tNoOptions(
          'platform_management_stats_subtitle',
          '查看活跃度、调用质量与项目排行。',
        )}
      </Typography.Text>
    </div>
    <Button
      theme="light"
      loading={loading}
      onClick={onRefresh}
      className="px-[16px] border border-solid coz-stroke-primary"
      style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
    >
      {tNoOptions('platform_management_refresh', '刷新')}
    </Button>
  </div>
);

const StatsMetricCard: FC<StatsMetricCardProps> = ({
  title,
  value,
  description,
}) => (
  <div className="rounded-[10px] border border-solid coz-stroke-primary px-[12px] py-[12px]">
    <Typography.Text className="text-[12px] coz-fg-secondary">
      {title}
    </Typography.Text>
    <Typography.Title heading={4} className="!mb-0 mt-[8px]">
      {value}
    </Typography.Title>
    {description ? (
      <Typography.Text className="mt-[4px] text-[12px] coz-fg-secondary">
        {description}
      </Typography.Text>
    ) : null}
  </div>
);

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
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_active_project',
        '活跃项目数',
      )}
      value={formatStatsNumber(overview.active_project_count)}
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_total_calls',
        '调用总量',
      )}
      value={formatStatsNumber(overview.total_calls)}
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_success_rate',
        '成功率',
      )}
      value={formatStatsPercentage(overview.success_rate)}
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_avg_latency',
        '平均时延',
      )}
      value={formatStatsDuration(overview.avg_latency_ms)}
    />
    <StatsMetricCard
      title={tNoOptions(
        'platform_management_stats_card_total_tokens',
        '总 Token',
      )}
      value={formatStatsNumber(overview.total_tokens)}
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
      <Typography.Title heading={5} className="!mb-0">
        {tNoOptions('platform_management_stats_rankings_title', '项目排行')}
      </Typography.Title>
      <Typography.Text className="text-[12px] coz-fg-secondary">
        {tNoOptions(
          'platform_management_stats_rankings_subtitle',
          `当前按 ${resolveStatsMetricLabel(metric)} 排序，共 ${total} 个项目`,
        )}
      </Typography.Text>
    </div>
    <div className="flex flex-wrap items-center gap-[10px]">
      <Select
        className="w-[180px]"
        value={metric}
        optionList={STATS_METRIC_OPTIONS}
        onChange={onMetricChange}
      />
      <Button
        theme="light"
        loading={loading}
        onClick={onRefresh}
        className="px-[16px] border border-solid coz-stroke-primary"
        style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
      >
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
      <Button
        size="small"
        disabled={page <= 1 || loading}
        onClick={onPrevPage}
        className="px-[12px] border border-solid coz-stroke-primary"
        style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
      >
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
    <div className="rounded-[10px] border border-solid coz-stroke-primary px-[12px] py-[12px]">
      <StatsRankingsHeader
        loading={loading}
        metric={metric}
        total={rankings.total ?? 0}
        onMetricChange={onMetricChange}
        onRefresh={onRefresh}
      />

      {rankingsErrorText ? (
        <div className="mt-[12px]">
          <PlatformErrorState
            errorText={rankingsErrorText}
            onRetry={onRefresh}
          />
        </div>
      ) : null}

      {!loading && !rankingsErrorText && !hasRows ? (
        <div className="mt-[12px]">
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
          <div className="mt-[12px] overflow-hidden">
            <Table
              columns={columns}
              dataSource={rankings.list ?? []}
              loading={loading}
              pagination={false}
              rowKey={record =>
                `${record.project_type || 'unknown'}-${record.project_id || 0}`
              }
              scroll={{ x: 1012 }}
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
