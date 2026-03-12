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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlatformFilters } from './types';
import {
  fetchBillingRecords,
  fetchBillingRecordsExportStatus,
  fetchBillingRecordsExportTask,
  formatBillingRecordCurrency,
  formatBillingRecordDateTime,
  formatBillingRecordNumber,
  formatBillingRecordProjectType,
  formatBillingRecordUnitPrice,
  resolveBillingRecordsExportRequestErrorText,
  resolveBillingRecordsRequestErrorText,
  SORT_DIRECTION_OPTIONS,
  SORT_FIELD_OPTIONS,
  type BillingRecordsQueryState,
} from './billing-records-helpers';

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _params: Record<string, unknown>, fallback: string) =>
      fallback,
  },
}));

const FIXED_NOW = Date.parse('2026-03-11T10:30:00+08:00');
const TODAY_START = Date.parse('2026-03-11T00:00:00+08:00');
const LAST_7_DAYS_START = Date.parse('2026-03-05T00:00:00+08:00');
const LAST_30_DAYS_START = Date.parse('2026-02-10T00:00:00+08:00');

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

describe('billing-records-helpers', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetchBillingRecords builds request with filters and normalizes defaults', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          data: {
            page: 2,
            total: 1,
            list: [
              {
                id: 1,
                project_name: '客服机器人',
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchBillingRecords(
      {
        timeRange: 'last_7_days',
        spaceId: '10001',
        projectType: 'agent',
      },
      {
        keyword: 'Alpha',
        page: 2,
        size: 50,
        orderBy: 'amount',
        orderDirection: 'asc',
      },
    );

    const [url, options] = fetchMock.mock.calls[0];
    const { searchParams } = new URL(String(url), 'http://localhost');

    expect(searchParams.get('start_time')).toBe(String(LAST_7_DAYS_START));
    expect(searchParams.get('end_time')).toBe(String(FIXED_NOW));
    expect(searchParams.get('space_ids')).toBe('10001');
    expect(searchParams.get('project_type')).toBe('agent');
    expect(searchParams.get('keyword')).toBe('Alpha');
    expect(searchParams.get('page')).toBe('2');
    expect(searchParams.get('size')).toBe('50');
    expect(searchParams.get('order_by')).toBe('amount');
    expect(searchParams.get('order_direction')).toBe('asc');
    expect(options).toEqual({ credentials: 'include' });

    expect(result).toEqual({
      page: 2,
      size: 20,
      total: 1,
      list: [
        {
          id: 1,
          project_name: '客服机器人',
        },
      ],
    });
  });

  it('fetchBillingRecords handles today range and omits optional query params', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: 0, data: {} }), { status: 200 }),
    );

    await fetchBillingRecords(
      {
        timeRange: 'today',
        spaceId: 'all',
        projectType: 'all',
      },
      DEFAULT_QUERY,
    );

    const [url] = fetchMock.mock.calls[0];
    const { searchParams } = new URL(String(url), 'http://localhost');

    expect(searchParams.get('start_time')).toBe(String(TODAY_START));
    expect(searchParams.get('space_ids')).toBeNull();
    expect(searchParams.get('keyword')).toBeNull();
    expect(searchParams.get('project_type')).toBe('all');
  });

  it('fetchBillingRecordsExportTask sends normalized request body and defaults status', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: 0, data: { task_id: 'task-1' } }), {
        status: 200,
      }),
    );

    const result = await fetchBillingRecordsExportTask(
      {
        timeRange: 'custom',
        spaceId: '10002',
        projectType: 'workflow',
      },
      {
        keyword: 'Budget',
        page: 3,
        size: 20,
        orderBy: 'usage_tokens',
        orderDirection: 'desc',
      },
    );

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('/api/platform/billing/records/export');
    expect(options).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      start_time: LAST_30_DAYS_START,
      end_time: FIXED_NOW,
      keyword: 'Budget',
      space_ids: [10002],
      project_type: 'workflow',
      order_by: 'usage_tokens',
      order_direction: 'desc',
    });
    expect(result).toEqual({
      task_id: 'task-1',
      status: 'processing',
    });
  });

  it('fetchBillingRecordsExportTask omits invalid export space id and throws payload message for business errors', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 0, data: {} }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 40001, msg: 'create export task failed' }),
          { status: 200 },
        ),
      );

    await fetchBillingRecordsExportTask(
      {
        ...DEFAULT_FILTERS,
        spaceId: 'invalid-space',
      },
      DEFAULT_QUERY,
    );

    const [, firstOptions] = fetchMock.mock.calls[0];

    expect(JSON.parse(String(firstOptions?.body)).space_ids).toEqual([]);

    await expect(
      fetchBillingRecordsExportTask(DEFAULT_FILTERS, DEFAULT_QUERY),
    ).rejects.toThrow('create export task failed');
  });

  it('fetchBillingRecordsExportStatus builds request and normalizes empty defaults', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: 0, data: {} }), { status: 200 }),
    );

    const result = await fetchBillingRecordsExportStatus('task-2');

    const [url, options] = fetchMock.mock.calls[0];
    const { searchParams } = new URL(String(url), 'http://localhost');

    expect(searchParams.get('task_id')).toBe('task-2');
    expect(options).toEqual({ credentials: 'include' });
    expect(result).toEqual({
      task_id: '',
      status: 'processing',
      download_url: '',
      expire_at: 0,
    });
  });

  it('exposes payload or http error text for records and export requests', async () => {
    const fetchMock = vi.mocked(fetch);
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 40003, msg: 'invalid page parameter' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response('server failed', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      );

    await expect(
      fetchBillingRecords(DEFAULT_FILTERS, DEFAULT_QUERY),
    ).rejects.toThrow('invalid page parameter');
    await expect(fetchBillingRecordsExportStatus('task-3')).rejects.toThrow(
      'HTTP 500 Internal Server Error',
    );
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });

  it('formats billing values consistently', () => {
    expect(formatBillingRecordCurrency('1234.5')).toBe('¥1,234.50');
    expect(formatBillingRecordUnitPrice(0.123456789)).toBe('0.12345679');
    expect(formatBillingRecordNumber(1234567)).toBe('1,234,567');
    expect(formatBillingRecordDateTime(0)).toBe('--');
    expect(formatBillingRecordDateTime(FIXED_NOW)).toBe('2026/03/11 10:30');
  });

  it('formats project type labels, error fallbacks, and exports stable sort options', () => {
    expect(formatBillingRecordProjectType('agent')).toBe('智能体');
    expect(formatBillingRecordProjectType('app')).toBe('应用');
    expect(formatBillingRecordProjectType('workflow')).toBe('工作流');
    expect(formatBillingRecordProjectType(undefined)).toBe('--');

    expect(
      resolveBillingRecordsRequestErrorText(new Error('load failed')),
    ).toBe('load failed');
    expect(resolveBillingRecordsRequestErrorText('unknown')).toBe(
      '账单明细加载失败',
    );
    expect(
      resolveBillingRecordsExportRequestErrorText(new Error('export failed')),
    ).toBe('export failed');
    expect(resolveBillingRecordsExportRequestErrorText('unknown')).toBe(
      '账单导出失败',
    );

    expect(SORT_FIELD_OPTIONS.map(option => option.value)).toEqual([
      'occurred_at',
      'amount',
      'usage_tokens',
    ]);
    expect(SORT_DIRECTION_OPTIONS.map(option => option.value)).toEqual([
      'desc',
      'asc',
    ]);
  });
});
