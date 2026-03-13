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

const KILO = 1000;
const MEGA = 1000000;

export const formatDateShort = (raw: string): string => {
  const parts = raw.split('-');
  if (parts.length >= 3) {
    return `${parseInt(parts[1], 10)}-${parseInt(parts[2], 10)}`;
  }
  return raw;
};

export const abbreviateNumber = (value: number): string => {
  if (value >= MEGA) {
    return `${(value / MEGA).toFixed(1)}M`;
  }
  if (value >= KILO * 10) {
    return `${(value / KILO).toFixed(0)}K`;
  }
  if (value >= KILO) {
    return `${(value / KILO).toFixed(1)}K`;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

export const computeNiceTicks = (maxValue: number, count: number): number[] => {
  if (maxValue <= 0) {
    return Array.from({ length: count }, (_, i) => i);
  }

  const rawStep = maxValue / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let niceStep: number;
  if (normalized <= 1) {
    niceStep = magnitude;
  } else if (normalized <= 2) {
    niceStep = 2 * magnitude;
  } else if (normalized <= 5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }

  return Array.from({ length: count }, (_, i) => i * niceStep);
};

export const buildLinePath = (
  points: Array<{ x: number; y: number }>,
): string => {
  if (!points.length) {
    return '';
  }
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
};

export const buildAreaPath = (
  points: Array<{ x: number; y: number }>,
  baseY: number,
): string => {
  if (!points.length) {
    return '';
  }
  const line = buildLinePath(points);
  return `${line} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z`;
};
