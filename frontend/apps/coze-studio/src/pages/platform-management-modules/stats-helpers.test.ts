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
  fetchStatsOverview,
  fetchStatsRankings,
  formatStatsCurrency,
  formatStatsDuration,
  formatStatsNumber,
  formatStatsPercentage,
  formatStatsProjectType,
  resolveStatsMetricLabel,
  resolveStatsRequestErrorText,
  STATS_METRIC_OPTIONS,
} from './stats-helpers';

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _params: Record<string, unknown>, fallback: string) =>
      fallback,
  },
}));

const FIXED_NOW = Date.parse('2026-03-10T06:30:00+08:00');

const DEFAULT_FILTERS: PlatformFilters = {
  timeRange: 'last_7_days',
  spaceId: 'all',
  projectType: 'all',
};

describe('stats-helpers', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetchStatsOverview builds overview request with filters and normalizes data', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          data: {
            active_space_dau: 12,
            total_calls: 345,
            success_rate: '0.9876',
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchStatsOverview({
      ...DEFAULT_FILTERS,
      spaceId: '10001',
      projectType: 'agent',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    const { searchParams } = new URL(String(url), 'http://localhost');

    expect(searchParams.get('project_type')).toBe('agent');
    expect(searchParams.get('space_ids')).toBe('10001');
    expect(searchParams.get('start_time')).toBeTruthy();
    expect(searchParams.get('end_time')).toBe(String(FIXED_NOW));
    expect(options).toEqual({ credentials: 'include' });

    expect(result).toEqual({
      active_space_dau: 12,
      active_space_wau: 0,
      active_project_count: 0,
      total_calls: 345,
      success_rate: '0.9876',
      avg_latency_ms: 0,
      total_tokens: 0,
    });
  });

  it('fetchStatsOverview omits space_ids when filters use all spaces', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: 0, data: {} }), { status: 200 }),
    );

    await fetchStatsOverview(DEFAULT_FILTERS);

    const [url] = fetchMock.mock.calls[0];
    const { searchParams } = new URL(String(url), 'http://localhost');

    expect(searchParams.get('space_ids')).toBeNull();
    expect(searchParams.get('project_type')).toBe('all');
  });

  it('fetchStatsRankings builds rankings request and normalizes list defaults', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          data: {
            page: 2,
            size: 5,
            total: 7,
            list: [
              {
                project_id: 11,
                project_name: '客服机器人',
                project_type: 'agent',
                calls: 999,
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchStatsRankings(
      {
        ...DEFAULT_FILTERS,
        projectType: 'workflow',
      },
      {
        metric: 'fail_rate',
        page: 2,
        size: 5,
      },
    );

    const [url] = fetchMock.mock.calls[0];
    const { searchParams } = new URL(String(url), 'http://localhost');

    expect(searchParams.get('metric')).toBe('fail_rate');
    expect(searchParams.get('page')).toBe('2');
    expect(searchParams.get('size')).toBe('5');
    expect(searchParams.get('project_type')).toBe('workflow');

    expect(result).toEqual({
      page: 2,
      size: 5,
      total: 7,
      list: [
        {
          project_id: 11,
          project_name: '客服机器人',
          project_type: 'agent',
          calls: 999,
          tokens: 0,
          cost: '0',
          fail_rate: '0.0000',
        },
      ],
    });
  });

  it('fetchStatsRankings throws payload message for business errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 40001, msg: 'invalid metric' }), {
        status: 200,
      }),
    );

    await expect(
      fetchStatsRankings(DEFAULT_FILTERS, {
        metric: 'calls',
        page: 1,
        size: 10,
      }),
    ).rejects.toThrow('invalid metric');
  });

  it('fetchStatsOverview throws HTTP fallback message when response is not ok', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    vi.mocked(fetch).mockResolvedValue(
      new Response('server failed', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    await expect(fetchStatsOverview(DEFAULT_FILTERS)).rejects.toThrow(
      'HTTP 500 Internal Server Error',
    );
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });

  it('resolveStatsRequestErrorText returns default text for unknown errors', () => {
    expect(resolveStatsRequestErrorText(new Error('boom'))).toBe('boom');
    expect(resolveStatsRequestErrorText('unknown')).toBe('数据加载失败');
  });

  it('formats stats values consistently', () => {
    expect(formatStatsNumber(1234567)).toBe('1,234,567');
    expect(formatStatsCurrency('1234.5')).toBe('¥1,234.50');
    expect(formatStatsPercentage('0.125')).toBe('12.50%');
    expect(formatStatsPercentage(87.5)).toBe('87.50%');
    expect(formatStatsDuration(3200)).toBe('3,200 ms');
  });

  it('formats stats project types and metric labels with fallbacks', () => {
    expect(formatStatsProjectType('agent')).toBe('智能体');
    expect(formatStatsProjectType('app')).toBe('应用');
    expect(formatStatsProjectType('workflow')).toBe('工作流');
    expect(formatStatsProjectType(undefined)).toBe('--');

    expect(resolveStatsMetricLabel('calls')).toBe('调用量');
    expect(resolveStatsMetricLabel('tokens')).toBe('Token');
    expect(STATS_METRIC_OPTIONS).toHaveLength(4);
  });
});
