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
import { IconCozMagnifier } from '@coze-arch/coze-design/icons';
import {
  Button,
  Input,
  Select,
  Table,
  Tag,
  Typography,
  type ColumnProps,
} from '@coze-arch/coze-design';

import { useBillingRecordsExport } from './use-billing-records-export';
import type { PlatformFilters } from './types';
import {
  PlatformEmptyState,
  PlatformErrorState,
} from './platform-request-states';
import { useBillingRecordsPanelState } from './billing-records-panel-state';
import {
  SORT_DIRECTION_OPTIONS,
  SORT_FIELD_OPTIONS,
  formatBillingRecordCurrency,
  formatBillingRecordDateTime,
  formatBillingRecordNumber,
  formatBillingRecordProjectType,
  formatBillingRecordUnitPrice,
  type BillingRecordItem,
  type BillingRecordSortDirection,
  type BillingRecordSortField,
} from './billing-records-helpers';

interface BillingRecordsPanelProps {
  filters: PlatformFilters;
  onResetFilters: () => void;
}

interface BillingRecordsPaginationProps {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  loading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

interface BillingRecordsHeaderProps {
  total: number;
  keywordInput: string;
  orderBy: BillingRecordSortField;
  orderDirection: BillingRecordSortDirection;
  exportInProgress: boolean;
  exportStatusText: { className: string; text: string } | null;
  hasExportFile: boolean;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onExport: () => void;
  onDownloadExport: () => void;
  onSortFieldChange: (value: unknown) => void;
  onSortDirectionChange: (value: unknown) => void;
}

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

const RECORDS_TABLE_STYLE = `
.platform-management-records-table table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.platform-management-records-table thead th {
  background: #F7F8FA;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 14px;
  border-bottom: 1px solid #E2E8F0;
}

.platform-management-records-table th,
.platform-management-records-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #F1F5F9;
  color: #1F2937;
  font-size: 14px;
}

.platform-management-records-table tbody tr:last-child td {
  border-bottom: none;
}

.platform-management-records-table tbody tr:hover td {
  background: #F8FAFC;
}
`;

const renderStatusTag = (status: string | undefined) => {
  switch (status) {
    case 'success':
      return (
        <Tag color="green" size="small">
          {tNoOptions('platform_management_record_status_success', '成功')}
        </Tag>
      );
    case 'failed':
      return (
        <Tag color="red" size="small">
          {tNoOptions('platform_management_record_status_failed', '失败')}
        </Tag>
      );
    case 'refund':
      return (
        <Tag color="grey" size="small">
          {tNoOptions('platform_management_record_status_refund', '回滚')}
        </Tag>
      );
    default:
      return (
        <Typography.Text className="text-[12px] coz-fg-secondary">
          {status || '--'}
        </Typography.Text>
      );
  }
};

const getBillingRecordColumns = (): ColumnProps<BillingRecordItem>[] => [
  {
    title: tNoOptions('platform_management_records_time', '时间'),
    dataIndex: 'occurred_at',
    key: 'occurred_at',
    width: 180,
    render: value => formatBillingRecordDateTime(value as number | undefined),
  },
  {
    title: tNoOptions('platform_management_records_space', '空间'),
    dataIndex: 'space_name',
    key: 'space_name',
    width: 180,
    render: value => value || '--',
  },
  {
    title: tNoOptions('platform_management_records_project_type', '项目类型'),
    dataIndex: 'project_type',
    key: 'project_type',
    width: 120,
    render: value =>
      formatBillingRecordProjectType(value as string | undefined),
  },
  {
    title: tNoOptions('platform_management_records_project_name', '项目名称'),
    dataIndex: 'project_name',
    key: 'project_name',
    width: 180,
    render: value => value || '--',
  },
  {
    title: tNoOptions('platform_management_records_model', '模型/能力项'),
    dataIndex: 'model_id',
    key: 'model_id',
    width: 180,
    render: value => value || '--',
  },
  {
    title: tNoOptions('platform_management_records_usage', '用量'),
    dataIndex: 'usage_tokens',
    key: 'usage_tokens',
    width: 140,
    align: 'right',
    render: value => formatBillingRecordNumber(value as number | undefined),
  },
  {
    title: tNoOptions('platform_management_records_unit_price', '单价'),
    dataIndex: 'unit_price',
    key: 'unit_price',
    width: 140,
    align: 'right',
    render: value =>
      formatBillingRecordUnitPrice(value as string | number | undefined),
  },
  {
    title: tNoOptions('platform_management_records_amount', '金额'),
    dataIndex: 'amount',
    key: 'amount',
    width: 140,
    align: 'right',
    render: value =>
      formatBillingRecordCurrency(value as string | number | undefined),
  },
  {
    title: tNoOptions('platform_management_records_status', '状态'),
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: value => renderStatusTag(value as string | undefined),
  },
];

const BillingRecordsPagination: FC<BillingRecordsPaginationProps> = ({
  page,
  size,
  total,
  totalPages,
  loading,
  onPrevPage,
  onNextPage,
}) => {
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <div className="mt-[16px] flex flex-wrap items-center justify-center gap-[12px] rounded-[8px] bg-[#F7F8FA] px-[12px] py-[10px]">
      <Button size="small" disabled={page <= 1 || loading} onClick={onPrevPage}>
        {tNoOptions('platform_management_records_prev_page', '上一页')}
      </Button>
      <Typography.Text className="text-[12px] coz-fg-secondary">
        {tNoOptions(
          'platform_management_records_pagination',
          `显示第 ${from} 至 ${to} 条，共 ${total} 条数据`,
        )}
      </Typography.Text>
      <Button
        size="small"
        disabled={page >= totalPages || loading}
        onClick={onNextPage}
      >
        {tNoOptions('platform_management_records_next_page', '下一页')}
      </Button>
    </div>
  );
};

