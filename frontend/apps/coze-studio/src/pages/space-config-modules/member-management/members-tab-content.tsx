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

import { useMemberManagement } from './use-member-management';
import { MemberRecordsTable } from './member-records-table';
import { MemberFilterBar } from './member-filter-bar';

interface MembersTabContentProps {
  onOpenInviteLinkModal: () => void;
  onAddMember: () => void;
  refreshVersion?: number;
}

export const MembersTabContent = ({
  onOpenInviteLinkModal,
  onAddMember,
  refreshVersion = 0,
}: MembersTabContentProps) => {
  const {
    loading,
    memberRoleFilter,
    setMemberRoleFilter,
    memberSearchKeyword,
    setMemberSearchKeyword,
    memberRecords,
    updatingMemberId,
    removingMemberId,
    handleRoleChange,
    handleRemoveMember,
  } = useMemberManagement(refreshVersion);

  return (
    <div className="flex flex-col gap-[12px] pt-[8px]">
      <MemberFilterBar
        memberRoleFilter={memberRoleFilter}
        onMemberRoleFilterChange={setMemberRoleFilter}
        memberSearchKeyword={memberSearchKeyword}
        onMemberSearchKeywordChange={setMemberSearchKeyword}
        onOpenInviteLinkModal={onOpenInviteLinkModal}
        onAddMember={onAddMember}
      />
      <MemberRecordsTable
        loading={loading}
        memberRecords={memberRecords}
        updatingMemberId={updatingMemberId}
        removingMemberId={removingMemberId}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
};
