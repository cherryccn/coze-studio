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

const billingRecordsPanelMocks = vi.hoisted(() => ({
  fetchBillingRecords: vi.fn(),
  useBillingRecordsExport: vi.fn(),
}));

function MockButton({
  children,
  disabled,
  onClick,
}: PropsWithChildren<{
  disabled?: boolean;
  onClick?: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </button>
  );
}

function MockInput({
  onChange,
  onEnterPress,
  placeholder,
  value,
}: {
  onChange?: (value: string) => void;
  onEnterPress?: () => void;
  placeholder?: string;
  value?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={event => onChange?.((event.target as HTMLInputElement).value)}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          onEnterPress?.();
        }
      }}
    />
  );
}

function MockSelect({
  onChange,
  optionList,
  value,
}: {
  onChange?: (value: unknown) => void;
  optionList?: Array<{ label: string; value: string }>;
  value?: string;
}) {
  return (
    <select value={value} onChange={event => onChange?.(event.target.value)}>
      {optionList?.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function MockTable({
  columns,
  dataSource,
  loading,
}: {
  columns?: Array<{
    dataIndex?: string;
    render?: (
      value: unknown,
      record: Record<string, unknown>,
      index: number,
    ) => unknown;
  }>;
  dataSource?: Array<Record<string, unknown>>;
  loading?: boolean;
}) {
  const firstRow = dataSource?.[0];

  columns?.forEach(column => {
    if (column.render && firstRow) {
      column.render(
        column.dataIndex ? firstRow[column.dataIndex] : undefined,
        firstRow,
        0,
      );
    }
  });

  return (
    <div>
      {`table:${loading ? 'loading' : 'idle'}:${dataSource?.length ?? 0}:${
        dataSource
          ?.map(item => item.project_name ?? item.id ?? '--')
          .join('|') ?? ''
      }`}
    </div>
  );
}

function MockTag({ children }: PropsWithChildren) {
  return <span>{children}</span>;
}

function MockText({ children }: PropsWithChildren) {
  return <span>{children}</span>;
}

function MockTitle({ children }: PropsWithChildren) {
  return <div>{children}</div>;
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

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _params: Record<string, unknown>, fallback: string) =>
      fallback,
  },
}));

vi.mock('@coze-arch/coze-design/icons', () => ({
  ['IconCozMagnifier']: () => null,
}));

vi.mock('@coze-arch/coze-design', () => ({
  Button: MockButton,
  Input: MockInput,
  Select: MockSelect,
  Table: MockTable,
  Tag: MockTag,
  Typography: {
    Text: MockText,
    Title: MockTitle,
  },
}));

vi.mock('./platform-request-states', () => ({
  PlatformEmptyState: MockPlatformEmptyState,
  PlatformErrorState: MockPlatformErrorState,
}));

vi.mock('./use-billing-records-export', () => ({
  useBillingRecordsExport: billingRecordsPanelMocks.useBillingRecordsExport,
}));

vi.mock('./billing-records-helpers', () => ({
  DEFAULT_QUERY_STATE: {
    keyword: '',
    page: 1,
    size: 20,
    orderBy: 'occurred_at',
    orderDirection: 'desc',
  },
  EMPTY_BILLING_RECORDS: {
    page: 1,
    size: 20,
    total: 0,
    list: [],
  },
  SORT_FIELD_OPTIONS: [
    { value: 'occurred_at', label: '时间' },
    { value: 'amount', label: '金额' },
    { value: 'usage_tokens', label: '用量' },
  ],
  SORT_DIRECTION_OPTIONS: [
    { value: 'desc', label: '降序' },
    { value: 'asc', label: '升序' },
  ],
  fetchBillingRecords: billingRecordsPanelMocks.fetchBillingRecords,
  formatBillingRecordCurrency: (value: string | number | undefined) =>
    `currency:${String(value ?? '')}`,
  formatBillingRecordDateTime: (value: number | undefined) =>
    `time:${String(value ?? '--')}`,
  formatBillingRecordNumber: (value: string | number | undefined) =>
    `number:${String(value ?? '')}`,
  formatBillingRecordProjectType: (value: string | undefined) => value || '--',
  formatBillingRecordUnitPrice: (value: string | number | undefined) =>
    `unit-price:${String(value ?? '')}`,
  resolveBillingRecordsRequestErrorText: (error: unknown) =>
    error instanceof Error ? error.message : '账单明细加载失败',
}));

