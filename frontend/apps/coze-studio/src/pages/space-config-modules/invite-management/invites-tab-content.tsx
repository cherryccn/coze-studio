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

import type { Dispatch, SetStateAction } from 'react';

import type { InviteFilterKey, InviteRecordItem } from './types';
import { InviteRecordsTable } from './invite-records-table';
import { InviteFilterBar } from './invite-filter-bar';

interface InvitesTabContentProps {
  inviteStatusFilter: InviteFilterKey;
  onInviteStatusFilterChange: Dispatch<SetStateAction<InviteFilterKey>>;
  inviteSearchKeyword: string;
  onInviteSearchKeywordChange: Dispatch<SetStateAction<string>>;
  inviteRecords: InviteRecordItem[];
  onRevokeInvite: (inviteUserId: string) => void;
  onOpenInviteLinkModal: () => void;
  onAddMember: () => void;
}

export const InvitesTabContent = ({
  inviteStatusFilter,
  onInviteStatusFilterChange,
  inviteSearchKeyword,
  onInviteSearchKeywordChange,
  inviteRecords,
  onRevokeInvite,
  onOpenInviteLinkModal,
  onAddMember,
}: InvitesTabContentProps) => (
  <div className="flex flex-col gap-[12px] pt-[8px]">
    <InviteFilterBar
      inviteStatusFilter={inviteStatusFilter}
      onInviteStatusFilterChange={onInviteStatusFilterChange}
      inviteSearchKeyword={inviteSearchKeyword}
      onInviteSearchKeywordChange={onInviteSearchKeywordChange}
      onOpenInviteLinkModal={onOpenInviteLinkModal}
      onAddMember={onAddMember}
    />
    <InviteRecordsTable
      inviteRecords={inviteRecords}
      onRevokeInvite={onRevokeInvite}
    />
  </div>
);
