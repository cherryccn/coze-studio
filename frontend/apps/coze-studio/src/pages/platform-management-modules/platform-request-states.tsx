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

export const PlatformLoadingState: FC<PlatformLoadingStateProps> = ({
  text,
}) => (
  <div className="rounded-[10px] coz-bg-plus px-[12px] py-[10px]">
    <Typography.Text className="text-[12px] coz-fg-secondary">
      {text || tNoOptions('platform_management_loading', '数据加载中...')}
    </Typography.Text>
  </div>
);

export const PlatformErrorState: FC<PlatformErrorStateProps> = ({
  errorText,
  onRetry,
}) => (
  <div className="rounded-[10px] border border-solid coz-stroke-primary px-[12px] py-[12px]">
    <Typography.Text className="coz-fg-hglt-red">{errorText}</Typography.Text>
    <div className="mt-[8px]">
      <Button size="small" onClick={onRetry}>
        {tNoOptions('platform_management_retry', '重试')}
      </Button>
    </div>
  </div>
);

export const PlatformEmptyState: FC<PlatformEmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => (
  <div className="rounded-[10px] border border-dashed coz-stroke-primary px-[12px] py-[20px] text-center">
    <Typography.Text className="block text-[14px] font-[500]">
      {title || tNoOptions('platform_management_empty_title', '暂无数据')}
    </Typography.Text>
    <Typography.Text className="mt-[6px] block text-[12px] coz-fg-secondary">
      {description ||
        tNoOptions(
          'platform_management_empty_description',
          '当前筛选条件下暂无可展示内容，可尝试调整或重置筛选条件。',
        )}
    </Typography.Text>
    {onAction ? (
      <div className="mt-[12px]">
        <Button
          theme="light"
          onClick={onAction}
          className="px-[16px] border border-solid coz-stroke-primary"
          style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
        >
          {actionText ||
            tNoOptions('platform_management_reset_filters', '重置筛选')}
        </Button>
      </div>
    ) : null}
  </div>
);
