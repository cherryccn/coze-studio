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
import { Typography, Button } from '@coze-arch/coze-design';

import type { TopSpacesOrder } from './billing-top-spaces';

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

interface BillingTopSpacesHeaderProps {
  topSpacesCount: number;
  displayLimit: number;
  order: TopSpacesOrder;
  loading: boolean;
  totalAmount: number;
  onToggleOrder: () => void;
  formatCurrency: (val: string | number | undefined) => string;
}

const TrophyIcon: FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 3h8v6a4 4 0 01-8 0V3z"
      stroke="#FF7D00"
      strokeWidth="1.4"
      fill="rgba(255,125,0,0.08)"
    />
    <path
      d="M6 5H4a2 2 0 000 4h2M14 5h2a2 2 0 010 4h-2"
      stroke="#FF7D00"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M8 13h4v1.5a1 1 0 01-1 1H9a1 1 0 01-1-1V13z"
      fill="#FF7D00"
      opacity="0.2"
    />
    <rect
      x="7"
      y="15"
      width="6"
      height="1.5"
      rx="0.5"
      fill="#FF7D00"
      opacity="0.35"
    />
  </svg>
);

const SortIcon: FC<{ direction: TopSpacesOrder }> = ({ direction }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    style={{
      transform: direction === 'asc' ? 'rotate(180deg)' : 'none',
      transition: 'transform 0.2s ease',
    }}
  >
    <path
      d="M8 3v10M4 9l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BillingTopSpacesHeader: FC<BillingTopSpacesHeaderProps> = ({
  topSpacesCount,
  displayLimit,
  order,
  loading,
  totalAmount,
  onToggleOrder,
  formatCurrency,
}) => {
  const orderLabel =
    order === 'desc'
      ? tNoOptions('platform_management_top_spaces_desc', '降序')
      : tNoOptions('platform_management_top_spaces_asc', '升序');

  return (
    <div className="px-[18px] pt-[18px] pb-[12px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <TrophyIcon />
          <Typography.Title heading={5} className="!mb-0">
            {tNoOptions('platform_management_top_spaces', 'Top 空间成本排行')}
          </Typography.Title>
          {topSpacesCount > 0 ? (
            <span
              className="rounded-[10px] px-[7px] py-[1px] text-[11px] font-[500]"
              style={{
                backgroundColor: 'rgba(255,125,0,0.08)',
                color: '#FF7D00',
              }}
            >
              Top {Math.min(topSpacesCount, displayLimit)}
            </span>
          ) : null}
        </div>
        <Button size="small" loading={loading} onClick={onToggleOrder}>
          <span className="flex items-center gap-[4px]">
            <SortIcon direction={order} />
            {orderLabel}
          </span>
        </Button>
      </div>
      <Typography.Text className="text-[12px] coz-fg-secondary mt-[4px] block">
        {tNoOptions(
          'platform_management_top_spaces_subtitle',
          '展示本期费用排名前 10 的空间',
        )}
        {totalAmount > 0
          ? ` · ${tNoOptions('platform_management_top_spaces_total', '合计')} ${formatCurrency(totalAmount)}`
          : ''}
      </Typography.Text>
    </div>
  );
};
