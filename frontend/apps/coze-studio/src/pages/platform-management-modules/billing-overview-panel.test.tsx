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

function MockText({ children }: PropsWithChildren) {
  return <span>{children}</span>;
}

function MockTitle({ children }: PropsWithChildren) {
  return <div>{children}</div>;
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
    <MockButton onClick={onRetry}>{`error-state:${errorText}`}</MockButton>
  );
}

function MockPlatformEmptyState({ onAction }: { onAction?: () => void }) {
  return <MockButton onClick={onAction}>empty-state</MockButton>;
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

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _params: Record<string, unknown>, fallback: string) =>
      fallback,
  },
}));

vi.mock('@coze-arch/coze-design', () => ({
  Typography: {
    Text: MockText,
    Title: MockTitle,
  },
}));

vi.mock('./platform-request-states', () => ({
  PlatformLoadingState: MockPlatformLoadingState,
  PlatformErrorState: MockPlatformErrorState,
  PlatformEmptyState: MockPlatformEmptyState,
}));

vi.mock('./filter-summary-chips', () => ({
  FilterSummaryChips: MockFilterSummaryChips,
}));

import { BillingOverviewPanel } from './billing-overview-panel';

const DEFAULT_FILTERS = {
  timeRange: 'last_7_days',
  spaceId: 'all',
  projectType: 'all',
} as const;

const FILTER_SUMMARY = [
  { key: 'timeRange', label: '时间范围', value: '近7天' },
  { key: 'space', label: '空间', value: '全部空间' },
];

const SUCCESS_OVERVIEW_DATA = {
  cards: {
    today_cost: '12.3',
    month_cost: '45.6',
    token_consumption: 1234,
    active_space_count: 6,
  },
  cost_trend: [
    { date: '2026-03-08', amount: '10.2' },
    { date: '2026-03-09', amount: '12.3' },
  ],
  token_trend: [{ date: '2026-03-09', tokens: 888 }],
  top_spaces: [
    { space_id: 1, space_name: 'A 空间', amount: '23.4', tokens: 666 },
  ],
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const createSuccessResponse = (data: unknown) =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () =>
      Promise.resolve({
        code: 0,
        data,
      }),
  }) as Response;

const getButtonByText = (container: HTMLElement, text: string) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent === text,
  );

describe('billing-overview-panel', () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders loading state without overview content while request is pending', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    await act(async () => {
      root.render(
        <BillingOverviewPanel
          filters={DEFAULT_FILTERS}
          filterSummary={FILTER_SUMMARY}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    expect(container.textContent).toContain('summary:近7天|全部空间');
    expect(container.textContent).toContain('loading-state');
    expect(container.textContent).not.toContain('今日费用');
    expect(container.textContent).not.toContain('Top 空间成本排行');
  });

  it('renders empty state and triggers filter reset action for empty overview data', async () => {
    const onResetFilters = vi.fn();
    fetchMock.mockResolvedValue(
      createSuccessResponse({
        cards: {
          today_cost: '0',
          month_cost: '0',
          token_consumption: 0,
          active_space_count: 0,
        },
        cost_trend: [],
        token_trend: [],
        top_spaces: [],
      }),
    );

    await act(async () => {
      root.render(
        <BillingOverviewPanel
          filters={DEFAULT_FILTERS}
          filterSummary={FILTER_SUMMARY}
          onResetFilters={onResetFilters}
        />,
      );
      await flushPromises();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('empty-state');
    expect(container.textContent).not.toContain('今日费用');

    act(() => {
      getButtonByText(container, 'empty-state')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it('renders error state and retries successfully', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('overview failed'))
      .mockResolvedValueOnce(createSuccessResponse(SUCCESS_OVERVIEW_DATA));

    await act(async () => {
      root.render(
        <BillingOverviewPanel
          filters={DEFAULT_FILTERS}
          filterSummary={FILTER_SUMMARY}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    expect(container.textContent).toContain('error-state:overview failed');
    expect(container.textContent).not.toContain('今日费用');

    await act(async () => {
      getButtonByText(container, 'error-state:overview failed')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('今日费用');
    expect(container.textContent).toContain('¥12.30');
    expect(container.textContent).toContain('¥45.60');
    expect(container.textContent).toContain('1,234');
    expect(container.textContent).toContain('A 空间');
  });
});