import { BillingRecordsPanel } from './billing-records-panel';

const DEFAULT_FILTERS = {
  timeRange: 'last_7_days',
  spaceId: 'all',
  projectType: 'all',
} as const;

const DEFAULT_EXPORT_STATE = {
  exportInProgress: false,
  exportStatusText: null,
  hasExportFile: false,
  onDownloadExport: vi.fn(),
  onExport: vi.fn().mockResolvedValue(undefined),
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    reject,
    resolve,
  };
};

const getButtonByText = (container: HTMLElement, text: string) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent === text,
  );

const setNativeInputValue = (input: HTMLInputElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;

  valueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('billing-records-panel', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    billingRecordsPanelMocks.fetchBillingRecords.mockReset();
    billingRecordsPanelMocks.useBillingRecordsExport.mockReset();
    billingRecordsPanelMocks.useBillingRecordsExport.mockReturnValue({
      ...DEFAULT_EXPORT_STATE,
      onDownloadExport: vi.fn(),
      onExport: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('renders empty state and triggers filter reset action', async () => {
    const onResetFilters = vi.fn();
    billingRecordsPanelMocks.fetchBillingRecords.mockResolvedValue({
      page: 1,
      size: 20,
      total: 0,
      list: [],
    });

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={onResetFilters}
        />,
      );
      await flushPromises();
    });

    expect(billingRecordsPanelMocks.fetchBillingRecords).toHaveBeenCalledWith(
      DEFAULT_FILTERS,
      {
        keyword: '',
        page: 1,
        size: 20,
        orderBy: 'occurred_at',
        orderDirection: 'desc',
      },
    );
    expect(container.textContent).toContain('empty-state');
    expect(container.textContent).not.toContain('table:');

    act(() => {
      getButtonByText(container, 'empty-state')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it('renders request error and retries loading on demand', async () => {
    billingRecordsPanelMocks.fetchBillingRecords
      .mockRejectedValueOnce(new Error('records failed'))
      .mockResolvedValueOnce({
        page: 1,
        size: 20,
        total: 1,
        list: [
          {
            id: 1,
            project_name: '客服机器人',
            project_type: 'agent',
            status: 'success',
            occurred_at: 1736035200000,
          },
        ],
      });

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    expect(container.textContent).toContain('error-state:records failed');

    await act(async () => {
      getButtonByText(container, 'error-state:records failed')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    expect(billingRecordsPanelMocks.fetchBillingRecords).toHaveBeenCalledTimes(
      2,
    );
    expect(container.textContent).toContain('table:idle:1:客服机器人');
  });

  it('updates query for search, sorting, and pagination interactions', async () => {
    billingRecordsPanelMocks.fetchBillingRecords.mockImplementation(
      (_filters, query) => ({
        page: query.page,
        size: query.size,
        total: 45,
        list: [
          {
            id: query.page,
            project_name: `${query.keyword || '默认'}-${query.orderBy}-${query.orderDirection}-p${query.page}`,
            project_type: 'agent',
            status: 'success',
            occurred_at: 1736035200000,
          },
        ],
      }),
    );

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    const input = container.querySelector('input');
    const selects = Array.from(container.querySelectorAll('select'));

    act(() => {
      if (input instanceof HTMLInputElement) {
        setNativeInputValue(input, '  Alpha  ');
      }
    });

    await act(async () => {
      getButtonByText(container, '查询')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    expect(
      billingRecordsPanelMocks.fetchBillingRecords,
    ).toHaveBeenLastCalledWith(DEFAULT_FILTERS, {
      keyword: 'Alpha',
      page: 1,
      size: 20,
      orderBy: 'occurred_at',
      orderDirection: 'desc',
    });

    await act(async () => {
      if (selects[0] instanceof HTMLSelectElement) {
        selects[0].value = 'amount';
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
      await flushPromises();
    });

    expect(
      billingRecordsPanelMocks.fetchBillingRecords,
    ).toHaveBeenLastCalledWith(DEFAULT_FILTERS, {
      keyword: 'Alpha',
      page: 1,
      size: 20,
      orderBy: 'amount',
      orderDirection: 'desc',
    });

    await act(async () => {
      if (selects[1] instanceof HTMLSelectElement) {
        selects[1].value = 'asc';
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
      await flushPromises();
    });

    expect(
      billingRecordsPanelMocks.fetchBillingRecords,
    ).toHaveBeenLastCalledWith(DEFAULT_FILTERS, {
      keyword: 'Alpha',
      page: 1,
      size: 20,
      orderBy: 'amount',
      orderDirection: 'asc',
    });

    await act(async () => {
      getButtonByText(container, '下一页')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    expect(
      billingRecordsPanelMocks.fetchBillingRecords,
    ).toHaveBeenLastCalledWith(DEFAULT_FILTERS, {
      keyword: 'Alpha',
      page: 2,
      size: 20,
      orderBy: 'amount',
      orderDirection: 'asc',
    });
    expect(container.textContent).toContain('table:idle:1:Alpha-amount-asc-p2');
  });

  it('resets page before reloading when filters change on a later page', async () => {
    billingRecordsPanelMocks.fetchBillingRecords.mockImplementation(
      (filters, query) => ({
        page: query.page,
        size: query.size,
        total: 45,
        list: [
          {
            id: query.page,
            project_name: `${filters.spaceId}-p${query.page}`,
            project_type: 'agent',
            status: 'success',
            occurred_at: 1736035200000,
          },
        ],
      }),
    );

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    await act(async () => {
      getButtonByText(container, '下一页')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    const nextFilters = {
      ...DEFAULT_FILTERS,
      spaceId: '1001',
    } as const;

    await act(async () => {
      root.render(
        <BillingRecordsPanel filters={nextFilters} onResetFilters={vi.fn()} />,
      );
      await flushPromises();
    });

    const callsWithNextFilters =
      billingRecordsPanelMocks.fetchBillingRecords.mock.calls.filter(
        ([filters]) => filters.spaceId === '1001',
      );

    expect(callsWithNextFilters).toHaveLength(1);
    expect(callsWithNextFilters[0]).toEqual([
      nextFilters,
      {
        keyword: '',
        page: 1,
        size: 20,
        orderBy: 'occurred_at',
        orderDirection: 'desc',
      },
    ]);
    expect(container.textContent).toContain('table:idle:1:1001-p1');
  });

  it('keeps the latest billing records response when requests resolve out of order', async () => {
    const firstRequest = createDeferred<{
      page: number;
      size: number;
      total: number;
      list: Array<{
        id: number;
        project_name: string;
        project_type: string;
        status: string;
        occurred_at: number;
      }>;
    }>();
    const secondRequest = createDeferred<{
      page: number;
      size: number;
      total: number;
      list: Array<{
        id: number;
        project_name: string;
        project_type: string;
        status: string;
        occurred_at: number;
      }>;
    }>();

    billingRecordsPanelMocks.fetchBillingRecords
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    const input = container.querySelector('input');

    act(() => {
      if (input instanceof HTMLInputElement) {
        setNativeInputValue(input, 'Alpha');
      }
    });

    await act(async () => {
      getButtonByText(container, '查询')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    await act(async () => {
      secondRequest.resolve({
        page: 1,
        size: 20,
        total: 1,
        list: [
          {
            id: 2,
            project_name: 'latest-alpha',
            project_type: 'agent',
            status: 'success',
            occurred_at: 1736035200000,
          },
        ],
      });
      await flushPromises();
    });

    expect(container.textContent).toContain('table:idle:1:latest-alpha');

    await act(async () => {
      firstRequest.resolve({
        page: 1,
        size: 20,
        total: 1,
        list: [
          {
            id: 1,
            project_name: 'stale-default',
            project_type: 'agent',
            status: 'success',
            occurred_at: 1736035200000,
          },
        ],
      });
      await flushPromises();
    });

    expect(container.textContent).toContain('table:idle:1:latest-alpha');
    expect(container.textContent).not.toContain('stale-default');
  });

  it('falls back to the last valid page when current page exceeds total pages', async () => {
    billingRecordsPanelMocks.fetchBillingRecords.mockImplementation(
      (_filters, query) => {
        if (query.page === 3) {
          return {
            page: 3,
            size: 20,
            total: 20,
            list: [],
          };
        }

        return {
          page: query.page,
          size: 20,
          total: 45,
          list: [
            {
              id: query.page,
              project_name: `page-${query.page}`,
              project_type: 'agent',
              status: 'success',
              occurred_at: 1736035200000,
            },
          ],
        };
      },
    );

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    await act(async () => {
      getButtonByText(container, '下一页')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    await act(async () => {
      getButtonByText(container, '下一页')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    expect(
      billingRecordsPanelMocks.fetchBillingRecords,
    ).toHaveBeenLastCalledWith(DEFAULT_FILTERS, {
      keyword: '',
      page: 1,
      size: 20,
      orderBy: 'occurred_at',
      orderDirection: 'desc',
    });
    expect(container.textContent).toContain('table:idle:1:page-1');
    expect(container.textContent).not.toContain('empty-state');
  });

  it('renders export status, forwards export action, and downloads file', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    const onDownloadExport = vi.fn();

    billingRecordsPanelMocks.fetchBillingRecords.mockResolvedValue({
      page: 1,
      size: 20,
      total: 1,
      list: [
        {
          id: 1,
          project_name: '客服机器人',
          project_type: 'agent',
          status: 'success',
          occurred_at: 1736035200000,
        },
      ],
    });
    billingRecordsPanelMocks.useBillingRecordsExport.mockReturnValue({
      exportInProgress: false,
      exportStatusText: {
        className: 'coz-fg-hglt-green',
        text: '导出已完成，文件保留至 2026-03-11 09:18',
      },
      hasExportFile: true,
      onDownloadExport,
      onExport,
    });

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    expect(container.textContent).toContain(
      '导出已完成，文件保留至 2026-03-11 09:18',
    );
    expect(getButtonByText(container, '下载文件')).toBeTruthy();

    await act(async () => {
      getButtonByText(container, '导出')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await flushPromises();
    });

    act(() => {
      getButtonByText(container, '下载文件')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onDownloadExport).toHaveBeenCalledTimes(1);
  });

  it('shows exporting state and disables export action while polling', async () => {
    billingRecordsPanelMocks.fetchBillingRecords.mockResolvedValue({
      page: 1,
      size: 20,
      total: 1,
      list: [
        {
          id: 1,
          project_name: '客服机器人',
          project_type: 'agent',
          status: 'success',
          occurred_at: 1736035200000,
        },
      ],
    });
    billingRecordsPanelMocks.useBillingRecordsExport.mockReturnValue({
      exportInProgress: true,
      exportStatusText: {
        className: 'coz-fg-hglt-blue',
        text: '导出任务处理中，请稍候',
      },
      hasExportFile: false,
      onDownloadExport: vi.fn(),
      onExport: vi.fn().mockResolvedValue(undefined),
    });

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    const exportingButton = getButtonByText(container, '导出中...');

    expect(container.textContent).toContain('导出任务处理中，请稍候');
    expect(exportingButton).toBeTruthy();
    expect(exportingButton?.hasAttribute('disabled')).toBe(true);
    expect(getButtonByText(container, '下载文件')).toBeFalsy();
  });

  it('renders expired export state without download action', async () => {
    billingRecordsPanelMocks.fetchBillingRecords.mockResolvedValue({
      page: 1,
      size: 20,
      total: 1,
      list: [
        {
          id: 1,
          project_name: '客服机器人',
          project_type: 'agent',
          status: 'success',
          occurred_at: 1736035200000,
        },
      ],
    });
    billingRecordsPanelMocks.useBillingRecordsExport.mockReturnValue({
      exportInProgress: false,
      exportStatusText: {
        className: 'coz-fg-hglt-red',
        text: '导出文件已过期，请重新发起导出',
      },
      hasExportFile: false,
      onDownloadExport: vi.fn(),
      onExport: vi.fn().mockResolvedValue(undefined),
    });

    await act(async () => {
      root.render(
        <BillingRecordsPanel
          filters={DEFAULT_FILTERS}
          onResetFilters={vi.fn()}
        />,
      );
      await flushPromises();
    });

    expect(container.textContent).toContain('导出文件已过期，请重新发起导出');
    expect(getButtonByText(container, '下载文件')).toBeFalsy();
  });
});
