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

import React from 'react';

import { I18n } from '@coze-arch/i18n';
import { Card, Tabs, Button } from '@coze-arch/coze-design';
import { IconCozPlus } from '@coze-arch/coze-design/icons';

import type { ClassMember } from '../../types';
import { MembersTable } from './members-table';
import { InviteCodesTable } from './invite-codes-table';

const { TabPane } = Tabs;

interface ClassMember {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  role: string;
  joinedAt: string;
}

interface InviteCode {
  id: string;
  code: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

interface ClassDetailTabsProps {
  members: ClassMember[];
  loadingMembers: boolean;
  onRemoveMember: (userId: string) => Promise<void>;
  inviteCodes: InviteCode[];
  loadingCodes: boolean;
  creatingCode: boolean;
  onCreateCode: () => Promise<void>;
  onCopyCode: (code: string) => void;
}

export const ClassDetailTabs: React.FC<ClassDetailTabsProps> = ({
  members,
  loadingMembers,
  onRemoveMember,
  inviteCodes,
  loadingCodes,
  creatingCode,
  onCreateCode,
  onCopyCode,
}) => (
  <Card bordered className="mt-[16px]">
    <Tabs defaultActiveKey="members">
      <TabPane
        tab={`${I18n.t('edu_members', {}, 'Members')} (${members.length})`}
        itemKey="members"
      >
        <div className="mt-[16px]">
          <MembersTable
            members={members}
            loading={loadingMembers}
            onRemoveMember={onRemoveMember}
          />
        </div>
      </TabPane>
      <TabPane
        tab={`${I18n.t('edu_invite_codes', {}, 'Invite Codes')} (${inviteCodes.length})`}
        itemKey="codes"
      >
        <div className="mt-[16px]">
          <div className="mb-[16px] flex justify-end">
            <Button
              theme="solid"
              type="primary"
              icon={<IconCozPlus />}
              onClick={onCreateCode}
              loading={creatingCode}
              data-testid="edu-teacher.class-detail.create-invite-code"
            >
              {I18n.t('edu_create_invite_code', {}, 'Create Invite Code')}
            </Button>
          </div>
          <InviteCodesTable
            inviteCodes={inviteCodes}
            loading={loadingCodes}
            onCopyCode={onCopyCode}
          />
        </div>
      </TabPane>
    </Tabs>
  </Card>
);
