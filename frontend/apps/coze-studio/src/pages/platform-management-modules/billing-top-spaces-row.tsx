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

import { Typography } from '@coze-arch/coze-design';

import type { BillingTopSpaceItem } from './billing-top-spaces';

const RANK_BADGE_COLORS = ['#FF7D00', '#A8B0BC', '#B58B67'];

const RankBadge: FC<{ rank: number }> = ({ rank }) => {
  const isTop3 = rank <= RANK_BADGE_COLORS.length;
  const bgColor = isTop3 ? RANK_BADGE_COLORS[rank - 1] : 'rgba(31,35,41,0.06)';
  const textColor = isTop3 ? '#fff' : '#86909C';

  return (
    <div
      className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[11px] font-[600] flex-shrink-0"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {rank}
    </div>
  );
};

const PROGRESS_BAR_COLORS = [
  { from: 'rgba(255,125,0,0.18)', to: 'rgba(255,125,0,0.04)' },
  { from: 'rgba(168,176,188,0.16)', to: 'rgba(168,176,188,0.05)' },
  { from: 'rgba(181,139,103,0.16)', to: 'rgba(181,139,103,0.05)' },
];
const PROGRESS_BAR_DEFAULT = {
  from: 'rgba(51,112,255,0.10)',
  to: 'rgba(51,112,255,0.03)',
};

const MIN_PROGRESS_PERCENT = 3;
const FULL_PERCENT = 100;

interface BillingTopSpacesRowProps {
  item: BillingTopSpaceItem;
  index: number;
  totalLength: number;
  maxAmount: number;
  totalAmount: number;
  displayLimit: number;
  rankingFallbackIndexStart: number;
  formatCurrency: (val: string | number | undefined) => string;
  formatNumber: (val: string | number | undefined) => string;
  toFiniteNumber: (val: string | number | undefined) => number;
}

export const BillingTopSpacesRow: FC<BillingTopSpacesRowProps> = ({
  item,
  index,
  totalLength,
  maxAmount,
  totalAmount,
  displayLimit,
  rankingFallbackIndexStart,
  formatCurrency,
  formatNumber,
  toFiniteNumber,
}) => {
  const amount = toFiniteNumber(item.amount);
  const ratio = maxAmount > 0 ? amount / maxAmount : 0;
  const percent =
    totalAmount > 0
      ? ((amount / totalAmount) * FULL_PERCENT).toFixed(1)
      : '0.0';
  const barColor =
    index < PROGRESS_BAR_COLORS.length
      ? PROGRESS_BAR_COLORS[index]
      : PROGRESS_BAR_DEFAULT;

  return (
    <div
      key={`${item.space_id ?? index + rankingFallbackIndexStart}`}
      className="top-spaces-row relative rounded-[8px] cursor-default bg-white border border-transparent hover:border-gray-100"
    >
      <div
        className="absolute left-0 top-0 bottom-0 rounded-[8px]"
        style={{
          width: `${Math.max(MIN_PROGRESS_PERCENT, ratio * FULL_PERCENT)}%`,
          background: `linear-gradient(90deg, ${barColor.from}, ${barColor.to})`,
          transition: 'width 0.4s ease',
        }}
      />
      <div className="relative grid grid-cols-[48px,1fr,100px,120px,100px] items-center gap-[8px] py-[10px] px-[8px]">
        <RankBadge rank={index + rankingFallbackIndexStart} />
        <div className="flex items-center gap-[6px] min-w-0">
          <Typography.Text className="text-[13px] text-gray-800 truncate font-medium">
            {item.space_name || String(item.space_id || '--')}
          </Typography.Text>
        </div>
        <Typography.Text className="text-[12px] text-right text-gray-500 tabular-nums">
          {percent}%
        </Typography.Text>
        <Typography.Text className="text-[13px] text-right font-[600] text-gray-900 tabular-nums">
          {formatCurrency(item.amount)}
        </Typography.Text>
        <Typography.Text className="text-[12px] text-right text-gray-500 tabular-nums">
          {formatNumber(item.tokens)}
        </Typography.Text>
      </div>
    </div>
  );
};
