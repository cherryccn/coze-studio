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

import React, { useState, useEffect } from 'react';

import { I18n } from '@coze-arch/i18n';
import { Form } from '@coze-arch/coze-design';

// Constants
const VALIDATION_LIMITS = {
  NAME_MAX: 100,
  CODE_MAX: 50,
  DESCRIPTION_MAX: 500,
  DESCRIPTION_ROWS: 4,
} as const;

/**
 * Form fields component for class creation/editing
 */
export const ClassFormFields: React.FC = () => {
  // Generate semester options
  const [semesterOptions, setSemesterOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setSemesterOptions([
      {
        value: `${currentYear} Spring`,
        label: I18n.t('edu_semester_spring', { year: currentYear }),
      },
      {
        value: `${currentYear} Fall`,
        label: I18n.t('edu_semester_fall', { year: currentYear }),
      },
      {
        value: `${currentYear + 1} Spring`,
        label: I18n.t('edu_semester_spring', { year: currentYear + 1 }),
      },
    ]);
  }, []);

  return (
    <>
      <Form.Input
        field="name"
        label={I18n.t('edu_class_name', {}, 'Class Name')}
        rules={[
          {
            required: true,
            message: I18n.t(
              'edu_class_name_required',
              {},
              'Class name is required',
            ),
          },
          {
            max: VALIDATION_LIMITS.NAME_MAX,
            message: I18n.t(
              'edu_class_name_max_length',
              {},
              'Class name should not exceed 100 characters',
            ),
          },
        ]}
        placeholder={I18n.t('edu_class_name_placeholder', {}, 'Enter class name')}
      />

      <Form.Input
        field="code"
        label={I18n.t('edu_class_code', {}, 'Class Code')}
        rules={[
          {
            required: true,
            message: I18n.t(
              'edu_class_code_required',
              {},
              'Class code is required',
            ),
          },
          {
            max: VALIDATION_LIMITS.CODE_MAX,
            message: I18n.t(
              'edu_class_code_max_length',
              {},
              'Class code should not exceed 50 characters',
            ),
          },
        ]}
        placeholder={I18n.t(
          'edu_class_code_placeholder',
          {},
          'Auto-generated or custom',
        )}
      />

      <Form.Select
        field="semester"
        label={I18n.t('edu_semester', {}, 'Semester')}
        rules={[
          {
            required: true,
            message: I18n.t('edu_semester_required', {}, 'Semester is required'),
          },
        ]}
        placeholder={I18n.t('edu_semester_placeholder', {}, 'Select semester')}
        optionList={semesterOptions}
      />

      <Form.TextArea
        field="description"
        label={I18n.t('description', {}, 'Description')}
        placeholder={I18n.t(
          'edu_class_description_placeholder',
          {},
          'Enter class description',
        )}
        rows={VALIDATION_LIMITS.DESCRIPTION_ROWS}
        maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX}
      />
    </>
  );
};
