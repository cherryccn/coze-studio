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

import { type PropsWithChildren } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

const statsPanelMocks = vi.hoisted(() => ({
  fetchStatsOverview: vi.fn(),
  fetchStatsRankings: vi.fn(),
  headerProps: [] as Array<{ onRefresh: () => void; loading: boolean }>,
  overviewProps: [] as Array<{ overview: Record<string, unknown> }>,
  rankingsProps: [] as Array<{
    metric: string;
    rankings: { total?: number; list?: unknown[] };
  }>,
}));

function MockButton({
  children,
  onClick,
}: PropsWithChildren<{ onClick?: () => void }>) {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function MockStateButton({
  children,
  onClick,
}: PropsWithChildren<{ onClick?: () => void }>) {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function MockStatsHeader({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  statsPanelMocks.headerProps.push({ loading, onRefresh });
  return <MockButton onClick={onRefresh}>refresh-header</MockButton>;
}

function MockStatsOverviewCardsGrid({
  overview,
}: {
  overview: Record<string, unknown>;
}) {
  statsPanelMocks.overviewProps.push({ overview });
  return <div>{`overview-grid:${JSON.stringify(overview)}`}</div>;
}

function MockStatsRankingsSection({
  metric,
  rankings,
}: {
  metric: string;
  rankings: { total?: number; list?: unknown[] };
}) {
  statsPanelMocks.rankingsProps.push({ metric, rankings });
  return <div>{`rankings-section:${metric}:${rankings.total ?? 0}`}</div>;
}

function MockPlatformLoadingState() {
  return <div>loading-state</div>;
}

function MockPlatformErrorState({
  errorText,
  onRetry,
}: {
  errorText: string;
  onRetry: () => void;
}) {
  return (
    <MockStateButton onClick={onRetry}>
      {`error-state:${errorText}`}
    </MockStateButton>
  );
}

function MockPlatformEmptyState({ onAction }: { onAction?: () => void }) {
  return <MockStateButton onClick={onAction}>empty-state</MockStateButton>;
}

function MockFilterSummaryChips({
  filterSummary,
}: {
  filterSummary: Array<{ key: string; value: string }>;
}) {
  return (
    <div>{`summary:${filterSummary.map(item => item.value).join('|')}`}</div>
  );
}

vi.mock('./stats-helpers', () => ({
  DEFAULT_STATS_RANKINGS_QUERY: { metric: 'calls', page: 1, size: 10 },
  EMPTY_STATS_OVERVIEW: {
    active_space_dau: 0,
    active_space_wau: 0,
    active_project_count: 0,
    total_calls: 0,
    success_rate: '0.0000',
    avg_latency_ms: 0,
    total_tokens: 0,
  },
  EMPTY_STATS_RANKINGS: {
    page: 1,
    size: 10,
    total: 0,
    list: [],
  },
  fetchStatsOverview: statsPanelMocks.fetchStatsOverview,
  fetchStatsRankings: statsPanelMocks.fetchStatsRankings,
  resolveStatsRequestErrorText: (error: unknown) =>
    error instanceof Error ? error.message : '数据加载失败',
}));

vi.mock('./stats-panel-sections', () => ({
  StatsHeader: MockStatsHeader,
  StatsOverviewCardsGrid: MockStatsOverviewCardsGrid,
  StatsRankingsSection: MockStatsRankingsSection,
}));

vi.mock('./platform-request-states', () => ({
  PlatformLoadingState: MockPlatformLoadingState,
  PlatformErrorState: MockPlatformErrorState,
  PlatformEmptyState: MockPlatformEmptyState,
}));

vi.mock('./filter-summary-chips', () => ({
  FilterSummaryChips: MockFilterSummaryChips,
}));

import { StatsPanel } from './stats-panel';

const DEFAULT_FILTERS = {
  timeRange: 'last_7_days',
  spaceId: 'all',
  projectType: 'all',
} as const;

const DEFAULT_FILTER_SUMMARY = [
  { key: 'timeRange', label: '时间范围', value: '近7天' },
  { key: 'space', label: '空间', value: '全部空间' },
];

const NON_EMPTY_OVERVIEW = {
  active_space_dau: 5,
  active_space_wau: 9,
  active_project_count: 3,
  total_calls: 100,
  success_rate: '0.9876',
  avg_latency_ms: 120,
  total_tokens: 4567,
};

const NON_EMPTY_RANKINGS = {
  page: 1,
  size: 10,
  total: 2,
  list: [
    {
      project_id: 1,
      project_name: '客服机器人',
      project_type: 'agent',
      calls: 50,
    },
  ],
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('stats-panel', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    statsPanelMocks.fetchStatsOverview.mockReset();
    statsPanelMocks.fetchStatsRankings.mockReset();
    statsPanelMocks.headerProps.length = 0;
    statsPanelMocks.overviewProps.length = 0;
    statsPanelMocks.rankingsProps.length = 0;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('renders empty state and triggers reset action when overview and rankings are empty', async () => {
    const onResetFilters = vi.fn();
    statsPanelMocks.fetchStatsOverview.mockResolvedValue({
      active_space_dau: 0,
      active_space_wau: 0,
      active_project_count: 0,
      total_calls: 0,
      success_rate: '0.0000',
      avg_latency_ms: 0,
      total_tokens: 0,
    });
    statsPanelMocks.fetchStatsRankings.mockResolvedValue({
      page: 1,
      size: 10,
      total: 0,
      list: [],
    });

    await act(async () => {
      root.render(
        <StatsPanel
          filters={DEFAULT_FILTERS}
          filterSummary={DEFAULT_FILTER_SUMMARY}
          onResetFilters={onResetFilters}
        />,
      );
      await flushPromises();
    });

    expect(container.textContent).toContain('summary:近7天|全部空间');
    expect(container.textContent).toContain('empty-state');
    expect(container.textContent).not.toContain('overview-grid:');
    expect(container.textContent).not.toContain('rankings-section:');

    const button = Array.from(container.querySelectorAll('button')).find(
      element => element.textContent === 'empty-state',
    );
    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it('renders overview error and retries overview loading on demand', async () => {
    statsPanelMocks.fetchStatsOverview
      .mockRejectedValueOnce(new Error('overview failed'))
      .mockResolvedValueOnce(NON_EMPTY_OVERVIEW);
    statsPanelMocks.fetchStatsRankings.mockResolvedValue(NON_EMPTY_RANKINGS);

    await act(async () => {
      root.render(
        <StatsPanel
          filters={DEFAULT_FILTERS}
          filterSummary={DEFAULT_FILTER_SUMMARY}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    expect(container.textContent).toContain('error-state:overview failed');
    expect(container.textContent).toContain('rankings-section:calls:2');

    const errorButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('error-state:overview failed'),
    );

    await act(async () => {
      errorButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(statsPanelMocks.fetchStatsOverview).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('"active_space_dau":5');
  });

  it('renders overview and rankings sections and refreshes both requests', async () => {
    statsPanelMocks.fetchStatsOverview.mockResolvedValue(NON_EMPTY_OVERVIEW);
    statsPanelMocks.fetchStatsRankings.mockResolvedValue(NON_EMPTY_RANKINGS);

    await act(async () => {
      root.render(
        <StatsPanel
          filters={DEFAULT_FILTERS}
          filterSummary={DEFAULT_FILTER_SUMMARY}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    expect(statsPanelMocks.fetchStatsOverview).toHaveBeenCalledWith(
      DEFAULT_FILTERS,
    );
    expect(statsPanelMocks.fetchStatsRankings).toHaveBeenCalledWith(
      DEFAULT_FILTERS,
      { metric: 'calls', page: 1, size: 10 },
    );
    expect(container.textContent).toContain('"total_calls":100');
    expect(container.textContent).toContain('rankings-section:calls:2');

    const refreshButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent === 'refresh-header',
    );

    await act(async () => {
      refreshButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
    });

    expect(statsPanelMocks.fetchStatsOverview).toHaveBeenCalledTimes(2);
    expect(statsPanelMocks.fetchStatsRankings).toHaveBeenCalledTimes(2);
  });
});
