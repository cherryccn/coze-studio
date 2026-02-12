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
import React, { useState } from 'react';

import { I18n } from '@coze-arch/i18n';
import { Card, Button, Input, Toast } from '@coze-arch/coze-design';
import { IconCozKey } from '@coze-arch/coze-design/icons';

import { useJoinClass } from '../../hooks/use-join-class';

import styles from './index.module.less';

const JoinClass: React.FC = () => {
  const { space_id } = useParams<{ space_id: string }>();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');

  const { joinClass, loading } = useJoinClass(space_id || '');

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) {
      Toast.error(I18n.t('edu_invite_code_required', {}, '请输入邀请码'));
      return;
    }

    try {
      const response = await joinClass({ invite_code: inviteCode.trim() });

      if (response?.code === 0) {
        Toast.success(I18n.t('edu_join_class_success', {}, '加入班级成功'));
        // 跳转到学生班级列表页
        setTimeout(() => {
          navigate(`/space/${space_id}/edu/student/classes`);
        }, 1000);
      } else {
        Toast.error(response?.msg || I18n.t('edu_join_class_failed', {}, '加入班级失败'));
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.msg || error?.message;
      Toast.error(errorMsg || I18n.t('edu_join_class_failed', {}, '加入班级失败'));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinClass();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className="text-[28px] font-[600] coz-fg-primary mb-[8px]">
            {I18n.t('edu_join_class', {}, '加入班级')}
          </div>
          <div className="text-[14px] coz-fg-tertiary">
            {I18n.t('edu_join_class_desc', {}, '请输入教师提供的邀请码')}
          </div>
        </div>

        <Card className={styles.formCard}>
          <div className="mb-[24px]">
            <div className="text-[14px] font-[500] coz-fg-primary mb-[8px]">
              {I18n.t('edu_invite_code', {}, '邀请码')}
            </div>
            <Input
              size="large"
              className={styles.codeInput}
              placeholder={I18n.t('edu_invite_code_placeholder', {}, '请输入邀请码')}
              value={inviteCode}
              onChange={value => setInviteCode(value)}
              onKeyPress={handleKeyPress}
              prefix={<IconCozKey />}
              maxLength={32}
            />
          </div>

          <div className="text-[12px] coz-fg-tertiary mb-[24px]">
            {I18n.t(
              'edu_join_class_tips',
              {},
              '邀请码由教师创建，如果没有邀请码，请联系您的教师获取',
            )}
          </div>

          <Button
            block
            theme="solid"
            type="primary"
            size="large"
            loading={loading}
            onClick={handleJoinClass}
            data-testid="edu-student.join-class.submit-button"
          >
            {I18n.t('edu_join_class', {}, '加入班级')}
          </Button>

          <div className="text-center mt-[16px]">
            <Button
              theme="borderless"
              type="tertiary"
              onClick={() => navigate(`/space/${space_id}/edu/student/classes`)}
            >
              {I18n.t('cancel', {}, '取消')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JoinClass;