const BillingRecordsHeader: FC<BillingRecordsHeaderProps> = ({
  total,
  keywordInput,
  orderBy,
  orderDirection,
  exportInProgress,
  exportStatusText,
  hasExportFile,
  onKeywordChange,
  onSearch,
  onExport,
  onDownloadExport,
  onSortFieldChange,
  onSortDirectionChange,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <Typography.Title
          heading={5}
          className="!mb-0 text-[16px] font-semibold text-gray-900"
        >
          {tNoOptions('platform_management_records_title', '账单明细')}
        </Typography.Title>
        <span className="rounded-full px-[8px] py-[1px] text-[12px] font-[500] bg-gray-100 text-gray-600">
          {total}
        </span>
      </div>
      {exportStatusText ? (
        <Typography.Text
          className={`mt-[6px] block text-[12px] ${exportStatusText.className}`}
        >
          {exportStatusText.text}
        </Typography.Text>
      ) : null}
    </div>
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Input
        value={keywordInput}
        onChange={onKeywordChange}
        onEnterPress={onSearch}
        showClear
        className="w-[240px]"
        prefix={<IconCozMagnifier className="text-[16px] text-gray-400" />}
        placeholder={tNoOptions(
          'platform_management_records_search_placeholder',
          '搜索空间/项目名',
        )}
      />
      <Select
        className="w-[120px]"
        value={orderBy}
        optionList={SORT_FIELD_OPTIONS}
        onChange={onSortFieldChange}
      />
      <Select
        className="w-[100px]"
        value={orderDirection}
        optionList={SORT_DIRECTION_OPTIONS}
        onChange={onSortDirectionChange}
      />
      <Button
        type="primary"
        onClick={onExport}
        loading={exportInProgress}
        disabled={exportInProgress}
        className="bg-[#3370FF] hover:bg-[#245BDB]"
      >
        {exportInProgress
          ? tNoOptions('platform_management_records_exporting', '导出中...')
          : tNoOptions('platform_management_records_export', '导出')}
      </Button>
      {hasExportFile ? (
        <Button onClick={onDownloadExport}>
          {tNoOptions(
            'platform_management_records_download_export',
            '下载文件',
          )}
        </Button>
      ) : null}
    </div>
  </div>
);

export const BillingRecordsPanel: FC<BillingRecordsPanelProps> = ({
  filters,
  onResetFilters,
}) => {
  const columns = useMemo(() => getBillingRecordColumns(), []);
  const {
    data,
    errorText,
    handleNextPage,
    handlePrevPage,
    handleSearch,
    handleSortDirectionChange,
    handleSortFieldChange,
    isEmpty,
    keywordInput,
    load,
    loading,
    query,
    setKeywordInput,
    totalPages,
  } = useBillingRecordsPanelState(filters);
  const {
    exportInProgress,
    exportStatusText,
    hasExportFile,
    onDownloadExport,
    onExport,
  } = useBillingRecordsExport({ filters, query });

  return (
    <div className="rounded-[12px] bg-white border border-gray-100 px-5 pt-6 pb-5 shadow-sm">
      <BillingRecordsHeader
        total={data.total ?? 0}
        keywordInput={keywordInput}
        orderBy={query.orderBy}
        orderDirection={query.orderDirection}
        exportInProgress={exportInProgress}
        exportStatusText={exportStatusText}
        hasExportFile={hasExportFile}
        onKeywordChange={setKeywordInput}
        onSearch={handleSearch}
        onExport={() => void onExport()}
        onDownloadExport={onDownloadExport}
        onSortFieldChange={handleSortFieldChange}
        onSortDirectionChange={handleSortDirectionChange}
      />

      {errorText ? (
        <div className="mt-4">
          <PlatformErrorState
            errorText={errorText}
            onRetry={() => void load()}
          />
        </div>
      ) : null}

      {isEmpty ? (
        <div className="mt-4">
          <PlatformEmptyState onAction={onResetFilters} />
        </div>
      ) : (
        <>
          <div className="platform-management-records-table mt-4 overflow-hidden">
            <style>{RECORDS_TABLE_STYLE}</style>
            <Table
              scrollX={1380}
              tableProps={{
                columns,
                dataSource: data.list ?? [],
                loading,
                pagination: false,
                rowKey: 'id',
              }}
            />
          </div>

          <BillingRecordsPagination
            page={query.page}
            size={query.size}
            total={data.total ?? 0}
            totalPages={totalPages}
            loading={loading}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />
        </>
      )}
    </div>
  );
};
