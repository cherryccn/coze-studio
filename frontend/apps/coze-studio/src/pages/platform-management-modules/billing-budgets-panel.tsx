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

import { type FC, useMemo } from 'react';

import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import {
  Button,
  Checkbox,
  InputNumber,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Table,
  Typography,
  type ColumnProps,
} from '@coze-arch/coze-design';

import { useBillingBudgetsState } from './use-billing-budgets';
import {
  PlatformEmptyState,
  PlatformErrorState,
} from './platform-request-states';
import {
  formatBillingBudgetUpdatedAt,
  resolveBillingBudgetThresholdOptions,
  type BillingBudgetEditableRow,
  type BillingBudgetOverLimitPolicy,
  type BillingBudgetSpaceOption,
} from './billing-budgets-helpers';

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

const BUDGETS_TABLE_STYLE = `
.platform-management-budgets-table table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.platform-management-budgets-table thead th {
  background: #F7F8FA;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  padding: 12px 16px;
  border-bottom: 1px solid #E2E8F0;
}

.platform-management-budgets-table th,
.platform-management-budgets-table td {
  padding: 16px 16px;
  border-bottom: 1px solid #F1F5F9;
  color: #1F2937;
  font-size: 14px;
  vertical-align: top;
}

.platform-management-budgets-table tbody tr:last-child td {
  border-bottom: none;
}

.platform-management-budgets-table tbody tr:hover td {
  background: #F8FAFC;
}
`;

interface BillingBudgetsPanelProps {
  selectedSpaceId: string;
  spaceOptions: BillingBudgetSpaceOption[];
  onResetFilters: () => void;
}

interface BillingBudgetsHeaderProps {
  busy: boolean;
  loading: boolean;
  spaceFilter: string;
  total: number;
  spaceOptions: BillingBudgetSpaceOption[];
  onRefresh: () => void;
  onSpaceFilterChange: (value: unknown) => void;
}

interface BudgetOperationCellProps {
  busy: boolean;
  row: BillingBudgetEditableRow;
  savingRowKey: string | null;
  onEnabledChange: (rowKey: string, enabled: boolean) => void;
  onSave: (row: BillingBudgetEditableRow) => void;
}

