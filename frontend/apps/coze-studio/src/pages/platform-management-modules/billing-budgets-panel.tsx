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
  <div className="flex flex-wrap items-start justify-between gap-[12px]">
    <div className="flex flex-col gap-[4px]">
      <Typography.Title heading={5} className="!mb-0">
        {tNoOptions('platform_management_budgets_title', '预算与阈值')}
      </Typography.Title>
      <Typography.Text className="text-[12px] coz-fg-secondary">
        {tNoOptions(
          'platform_management_budgets_subtitle',
          `共 ${total} 个空间可配置月预算、告警阈值和超限策略`,
        )}
      </Typography.Text>
    </div>
    <div className="flex flex-wrap items-center gap-[10px]">
      <Select
        className="w-[200px]"
        disabled={busy}
        value={spaceFilter}
        optionList={spaceOptions}
        onChange={onSpaceFilterChange}
      />
      <Button
        theme="light"
        disabled={busy}
        loading={loading}
        onClick={onRefresh}
        className="px-[16px] border border-solid coz-stroke-primary"
        style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
      >
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
  <div className="flex flex-col items-start gap-[8px]">
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
    <div className="rounded-[10px] border border-solid coz-stroke-primary px-[12px] py-[12px]">
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
        <div className="mt-[12px]">
          <PlatformErrorState
            errorText={errorText}
            onRetry={() => void load()}
          />
        </div>
      ) : null}

      {isEmpty ? (
        <div className="mt-[12px]">
          <PlatformEmptyState onAction={onResetFilters} />
        </div>
      ) : (
        <div className="mt-[12px] overflow-hidden">
          <Table
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={false}
            rowKey="key"
            scroll={{ x: 1120 }}
          />
        </div>
      )}

      <div className="mt-[12px] rounded-[10px] coz-bg-plus px-[12px] py-[10px]">
        <Typography.Text className="text-[12px] coz-fg-secondary">
          {tNoOptions(
            'platform_management_budgets_note',
            '说明：当费用命中阈值时，将向平台管理员发送站内通知。',
          )}
        </Typography.Text>
      </div>
    </div>
  );
};
