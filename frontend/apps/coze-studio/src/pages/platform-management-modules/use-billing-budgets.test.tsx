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

import { useBillingBudgetsState } from './use-billing-budgets';
import type {
  BillingBudgetEditableRow,
  BillingBudgetSpaceOption,
} from './billing-budgets-helpers';

const budgetsHookMocks = vi.hoisted(() => ({
  buildBillingBudgetRows: vi.fn(),
  fetchBillingBudgets: vi.fn(),
  resolveBillingBudgetRequestErrorText: vi.fn(),
  resolveBillingBudgetsQuerySize: vi.fn(),
  saveBillingBudget: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  validateBillingBudgetRow: vi.fn(),
}));

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _params: Record<string, unknown>, fallback: string) =>
      fallback,
  },
}));

vi.mock('@coze-arch/coze-design', () => ({
  Toast: {
    error: budgetsHookMocks.toastError,
    success: budgetsHookMocks.toastSuccess,
  },
}));

vi.mock('./billing-budgets-helpers', () => ({
  buildBillingBudgetRows: budgetsHookMocks.buildBillingBudgetRows,
  fetchBillingBudgets: budgetsHookMocks.fetchBillingBudgets,
  resolveBillingBudgetRequestErrorText:
    budgetsHookMocks.resolveBillingBudgetRequestErrorText,
  resolveBillingBudgetsQuerySize:
    budgetsHookMocks.resolveBillingBudgetsQuerySize,
  saveBillingBudget: budgetsHookMocks.saveBillingBudget,
  validateBillingBudgetRow: budgetsHookMocks.validateBillingBudgetRow,
}));

const SPACE_OPTIONS: BillingBudgetSpaceOption[] = [
  { value: 'all', label: '全部空间' },
  { value: '1001', label: 'Alpha' },
  { value: '1002', label: 'Beta' },
];

const createRow = (
  spaceId: number,
  patch: Partial<BillingBudgetEditableRow> = {},
): BillingBudgetEditableRow => ({
  id: spaceId,
  key: String(spaceId),
  spaceId,
  spaceName: spaceId === 1001 ? 'Alpha' : 'Beta',
  monthlyBudget: spaceId === 1001 ? 120 : 260,
  alarmThresholds: [70, 90],
  overLimitPolicy: 'warn',
  enabled: spaceId === 1001,
  updatedAt: 1736035200000 + spaceId,
  ...patch,
});

const buildRowsForSpace = (selectedSpaceId: string) =>
  [createRow(1001), createRow(1002, { enabled: false })]
    .filter(row => selectedSpaceId === 'all' || row.key === selectedSpaceId)
    .map(row => ({ ...row, alarmThresholds: [...row.alarmThresholds] }));

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

