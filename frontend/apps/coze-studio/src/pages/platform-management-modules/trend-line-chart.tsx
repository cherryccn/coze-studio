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

export interface TrendDataPoint {
  label: string;
  value: number;
}

export interface TrendLineChartProps {
  title: string;
  data: TrendDataPoint[];
  valueFormatter: (value: number) => string;
  color?: string;
  height?: number;
  emptyText?: string;
}

const DEFAULT_HEIGHT = 212;
const DEFAULT_COLOR = '#3370FF';
const PANEL_SURFACE_STYLE = {
  backgroundColor: '#FFFFFF',
  borderColor: 'rgba(15, 23, 42, 0.08)',
  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.04)',
};

import { TrendLineChartSvg } from './trend-line-chart-svg';
import {
  formatDateFull,
  abbreviateNumber,
  buildAreaPath,
  buildLinePath,
} from './trend-line-chart-helpers';
import { useTrendLineChart } from './use-trend-line-chart';

export const TrendLineChart: FC<TrendLineChartProps> = ({
  title,
  data,
  valueFormatter,
  color = DEFAULT_COLOR,
  height = DEFAULT_HEIGHT,
  emptyText,
}) => {
  const chartWidth = 500;
  const {
    containerRef,
    hoverIndex,
    tooltipPos,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    plotWidth,
    plotHeight,
    yMax,
    ticks,
    xLabels,
    points,
    gradientId,
    handleMouseMove,
    handleMouseLeave,
  } = useTrendLineChart({ data, color, height, chartWidth });

  const isEmpty = !data.length;
  const latestValue = data[data.length - 1]?.value ?? 0;

  return (
    <div
      className="rounded-[16px] border border-solid px-[18px] py-[16px]"
      style={PANEL_SURFACE_STYLE}
    >
      <div className="flex items-start justify-between gap-[12px]">
        <div className="min-w-0">
          <Typography.Text className="block text-[13px] font-[600]">
            {title}
          </Typography.Text>
          <Typography.Text className="mt-[4px] block text-[12px] coz-fg-secondary">
            {isEmpty
              ? tNoOptions('platform_management_empty_trend', '暂无趋势数据')
              : tNoOptions(
                  'platform_management_trend_latest_value',
                  `最新值 ${valueFormatter(latestValue)}`,
                )}
          </Typography.Text>
        </div>
      </div>
      {isEmpty ? (
        <div
          className="mt-[12px] flex flex-col items-center justify-center gap-[8px]"
          style={{ height }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M4 24L10 16L16 20L22 10L28 14"
              stroke="#C9CDD4"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="16" r="2" fill="#E5E6EB" />
            <circle cx="16" cy="20" r="2" fill="#E5E6EB" />
            <circle cx="22" cy="10" r="2" fill="#E5E6EB" />
          </svg>
          <Typography.Text className="text-[12px] coz-fg-secondary">
            {emptyText ||
              tNoOptions('platform_management_empty_trend', '暂无趋势数据')}
          </Typography.Text>
        </div>
      ) : (
        <div ref={containerRef} className="relative mt-[12px]">
          <TrendLineChartSvg
            chartWidth={chartWidth}
            height={height}
            plotLeft={plotLeft}
            plotRight={plotRight}
            plotTop={plotTop}
            plotBottom={plotBottom}
            plotWidth={plotWidth}
            plotHeight={plotHeight}
            yMax={yMax}
            ticks={ticks}
            xLabels={xLabels}
            points={points}
            data={data}
            color={color}
            gradientId={gradientId}
            hoverIndex={hoverIndex}
            abbreviateNumber={abbreviateNumber}
            buildAreaPath={buildAreaPath}
            buildLinePath={buildLinePath}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {hoverIndex !== null && data[hoverIndex] ? (
            <div
              className="pointer-events-none absolute z-10 rounded-[6px] px-[8px] py-[4px] text-[12px] shadow-md"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: '#fff',
                transform: 'translateY(-100%)',
                whiteSpace: 'nowrap',
              }}
            >
              <div>{formatDateFull(data[hoverIndex].label)}</div>
              <div className="font-[500]">
                {valueFormatter(data[hoverIndex].value)}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
