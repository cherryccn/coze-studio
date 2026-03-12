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

import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('IS_DEV_MODE', false);

vi.mock('react-router-dom', () => ({
  useParams: () => ({}),
}));

vi.mock('@coze-foundation/space-ui-adapter', () => ({
  VerticalSidebarMenuAdapter: () => null,
}));

vi.mock('@coze-foundation/layout', () => ({
  GlobalLayout: () => null,
}));

vi.mock('@coze-foundation/global', () => ({
  useCreateBotAction: () => ({ createBot: vi.fn(), createBotModal: null }),
}));

vi.mock('@coze-foundation/account-ui-adapter', () => ({
  RequireAuthContainer: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@coze-foundation/account-adapter', () => ({
  usePlatformManagementAccess: () => false,
}));

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _options: unknown, fallback?: string) => fallback ?? _key,
  },
}));

vi.mock('@coze-arch/bot-hooks', () => ({
  useRouteConfig: () => ({}),
}));

vi.mock('./hooks/use-has-sider', () => ({
  useHasSider: () => false,
}));

vi.mock('../account-dropdown', () => ({
  AccountDropdown: () => null,
}));

import { buildGlobalLayoutMenus } from './index';

describe('buildGlobalLayoutMenus', () => {
  it('should include platform menu when access is enabled', () => {
    const menus = buildGlobalLayoutMenus({ showPlatformManagement: true });

    expect(menus.map(menu => menu.path)).toContain('/platform');
  });

  it('should omit platform menu when access is disabled', () => {
    const menus = buildGlobalLayoutMenus({ showPlatformManagement: false });

    expect(menus.map(menu => menu.path)).not.toContain('/platform');
  });
});
