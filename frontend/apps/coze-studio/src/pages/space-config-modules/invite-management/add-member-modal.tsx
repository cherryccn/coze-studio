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

import { I18n } from '@coze-arch/i18n';
import {
  IconCozEmpty,
  IconCozMagnifier,
  IconCozPeopleFill,
} from '@coze-arch/coze-design/icons';
import { Avatar, Input, Modal, Typography } from '@coze-arch/coze-design';

import type { AddMemberCandidateItem } from './types';

import styles from './add-member-modal.module.less';

interface AddMemberModalProps {
  visible: boolean;
  searchKeyword: string;
  searching: boolean;
  confirming: boolean;
  candidateUsers: AddMemberCandidateItem[];
  selectedUsers: AddMemberCandidateItem[];
  maxSelectableCount: number;
  onSearchKeywordChange: (value: string) => void;
  onToggleUser: (user: AddMemberCandidateItem) => void;
  onRemoveSelectedUser: (userId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const MemberStatusTag = ({
  text,
  tone,
}: {
  text: string;
  tone: 'joined' | 'inviting';
}) => (
  <span
    className={`${styles['status-tag']} ${
      tone === 'joined'
        ? styles['status-tag-joined']
        : styles['status-tag-inviting']
    }`}
  >
    {text}
  </span>
);

const SelectIndicator = ({ selected }: { selected: boolean }) => (
  <span
    className={`${styles.indicator} ${
      selected ? styles['indicator-selected'] : ''
    }`}
  >
    {selected ? <span className={styles['indicator-dot']} /> : null}
  </span>
);

const AddMemberSearchEmpty = () => (
  <div className={styles['empty-wrap']}>
    <IconCozEmpty className={styles['empty-image']} />
    <Typography.Text className={styles['empty-text']}>
      {I18n.t('team_add_member_empty_desc', {}, '搜索用户名以添加新成员')}
    </Typography.Text>
  </div>
);

const AddMemberSearchLoading = () => (
  <div className="h-full flex items-center justify-center">
    <Typography.Text className="text-[13px] coz-fg-secondary">
      {I18n.t('space_config_member_search_loading', {}, '搜索中...')}
    </Typography.Text>
  </div>
);

const AddMemberSearchNoResult = () => (
  <div className="h-full flex items-center justify-center">
    <Typography.Text className={styles['empty-text']}>
      {I18n.t('space_config_member_search_empty', {}, '未搜索到可添加的成员')}
    </Typography.Text>
  </div>
);

const CandidateUserList = ({
  candidateUsers,
  selectedUserMap,
  onToggleUser,
}: {
  candidateUsers: AddMemberCandidateItem[];
  selectedUserMap: Set<string>;
  onToggleUser: (user: AddMemberCandidateItem) => void;
}) => (
  <div className={styles.list}>
    {candidateUsers.map(user => {
      const selected = selectedUserMap.has(user.id);
      const disabled = user.isJoined || user.isInviting;
      return (
        <button
          key={user.id}
          type="button"
          disabled={disabled}
          onClick={() => onToggleUser(user)}
          className={`${styles['candidate-item']} ${
            selected ? styles['candidate-item-selected'] : ''
          } ${disabled ? styles['candidate-item-disabled'] : ''}`}
        >
          <div className={styles['candidate-main']}>
            <Avatar
              size="small"
              shape="circle"
              src={user.iconUrl}
              className="flex-none"
            >
              <IconCozPeopleFill />
            </Avatar>
            <div className={styles['candidate-content']}>
              <Typography.Text className={`${styles.name} truncate`}>
                {user.nickname}
              </Typography.Text>
              <Typography.Text className={`${styles.username} truncate`}>
                {user.username === '--' ? '--' : `@${user.username}`}
              </Typography.Text>
            </div>
            <div className="flex-none">
              {user.isJoined ? (
                <MemberStatusTag
                  tone="joined"
                  text={I18n.t(
                    'enterprise_member_list_add_new_member_tag_added',
                    {},
                    '已加入',
                  )}
                />
              ) : user.isInviting ? (
                <MemberStatusTag
                  tone="inviting"
                  text={I18n.t(
                    'enterprise_member_list_add_new_member_tag_inviting',
                    {},
                    '邀请中',
                  )}
                />
              ) : (
                <SelectIndicator selected={selected} />
              )}
            </div>
          </div>
        </button>
      );
    })}
  </div>
);

const AddMemberSearchResult = ({
  hasKeyword,
  searching,
  candidateUsers,
  selectedUserMap,
  onToggleUser,
}: {
  hasKeyword: boolean;
  searching: boolean;
  candidateUsers: AddMemberCandidateItem[];
  selectedUserMap: Set<string>;
  onToggleUser: (user: AddMemberCandidateItem) => void;
}) => {
  if (!hasKeyword) {
    return <AddMemberSearchEmpty />;
  }
  if (searching) {
    return <AddMemberSearchLoading />;
  }
  if (!candidateUsers.length) {
    return <AddMemberSearchNoResult />;
  }
  return (
    <CandidateUserList
      candidateUsers={candidateUsers}
      selectedUserMap={selectedUserMap}
      onToggleUser={onToggleUser}
    />
  );
};

const AddMemberSelectedList = ({
  selectedUsers,
  onRemoveSelectedUser,
}: {
  selectedUsers: AddMemberCandidateItem[];
  onRemoveSelectedUser: (userId: string) => void;
}) => {
  if (!selectedUsers.length) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <Typography.Text className={styles['empty-text']}>
          {I18n.t(
            'enterprise_member_list_add_new_member_no_choose',
            {},
            '当前未选择用户',
          )}
        </Typography.Text>
      </div>
    );
  }
  return (
    <div className={styles['selected-list']}>
      {selectedUsers.map(user => (
        <div key={user.id} className={styles['selected-item']}>
          <Avatar
            size="small"
            shape="circle"
            src={user.iconUrl}
            className="flex-none"
          >
            <IconCozPeopleFill />
          </Avatar>
          <div className={styles['candidate-content']}>
            <Typography.Text className={`${styles.name} truncate`}>
              {user.nickname}
            </Typography.Text>
            <Typography.Text className={`${styles.username} truncate`}>
              {user.username === '--' ? '--' : `@${user.username}`}
            </Typography.Text>
          </div>
          <button
            type="button"
            className={styles['remove-btn']}
            onClick={() => onRemoveSelectedUser(user.id)}
          >
            {I18n.t('remove', {}, '移除')}
          </button>
        </div>
      ))}
    </div>
  );
};

