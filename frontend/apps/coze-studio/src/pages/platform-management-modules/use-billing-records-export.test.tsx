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

import { type FC } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

import { useBillingRecordsExport } from './use-billing-records-export';
import type { PlatformFilters } from './types';
import type { BillingRecordsQueryState } from './billing-records-helpers';

const exportHookMocks = vi.hoisted(() => ({
  fetchBillingRecordsExportTask: vi.fn(),
  fetchBillingRecordsExportStatus: vi.fn(),
  resolveBillingRecordsExportRequestErrorText: vi.fn(),
  formatBillingRecordDateTime: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _params: Record<string, unknown>, fallback: string) =>
      fallback,
  },
}));

vi.mock('@coze-arch/coze-design', () => ({
  Toast: {
    info: exportHookMocks.toastInfo,
    success: exportHookMocks.toastSuccess,
    error: exportHookMocks.toastError,
  },
}));

vi.mock('./billing-records-helpers', () => ({
  fetchBillingRecordsExportTask: exportHookMocks.fetchBillingRecordsExportTask,
  fetchBillingRecordsExportStatus:
    exportHookMocks.fetchBillingRecordsExportStatus,
  formatBillingRecordDateTime: exportHookMocks.formatBillingRecordDateTime,
  resolveBillingRecordsExportRequestErrorText:
    exportHookMocks.resolveBillingRecordsExportRequestErrorText,
}));

const DEFAULT_FILTERS: PlatformFilters = {
  timeRange: 'last_7_days',
  spaceId: 'all',
  projectType: 'all',
};

