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

interface BillingRecordsToolbarProps {
  keywordInput: string;
  orderBy: BillingRecordSortField;
  orderDirection: BillingRecordSortDirection;
  exportInProgress: boolean;
  hasExportFile: boolean;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onExport: () => void;
  onDownloadExport: () => void;
  onSortFieldChange: (value: unknown) => void;
  onSortDirectionChange: (value: unknown) => void;
}

interface BillingRecordsPaginationProps {
  page: number;
  size: number;
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

const BillingRecordsToolbar: FC<BillingRecordsToolbarProps> = ({
  keywordInput,
  orderBy,
  orderDirection,
  exportInProgress,
  hasExportFile,
  onKeywordChange,
  onSearch,
  onExport,
  onDownloadExport,
  onSortFieldChange,
  onSortDirectionChange,
}) => (
  <div className="flex flex-wrap items-center justify-end gap-[10px]">
    <Input
      value={keywordInput}
      onChange={onKeywordChange}
      onEnterPress={onSearch}
      showClear
      className="w-[220px] md:w-[280px]"
      prefix={<IconCozMagnifier className="text-[16px] coz-fg-secondary" />}
      placeholder={tNoOptions(
        'platform_management_records_search_placeholder',
        '搜索空间名/项目名',
      )}
    />
    <Button
      onClick={onSearch}
      className="px-[16px] border border-solid coz-stroke-primary"
      style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
    >
      {tNoOptions('platform_management_records_search', '查询')}
    </Button>
    <Button
      onClick={onExport}
      loading={exportInProgress}
      disabled={exportInProgress}
    >
      {exportInProgress
        ? tNoOptions('platform_management_records_exporting', '导出中...')
        : tNoOptions('platform_management_records_export', '导出')}
    </Button>
    {hasExportFile ? (
      <Button
        theme="light"
        onClick={onDownloadExport}
        className="px-[16px] border border-solid coz-stroke-primary"
        style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
      >
        {tNoOptions('platform_management_records_download_export', '下载文件')}
      </Button>
    ) : null}
    <Select
      className="w-[130px]"
      value={orderBy}
      optionList={SORT_FIELD_OPTIONS}
      onChange={onSortFieldChange}
    />
    <Select
      className="w-[110px]"
      value={orderDirection}
      optionList={SORT_DIRECTION_OPTIONS}
      onChange={onSortDirectionChange}
    />
  </div>
);

const BillingRecordsPagination: FC<BillingRecordsPaginationProps> = ({
  page,
  size,
  totalPages,
  loading,
  onPrevPage,
  onNextPage,
}) => (
  <div className="mt-[12px] flex flex-wrap items-center justify-between gap-[12px]">
    <Typography.Text className="text-[12px] coz-fg-secondary">
      {tNoOptions(
        'platform_management_records_pagination',
        `第 ${page} / ${totalPages} 页，每页 ${size} 条`,
      )}
    </Typography.Text>
    <div className="flex items-center gap-[8px]">
      <Button
        size="small"
        disabled={page <= 1 || loading}
        onClick={onPrevPage}
        className="px-[12px] border border-solid coz-stroke-primary"
        style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
      >
        {tNoOptions('platform_management_records_prev_page', '上一页')}
      </Button>
      <Button
        size="small"
        disabled={page >= totalPages || loading}
        onClick={onNextPage}
      >
        {tNoOptions('platform_management_records_next_page', '下一页')}
      </Button>
    </div>
  </div>
);

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
  <div className="flex flex-wrap items-center justify-between gap-[12px]">
    <div className="flex flex-col gap-[4px]">
      <Typography.Title heading={5} className="!mb-0">
        {tNoOptions('platform_management_records_title', '账单明细')}
      </Typography.Title>
      <Typography.Text className="text-[12px] coz-fg-secondary">
        {tNoOptions('platform_management_records_total', `共 ${total} 条记录`)}
      </Typography.Text>
      {exportStatusText ? (
        <Typography.Text
          className={`text-[12px] ${exportStatusText.className}`}
        >
          {exportStatusText.text}
        </Typography.Text>
      ) : null}
    </div>
    <BillingRecordsToolbar
      keywordInput={keywordInput}
      orderBy={orderBy}
      orderDirection={orderDirection}
      exportInProgress={exportInProgress}
      hasExportFile={hasExportFile}
      onKeywordChange={onKeywordChange}
      onSearch={onSearch}
      onExport={onExport}
      onDownloadExport={onDownloadExport}
      onSortFieldChange={onSortFieldChange}
      onSortDirectionChange={onSortDirectionChange}
    />
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
    <div className="rounded-[10px] border border-solid coz-stroke-primary px-[12px] py-[12px]">
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
        <>
          <div className="mt-[12px] overflow-hidden">
            <Table
              columns={columns}
              dataSource={data.list ?? []}
              loading={loading}
              pagination={false}
              rowKey="id"
              scroll={{ x: 1380 }}
            />
          </div>

          <BillingRecordsPagination
            page={query.page}
            size={query.size}
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