describe('useBillingBudgetsState', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestResult: ReturnType<typeof useBillingBudgetsState> | null;

  const Harness: FC<{
    selectedSpaceId: string;
    spaceOptions: BillingBudgetSpaceOption[];
  }> = ({ selectedSpaceId, spaceOptions }) => {
    latestResult = useBillingBudgetsState({
      selectedSpaceId,
      spaceOptions,
    });

    return null;
  };

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    latestResult = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    budgetsHookMocks.buildBillingBudgetRows.mockReset();
    budgetsHookMocks.fetchBillingBudgets.mockReset();
    budgetsHookMocks.resolveBillingBudgetRequestErrorText.mockReset();
    budgetsHookMocks.resolveBillingBudgetsQuerySize.mockReset();
    budgetsHookMocks.saveBillingBudget.mockReset();
    budgetsHookMocks.toastError.mockReset();
    budgetsHookMocks.toastSuccess.mockReset();
    budgetsHookMocks.validateBillingBudgetRow.mockReset();

    budgetsHookMocks.resolveBillingBudgetsQuerySize.mockReturnValue(50);
    budgetsHookMocks.fetchBillingBudgets.mockResolvedValue({
      list: [{ space_id: 1001 }, { space_id: 1002 }],
    });
    budgetsHookMocks.buildBillingBudgetRows.mockImplementation(
      ({ selectedSpaceId }: { selectedSpaceId: string }) =>
        buildRowsForSpace(selectedSpaceId),
    );
    budgetsHookMocks.resolveBillingBudgetRequestErrorText.mockImplementation(
      error => (error instanceof Error ? error.message : '预算规则请求失败'),
    );
    budgetsHookMocks.validateBillingBudgetRow.mockReturnValue('');
    budgetsHookMocks.saveBillingBudget.mockResolvedValue({
      success_count: 1,
      failed: [],
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('loads billing budgets on mount and syncs selected space changes', async () => {
    await act(async () => {
      root.render(
        <Harness selectedSpaceId="all" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    expect(
      budgetsHookMocks.resolveBillingBudgetsQuerySize,
    ).toHaveBeenCalledWith(SPACE_OPTIONS);
    expect(budgetsHookMocks.fetchBillingBudgets).toHaveBeenCalledWith(
      'all',
      50,
    );
    expect(budgetsHookMocks.buildBillingBudgetRows).toHaveBeenLastCalledWith({
      budgetItems: [{ space_id: 1001 }, { space_id: 1002 }],
      selectedSpaceId: 'all',
      spaceOptions: SPACE_OPTIONS,
    });
    expect(latestResult?.spaceFilter).toBe('all');
    expect(latestResult?.rows.map(row => row.spaceId)).toEqual([1001, 1002]);

    await act(async () => {
      root.render(
        <Harness selectedSpaceId="1002" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    expect(budgetsHookMocks.fetchBillingBudgets).toHaveBeenLastCalledWith(
      '1002',
      50,
    );
    expect(latestResult?.spaceFilter).toBe('1002');
    expect(latestResult?.rows.map(row => row.spaceId)).toEqual([1002]);
  });

  it('reloads on space filter change and normalizes local row edits', async () => {
    await act(async () => {
      root.render(
        <Harness selectedSpaceId="all" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    await act(async () => {
      latestResult?.onSpaceFilterChange('1001');
      await flushPromises();
    });

    expect(budgetsHookMocks.fetchBillingBudgets).toHaveBeenLastCalledWith(
      '1001',
      50,
    );
    expect(latestResult?.spaceFilter).toBe('1001');
    expect(latestResult?.rows.map(row => row.spaceId)).toEqual([1001]);

    act(() => {
      latestResult?.onBudgetChange('1001', 388.5);
      latestResult?.onThresholdsChange('1001', ['100', 70, '70', 0, 'bad']);
      latestResult?.onPolicyChange('1001', 'reject');
      latestResult?.onEnabledChange('1001', false);
    });

    expect(latestResult?.rows[0]).toMatchObject({
      key: '1001',
      monthlyBudget: 388.5,
      alarmThresholds: [70, 70, 100],
      overLimitPolicy: 'reject',
      enabled: false,
    });
  });

  it('keeps latest budgets response when requests resolve out of order', async () => {
    const firstRequest = createDeferred<{
      list: Array<{ space_id: number }>;
    }>();
    const secondRequest = createDeferred<{
      list: Array<{ space_id: number }>;
    }>();

    budgetsHookMocks.fetchBillingBudgets
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);

    await act(async () => {
      root.render(
        <Harness selectedSpaceId="all" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    await act(async () => {
      latestResult?.onSpaceFilterChange('1001');
      await flushPromises();
    });

    await act(async () => {
      secondRequest.resolve({
        list: [{ space_id: 1001 }],
      });
      await flushPromises();
    });

    expect(latestResult?.spaceFilter).toBe('1001');
    expect(latestResult?.rows.map(row => row.spaceId)).toEqual([1001]);

    await act(async () => {
      firstRequest.resolve({
        list: [{ space_id: 1001 }, { space_id: 1002 }],
      });
      await flushPromises();
    });

    expect(latestResult?.spaceFilter).toBe('1001');
    expect(latestResult?.rows.map(row => row.spaceId)).toEqual([1001]);
  });

  it('updates row timestamp and shows success toast after save', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1773193200000);

    await act(async () => {
      root.render(
        <Harness selectedSpaceId="1001" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    const row = latestResult?.rows[0];
    expect(row).toBeTruthy();

    await act(async () => {
      await latestResult?.onSave(row as BillingBudgetEditableRow);
      await flushPromises();
    });

    expect(budgetsHookMocks.validateBillingBudgetRow).toHaveBeenCalledWith(row);
    expect(budgetsHookMocks.saveBillingBudget).toHaveBeenCalledWith(row);
    expect(latestResult?.savingRowKey).toBeNull();
    expect(latestResult?.rows[0]?.updatedAt).toBe(1773193200000);
    expect(budgetsHookMocks.toastSuccess).toHaveBeenCalledWith(
      '预算规则已保存',
    );
  });

  it('shows validation error without calling save request', async () => {
    budgetsHookMocks.validateBillingBudgetRow.mockReturnValue('请填写月预算');

    await act(async () => {
      root.render(
        <Harness selectedSpaceId="1001" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    const row = latestResult?.rows[0];

    await act(async () => {
      await latestResult?.onSave(row as BillingBudgetEditableRow);
      await flushPromises();
    });

    expect(budgetsHookMocks.saveBillingBudget).not.toHaveBeenCalled();
    expect(budgetsHookMocks.toastError).toHaveBeenCalledWith('请填写月预算');
    expect(latestResult?.savingRowKey).toBeNull();
  });

  it('surfaces load failures through error state', async () => {
    budgetsHookMocks.fetchBillingBudgets.mockRejectedValue(
      new Error('load budgets failed'),
    );

    await act(async () => {
      root.render(
        <Harness selectedSpaceId="all" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    expect(latestResult?.rows).toEqual([]);
    expect(latestResult?.errorText).toBe('load budgets failed');
    expect(latestResult?.loading).toBe(false);
  });

  it('shows backend save failure without mutating updated timestamp', async () => {
    budgetsHookMocks.saveBillingBudget.mockResolvedValue({
      success_count: 0,
      failed: [{ space_id: 1001, msg: '预算规则保存失败' }],
    });

    await act(async () => {
      root.render(
        <Harness selectedSpaceId="1001" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    const row = latestResult?.rows[0];
    const previousUpdatedAt = row?.updatedAt;

    await act(async () => {
      await latestResult?.onSave(row as BillingBudgetEditableRow);
      await flushPromises();
    });

    expect(latestResult?.rows[0]?.updatedAt).toBe(previousUpdatedAt);
    expect(budgetsHookMocks.toastError).toHaveBeenCalledWith(
      '预算规则保存失败',
    );
    expect(budgetsHookMocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('blocks a second save while another save is still in progress', async () => {
    const saveDeferred = createDeferred<{
      success_count: number;
      failed: never[];
    }>();
    budgetsHookMocks.saveBillingBudget.mockImplementation(
      () => saveDeferred.promise,
    );

    await act(async () => {
      root.render(
        <Harness selectedSpaceId="all" spaceOptions={SPACE_OPTIONS} />,
      );
      await flushPromises();
    });

    const firstRow = latestResult?.rows[0];
    const secondRow = latestResult?.rows[1];

    let firstSavePromise: Promise<void> | undefined;
    await act(async () => {
      firstSavePromise = latestResult?.onSave(
        firstRow as BillingBudgetEditableRow,
      );
      await flushPromises();
    });

    expect(latestResult?.savingRowKey).toBe('1001');
    expect(budgetsHookMocks.saveBillingBudget).toHaveBeenCalledTimes(1);

    await act(async () => {
      await latestResult?.onSave(secondRow as BillingBudgetEditableRow);
      await flushPromises();
    });

    expect(budgetsHookMocks.saveBillingBudget).toHaveBeenCalledTimes(1);
    expect(budgetsHookMocks.toastError).toHaveBeenCalledWith(
      '已有保存任务进行中，请稍候',
    );

    await act(async () => {
      saveDeferred.resolve({
        success_count: 1,
        failed: [],
      });
      await firstSavePromise;
      await flushPromises();
    });

    expect(latestResult?.savingRowKey).toBeNull();
  });
});
