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
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import { Toast } from '@coze-arch/coze-design';

import type { PlatformFilters } from './types';
import {
  fetchBillingRecordsExportStatus,
  fetchBillingRecordsExportTask,
  formatBillingRecordDateTime,
  resolveBillingRecordsExportRequestErrorText,
  type BillingRecordsExportStatusData,
  type BillingRecordsQueryState,
} from './billing-records-helpers';

const EXPORT_STATUS_POLL_INTERVAL_MS = 2000;
const EXPORT_STATUS_POLL_MAX_ATTEMPTS = 30;

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

interface UseBillingRecordsExportParams {
  filters: PlatformFilters;
  query: BillingRecordsQueryState;
}

interface ExportStatusText {
  className: string;
  text: string;
}

interface UseBillingRecordsExportPollingParams {
  clearExportPollingTimer: () => void;
  exportPollingAttemptsRef: MutableRefObject<number>;
  exportPollingTimerRef: MutableRefObject<number | null>;
  exportTask: BillingRecordsExportStatusData | null;
  onTaskExpired: () => void;
  setExportTask: Dispatch<
    SetStateAction<BillingRecordsExportStatusData | null>
  >;
}

interface UseBillingRecordsExportActionsParams {
  clearExportPollingTimer: () => void;
  exportExpired: boolean;
  exportPollingAttemptsRef: MutableRefObject<number>;
  exportTask: BillingRecordsExportStatusData | null;
  filters: PlatformFilters;
  onTaskExpired: () => void;
  query: BillingRecordsQueryState;
  resetExportTaskState: () => void;
  setExportLoading: Dispatch<SetStateAction<boolean>>;
  setExportTask: Dispatch<
    SetStateAction<BillingRecordsExportStatusData | null>
  >;
}

const getExportExpiredText = () =>
  tNoOptions(
    'platform_management_records_export_expired',
    '导出文件已过期，请重新发起导出',
  );

const getExportStartedText = () =>
  tNoOptions(
    'platform_management_records_export_started',
    '已发起导出，文件生成后可下载',
  );

const getExportCompletedText = () =>
  tNoOptions(
    'platform_management_records_export_completed',
    '导出完成，可下载文件',
  );

const getExportFailedText = () =>
  tNoOptions('platform_management_records_export_failed', '账单导出失败');

const notifyExportTaskResult = ({
  completedTask,
  onTaskExpired,
}: {
  completedTask: BillingRecordsExportStatusData;
  onTaskExpired: () => void;
}) => {
  if (completedTask.expire_at && completedTask.expire_at <= Date.now()) {
    onTaskExpired();
    Toast.error(getExportExpiredText());
    return;
  }

  if (completedTask.status === 'success') {
    Toast.success(getExportCompletedText());
    return;
  }

  if (completedTask.status === 'failed') {
    Toast.error(getExportFailedText());
    return;
  }

  Toast.info(getExportStartedText());
};

