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

import type { FilterSummaryItem, PlatformFilters } from './types';
import {
  StatsHeader,
  StatsOverviewCardsGrid,
  StatsRankingsSection,
} from './stats-panel-sections';
import {
  DEFAULT_STATS_RANKINGS_QUERY,
  EMPTY_STATS_OVERVIEW,
  EMPTY_STATS_RANKINGS,
  fetchStatsOverview,
  fetchStatsRankings,
  resolveStatsRequestErrorText,
  type StatsOverviewResponseData,
  type StatsRankingMetric,
  type StatsRankingsQueryState,
  type StatsRankingsResponseData,
} from './stats-helpers';
import {
  PlatformEmptyState,
  PlatformErrorState,
  PlatformLoadingState,
} from './platform-request-states';

interface StatsPanelProps {
  filters: PlatformFilters;
  filterSummary: FilterSummaryItem[];
  onResetFilters: () => void;
}

const useStatsPanelState = (filters: PlatformFilters) => {
  const [overview, setOverview] =
    useState<StatsOverviewResponseData>(EMPTY_STATS_OVERVIEW);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewErrorText, setOverviewErrorText] = useState('');

  const [rankingsQuery, setRankingsQuery] = useState<StatsRankingsQueryState>(
    DEFAULT_STATS_RANKINGS_QUERY,
  );
  const [rankings, setRankings] =
    useState<StatsRankingsResponseData>(EMPTY_STATS_RANKINGS);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsErrorText, setRankingsErrorText] = useState('');

  const currentPage = rankings.page ?? rankingsQuery.page;
  const currentSize = rankings.size ?? rankingsQuery.size;
  const totalPages = Math.max(
    1,
    Math.ceil((rankings.total ?? 0) / Math.max(1, currentSize)),
  );

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewErrorText('');
    try {
      const nextOverview = await fetchStatsOverview(filters);
      setOverview(nextOverview);
    } catch (error) {
      setOverviewErrorText(resolveStatsRequestErrorText(error));
      setOverview(EMPTY_STATS_OVERVIEW);
    } finally {
      setOverviewLoading(false);
    }
  }, [filters]);

  const loadRankings = useCallback(async () => {
    setRankingsLoading(true);
    setRankingsErrorText('');
    try {
      const nextRankings = await fetchStatsRankings(filters, rankingsQuery);
      setRankings(nextRankings);
    } catch (error) {
      setRankingsErrorText(resolveStatsRequestErrorText(error));
      setRankings(EMPTY_STATS_RANKINGS);
    } finally {
      setRankingsLoading(false);
    }
  }, [filters, rankingsQuery]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadRankings();
  }, [loadRankings]);

  useEffect(() => {
    setRankingsQuery(previous =>
      previous.page === 1 ? previous : { ...previous, page: 1 },
    );
  }, [filters]);

  const handleMetricChange = useCallback((value: unknown) => {
    setRankingsQuery(previous => ({
      ...previous,
      metric: value as StatsRankingMetric,
      page: 1,
    }));
  }, []);

  const handlePrevPage = useCallback(() => {
    setRankingsQuery(previous => ({
      ...previous,
      page: Math.max(1, previous.page - 1),
    }));
  }, []);

  const handleNextPage = useCallback(() => {
    setRankingsQuery(previous => ({
      ...previous,
      page: Math.min(totalPages, previous.page + 1),
    }));
  }, [totalPages]);

  const handleRefresh = useCallback(() => {
    void Promise.all([loadOverview(), loadRankings()]);
  }, [loadOverview, loadRankings]);

  return {
    currentPage,
    currentSize,
    handleMetricChange,
    handleNextPage,
    handlePrevPage,
    handleRefresh,
    loadOverview,
    loadRankings,
    overview,
    overviewErrorText,
    overviewLoading,
    rankings,
    rankingsErrorText,
    rankingsLoading,
    rankingsQuery,
    totalPages,
  };
};

const isStatsPanelEmpty = ({
  overview,
  rankings,
}: {
  overview: StatsOverviewResponseData;
  rankings: StatsRankingsResponseData;
}) => {
  const overviewValues = [
    overview.active_space_dau,
    overview.active_space_wau,
    overview.active_project_count,
    overview.total_calls,
    overview.avg_latency_ms,
    overview.total_tokens,
    overview.success_rate,
  ];

  return (
    overviewValues.every(value => !Number(value ?? 0)) &&
    !(rankings.list ?? []).length
  );
};

export const StatsPanel: FC<StatsPanelProps> = ({
  filters,
  filterSummary,
  onResetFilters,
}) => {
  const {
    currentPage,
    currentSize,
    handleMetricChange,
    handleNextPage,
    handlePrevPage,
    handleRefresh,
    loadOverview,
    loadRankings,
    overview,
    overviewErrorText,
    overviewLoading,
    rankings,
    rankingsErrorText,
    rankingsLoading,
    rankingsQuery,
    totalPages,
  } = useStatsPanelState(filters);

  const isEmpty =
    !overviewLoading &&
    !overviewErrorText &&
    !rankingsLoading &&
    !rankingsErrorText &&
    isStatsPanelEmpty({ overview, rankings });

  return (
    <div className="py-2 flex flex-col gap-5">
      <StatsHeader
        loading={overviewLoading || rankingsLoading}
        onRefresh={handleRefresh}
      />

      {overviewLoading ? <PlatformLoadingState /> : null}

      {overviewErrorText ? (
        <PlatformErrorState
          errorText={overviewErrorText}
          onRetry={() => void loadOverview()}
        />
      ) : null}

      {isEmpty ? <PlatformEmptyState onAction={onResetFilters} /> : null}

      {isEmpty ? null : <StatsOverviewCardsGrid overview={overview} />}

      {isEmpty ? null : (
        <StatsRankingsSection
          currentPage={currentPage}
          currentSize={currentSize}
          loading={rankingsLoading}
          metric={rankingsQuery.metric}
          onMetricChange={handleMetricChange}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          onRefresh={() => void loadRankings()}
          onResetFilters={onResetFilters}
          rankings={rankings}
          rankingsErrorText={rankingsErrorText}
          totalPages={totalPages}
        />
      )}
    </div>
  );
};
