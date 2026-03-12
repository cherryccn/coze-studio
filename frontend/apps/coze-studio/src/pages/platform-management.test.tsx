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

/* eslint-disable @typescript-eslint/naming-convention -- module mocks must preserve real export names. */

import React from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

const mockUsePlatformManagementAccess = vi.fn();

vi.mock('@coze-foundation/account-adapter', () => ({
  usePlatformManagementAccess: () => mockUsePlatformManagementAccess(),
}));

vi.mock('@coze-foundation/space-store-adapter', () => ({
  useSpaceStore: (selector: (state: { spaceList: [] }) => unknown) =>
    selector({ spaceList: [] }),
}));

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _options: unknown, fallback?: string) => fallback ?? _key,
  },
}));

vi.mock('@coze-arch/coze-design', () => {
  const Tabs = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  const TabPane = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  const Typography = {
    Title: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <h1 className={className}>{children}</h1>,
    Text: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <p className={className}>{children}</p>,
  };

  return {
    Button: ({ children }: { children: React.ReactNode }) => (
      <button type="button">{children}</button>
    ),
    Select: () => <div />,
    Tabs: Object.assign(Tabs, { TabPane }),
    Typography,
  };
});

vi.mock('./platform-management-modules/stats-panel', () => ({
  StatsPanel: () => <div>stats-panel</div>,
}));

vi.mock('./platform-management-modules/billing-overview-panel', () => ({
  BillingOverviewPanel: () => <div>billing-overview-panel</div>,
}));

vi.mock('./platform-management-modules/billing-records-panel', () => ({
  BillingRecordsPanel: () => <div>billing-records-panel</div>,
}));

vi.mock('./platform-management-modules/billing-budgets-panel', () => ({
  BillingBudgetsPanel: () => <div>billing-budgets-panel</div>,
}));

import PlatformManagementPage from './platform-management';

describe('PlatformManagementPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mockUsePlatformManagementAccess.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should render no-permission state when access is denied', () => {
    mockUsePlatformManagementAccess.mockReturnValue(false);

    act(() => {
      root.render(<PlatformManagementPage />);
    });

    expect(container.textContent).toContain('暂无权限查看平台管理内容');
  });

  it('should render platform panels when access is granted', () => {
    mockUsePlatformManagementAccess.mockReturnValue(true);

    act(() => {
      root.render(<PlatformManagementPage />);
    });

    expect(container.textContent).toContain('billing-overview-panel');
    expect(container.textContent).toContain('billing-records-panel');
    expect(container.textContent).toContain('billing-budgets-panel');
    expect(container.textContent).not.toContain('暂无权限查看平台管理内容');
  });
});
