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

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import { Toast } from '@coze-arch/coze-design';

import {
  buildBillingBudgetRows,
  fetchBillingBudgets,
  resolveBillingBudgetRequestErrorText,
  resolveBillingBudgetsQuerySize,
  saveBillingBudget,
  validateBillingBudgetRow,
  type BillingBudgetEditableRow,
  type BillingBudgetOverLimitPolicy,
  type BillingBudgetSpaceOption,
} from './billing-budgets-helpers';

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

const getSavingInProgressText = () =>
  tNoOptions(
    'platform_management_budgets_save_in_progress',
    '已有保存任务进行中，请稍候',
  );

interface UseBillingBudgetsStateParams {
  selectedSpaceId: string;
  spaceOptions: BillingBudgetSpaceOption[];
}

export interface UseBillingBudgetsStateResult {
  errorText: string;
  load: () => Promise<void>;
  loading: boolean;
  onBudgetChange: (rowKey: string, monthlyBudget: number | undefined) => void;
  onEnabledChange: (rowKey: string, enabled: boolean) => void;
  onPolicyChange: (
    rowKey: string,
    policy: BillingBudgetOverLimitPolicy,
  ) => void;
  onSave: (row: BillingBudgetEditableRow) => Promise<void>;
  onSpaceFilterChange: (value: string) => void;
  onThresholdsChange: (
    rowKey: string,
    thresholds: Array<string | number>,
  ) => void;
  rows: BillingBudgetEditableRow[];
  savingRowKey: string | null;
  spaceFilter: string;
}

const toNumberArray = (value: Array<string | number>) =>
  value
    .map(item => Number(item))
    .filter(item => Number.isInteger(item) && item > 0)
    .sort((left, right) => left - right);

const useBillingBudgetRowHandlers = ({
  savingRowKey,
  setRows,
  setSavingRowKey,
}: {
  savingRowKey: string | null;
  setRows: Dispatch<SetStateAction<BillingBudgetEditableRow[]>>;
  setSavingRowKey: Dispatch<SetStateAction<string | null>>;
}) => {
  const updateRow = useCallback(
    (rowKey: string, patch: Partial<BillingBudgetEditableRow>) => {
      setRows(previous =>
        previous.map(row =>
          row.key === rowKey
            ? {
                ...row,
                ...patch,
              }
            : row,
        ),
      );
    },
    [setRows],
  );

  const handleBudgetChange = useCallback(
    (rowKey: string, monthlyBudget: number | undefined) => {
      updateRow(rowKey, { monthlyBudget });
    },
    [updateRow],
  );

  const handleThresholdsChange = useCallback(
    (rowKey: string, thresholds: Array<string | number>) => {
      updateRow(rowKey, { alarmThresholds: toNumberArray(thresholds) });
    },
    [updateRow],
  );

  const handlePolicyChange = useCallback(
    (rowKey: string, policy: BillingBudgetOverLimitPolicy) => {
      updateRow(rowKey, { overLimitPolicy: policy });
    },
    [updateRow],
  );

  const handleEnabledChange = useCallback(
    (rowKey: string, enabled: boolean) => {
      updateRow(rowKey, { enabled });
    },
    [updateRow],
  );

  const handleSave = useCallback(
    async (row: BillingBudgetEditableRow) => {
      if (savingRowKey) {
        Toast.error(getSavingInProgressText());
        return;
      }

      const validationMessage = validateBillingBudgetRow(row);
      if (validationMessage) {
        Toast.error(validationMessage);
        return;
      }

      setSavingRowKey(row.key);
      try {
        const response = await saveBillingBudget(row);
        const failure = response.failed?.[0];

        if ((response.success_count ?? 0) <= 0 || failure?.msg) {
          Toast.error(
            failure?.msg ||
              tNoOptions(
                'platform_management_budgets_save_failed',
                '预算规则保存失败',
              ),
          );
          return;
        }

        setRows(previous =>
          previous.map(item =>
            item.key === row.key
              ? {
                  ...item,
                  updatedAt: Date.now(),
                }
              : item,
          ),
        );
        Toast.success(
          tNoOptions(
            'platform_management_budgets_save_success',
            '预算规则已保存',
          ),
        );
      } catch (error) {
        Toast.error(resolveBillingBudgetRequestErrorText(error));
      } finally {
        setSavingRowKey(null);
      }
    },
    [savingRowKey, setRows, setSavingRowKey],
  );

  return {
    onBudgetChange: handleBudgetChange,
    onEnabledChange: handleEnabledChange,
    onPolicyChange: handlePolicyChange,
    onSave: handleSave,
    onThresholdsChange: handleThresholdsChange,
  };
};

export const useBillingBudgetsState = ({
  selectedSpaceId,
  spaceOptions,
}: UseBillingBudgetsStateParams): UseBillingBudgetsStateResult => {
  const [spaceFilter, setSpaceFilter] = useState(selectedSpaceId);
  const [rows, setRows] = useState<BillingBudgetEditableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const latestLoadRequestIDRef = useRef(0);

  useEffect(() => {
    setSpaceFilter(selectedSpaceId);
  }, [selectedSpaceId]);

  const load = useCallback(async () => {
    latestLoadRequestIDRef.current += 1;
    const requestID = latestLoadRequestIDRef.current;

    setLoading(true);
    setErrorText('');
    try {
      const response = await fetchBillingBudgets(
        spaceFilter,
        resolveBillingBudgetsQuerySize(spaceOptions),
      );
      if (requestID !== latestLoadRequestIDRef.current) {
        return;
      }

      setRows(
        buildBillingBudgetRows({
          budgetItems: response.list ?? [],
          selectedSpaceId: spaceFilter,
          spaceOptions,
        }),
      );
    } catch (error) {
      if (requestID !== latestLoadRequestIDRef.current) {
        return;
      }

      setRows([]);
      setErrorText(resolveBillingBudgetRequestErrorText(error));
    } finally {
      if (requestID === latestLoadRequestIDRef.current) {
        setLoading(false);
      }
    }
  }, [spaceFilter, spaceOptions]);

  useEffect(() => {
    void load();
  }, [load]);

  const {
    onBudgetChange,
    onEnabledChange,
    onPolicyChange,
    onSave,
    onThresholdsChange,
  } = useBillingBudgetRowHandlers({
    savingRowKey,
    setRows,
    setSavingRowKey,
  });

  return {
    errorText,
    load,
    loading,
    onBudgetChange,
    onEnabledChange,
    onPolicyChange,
    onSave,
    onSpaceFilterChange: setSpaceFilter,
    onThresholdsChange,
    rows,
    savingRowKey,
    spaceFilter,
  };
};
