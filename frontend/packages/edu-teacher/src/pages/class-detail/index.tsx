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

import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { I18n } from '@coze-arch/i18n';
import { Toast, Modal, Button, Space } from '@coze-arch/coze-design';
import { IconCozCopy } from '@coze-arch/coze-design/icons';

import type { UpdateClassRequest } from '../../types';
import { useInviteCodes } from '../../hooks/use-invite-codes';
import { useClassMembers } from '../../hooks/use-class-members';
import { useClassDetail } from '../../hooks/use-class-detail';
import ClassForm from '../../components/class-form';
import { ClassDetailTabs } from './class-detail-tabs';
import { ClassDetailHeader } from './class-detail-header';

import styles from './index.module.less';

const LoadingView = () => (
  <div className={styles.loading}>
    <div style={{ textAlign: 'center', padding: '50px' }}>
      {I18n.t('loading', {}, 'Loading...')}
    </div>
  </div>
);

const ClassDetail: React.FC = () => {
  const { space_id, class_id } = useParams<{
    space_id: string;
    class_id: string;
  }>();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);

  const { classDetail, loadingClass, updateClass, updatingClass } =
    useClassDetail(space_id || '', class_id || '');

  const { members, loadingMembers, removeMember } =
    useClassMembers(space_id || '', class_id || '');

  const { inviteCodes, loadingCodes, createCode, creatingCode, createdCode } =
    useInviteCodes(space_id || '', class_id || '');

  // 当创建新邀请码成功后，自动显示邀请码弹窗
  useEffect(() => {
    if (createdCode) {
      setShowInviteCodeModal(true);
    }
  }, [createdCode]);

  const handleUpdateClass = async (values: UpdateClassRequest) => {
    try {
      await updateClass(values);
      setShowEditModal(false);
      Toast.success(
        I18n.t('edu_class_updated', {}, 'Class updated successfully'),
      );
    } catch (error) {
      Toast.error(
        I18n.t('edu_class_update_failed', {}, 'Failed to update class'),
      );
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(userId);
      Toast.success(
        I18n.t('edu_member_removed', {}, 'Member removed successfully'),
      );
    } catch (error) {
      Toast.error(
        I18n.t('edu_member_remove_failed', {}, 'Failed to remove member'),
      );
    }
  };

  const handleCreateCode = async () => {
    try {
      await createCode({
        role: 'student',
        max_uses: 0, // 0 表示无限制
      });

      Toast.success(
        I18n.t(
          'edu_invite_code_created',
          {},
          'Invite code created successfully',
        ),
      );
    } catch (error) {
      Toast.error(
        I18n.t(
          'edu_invite_code_create_failed',
          {},
          'Failed to create invite code',
        ),
      );
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    Toast.success(I18n.t('copied', {}, 'Copied to clipboard'));
  };

  const handleCopyNewCode = () => {
    if (createdCode?.code) {
      handleCopyCode(createdCode.code);
    }
  };

  if (loadingClass) {
    return <LoadingView />;
  }

  if (!classDetail) {
    return null;
  }

  return (
    <div className={styles.container}>
      <ClassDetailHeader
        classDetail={classDetail}
        onBack={() => navigate(`/space/${space_id}/edu/teacher/classes`)}
        onEdit={() => setShowEditModal(true)}
      />

      <ClassDetailTabs
        members={members}
        loadingMembers={loadingMembers}
        onRemoveMember={handleRemoveMember}
        inviteCodes={inviteCodes}
        loadingCodes={loadingCodes}
        creatingCode={creatingCode}
        onCreateCode={handleCreateCode}
        onCopyCode={handleCopyCode}
      />

      {/* Edit Class Modal */}
      <ClassForm
        visible={showEditModal}
        loading={updatingClass}
        initialValues={classDetail}
        onSubmit={handleUpdateClass}
        onCancel={() => setShowEditModal(false)}
      />

      {/* New Invite Code Modal */}
      <Modal
        title={I18n.t('edu_invite_code_created', {}, 'Invite Code Created')}
        visible={showInviteCodeModal}
        centered
        size="default"
        okText={I18n.t('copy_code', {}, 'Copy Code')}
        cancelText={I18n.t('close', {}, 'Close')}
        onOk={handleCopyNewCode}
        onCancel={() => setShowInviteCodeModal(false)}
      >
        <div className="text-center py-[12px]">
          <div className="text-[14px] font-[500] mb-[8px] coz-fg-secondary">
            {I18n.t('edu_invite_code', {}, 'Invite Code')}
          </div>
          <div className="coz-bg-secondary px-[16px] py-[12px] rounded-[6px] mb-[16px]">
            <div
              className="text-[32px] font-[600] coz-fg-primary select-all"
              style={{ letterSpacing: '4px' }}
            >
              {createdCode?.code || ''}
            </div>
          </div>
          <div className="text-[14px] coz-fg-secondary mb-[8px]">
            {I18n.t(
              'edu_invite_code_usage',
              {},
              'Share this code with students to let them join the class',
            )}
          </div>
          <div className="text-[12px] coz-fg-tertiary">
            {I18n.t(
              'edu_invite_code_note',
              {},
              'Students need to register an account first, then use this code to join',
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClassDetail;
