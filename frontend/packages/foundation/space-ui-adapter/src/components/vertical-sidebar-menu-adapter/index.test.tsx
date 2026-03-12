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

import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('IS_DEV_MODE', false);

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(() => ({ pathname: '/' })),
}));

vi.mock('@coze-foundation/space-ui-base', () => ({
  VerticalSidebarMenu: () => null,
}));

vi.mock('@coze-foundation/account-ui-adapter', () => ({
  useLogout: () => ({ node: null, open: vi.fn() }),
  usePlatformManagementAccess: () => false,
}));

vi.mock('@coze-foundation/space-store', () => ({
  useSpaceStore: vi.fn(),
}));

vi.mock('@coze-arch/i18n', () => ({
  I18n: {
    t: (_key: string, _options: unknown, fallback?: string) => fallback ?? _key,
  },
}));

vi.mock('../../hooks/use-create-space', () => ({
  useCreateSpace: () => ({ node: null, open: vi.fn() }),
}));

import { buildMenuGroups } from './index';

describe('buildMenuGroups', () => {
  const menuLabels = {
    home: 'home',
    develop: 'develop',
    library: 'library',
    config: 'config',
    platform: 'platform',
    template: 'template',
    plugin: 'plugin',
  };

  it('should include platform menu when access is enabled', () => {
    const groups = buildMenuGroups({
      menuLabels,
      navigate: vi.fn(),
      spaceId: 'space-1',
      showPlatformManagement: true,
    });

    expect(groups[0]?.items.map(item => item.key)).toContain('platform');
  });

  it('should omit platform menu when access is disabled', () => {
    const groups = buildMenuGroups({
      menuLabels,
      navigate: vi.fn(),
      spaceId: 'space-1',
      showPlatformManagement: false,
    });

    expect(groups[0]?.items.map(item => item.key)).not.toContain('platform');
  });
});
