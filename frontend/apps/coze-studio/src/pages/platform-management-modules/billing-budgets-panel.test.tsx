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
  createContext,
  type PropsWithChildren,
  useContext,
  type ReactNode,
} from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

const billingBudgetsPanelMocks = vi.hoisted(() => ({
  useBillingBudgetsState: vi.fn(),
}));

const checkboxGroupContext = createContext<{
  value: Array<string | number>;
  onChange?: (value: Array<string | number>) => void;
}>({
  value: [],
});

const radioGroupContext = createContext<{
  value?: string;
  onChange?: (event: { target: { value: string } }) => void;
}>({});

function MockButton({
  children,
  disabled,
  loading,
  onClick,
}: PropsWithChildren<{
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {loading ? `loading:${children as string}` : children}
    </button>
  );
}

function MockText({ children }: PropsWithChildren) {
  return <span>{children}</span>;
}

function MockTitle({ children }: PropsWithChildren) {
  return <div>{children}</div>;
}

function MockSelect({
  disabled,
  onChange,
  optionList,
  value,
}: {
  disabled?: boolean;
  onChange?: (value: unknown) => void;
  optionList?: Array<{ label: string; value: string }>;
  value?: string;
}) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={event => onChange?.(event.target.value)}
    >
      {optionList?.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function MockInputNumber({
  disabled,
  onNumberChange,
  value,
}: {
  disabled?: boolean;
  onNumberChange?: (value: number | string | undefined) => void;
  value?: number;
}) {
  return (
    <input
      disabled={disabled}
      type="number"
      value={value ?? ''}
      onChange={event => {
        const nextValue = event.target.value;
        onNumberChange?.(nextValue === '' ? '' : Number(nextValue));
      }}
    />
  );
}

function MockCheckboxGroup({
  children,
  onChange,
  value = [],
}: PropsWithChildren<{
  onChange?: (value: Array<string | number>) => void;
  value?: Array<string | number>;
}>) {
  return (
    <checkboxGroupContext.Provider value={{ value, onChange }}>
      {children}
    </checkboxGroupContext.Provider>
  );
}

function MockCheckbox({
  children,
  disabled,
  value,
}: PropsWithChildren<{ disabled?: boolean; value: string | number }>) {
  const group = useContext(checkboxGroupContext);
  const checked = group.value.some(item => String(item) === String(value));

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        const nextValue = checked
          ? group.value.filter(item => String(item) !== String(value))
          : [...group.value, value];
        group.onChange?.(nextValue);
      }}
    >
      {children}
    </button>
  );
}

function MockRadioGroup({
  children,
  onChange,
  value,
}: PropsWithChildren<{
  onChange?: (event: { target: { value: string } }) => void;
  value?: string;
}>) {
  return (
    <radioGroupContext.Provider value={{ value, onChange }}>
      {children}
    </radioGroupContext.Provider>
  );
}

function MockRadio({
  children,
  disabled,
  value,
}: PropsWithChildren<{ disabled?: boolean; value: string }>) {
  const group = useContext(radioGroupContext);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => group.onChange?.({ target: { value } })}
    >
      {children}
    </button>
  );
}

function MockSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked?: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
    >
      {`switch:${checked ? 'on' : 'off'}`}
    </button>
  );
}

