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

import {
  buildBillingBudgetRows,
  fetchBillingBudgets,
  formatBillingBudgetUpdatedAt,
  resolveBillingBudgetRequestErrorText,
  resolveBillingBudgetThresholdOptions,
  resolveBillingBudgetsQuerySize,
  saveBillingBudget,
  validateBillingBudgetRow,
  type BillingBudgetEditableRow,
  type BillingBudgetSpaceOption,
} from './billing-budgets-helpers';

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _params: Record<string, unknown>, fallback: string) =>
      fallback,
  },
}));

const SPACE_OPTIONS: BillingBudgetSpaceOption[] = [
  { value: 'all', label: '全部空间' },
  { value: '1002', label: '乙空间' },
  { value: '1001', label: '甲空间' },
];

const VALID_ROW: BillingBudgetEditableRow = {
  key: '1001',
  spaceId: 1001,
  spaceName: '甲空间',
  monthlyBudget: 123.45,
  alarmThresholds: [70, 90],
  overLimitPolicy: 'warn',
  enabled: true,
  updatedAt: 1736035200000,
};

describe('billing-budgets-helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('resolveBillingBudgetsQuerySize keeps minimum page size and expands for larger space counts', () => {
    expect(resolveBillingBudgetsQuerySize(SPACE_OPTIONS)).toBe(50);
    expect(
      resolveBillingBudgetsQuerySize([
        { value: 'all', label: '全部空间' },
        ...Array.from({ length: 55 }, (_, index) => ({
          value: String(index + 1),
          label: `空间-${index + 1}`,
        })),
      ]),
    ).toBe(55);
  });

  it('fetchBillingBudgets builds request with space filter and normalizes defaults', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          data: {
            list: [{ space_id: 1001, monthly_budget: '88.00' }],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await fetchBillingBudgets('1001', 80);

    const [url, options] = fetchMock.mock.calls[0];
    const { searchParams } = new URL(String(url), 'http://localhost');

    expect(searchParams.get('page')).toBe('1');
    expect(searchParams.get('size')).toBe('80');
    expect(searchParams.get('space_ids')).toBe('1001');
    expect(options).toEqual({ credentials: 'include' });
    expect(result).toEqual({
      page: 1,
      size: 50,
      total: 0,
      list: [{ space_id: 1001, monthly_budget: '88.00' }],
    });
  });

  it('fetchBillingBudgets omits space filter for all spaces and throws payload message for business error', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: 0,
            data: { page: 1, size: 20, total: 0, list: [] },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 40001, msg: 'invalid budget query' }),
          { status: 200 },
        ),
      );

    await fetchBillingBudgets('all', 50);

    const [url] = fetchMock.mock.calls[0];
    const { searchParams } = new URL(String(url), 'http://localhost');

    expect(searchParams.get('space_ids')).toBeNull();

    await expect(fetchBillingBudgets('1001', 50)).rejects.toThrow(
      'invalid budget query',
    );
  });

  it('saveBillingBudget sends sanitized payload and normalizes save response', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          data: {
            success_count: 1,
            failed: [],
          },
        }),
        { status: 200 },
      ),
    );

    const result = await saveBillingBudget({
      ...VALID_ROW,
      monthlyBudget: 12,
      alarmThresholds: [100, 90, 90, 120, 0],
      overLimitPolicy: 'reject',
    });

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('/api/platform/billing/budgets');
    expect(options).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      rules: [
        {
          space_id: 1001,
          monthly_budget: '12.00',
          alarm_thresholds: [90, 100],
          over_limit_policy: 'reject',
          enabled: true,
        },
      ],
    });
    expect(result).toEqual({
      success_count: 1,
      failed: [],
    });
  });

  it('buildBillingBudgetRows merges options with returned budgets, applies defaults, and keeps extra api rows', () => {
    const rows = buildBillingBudgetRows({
      selectedSpaceId: 'all',
      spaceOptions: SPACE_OPTIONS,
      budgetItems: [
        {
          id: 1,
          space_id: 1001,
          space_name: '甲空间',
          monthly_budget: ' 123.45 ',
          alarm_thresholds: [100, 90, 90, 120],
          over_limit_policy: 'reject',
          enabled: true,
          updated_at: 1736035200000,
        },
        {
          id: 2,
          space_id: 1003,
          space_name: '丙空间',
          monthly_budget: '66.60',
          alarm_thresholds: [],
          over_limit_policy: 'warn',
          enabled: false,
        },
      ],
    });

    expect(rows).toHaveLength(3);
    expect(rows.map(row => row.key)).toEqual(['1003', '1001', '1002']);

    const apiOnlyRow = rows.find(row => row.key === '1003');
    const configuredRow = rows.find(row => row.key === '1001');
    const defaultRow = rows.find(row => row.key === '1002');

    expect(configuredRow).toMatchObject({
      id: 1,
      key: '1001',
      monthlyBudget: 123.45,
      alarmThresholds: [90, 100],
      overLimitPolicy: 'reject',
      enabled: true,
      updatedAt: 1736035200000,
    });
    expect(defaultRow).toMatchObject({
      key: '1002',
      monthlyBudget: undefined,
      alarmThresholds: [70, 90, 100],
      overLimitPolicy: 'warn',
      enabled: false,
    });
    expect(apiOnlyRow).toMatchObject({
      key: '1003',
      spaceName: '丙空间',
      monthlyBudget: 66.6,
      alarmThresholds: [70, 90, 100],
    });
  });

  it('resolveBillingBudgetThresholdOptions and formatBillingBudgetUpdatedAt expose stable fallbacks', () => {
    expect(resolveBillingBudgetThresholdOptions([100, 80, 90, 70, 80])).toEqual(
      [70, 80, 90, 100],
    );
    expect(formatBillingBudgetUpdatedAt(0)).toBe('尚未保存');
  });

  it('validateBillingBudgetRow covers invalid and valid input branches', () => {
    expect(
      validateBillingBudgetRow({
        ...VALID_ROW,
        spaceId: 0,
      }),
    ).toBe('空间信息无效，请刷新后重试');
    expect(
      validateBillingBudgetRow({
        ...VALID_ROW,
        monthlyBudget: undefined,
      }),
    ).toBe('请填写月预算');
    expect(
      validateBillingBudgetRow({
        ...VALID_ROW,
        monthlyBudget: -1,
      }),
    ).toBe('月预算不能小于 0');
    expect(
      validateBillingBudgetRow({
        ...VALID_ROW,
        alarmThresholds: [],
      }),
    ).toBe('请至少选择一个告警阈值');
    expect(
      validateBillingBudgetRow({
        ...VALID_ROW,
        overLimitPolicy:
          'invalid' as unknown as BillingBudgetEditableRow['overLimitPolicy'],
      }),
    ).toBe('超限策略无效，请刷新后重试');
    expect(validateBillingBudgetRow(VALID_ROW)).toBe('');
  });

  it('resolveBillingBudgetRequestErrorText falls back for unknown errors', () => {
    expect(resolveBillingBudgetRequestErrorText(new Error('save failed'))).toBe(
      'save failed',
    );
    expect(resolveBillingBudgetRequestErrorText('unknown')).toBe(
      '预算规则请求失败',
    );
  });
});
