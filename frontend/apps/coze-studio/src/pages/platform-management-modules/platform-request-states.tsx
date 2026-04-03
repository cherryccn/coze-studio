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

import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import { Button, Typography } from '@coze-arch/coze-design';

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

interface PlatformLoadingStateProps {
  text?: string;
}

interface PlatformErrorStateProps {
  errorText: string;
  onRetry: () => void;
}

interface PlatformEmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const shimmerStyle = `
@keyframes platform-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

const STATE_SURFACE_STYLE = {
  backgroundColor: '#FFFFFF',
  borderColor: 'rgba(15, 23, 42, 0.08)',
  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.04)',
};

const ShimmerBar: FC<{ width: string; className?: string }> = ({
  width,
  className = '',
}) => (
  <div
    className={`h-[12px] rounded-[4px] ${className}`}
    style={{
      width,
      background:
        'linear-gradient(90deg, rgba(31,35,41,0.06) 25%, rgba(31,35,41,0.12) 50%, rgba(31,35,41,0.06) 75%)',
      backgroundSize: '800px 100%',
      animation: 'platform-shimmer 1.6s ease-in-out infinite',
    }}
  />
);

export const PlatformLoadingState: FC<PlatformLoadingStateProps> = ({
  text,
}) => (
  <div
    className="rounded-[12px] border border-solid px-5 py-4"
    style={STATE_SURFACE_STYLE}
  >
    <style>{shimmerStyle}</style>
    <Typography.Text className="text-[12px] coz-fg-secondary mb-[10px] block">
      {text || tNoOptions('platform_management_loading', '数据加载中...')}
    </Typography.Text>
    <div className="flex flex-col gap-[10px]">
      <div className="flex gap-[12px]">
        <ShimmerBar width="30%" />
        <ShimmerBar width="20%" />
        <ShimmerBar width="25%" />
      </div>
      <div className="flex gap-[12px]">
        <ShimmerBar width="40%" />
        <ShimmerBar width="15%" />
      </div>
      <div className="flex gap-[12px]">
        <ShimmerBar width="20%" />
        <ShimmerBar width="35%" />
        <ShimmerBar width="10%" />
      </div>
    </div>
  </div>
);

export const PlatformErrorState: FC<PlatformErrorStateProps> = ({
  errorText,
  onRetry,
}) => (
  <div
    className="rounded-[12px] border border-solid px-5 py-4 flex items-center gap-[12px]"
    style={{
      ...STATE_SURFACE_STYLE,
      backgroundColor: '#FFF8F7',
      borderColor: 'rgba(245, 63, 63, 0.14)',
    }}
  >
    <div
      className="flex-shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center"
      style={{ backgroundColor: 'rgba(245,63,63,0.08)' }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 2C4.686 2 2 4.686 2 8s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 9a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3a.75.75 0 01-1.5 0V5.5a.75.75 0 011.5 0V8z"
          fill="#F53F3F"
        />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <Typography.Text className="coz-fg-hglt-red text-[13px]">
        {errorText}
      </Typography.Text>
    </div>
    <Button size="small" onClick={onRetry} className="flex-shrink-0">
      {tNoOptions('platform_management_retry', '重试')}
    </Button>
  </div>
);

const EmptyIcon: FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="8"
      y="12"
      width="32"
      height="24"
      rx="3"
      stroke="#C9CDD4"
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M8 18h32" stroke="#C9CDD4" strokeWidth="1.5" />
    <circle cx="13" cy="15" r="1" fill="#C9CDD4" />
    <circle cx="17" cy="15" r="1" fill="#C9CDD4" />
    <circle cx="21" cy="15" r="1" fill="#C9CDD4" />
    <rect x="14" y="23" width="20" height="2" rx="1" fill="#E5E6EB" />
    <rect x="14" y="28" width="14" height="2" rx="1" fill="#E5E6EB" />
  </svg>
);

export const PlatformEmptyState: FC<PlatformEmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => (
  <div
    className="rounded-[12px] border border-dashed px-5 py-8 text-center flex flex-col items-center"
    style={{
      backgroundColor: '#FBFCFD',
      borderColor: 'rgba(148, 163, 184, 0.22)',
    }}
  >
    <EmptyIcon />
    <Typography.Text className="mt-[10px] block text-[13px] font-[500]">
      {title || tNoOptions('platform_management_empty_title', '暂无数据')}
    </Typography.Text>
    <Typography.Text className="mt-[4px] block text-[12px] coz-fg-secondary leading-[18px]">
      {description ||
        tNoOptions(
          'platform_management_empty_description',
          '当前筛选条件下暂无可展示内容，可尝试调整或重置筛选条件。',
        )}
    </Typography.Text>
    {onAction ? (
      <div className="mt-[14px]">
        <Button size="small" onClick={onAction}>
          {actionText ||
            tNoOptions('platform_management_reset_filters', '重置筛选')}
        </Button>
      </div>
    ) : null}
  </div>
);