function MockTable({
  columns,
  dataSource,
  tableProps,
}: {
  columns?: Array<{
    key?: string;
    dataIndex?: string;
    render?: (
      value: unknown,
      record: Record<string, unknown>,
      index: number,
    ) => ReactNode;
  }>;
  dataSource?: Array<Record<string, unknown>>;
  tableProps?: {
    columns?: Array<{
      key?: string;
      dataIndex?: string;
      render?: (
        value: unknown,
        record: Record<string, unknown>,
        index: number,
      ) => ReactNode;
    }>;
    dataSource?: Array<Record<string, unknown>>;
  };
}) {
  const effectiveColumns = columns ?? tableProps?.columns;
  const effectiveDataSource = dataSource ?? tableProps?.dataSource;
  const firstRow = effectiveDataSource?.[0];

  return (
    <div>
      {`table:${effectiveDataSource?.length ?? 0}:${firstRow?.spaceName ?? ''}`}
      {firstRow
        ? effectiveColumns?.map((column, index) => (
            <div key={column.key ?? column.dataIndex ?? String(index)}>
              {column.render
                ? column.render(
                    column.dataIndex ? firstRow[column.dataIndex] : undefined,
                    firstRow,
                    0,
                  )
                : null}
            </div>
          ))
        : null}
    </div>
  );
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

vi.mock('@coze-arch/coze-design', () => ({
  Button: MockButton,
  Checkbox: Object.assign(MockCheckbox, { Group: MockCheckboxGroup }),
  InputNumber: MockInputNumber,
  Radio: MockRadio,
  RadioGroup: MockRadioGroup,
  Select: MockSelect,
  Switch: MockSwitch,
  Table: MockTable,
  Typography: {
    Text: MockText,
    Title: MockTitle,
  },
}));

vi.mock('./platform-request-states', () => ({
  PlatformEmptyState: MockPlatformEmptyState,
  PlatformErrorState: MockPlatformErrorState,
}));

vi.mock('./use-billing-budgets', () => ({
  useBillingBudgetsState: billingBudgetsPanelMocks.useBillingBudgetsState,
}));

vi.mock('./billing-budgets-helpers', () => ({
  formatBillingBudgetUpdatedAt: (updatedAt: number | undefined) =>
    `time:${String(updatedAt ?? 0)}`,
  resolveBillingBudgetThresholdOptions: () => [70, 90, 100],
}));

import { BillingBudgetsPanel } from './billing-budgets-panel';

const SPACE_OPTIONS = [
  { value: 'all', label: '全部空间' },
  { value: '1001', label: '空间 A' },
  { value: '1002', label: '空间 B' },
];

const DEFAULT_STATE = {
  errorText: '',
  load: vi.fn().mockResolvedValue(undefined),
  loading: false,
  onBudgetChange: vi.fn(),
  onEnabledChange: vi.fn(),
  onPolicyChange: vi.fn(),
  onSave: vi.fn().mockResolvedValue(undefined),
  onSpaceFilterChange: vi.fn(),
  onThresholdsChange: vi.fn(),
  rows: [],
  savingRowKey: null,
  spaceFilter: 'all',
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
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('billing-budgets-panel', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    billingBudgetsPanelMocks.useBillingBudgetsState.mockReset();
    billingBudgetsPanelMocks.useBillingBudgetsState.mockReturnValue({
      ...DEFAULT_STATE,
      load: vi.fn().mockResolvedValue(undefined),
      onBudgetChange: vi.fn(),
      onEnabledChange: vi.fn(),
      onPolicyChange: vi.fn(),
      onSave: vi.fn().mockResolvedValue(undefined),
      onSpaceFilterChange: vi.fn(),
      onThresholdsChange: vi.fn(),
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('renders empty state and triggers filter reset action', () => {
    const onResetFilters = vi.fn();

    act(() => {
      root.render(
        <BillingBudgetsPanel
          selectedSpaceId="all"
          spaceOptions={SPACE_OPTIONS}
          onResetFilters={onResetFilters}
        />,
      );
    });

    expect(container.textContent).toContain('empty-state');
    expect(container.textContent).not.toContain('table:');

    act(() => {
      getButtonByText(container, 'empty-state')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it('renders error state and retries loading on demand', () => {
    const load = vi.fn().mockResolvedValue(undefined);
    billingBudgetsPanelMocks.useBillingBudgetsState.mockReturnValue({
      ...DEFAULT_STATE,
      errorText: 'budget failed',
      load,
    });

    act(() => {
      root.render(
        <BillingBudgetsPanel
          selectedSpaceId="all"
          spaceOptions={SPACE_OPTIONS}
          onResetFilters={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain('error-state:budget failed');

    act(() => {
      getButtonByText(container, 'error-state:budget failed')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('wires header and row interactions to billing budgets state handlers', async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    const onBudgetChange = vi.fn();
    const onEnabledChange = vi.fn();
    const onPolicyChange = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onSpaceFilterChange = vi.fn();
    const onThresholdsChange = vi.fn();
    const row = {
      key: '1001',
      spaceId: 1001,
      spaceName: '空间 A',
      monthlyBudget: 120.5,
      alarmThresholds: [70, 90],
      overLimitPolicy: 'warn' as const,
      enabled: true,
      updatedAt: 1736035200000,
    };

    billingBudgetsPanelMocks.useBillingBudgetsState.mockReturnValue({
      ...DEFAULT_STATE,
      load,
      onBudgetChange,
      onEnabledChange,
      onPolicyChange,
      onSave,
      onSpaceFilterChange,
      onThresholdsChange,
      rows: [row],
      spaceFilter: '1001',
    });

    act(() => {
      root.render(
        <BillingBudgetsPanel
          selectedSpaceId="all"
          spaceOptions={SPACE_OPTIONS}
          onResetFilters={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain('table:1:空间 A');
    expect(container.textContent).toContain(
      '说明：当费用命中阈值时，将向平台管理员发送站内通知。',
    );

    const select = container.querySelector('select');
    const numberInput = container.querySelector('input[type="number"]');
    await act(async () => {
      if (select instanceof HTMLSelectElement) {
        select.value = '1002';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      getButtonByText(container, '刷新')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );

      if (numberInput instanceof HTMLInputElement) {
        setNativeInputValue(numberInput, '456');
      }

      getButtonByText(container, '100%')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      getButtonByText(container, '拒绝新增调用')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      getButtonByText(container, 'switch:on')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      getButtonByText(container, '保存')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );

      await Promise.resolve();
    });

    expect(onSpaceFilterChange).toHaveBeenCalledWith('1002');
    expect(load).toHaveBeenCalledTimes(1);
    expect(onBudgetChange).toHaveBeenCalledWith('1001', 456);
    expect(onThresholdsChange).toHaveBeenCalledWith('1001', [70, 90, 100]);
    expect(onPolicyChange).toHaveBeenCalledWith('1001', 'reject');
    expect(onEnabledChange).toHaveBeenCalledWith('1001', false);
    expect(onSave).toHaveBeenCalledWith(row);
  });

  it('disables refresh and save actions while a row is saving', () => {
    billingBudgetsPanelMocks.useBillingBudgetsState.mockReturnValue({
      ...DEFAULT_STATE,
      rows: [
        {
          key: '1001',
          spaceId: 1001,
          spaceName: '空间 A',
          monthlyBudget: 120,
          alarmThresholds: [70, 90],
          overLimitPolicy: 'warn',
          enabled: true,
          updatedAt: 1736035200000,
        },
      ],
      savingRowKey: '1001',
      spaceFilter: '1001',
    });

    act(() => {
      root.render(
        <BillingBudgetsPanel
          selectedSpaceId="1001"
          spaceOptions={SPACE_OPTIONS}
          onResetFilters={vi.fn()}
        />,
      );
    });

    expect(getButtonByText(container, '刷新')?.hasAttribute('disabled')).toBe(
      true,
    );
    expect(
      getButtonByText(container, 'loading:保存')?.hasAttribute('disabled'),
    ).toBe(true);
  });
});