export const AddMemberModal = ({
  visible,
  searchKeyword,
  searching,
  confirming,
  candidateUsers,
  selectedUsers,
  maxSelectableCount,
  onSearchKeywordChange,
  onToggleUser,
  onRemoveSelectedUser,
  onCancel,
  onConfirm,
}: AddMemberModalProps) => {
  const selectedUserMap = new Set(selectedUsers.map(user => user.id));
  const hasKeyword = Boolean(searchKeyword.trim());

  return (
    <Modal
      visible={visible}
      title={I18n.t('team_add_member_btn', {}, '添加新成员')}
      className={styles['add-member-modal']}
      width={980}
      maskClosable={!confirming}
      onCancel={onCancel}
      onOk={onConfirm}
      okText={I18n.t(
        'enterprise_member_list_add_new_member_button_confirm',
        {},
        '确认',
      )}
      cancelText={I18n.t(
        'enterprise_member_list_add_new_member_button_cancel',
        {},
        '取消',
      )}
      okButtonProps={{
        disabled: selectedUsers.length === 0,
        loading: confirming,
      }}
      cancelButtonProps={{
        disabled: confirming,
      }}
    >
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles['left-panel']}>
            <Input
              value={searchKeyword}
              onChange={onSearchKeywordChange}
              showClear
              prefix={
                <IconCozMagnifier className="text-[16px] coz-fg-secondary" />
              }
              placeholder={I18n.t(
                'enterprise_member_list_add_new_member_search',
                {},
                '搜索用户名',
              )}
            />
            <Typography.Text className={styles['search-tip']}>
              {I18n.t(
                'enterprise_member_list_add_new_member_search_tips',
                {},
                '根据扣子用户名精准搜索以添加新成员',
              )}
            </Typography.Text>

            <div className={styles['list-wrap']}>
              <AddMemberSearchResult
                hasKeyword={hasKeyword}
                searching={searching}
                candidateUsers={candidateUsers}
                selectedUserMap={selectedUserMap}
                onToggleUser={onToggleUser}
              />
            </div>
          </div>

          <div className={styles['right-panel']}>
            <div className={styles['selected-header']}>
              <Typography.Text className={styles['selected-title']}>
                {I18n.t(
                  'enterprise_member_list_add_new_member_button_chosen',
                  {},
                  '已选',
                )}
              </Typography.Text>
              <Typography.Text className={styles['selected-count']}>
                {I18n.t(
                  'space_config_add_member_selected_count',
                  {
                    count: selectedUsers.length,
                    max: maxSelectableCount,
                  },
                  `选定:${selectedUsers.length} (最大值:${maxSelectableCount})`,
                )}
              </Typography.Text>
            </div>

            <div className={styles['selected-list-wrap']}>
              <AddMemberSelectedList
                selectedUsers={selectedUsers}
                onRemoveSelectedUser={onRemoveSelectedUser}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
