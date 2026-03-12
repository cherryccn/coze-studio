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

import { type PropsWithChildren } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

function MockButton({
  children,
  onClick,
}: PropsWithChildren<{ onClick?: () => void }>) {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function MockText({ children }: PropsWithChildren) {
  return <span>{children}</span>;
}

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _params: Record<string, unknown>, fallback: string) =>
      fallback,
  },
}));

vi.mock('@coze-arch/coze-design', () => ({
  Button: MockButton,
  Typography: {
    Text: MockText,
  },
}));

import {
  PlatformEmptyState,
  PlatformErrorState,
  PlatformLoadingState,
} from './platform-request-states';

describe('platform-request-states', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('renders loading state with default and custom text', () => {
    act(() => {
      root.render(<PlatformLoadingState />);
    });

    expect(container.textContent).toContain('数据加载中...');

    act(() => {
      root.render(<PlatformLoadingState text="自定义加载文案" />);
    });

    expect(container.textContent).toContain('自定义加载文案');
  });

  it('renders error state and triggers retry handler', () => {
    const onRetry = vi.fn();

    act(() => {
      root.render(
        <PlatformErrorState errorText="请求失败，请重试" onRetry={onRetry} />,
      );
    });

    expect(container.textContent).toContain('请求失败，请重试');

    const button = container.querySelector('button');
    expect(button?.textContent).toBe('重试');

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state and triggers reset action when action is provided', () => {
    const onAction = vi.fn();

    act(() => {
      root.render(<PlatformEmptyState onAction={onAction} />);
    });

    expect(container.textContent).toContain('暂无数据');
    expect(container.textContent).toContain(
      '当前筛选条件下暂无可展示内容，可尝试调整或重置筛选条件。',
    );

    const button = container.querySelector('button');
    expect(button?.textContent).toBe('重置筛选');

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders custom empty state without action button', () => {
    act(() => {
      root.render(
        <PlatformEmptyState
          title="暂无排行数据"
          description="当前维度下没有可展示项目。"
        />,
      );
    });

    expect(container.textContent).toContain('暂无排行数据');
    expect(container.textContent).toContain('当前维度下没有可展示项目。');
    expect(container.querySelector('button')).toBeNull();
  });
});
