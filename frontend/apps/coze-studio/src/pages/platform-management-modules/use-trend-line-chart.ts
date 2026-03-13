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

import { useState, useMemo, useCallback, useRef } from 'react';

import { computeNiceTicks, formatDateShort } from './trend-line-chart-helpers';
import type { TrendDataPoint } from './trend-line-chart';

const CHART_PADDING = { top: 18, right: 16, bottom: 34, left: 48 };
const GRID_LINE_COUNT = 5;
const TOOLTIP_OFFSET_X = 12;
const TOOLTIP_OFFSET_Y = -8;

interface UseTrendLineChartProps {
  data: TrendDataPoint[];
  color: string;
  height: number;
  chartWidth?: number;
}

export const useTrendLineChart = ({
  data,
  color,
  height,
  chartWidth = 500,
}: UseTrendLineChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const plotLeft = CHART_PADDING.left;
  const plotRight = chartWidth - CHART_PADDING.right;
  const plotTop = CHART_PADDING.top;
  const plotBottom = height - CHART_PADDING.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const maxValue = useMemo(
    () => Math.max(0, ...data.map(d => d.value)),
    [data],
  );

  const ticks = useMemo(
    () => computeNiceTicks(maxValue, GRID_LINE_COUNT),
    [maxValue],
  );

  const yMax = ticks[ticks.length - 1] || 1;

  const points = useMemo(() => {
    if (data.length < 2) {
      return data.map(() => ({
        x: plotLeft + plotWidth / 2,
        y: plotBottom - ((data[0]?.value ?? 0) / yMax) * plotHeight,
      }));
    }
    return data.map((d, i) => ({
      x: plotLeft + (i / (data.length - 1)) * plotWidth,
      y: plotBottom - (d.value / yMax) * plotHeight,
    }));
  }, [data, plotLeft, plotWidth, plotBottom, plotHeight, yMax]);

  const xLabels = useMemo(() => {
    if (!data.length) {
      return [];
    }
    const maxLabels = 7;
    const step = Math.max(1, Math.ceil(data.length / maxLabels));
    const labels: Array<{ x: number; text: string }> = [];
    for (let i = 0; i < data.length; i += step) {
      labels.push({
        x: points[i]?.x ?? 0,
        text: formatDateShort(data[i]?.label || ''),
      });
    }
    if (data.length > 1) {
      const lastIdx = data.length - 1;
      const lastLabel = {
        x: points[lastIdx]?.x ?? 0,
        text: formatDateShort(data[lastIdx]?.label || ''),
      };
      if (!labels.some(l => l.text === lastLabel.text)) {
        labels.push(lastLabel);
      }
    }
    return labels;
  }, [data, points]);

  const gradientId = useMemo(
    () => `trend-grad-${color.replace('#', '')}`,
    [color],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!data.length || !containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const svgWidth = rect.width;
      const scaleX = svgWidth / chartWidth;
      const mouseX = (e.clientX - rect.left) / scaleX;

      let closestIdx = 0;
      let closestDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - mouseX);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      setHoverIndex(closestIdx);
      setTooltipPos({
        x: e.clientX - rect.left + TOOLTIP_OFFSET_X,
        y: e.clientY - rect.top + TOOLTIP_OFFSET_Y,
      });
    },
    [data, points, chartWidth],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  return {
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
  };
};
