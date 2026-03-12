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

import type { PlatformFilters } from './types';
import {
  DEFAULT_QUERY_STATE,
  EMPTY_BILLING_RECORDS,
  fetchBillingRecords,
  resolveBillingRecordsRequestErrorText,
  type BillingRecordSortDirection,
  type BillingRecordSortField,
  type BillingRecordsQueryState,
  type BillingRecordsResponseData,
} from './billing-records-helpers';

export interface UseBillingRecordsPanelStateResult {
  data: BillingRecordsResponseData;
  errorText: string;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  handleSearch: () => void;
  handleSortDirectionChange: (value: unknown) => void;
  handleSortFieldChange: (value: unknown) => void;
  isEmpty: boolean;
  keywordInput: string;
  load: () => Promise<void>;
  loading: boolean;
  query: BillingRecordsQueryState;
  setKeywordInput: (value: string) => void;
  totalPages: number;
}

interface UseBillingRecordsDataLoaderResult {
  data: BillingRecordsResponseData;
  errorText: string;
  load: () => Promise<void>;
  loading: boolean;
}

const useBillingRecordsDataLoader = ({
  filters,
  query,
  setQuery,
}: {
  filters: PlatformFilters;
  query: BillingRecordsQueryState;
  setQuery: Dispatch<SetStateAction<BillingRecordsQueryState>>;
}): UseBillingRecordsDataLoaderResult => {
  const [data, setData] = useState<BillingRecordsResponseData>(
    EMPTY_BILLING_RECORDS,
  );
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const filtersKey = `${filters.timeRange}:${filters.spaceId}:${filters.projectType}`;
  const previousFiltersKeyRef = useRef(filtersKey);
  const latestLoadRequestIDRef = useRef(0);

  const load = useCallback(async () => {
    latestLoadRequestIDRef.current += 1;
    const requestID = latestLoadRequestIDRef.current;

    setLoading(true);
    setErrorText('');
    try {
      const nextData = await fetchBillingRecords(filters, query);
      if (requestID !== latestLoadRequestIDRef.current) {
        return;
      }

      const nextTotalPages = Math.max(
        1,
        Math.ceil((nextData.total ?? 0) / Math.max(1, query.size)),
      );

      if (
        (nextData.total ?? 0) > 0 &&
        !(nextData.list ?? []).length &&
        query.page > nextTotalPages
      ) {
        setQuery(previous =>
          previous.page === nextTotalPages
            ? previous
            : { ...previous, page: nextTotalPages },
        );
        return;
      }

      setData(nextData);
    } catch (error) {
      if (requestID !== latestLoadRequestIDRef.current) {
        return;
      }

      setErrorText(resolveBillingRecordsRequestErrorText(error));
      setData(EMPTY_BILLING_RECORDS);
    } finally {
      if (requestID === latestLoadRequestIDRef.current) {
        setLoading(false);
      }
    }
  }, [filters, query, setQuery]);

  useEffect(() => {
    const filtersChanged = previousFiltersKeyRef.current !== filtersKey;
    previousFiltersKeyRef.current = filtersKey;

    if (filtersChanged && query.page !== 1) {
      setQuery(previous =>
        previous.page === 1 ? previous : { ...previous, page: 1 },
      );
      return;
    }

    void load();
  }, [filtersKey, load, query.page, setQuery]);

  return {
    data,
    errorText,
    load,
    loading,
  };
};

export const useBillingRecordsPanelState = (
  filters: PlatformFilters,
): UseBillingRecordsPanelStateResult => {
  const [keywordInput, setKeywordInput] = useState('');
  const [query, setQuery] =
    useState<BillingRecordsQueryState>(DEFAULT_QUERY_STATE);
  const { data, errorText, load, loading } = useBillingRecordsDataLoader({
    filters,
    query,
    setQuery,
  });

  const totalPages = Math.max(1, Math.ceil((data.total ?? 0) / query.size));
  const isEmpty = !loading && !errorText && !(data.list ?? []).length;

  const handleSearch = useCallback(() => {
    setQuery(previous => ({
      ...previous,
      keyword: keywordInput.trim(),
      page: 1,
    }));
  }, [keywordInput]);

  const handleSortFieldChange = useCallback((value: unknown) => {
    setQuery(previous => ({
      ...previous,
      orderBy: value as BillingRecordSortField,
      page: 1,
    }));
  }, []);

  const handleSortDirectionChange = useCallback((value: unknown) => {
    setQuery(previous => ({
      ...previous,
      orderDirection: value as BillingRecordSortDirection,
      page: 1,
    }));
  }, []);

  const handlePrevPage = useCallback(() => {
    setQuery(previous => ({
      ...previous,
      page: Math.max(1, previous.page - 1),
    }));
  }, []);

  const handleNextPage = useCallback(() => {
    setQuery(previous => ({
      ...previous,
      page: Math.min(totalPages, previous.page + 1),
    }));
  }, [totalPages]);

  return {
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
  };
};
