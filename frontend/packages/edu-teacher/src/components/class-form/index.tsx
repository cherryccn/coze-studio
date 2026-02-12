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

import React, { useEffect, useRef } from 'react';

import { I18n } from '@coze-arch/i18n';
import { Modal, Form, type FormApi } from '@coze-arch/coze-design';

import type { Class, CreateClassRequest } from '../../types';
import { generateClassCode } from './utils';
import { ClassFormFields } from './form-fields';

interface ClassFormProps {
  visible: boolean;
  loading?: boolean;
  initialValues?: Partial<Class>;
  onSubmit: (values: CreateClassRequest) => void | Promise<void>;
  onCancel: () => void;
}

const ClassForm: React.FC<ClassFormProps> = ({
  visible,
  loading,
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const formRef = useRef<FormApi<CreateClassRequest> | null>(null);
  const isEdit = !!initialValues?.id;

  useEffect(() => {
    if (visible && formRef.current) {
      if (initialValues) {
        formRef.current.setValues(initialValues);
      } else {
        formRef.current.reset();
        formRef.current.setValue('code', generateClassCode());
      }
    }
  }, [visible, initialValues]);

  const handleSubmit = async () => {
    if (!formRef.current) {
      return;
    }
    try {
      const values = await formRef.current.validate();
      await onSubmit(values);
      formRef.current.reset();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={
        isEdit
          ? I18n.t('edu_teacher_edit_class', {}, 'Edit Class')
          : I18n.t('edu_teacher_create_class', {}, 'Create Class')
      }
      visible={visible}
      centered
      size="default"
      okText={isEdit ? I18n.t('save', {}, 'Save') : I18n.t('create', {}, 'Create')}
      cancelText={I18n.t('cancel', {}, 'Cancel')}
      confirmLoading={loading}
      onOk={handleSubmit}
      onCancel={onCancel}
      getPopupContainer={() => document.body}
    >
      <div className="py-[12px]">
        <Form
          getFormApi={formApi => (formRef.current = formApi)}
          labelPosition="left"
          labelWidth="100px"
        >
          <ClassFormFields />
        </Form>
      </div>
    </Modal>
  );
};

export default ClassForm;