const useBillingRecordsExportPolling = ({
  clearExportPollingTimer,
  exportPollingAttemptsRef,
  exportPollingTimerRef,
  exportTask,
  onTaskExpired,
  setExportTask,
}: UseBillingRecordsExportPollingParams) => {
  useEffect(() => {
    if (!exportTask?.task_id || exportTask.status !== 'processing') {
      return;
    }

    if (exportPollingAttemptsRef.current >= EXPORT_STATUS_POLL_MAX_ATTEMPTS) {
      clearExportPollingTimer();
      setExportTask(previous =>
        previous ? { ...previous, status: 'failed' } : previous,
      );
      Toast.error(
        tNoOptions(
          'platform_management_records_export_timeout',
          '导出超时，请重新发起导出',
        ),
      );
      return;
    }

    const pollingTimer = window.setTimeout(() => {
      void (async () => {
        try {
          const nextTask = await fetchBillingRecordsExportStatus(
            exportTask.task_id ?? '',
          );

          if (nextTask.status === 'processing') {
            exportPollingAttemptsRef.current += 1;
            setExportTask(nextTask);
            return;
          }

          clearExportPollingTimer();
          setExportTask(nextTask);

          if (
            nextTask.status === 'success' &&
            nextTask.expire_at &&
            nextTask.expire_at <= Date.now()
          ) {
            onTaskExpired();
            Toast.error(getExportExpiredText());
            return;
          }

          if (nextTask.status === 'success') {
            Toast.success(getExportCompletedText());
            return;
          }

          Toast.error(getExportFailedText());
        } catch (error) {
          clearExportPollingTimer();
          setExportTask(previous =>
            previous ? { ...previous, status: 'failed' } : previous,
          );
          Toast.error(resolveBillingRecordsExportRequestErrorText(error));
        }
      })();
    }, EXPORT_STATUS_POLL_INTERVAL_MS);

    exportPollingTimerRef.current = pollingTimer;

    return () => {
      window.clearTimeout(pollingTimer);
    };
  }, [
    clearExportPollingTimer,
    exportPollingAttemptsRef,
    exportPollingTimerRef,
    exportTask,
    onTaskExpired,
    setExportTask,
  ]);
};

const useBillingRecordsExportStatusText = ({
  exportInProgress,
  exportExpired,
  exportTask,
}: {
  exportInProgress: boolean;
  exportExpired: boolean;
  exportTask: BillingRecordsExportStatusData | null;
}) =>
  useMemo<ExportStatusText | null>(() => {
    if (exportInProgress) {
      return {
        className: 'coz-fg-brand',
        text: tNoOptions(
          'platform_management_records_export_processing',
          '导出任务生成中，完成后可直接下载',
        ),
      };
    }

    if (exportExpired) {
      return {
        className: 'coz-fg-hglt-red',
        text: getExportExpiredText(),
      };
    }

    if (exportTask?.status === 'success' && exportTask.download_url) {
      if (!exportTask.expire_at) {
        return {
          className: 'coz-fg-hglt-green',
          text: tNoOptions(
            'platform_management_records_export_ready_without_expire',
            '导出已完成，可下载文件',
          ),
        };
      }

      return {
        className: 'coz-fg-hglt-green',
        text: tNoOptions(
          'platform_management_records_export_ready',
          `导出已完成，文件保留至 ${formatBillingRecordDateTime(
            exportTask.expire_at,
          )}`,
        ),
      };
    }

    if (exportTask?.status === 'failed') {
      return {
        className: 'coz-fg-hglt-red',
        text: tNoOptions(
          'platform_management_records_export_retry',
          '导出失败，请重新发起导出',
        ),
      };
    }

    return null;
  }, [exportExpired, exportInProgress, exportTask]);

const useBillingRecordsExportExpiration = ({
  exportTask,
  onTaskExpired,
}: {
  exportTask: BillingRecordsExportStatusData | null;
  onTaskExpired: () => void;
}) => {
  useEffect(() => {
    if (
      exportTask?.status !== 'success' ||
      !exportTask.download_url ||
      !exportTask.expire_at
    ) {
      return;
    }

    const remainingMs = exportTask.expire_at - Date.now();
    if (remainingMs <= 0) {
      onTaskExpired();
      return;
    }

    const expirationTimer = window.setTimeout(() => {
      onTaskExpired();
    }, remainingMs);

    return () => {
      window.clearTimeout(expirationTimer);
    };
  }, [
    exportTask?.download_url,
    exportTask?.expire_at,
    exportTask?.status,
    onTaskExpired,
  ]);
};

