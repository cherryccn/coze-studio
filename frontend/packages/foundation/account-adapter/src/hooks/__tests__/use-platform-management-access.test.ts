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

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as PlatformAccessModule from '../use-platform-management-access';

let hasPlatformManagementAccess: typeof PlatformAccessModule.hasPlatformManagementAccess;
let usePlatformManagementAccess: typeof PlatformAccessModule.usePlatformManagementAccess;
const mockUseUserInfo = vi.fn();

vi.mock('@coze-foundation/account-base', () => ({
  useUserInfo: () => mockUseUserInfo(),
}));

describe('platform management access helpers', () => {
  beforeAll(async () => {
    vi.stubGlobal('IS_DEV_MODE', false);

    ({
      hasPlatformManagementAccess,
      usePlatformManagementAccess,
    } = await import('../use-platform-management-access'));
  });

  beforeEach(() => {
    mockUseUserInfo.mockReset();
  });

  it('should allow explicit platform management capability', () => {
    expect(
      hasPlatformManagementAccess({
        platformManagementAccess: true,
      }),
    ).toBe(true);
  });

  it('should block when capability is absent', () => {
    expect(
      hasPlatformManagementAccess({
        platformManagementAccess: undefined,
      }),
    ).toBe(false);
  });

  it('should read platform management capability from user info', () => {
    mockUseUserInfo.mockReturnValue({
      platform_management_access: true,
    });

    expect(usePlatformManagementAccess()).toBe(true);
  });
});
