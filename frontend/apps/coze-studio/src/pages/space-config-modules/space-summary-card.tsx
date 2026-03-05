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

import {
  IconCozPeopleFill,
  IconCozTeamFill,
} from '@coze-arch/coze-design/icons';
import { Avatar, Typography } from '@coze-arch/coze-design';

interface SpaceSummaryCardProps {
  iconUrl?: string;
  isPersonalSpace: boolean;
  iconError: boolean;
  onIconError: () => void;
  spaceDisplayName: string;
  roleName: string;
}

export const SpaceSummaryCard = ({
  iconUrl,
  isPersonalSpace,
  iconError,
  onIconError,
  spaceDisplayName,
  roleName,
}: SpaceSummaryCardProps) => {
  const isDefaultIcon =
    Boolean(iconUrl) &&
    (iconUrl?.includes('/default_icon/') ||
      iconUrl?.includes('team_default_icon'));
  const showFallbackIcon = !iconUrl || isDefaultIcon || iconError;
  const FallbackIcon = isPersonalSpace ? IconCozPeopleFill : IconCozTeamFill;
  const fallbackBgClass = isPersonalSpace ? 'bg-blue-500' : 'bg-[#FF6B2C]';

  return (
    <div className="flex items-center gap-[12px] p-[12px] rounded-[12px] border border-solid coz-stroke-primary coz-mg-card mb-[16px] mt-[8px]">
      <div
        className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-white ${fallbackBgClass}`}
      >
        {showFallbackIcon ? (
          <FallbackIcon className="text-[20px]" />
        ) : (
          <Avatar
            className="w-[32px] h-[32px] rounded-full"
            src={iconUrl}
            onError={onIconError}
          />
        )}
      </div>
      <div className="flex flex-col gap-[2px]">
        <Typography.Text className="text-[16px] font-[600] coz-fg-primary">
          {spaceDisplayName}
        </Typography.Text>
        <Typography.Text className="text-[12px] coz-fg-secondary">
          {roleName}
        </Typography.Text>
      </div>
    </div>
  );
};
