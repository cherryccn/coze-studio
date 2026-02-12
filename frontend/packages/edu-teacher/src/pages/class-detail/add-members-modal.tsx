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
import { Modal, Form, Button, type FormApi } from '@coze-arch/coze-design';

interface AddMembersModalProps {
  visible: boolean;
  loading: boolean;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  formRef: React.MutableRefObject<FormApi<{ emails: string }> | null>;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
  visible,
  loading,
  onSubmit,
  onCancel,
  formRef,
}) => (
  <Modal
    title={I18n.t('edu_add_members', {}, 'Add Members')}
    visible={visible}
    onCancel={onCancel}
    footer={
      <>
        <Button onClick={onCancel}>{I18n.t('cancel', {}, 'Cancel')}</Button>
        <Button
          theme="solid"
          type="primary"
          loading={loading}
          onClick={onSubmit}
        >
          {I18n.t('add', {}, 'Add')}
        </Button>
      </>
    }
  >
    <Form getFormApi={formApi => (formRef.current = formApi)}>
      <Form.TextArea
        field="emails"
        label={I18n.t('edu_member_emails', {}, 'Member Emails')}
        rules={[
          {
            required: true,
            message: I18n.t(
              'edu_emails_required',
              {},
              'Please enter at least one email',
            ),
          },
        ]}
        placeholder={I18n.t(
          'edu_emails_placeholder',
          {},
          'Enter email addresses, one per line',
        )}
        rows={6}
      />
    </Form>
  </Modal>
);