const toMaybeNumber = (value: number | string | undefined) => {
  if (value === '' || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const BillingBudgetsHeader: FC<BillingBudgetsHeaderProps> = ({
  busy,
  loading,
  spaceFilter,
  total,
  spaceOptions,
  onRefresh,
  onSpaceFilterChange,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-3">
        <Typography.Title
          heading={5}
          className="!mb-0 text-[18px] font-semibold text-gray-900"
        >
          {tNoOptions('platform_management_budgets_title', '预算与阈值')}
        </Typography.Title>
        <span className="rounded-full px-[10px] py-[2px] text-[12px] font-[500] bg-gray-100 text-gray-600">
          {total}
        </span>
      </div>
      <Typography.Text className="mt-[4px] block text-[12px] text-gray-500">
        {tNoOptions(
          'platform_management_budgets_subtitle',
          `共 ${total} 个空间可配置月预算、告警阈值和超限策略`,
        )}
      </Typography.Text>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Select
        className="w-[200px]"
        disabled={busy}
        value={spaceFilter}
        optionList={spaceOptions}
        onChange={onSpaceFilterChange}
        showSearch
      />
      <Button disabled={busy} loading={loading} onClick={onRefresh}>
        {tNoOptions('platform_management_refresh', '刷新')}
      </Button>
    </div>
  </div>
);

const BudgetOperationCell: FC<BudgetOperationCellProps> = ({
  busy,
  row,
  savingRowKey,
  onEnabledChange,
  onSave,
}) => (
  <div
    className="flex min-w-[180px] flex-col items-start gap-[10px] rounded-[12px] border border-solid px-[12px] py-[10px]"
    style={{
      borderColor: 'rgba(148, 163, 184, 0.16)',
      backgroundColor: '#FCFCFD',
    }}
  >
    <div className="flex items-center gap-[8px]">
      <Typography.Text className="text-[12px] coz-fg-secondary">
        {tNoOptions('platform_management_budgets_enabled', '启用规则')}
      </Typography.Text>
      <Switch
        size="small"
        checked={row.enabled}
        disabled={busy}
        onChange={value => onEnabledChange(row.key, value)}
      />
    </div>
    <Button
      size="small"
      loading={savingRowKey === row.key}
      disabled={busy}
      onClick={() => onSave(row)}
    >
      {tNoOptions('platform_management_budgets_save', '保存')}
    </Button>
    <Typography.Text className="text-[12px] coz-fg-secondary">
      {tNoOptions(
        'platform_management_budgets_updated_at',
        `最近更新 ${formatBillingBudgetUpdatedAt(row.updatedAt)}`,
      )}
    </Typography.Text>
  </div>
);

const useBillingBudgetColumns = ({
  busy,
  onBudgetChange,
  onEnabledChange,
  onPolicyChange,
  onSave,
  onThresholdsChange,
  savingRowKey,
}: {
  busy: boolean;
  onBudgetChange: (rowKey: string, monthlyBudget: number | undefined) => void;
  onEnabledChange: (rowKey: string, enabled: boolean) => void;
  onPolicyChange: (
    rowKey: string,
    policy: BillingBudgetOverLimitPolicy,
  ) => void;
  onSave: (row: BillingBudgetEditableRow) => Promise<void>;
  onThresholdsChange: (
    rowKey: string,
    thresholds: Array<string | number>,
  ) => void;
  savingRowKey: string | null;
}) =>
  useMemo<ColumnProps<BillingBudgetEditableRow>[]>(
    () => [
      {
        title: tNoOptions('platform_management_budgets_space', '空间名称'),
        dataIndex: 'spaceName',
        key: 'spaceName',
        width: 220,
        render: (_value, record) => (
          <div className="flex flex-col gap-[4px]">
            <Typography.Text className="font-[500]">
              {record.spaceName || String(record.spaceId)}
            </Typography.Text>
            <Typography.Text className="text-[12px] coz-fg-secondary">
              {record.enabled
                ? tNoOptions(
                    'platform_management_budgets_enabled_status',
                    '预算规则已启用',
                  )
                : tNoOptions(
                    'platform_management_budgets_disabled_status',
                    '预算规则未启用',
                  )}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: tNoOptions(
          'platform_management_budgets_monthly_budget',
          '月预算 (¥)',
        ),
        dataIndex: 'monthlyBudget',
        key: 'monthlyBudget',
        width: 180,
        render: (_value, record) => (
          <InputNumber
            keepFocus
            disabled={busy}
            min={0}
            precision={2}
            className="w-[140px]"
            value={record.monthlyBudget}
            onNumberChange={value =>
              onBudgetChange(record.key, toMaybeNumber(value))
            }
          />
        ),
      },
      {
        title: tNoOptions(
          'platform_management_budgets_thresholds',
          '告警阈值 (%)',
        ),
        dataIndex: 'alarmThresholds',
        key: 'alarmThresholds',
        width: 260,
        render: (_value, record) => (
          <Checkbox.Group
            className="flex flex-wrap gap-[8px]"
            value={record.alarmThresholds}
            onChange={value => onThresholdsChange(record.key, value)}
          >
            {resolveBillingBudgetThresholdOptions(record.alarmThresholds).map(
              threshold => (
                <Checkbox disabled={busy} key={threshold} value={threshold}>
                  {`${threshold}%`}
                </Checkbox>
              ),
            )}
          </Checkbox.Group>
        ),
      },
      {
        title: tNoOptions('platform_management_budgets_policy', '超限策略'),
        dataIndex: 'overLimitPolicy',
        key: 'overLimitPolicy',
        width: 260,
        render: (_value, record) => (
          <RadioGroup
            value={record.overLimitPolicy}
            onChange={event =>
              onPolicyChange(
                record.key,
                String(event.target.value) as BillingBudgetOverLimitPolicy,
              )
            }
          >
            <Radio disabled={busy} value="warn">
              {tNoOptions('platform_management_budgets_policy_warn', '仅告警')}
            </Radio>
            <Radio disabled={busy} value="reject">
              {tNoOptions(
                'platform_management_budgets_policy_reject',
                '拒绝新增调用',
              )}
            </Radio>
          </RadioGroup>
        ),
      },
      {
        title: tNoOptions('platform_management_budgets_action', '操作'),
        dataIndex: 'key',
        key: 'operation',
        width: 220,
        render: (_value, record) => (
          <BudgetOperationCell
            busy={busy}
            row={record}
            savingRowKey={savingRowKey}
            onEnabledChange={onEnabledChange}
            onSave={row => void onSave(row)}
          />
        ),
      },
    ],
    [
      busy,
      onBudgetChange,
      onEnabledChange,
      onPolicyChange,
      onSave,
      onThresholdsChange,
      savingRowKey,
    ],
  );

export const BillingBudgetsPanel: FC<BillingBudgetsPanelProps> = ({
  selectedSpaceId,
  spaceOptions,
  onResetFilters,
}) => {
  const {
    errorText,
    load,
    loading,
    onBudgetChange,
    onEnabledChange,
    onPolicyChange,
    onSave,
    onSpaceFilterChange,
    onThresholdsChange,
    rows,
    savingRowKey,
    spaceFilter,
  } = useBillingBudgetsState({
    selectedSpaceId,
    spaceOptions,
  });
  const busy = loading || savingRowKey !== null;
  const columns = useBillingBudgetColumns({
    busy,
    onBudgetChange,
    onEnabledChange,
    onPolicyChange,
    onSave,
    onThresholdsChange,
    savingRowKey,
  });
  const isEmpty = !loading && !errorText && !rows.length;

  return (
    <div className="rounded-[12px] bg-white border border-gray-100 px-6 py-6 shadow-sm">
      <BillingBudgetsHeader
        busy={busy}
        loading={loading}
        total={rows.length}
        spaceFilter={spaceFilter}
        spaceOptions={spaceOptions}
        onRefresh={() => void load()}
        onSpaceFilterChange={value => onSpaceFilterChange(String(value))}
      />

      {errorText ? (
        <div className="mt-5">
          <PlatformErrorState
            errorText={errorText}
            onRetry={() => void load()}
          />
        </div>
      ) : null}

      {isEmpty ? (
        <div className="mt-5">
          <PlatformEmptyState onAction={onResetFilters} />
        </div>
      ) : (
        <div className="platform-management-budgets-table mt-5 overflow-hidden">
          <style>{BUDGETS_TABLE_STYLE}</style>
          <Table
            scrollX={1120}
            tableProps={{
              columns,
              dataSource: rows,
              loading,
              pagination: false,
              rowKey: 'key',
            }}
          />
        </div>
      )}

      <div className="mt-5 flex items-start gap-2 rounded-[8px] px-4 py-3 bg-[#FFF7E8] border border-[#FFE4BA]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className="flex-shrink-0 mt-[1px]"
        >
          <path
            d="M8 2C4.686 2 2 4.686 2 8s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm.75 9a.75.75 0 01-1.5 0v-3a.75.75 0 011.5 0v3zM8 6.5a.75.75 0 110-1.5.75.75 0 010 1.5z"
            fill="#FF7D00"
          />
        </svg>
        <Typography.Text className="text-[12px] text-[#FF7D00]">
          {tNoOptions(
            'platform_management_budgets_note',
            '说明：当费用命中阈值时，将向平台管理员发送站内通知。',
          )}
        </Typography.Text>
      </div>
    </div>
  );
};
