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
import { Typography } from '@coze-arch/coze-design';

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

export type TopSpacesOrder = 'asc' | 'desc';

export interface BillingTopSpaceItem {
  space_id?: number | string;
  space_name?: string;
  amount?: string;
  tokens?: number;
}

interface BillingTopSpacesSectionProps {
  topSpaces: BillingTopSpaceItem[];
  order: TopSpacesOrder;
  loading: boolean;
  onToggleOrder: () => void;
  formatCurrency: (val: string | number | undefined) => string;
  formatNumber: (val: string | number | undefined) => string;
  toFiniteNumber: (val: string | number | undefined) => number;
}

import { BillingTopSpacesRow } from './billing-top-spaces-row';

const DISPLAY_LIMIT = 10;
const RANKING_FALLBACK_INDEX_START = 1;

const topSpacesRowHoverStyle = `
.top-spaces-row { transition: background-color 0.15s ease, transform 0.15s ease; }
.top-spaces-row:hover { background-color: rgba(51, 112, 255, 0.03); transform: translateX(2px); }
`;

import { BillingTopSpacesHeader } from './billing-top-spaces-header';

export const BillingTopSpacesSection: FC<BillingTopSpacesSectionProps> = ({
  topSpaces,
  order,
  loading,
  onToggleOrder,
  formatCurrency,
  formatNumber,
  toFiniteNumber,
}) => {
  const maxAmount = Math.max(
    0,
    ...topSpaces.map(s => toFiniteNumber(s.amount)),
  );

  const totalAmount = topSpaces.reduce(
    (acc, s) => acc + toFiniteNumber(s.amount),
    0,
  );

  return (
    <div className="overflow-hidden bg-white h-full flex flex-col">
      <style>{topSpacesRowHoverStyle}</style>
      <BillingTopSpacesHeader
        topSpacesCount={topSpaces.length}
        displayLimit={DISPLAY_LIMIT}
        order={order}
        loading={loading}
        totalAmount={totalAmount}
        onToggleOrder={onToggleOrder}
        formatCurrency={formatCurrency}
      />

      <div className="grid grid-cols-[48px,1fr,100px,120px,100px] items-center gap-[8px] px-[18px] py-[10px] bg-gray-50 border-y border-gray-100">
        <Typography.Text className="text-[12px] text-gray-500 font-medium">
          {tNoOptions('platform_management_top_spaces_rank', '排名')}
        </Typography.Text>
        <Typography.Text className="text-[12px] text-gray-500 font-medium">
          {tNoOptions('platform_management_top_spaces_name', '空间')}
        </Typography.Text>
        <Typography.Text className="text-[12px] text-gray-500 font-medium text-right">
          {tNoOptions('platform_management_top_spaces_percent', '占比')}
        </Typography.Text>
        <Typography.Text className="text-[12px] text-gray-500 font-medium text-right">
          {tNoOptions('platform_management_top_spaces_amount', '费用')}
        </Typography.Text>
        <Typography.Text className="text-[12px] text-gray-500 font-medium text-right">
          Token
        </Typography.Text>
      </div>

      <div className="px-[18px] pb-[18px] pt-2 flex-1">
        {topSpaces.length ? (
          <div className="flex flex-col gap-1">
            {topSpaces.slice(0, DISPLAY_LIMIT).map((item, index) => (
              <BillingTopSpacesRow
                key={`${item.space_id ?? index + RANKING_FALLBACK_INDEX_START}`}
                item={item}
                index={index}
                totalLength={topSpaces.length}
                maxAmount={maxAmount}
                totalAmount={totalAmount}
                displayLimit={DISPLAY_LIMIT}
                rankingFallbackIndexStart={RANKING_FALLBACK_INDEX_START}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                toFiniteNumber={toFiniteNumber}
              />
            ))}
          </div>
        ) : (
          <div className="py-[24px] text-center flex flex-col items-center gap-[8px] justify-center h-full">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="8"
                y="12"
                width="24"
                height="18"
                rx="2"
                stroke="#C9CDD4"
                strokeWidth="1.2"
              />
              <path d="M8 16h24" stroke="#C9CDD4" strokeWidth="1.2" />
              <rect
                x="12"
                y="20"
                width="16"
                height="1.5"
                rx="0.75"
                fill="#E5E6EB"
              />
              <rect
                x="12"
                y="24"
                width="10"
                height="1.5"
                rx="0.75"
                fill="#E5E6EB"
              />
            </svg>
            <Typography.Text className="text-[13px] text-gray-400">
              {tNoOptions(
                'platform_management_empty_top_spaces',
                '暂无排行数据',
              )}
            </Typography.Text>
          </div>
        )}
      </div>
    </div>
  );
};
