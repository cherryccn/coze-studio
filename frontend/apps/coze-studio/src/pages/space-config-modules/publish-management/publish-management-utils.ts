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

const DATE_PAD_LENGTH = 2;
const UNIX_SECONDS_LENGTH = 10;
const UNIX_MILLISECONDS_THRESHOLD = 1_000_000_000_000;
const SECOND_TO_MILLISECOND = 1000;

const isRenderableIconURL = (value?: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    return false;
  }
  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('//') ||
    normalized.startsWith('data:')
  );
};

export const formatDateTime = (raw?: string | number) => {
  if (raw === undefined || raw === null || raw === '') {
    return '--';
  }

  let date: Date | undefined;
  if (typeof raw === 'number') {
    const value =
      raw > UNIX_MILLISECONDS_THRESHOLD ? raw : raw * SECOND_TO_MILLISECOND;
    date = new Date(value);
  } else if (/^\d+$/.test(raw)) {
    const value = Number(raw);
    const timestamp =
      raw.length > UNIX_SECONDS_LENGTH ? value : value * SECOND_TO_MILLISECOND;
    date = new Date(timestamp);
  } else {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      date = new Date(parsed);
    }
  }

  if (!date || Number.isNaN(date.getTime())) {
    return '--';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(DATE_PAD_LENGTH, '0');
  const day = String(date.getDate()).padStart(DATE_PAD_LENGTH, '0');
  const hour = String(date.getHours()).padStart(DATE_PAD_LENGTH, '0');
  const minute = String(date.getMinutes()).padStart(DATE_PAD_LENGTH, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const parseTimestampValue = (raw?: string | number) => {
  if (raw === undefined || raw === null || raw === '') {
    return 0;
  }
  if (typeof raw === 'number') {
    return raw > UNIX_MILLISECONDS_THRESHOLD
      ? raw
      : raw * SECOND_TO_MILLISECOND;
  }
  if (/^\d+$/.test(raw)) {
    const value = Number(raw);
    if (Number.isNaN(value) || value <= 0) {
      return 0;
    }
    return raw.length > UNIX_SECONDS_LENGTH
      ? value
      : value * SECOND_TO_MILLISECOND;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const parseTokenConsumption = (
  ...candidates: Array<string | number | null | undefined>
) => {
  for (const value of candidates) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 0;
};

export const getIconText = (name?: string) => {
  const normalizedName = (name || '').trim();
  if (!normalizedName) {
    return '·';
  }
  return normalizedName.slice(0, 1).toUpperCase();
};

export const resolveWorkflowIconURL = (item: {
  url?: string;
  icon_uri?: string;
}) => {
  const workflowIconURL = item.url?.trim();
  if (workflowIconURL) {
    return workflowIconURL;
  }
  const iconURI = item.icon_uri?.trim();
  return isRenderableIconURL(iconURI) ? iconURI : undefined;
};

export const isSuccessCode = (code?: string | number) => {
  if (code === undefined || code === null || code === '') {
    return true;
  }
  return Number(code) === 0;
};