const DEFAULT_QUERY: BillingRecordsQueryState = {
  keyword: '',
  page: 1,
  size: 20,
  orderBy: 'occurred_at',
  orderDirection: 'desc',
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const advancePollingOnce = async () => {
  await vi.advanceTimersByTimeAsync(2000);
  await flushPromises();
};

describe('useBillingRecordsExport', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestResult: ReturnType<typeof useBillingRecordsExport> | null;

  const Harness: FC<{
    filters: PlatformFilters;
    query: BillingRecordsQueryState;
  }> = ({ filters, query }) => {
    latestResult = useBillingRecordsExport({ filters, query });
    return null;
  };

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    latestResult = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    exportHookMocks.fetchBillingRecordsExportTask.mockReset();
    exportHookMocks.fetchBillingRecordsExportStatus.mockReset();
    exportHookMocks.resolveBillingRecordsExportRequestErrorText.mockReset();
    exportHookMocks.formatBillingRecordDateTime.mockReset();
    exportHookMocks.toastInfo.mockReset();
    exportHookMocks.toastSuccess.mockReset();
    exportHookMocks.toastError.mockReset();

    exportHookMocks.resolveBillingRecordsExportRequestErrorText.mockImplementation(
      error => (error instanceof Error ? error.message : '账单导出失败'),
    );
    exportHookMocks.formatBillingRecordDateTime.mockImplementation(
      value => `formatted:${String(value)}`,
    );
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts export, polls success and downloads exported file', async () => {
    const expireAt = Date.now() + 60_000;

    exportHookMocks.fetchBillingRecordsExportTask.mockResolvedValue({
      task_id: 'task-1',
      status: 'processing',
    });
    exportHookMocks.fetchBillingRecordsExportStatus.mockResolvedValue({
      task_id: 'task-1',
      status: 'success',
      download_url: 'https://example.com/task-1.csv',
      expire_at: expireAt,
    });

    await act(async () => {
      root.render(<Harness filters={DEFAULT_FILTERS} query={DEFAULT_QUERY} />);
      await flushPromises();
    });

    await act(async () => {
      await latestResult?.onExport();
      await flushPromises();
    });

    expect(exportHookMocks.fetchBillingRecordsExportTask).toHaveBeenCalledWith(
      DEFAULT_FILTERS,
      DEFAULT_QUERY,
    );
    expect(exportHookMocks.toastInfo).toHaveBeenCalledWith(
      '已发起导出，文件生成后可下载',
    );
    expect(latestResult?.exportInProgress).toBe(true);
    expect(latestResult?.hasExportFile).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await flushPromises();
    });

    expect(
      exportHookMocks.fetchBillingRecordsExportStatus,
    ).toHaveBeenCalledWith('task-1');
    expect(exportHookMocks.toastSuccess).toHaveBeenCalledWith(
      '导出完成，可下载文件',
    );
    expect(latestResult?.exportInProgress).toBe(false);
    expect(latestResult?.hasExportFile).toBe(true);
    expect(latestResult?.exportStatusText).toEqual({
      className: 'coz-fg-hglt-green',
      text: `导出已完成，文件保留至 formatted:${String(expireAt)}`,
    });

    act(() => {
      latestResult?.onDownloadExport();
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/task-1.csv',
      '_blank',
    );
  });

  it('loads completed export details when create request returns success directly', async () => {
    const expireAt = Date.now() + 60_000;

    exportHookMocks.fetchBillingRecordsExportTask.mockResolvedValue({
      task_id: 'task-direct-success',
      status: 'success',
    });
    exportHookMocks.fetchBillingRecordsExportStatus.mockResolvedValue({
      task_id: 'task-direct-success',
      status: 'success',
      download_url: 'https://example.com/task-direct-success.csv',
      expire_at: expireAt,
    });

    await act(async () => {
      root.render(<Harness filters={DEFAULT_FILTERS} query={DEFAULT_QUERY} />);
      await flushPromises();
    });

    await act(async () => {
      await latestResult?.onExport();
      await flushPromises();
    });

    expect(exportHookMocks.fetchBillingRecordsExportTask).toHaveBeenCalledWith(
      DEFAULT_FILTERS,
      DEFAULT_QUERY,
    );
    expect(
      exportHookMocks.fetchBillingRecordsExportStatus,
    ).toHaveBeenCalledWith('task-direct-success');
    expect(exportHookMocks.toastSuccess).toHaveBeenCalledWith(
      '导出完成，可下载文件',
    );
    expect(latestResult?.exportInProgress).toBe(false);
    expect(latestResult?.hasExportFile).toBe(true);
  });

  it('marks export as failed when polling request throws', async () => {
    exportHookMocks.fetchBillingRecordsExportTask.mockResolvedValue({
      task_id: 'task-2',
      status: 'processing',
    });
    exportHookMocks.fetchBillingRecordsExportStatus.mockRejectedValue(
      new Error('polling failed'),
    );

    await act(async () => {
      root.render(<Harness filters={DEFAULT_FILTERS} query={DEFAULT_QUERY} />);
      await flushPromises();
    });

    await act(async () => {
      await latestResult?.onExport();
      await flushPromises();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await flushPromises();
    });

    expect(exportHookMocks.toastError).toHaveBeenCalledWith('polling failed');
    expect(latestResult?.exportInProgress).toBe(false);
    expect(latestResult?.hasExportFile).toBe(false);
    expect(latestResult?.exportStatusText).toEqual({
      className: 'coz-fg-hglt-red',
      text: '导出失败，请重新发起导出',
    });
  });

  it('marks export as failed after polling timeout', async () => {
    exportHookMocks.fetchBillingRecordsExportTask.mockResolvedValue({
      task_id: 'task-3',
      status: 'processing',
    });
    exportHookMocks.fetchBillingRecordsExportStatus.mockImplementation(() =>
      Promise.resolve({
        task_id: 'task-3',
        status: 'processing',
      }),
    );

    await act(async () => {
      root.render(<Harness filters={DEFAULT_FILTERS} query={DEFAULT_QUERY} />);
      await flushPromises();
    });

    await act(async () => {
      await latestResult?.onExport();
      await flushPromises();
    });

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await act(async () => {
        await advancePollingOnce();
      });
    }

    expect(
      exportHookMocks.fetchBillingRecordsExportStatus,
    ).toHaveBeenCalledTimes(30);
    expect(exportHookMocks.toastError).toHaveBeenCalledWith(
      '导出超时，请重新发起导出',
    );
    expect(latestResult?.exportInProgress).toBe(false);
    expect(latestResult?.exportStatusText).toEqual({
      className: 'coz-fg-hglt-red',
      text: '导出失败，请重新发起导出',
    });
  });

  it('clears completed export state when filters change', async () => {
    const expireAt = Date.now() + 60_000;

    exportHookMocks.fetchBillingRecordsExportTask.mockResolvedValue({
      task_id: 'task-4',
      status: 'processing',
    });
    exportHookMocks.fetchBillingRecordsExportStatus.mockResolvedValue({
      task_id: 'task-4',
      status: 'success',
      download_url: 'https://example.com/task-4.csv',
      expire_at: expireAt,
    });

    await act(async () => {
      root.render(<Harness filters={DEFAULT_FILTERS} query={DEFAULT_QUERY} />);
      await flushPromises();
    });

    await act(async () => {
      await latestResult?.onExport();
      await flushPromises();
    });

    await act(async () => {
      await advancePollingOnce();
    });

    expect(latestResult?.hasExportFile).toBe(true);

    await act(async () => {
      root.render(
        <Harness
          filters={{ ...DEFAULT_FILTERS, spaceId: '10001' }}
          query={DEFAULT_QUERY}
        />,
      );
      await flushPromises();
    });

    expect(latestResult?.hasExportFile).toBe(false);
    expect(latestResult?.exportStatusText).toBeNull();
  });

  it('marks completed export as expired and blocks download', async () => {
    const expireAt = Date.now() + 5000;

    exportHookMocks.fetchBillingRecordsExportTask.mockResolvedValue({
      task_id: 'task-expired',
      status: 'processing',
    });
    exportHookMocks.fetchBillingRecordsExportStatus.mockResolvedValue({
      task_id: 'task-expired',
      status: 'success',
      download_url: 'https://example.com/task-expired.csv',
      expire_at: expireAt,
    });

    await act(async () => {
      root.render(<Harness filters={DEFAULT_FILTERS} query={DEFAULT_QUERY} />);
      await flushPromises();
    });

    await act(async () => {
      await latestResult?.onExport();
      await flushPromises();
    });

    await act(async () => {
      await advancePollingOnce();
    });

    expect(latestResult?.hasExportFile).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
      await flushPromises();
    });

    expect(latestResult?.hasExportFile).toBe(false);
    expect(latestResult?.exportStatusText).toEqual({
      className: 'coz-fg-hglt-red',
      text: '导出文件已过期，请重新发起导出',
    });

    act(() => {
      latestResult?.onDownloadExport();
    });

    expect(exportHookMocks.toastError).toHaveBeenCalledWith(
      '导出文件已过期，请重新发起导出',
    );
    expect(window.open).not.toHaveBeenCalled();
  });

  it('shows request error when export task creation fails', async () => {
    exportHookMocks.fetchBillingRecordsExportTask.mockRejectedValue(
      new Error('create export failed'),
    );

    await act(async () => {
      root.render(<Harness filters={DEFAULT_FILTERS} query={DEFAULT_QUERY} />);
      await flushPromises();
    });

    await act(async () => {
      await latestResult?.onExport();
      await flushPromises();
    });

    expect(
      exportHookMocks.fetchBillingRecordsExportStatus,
    ).not.toHaveBeenCalled();
    expect(exportHookMocks.toastError).toHaveBeenCalledWith(
      'create export failed',
    );
    expect(latestResult?.exportInProgress).toBe(false);
    expect(latestResult?.hasExportFile).toBe(false);
    expect(latestResult?.exportStatusText).toBeNull();
  });
});