const useBillingRecordsExportActions = ({
  clearExportPollingTimer,
  exportExpired,
  exportPollingAttemptsRef,
  exportTask,
  filters,
  onTaskExpired,
  query,
  resetExportTaskState,
  setExportLoading,
  setExportTask,
}: UseBillingRecordsExportActionsParams) => {
  const handleExport = useCallback(async () => {
    clearExportPollingTimer();
    exportPollingAttemptsRef.current = 0;
    resetExportTaskState();
    setExportLoading(true);

    try {
      const nextTask = await fetchBillingRecordsExportTask(filters, query);
      if (nextTask.status === 'success' && nextTask.task_id) {
        const completedTask = await fetchBillingRecordsExportStatus(
          nextTask.task_id,
        );
        setExportTask(completedTask);
        notifyExportTaskResult({ completedTask, onTaskExpired });
        return;
      }

      setExportTask({
        task_id: nextTask.task_id ?? '',
        status: nextTask.status ?? 'processing',
        download_url: '',
        expire_at: 0,
      });

      if (nextTask.status === 'failed') {
        Toast.error(getExportFailedText());
        return;
      }

      Toast.info(getExportStartedText());
    } catch (error) {
      Toast.error(resolveBillingRecordsExportRequestErrorText(error));
    } finally {
      setExportLoading(false);
    }
  }, [
    clearExportPollingTimer,
    exportPollingAttemptsRef,
    filters,
    onTaskExpired,
    query,
    resetExportTaskState,
    setExportLoading,
    setExportTask,
  ]);

  const handleDownloadExport = useCallback(() => {
    if (!exportTask?.download_url) {
      return;
    }

    if (
      exportExpired ||
      (exportTask.expire_at && exportTask.expire_at <= Date.now())
    ) {
      onTaskExpired();
      Toast.error(getExportExpiredText());
      return;
    }

    window.open(exportTask.download_url, '_blank');
  }, [
    exportExpired,
    exportTask?.download_url,
    exportTask?.expire_at,
    onTaskExpired,
  ]);

  return {
    handleDownloadExport,
    handleExport,
  };
};

export const useBillingRecordsExport = ({
  filters,
  query,
}: UseBillingRecordsExportParams) => {
  const exportPollingTimerRef = useRef<number | null>(null);
  const exportPollingAttemptsRef = useRef(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportExpired, setExportExpired] = useState(false);
  const [exportTask, setExportTask] =
    useState<BillingRecordsExportStatusData | null>(null);

  const exportInProgress = exportLoading || exportTask?.status === 'processing';
  const hasExportFile = Boolean(
    exportTask?.status === 'success' &&
      exportTask.download_url &&
      !exportExpired,
  );

  const clearExportPollingTimer = useCallback(() => {
    if (exportPollingTimerRef.current !== null) {
      window.clearTimeout(exportPollingTimerRef.current);
      exportPollingTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearExportPollingTimer();
    },
    [clearExportPollingTimer],
  );

  const handleTaskExpired = useCallback(() => {
    clearExportPollingTimer();
    setExportExpired(true);
  }, [clearExportPollingTimer]);

  const resetExportTaskState = useCallback(() => {
    setExportExpired(false);
    setExportTask(null);
  }, []);

  useEffect(() => {
    clearExportPollingTimer();
    exportPollingAttemptsRef.current = 0;
    resetExportTaskState();
  }, [
    clearExportPollingTimer,
    filters,
    query.keyword,
    query.orderBy,
    query.orderDirection,
    resetExportTaskState,
  ]);

  useBillingRecordsExportPolling({
    clearExportPollingTimer,
    exportPollingAttemptsRef,
    exportPollingTimerRef,
    exportTask,
    onTaskExpired: handleTaskExpired,
    setExportTask,
  });

  useBillingRecordsExportExpiration({
    exportTask,
    onTaskExpired: handleTaskExpired,
  });

  const { handleDownloadExport, handleExport } = useBillingRecordsExportActions(
    {
      clearExportPollingTimer,
      exportExpired,
      exportPollingAttemptsRef,
      exportTask,
      filters,
      onTaskExpired: handleTaskExpired,
      query,
      resetExportTaskState,
      setExportLoading,
      setExportTask,
    },
  );

  const exportStatusText = useBillingRecordsExportStatusText({
    exportInProgress,
    exportExpired,
    exportTask,
  });

  return {
    exportInProgress,
    exportStatusText,
    hasExportFile,
    onDownloadExport: handleDownloadExport,
    onExport: handleExport,
  };
};
