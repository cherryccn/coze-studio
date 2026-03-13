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

interface TrendLineChartSvgProps {
  chartWidth: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  plotHeight: number;
  yMax: number;
  ticks: number[];
  xLabels: Array<{ x: number; text: string }>;
  points: Array<{ x: number; y: number }>;
  color: string;
  gradientId: string;
  hoverIndex: number | null;
  tickFormatter: (value: number) => string;
  abbreviateNumber: (value: number) => string;
  buildAreaPath: (
    points: Array<{ x: number; y: number }>,
    baseY: number,
  ) => string;
  buildLinePath: (points: Array<{ x: number; y: number }>) => string;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseLeave: () => void;
}

export const TrendLineChartSvg: FC<TrendLineChartSvgProps> = ({
  chartWidth,
  height,
  plotLeft,
  plotRight,
  plotTop,
  plotBottom,
  plotHeight,
  yMax,
  ticks,
  xLabels,
  points,
  color,
  gradientId,
  hoverIndex,
  tickFormatter,
  abbreviateNumber,
  buildAreaPath,
  buildLinePath,
  onMouseMove,
  onMouseLeave,
}) => (
  <svg
    viewBox={`0 0 ${chartWidth} ${height}`}
    width="100%"
    height="100%"
    onMouseMove={onMouseMove}
    onMouseLeave={onMouseLeave}
    className="block w-full h-full"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.18} />
        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
      </linearGradient>
    </defs>

    {ticks.map(tick => {
      const y = plotBottom - (tick / yMax) * plotHeight;
      return (
        <g key={tick}>
          <line
            x1={plotLeft}
            y1={y}
            x2={plotRight}
            y2={y}
            stroke="rgba(148, 163, 184, 0.26)"
            strokeWidth={0.5}
          />
          <text
            x={plotLeft - 6}
            y={y + 3}
            textAnchor="end"
            fontSize={9}
            fill="#86909C"
          >
            {tickFormatter(tick)}
          </text>
        </g>
      );
    })}

    {xLabels.map((label, i) => (
      <text
        key={`${label.text}-${i}`}
        x={label.x}
        y={plotBottom + 12}
        textAnchor="middle"
        fontSize={9}
        fill="#86909C"
      >
        {label.text}
      </text>
    ))}

    <path d={buildAreaPath(points, plotBottom)} fill={`url(#${gradientId})`} />
    <path
      d={buildLinePath(points)}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
    />

    {points.map((p, i) => (
      <circle
        key={i}
        cx={p.x}
        cy={p.y}
        r={hoverIndex === i ? 2.5 : 1.5}
        fill={hoverIndex === i ? color : '#fff'}
        stroke={color}
        strokeWidth={1}
        style={{ transition: 'r 0.15s ease, fill 0.15s ease' }}
      />
    ))}

    {hoverIndex !== null && points[hoverIndex] ? (
      <line
        x1={points[hoverIndex].x}
        y1={plotTop}
        x2={points[hoverIndex].x}
        y2={plotBottom}
        stroke={color}
        strokeWidth={0.5}
        strokeDasharray="3,3"
        opacity={0.5}
      />
    ) : null}
  </svg>
);
