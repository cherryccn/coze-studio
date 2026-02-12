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
import { Button, Space, Card, Tag } from '@coze-arch/coze-design';
import { IconCozArrowLeft, IconCozEdit } from '@coze-arch/coze-design/icons';

interface Class {
  id: string;
  name: string;
  code: string;
  description?: string;
  semester: string;
  status: string;
  teacherId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ClassDetailHeaderProps {
  classDetail: Class;
  onBack: () => void;
  onEdit: () => void;
}

/**
 * Format semester string to localized text
 * @param semester - Format: "2025 Spring" or "2025 Fall"
 * @returns Localized semester text
 */
const formatSemester = (semester: string): string => {
  const match = semester.match(/^(\d{4})\s+(Spring|Fall)$/i);
  if (!match) return semester;

  const [, year, season] = match;
  const seasonKey = season.toLowerCase() === 'spring' ? 'edu_semester_spring' : 'edu_semester_fall';
  return I18n.t(seasonKey, { year: parseInt(year) });
};

export const ClassDetailHeader: React.FC<ClassDetailHeaderProps> = ({
  classDetail,
  onBack,
  onEdit,
}) => (
  <>
    <div className="mb-[16px] flex items-center justify-between">
      <Space>
        <Button icon={<IconCozArrowLeft />} onClick={onBack} />
        <div>
          <div className="text-[20px] font-[500] coz-fg-primary">
            {classDetail.name}
          </div>
          <div className="text-[14px] coz-fg-tertiary">
            {I18n.t('edu_class_code', {}, 'Class Code')}: {classDetail.code}
          </div>
        </div>
      </Space>
      <Button icon={<IconCozEdit />} onClick={onEdit}>
        {I18n.t('edit', {}, 'Edit')}
      </Button>
    </div>

    <Card>
      <Space size={16}>
        <div>
          <div className="text-[14px] coz-fg-tertiary">
            {I18n.t('edu_semester', {}, 'Semester')}
          </div>
          <div className="text-[14px] font-[500] coz-fg-primary mt-[4px]">
            {formatSemester(classDetail.semester)}
          </div>
        </div>
        <div>
          <div className="text-[14px] coz-fg-tertiary">
            {I18n.t('edu_members', {}, 'Members')}
          </div>
          <div className="text-[14px] font-[500] coz-fg-primary mt-[4px]">
            {classDetail.memberCount}
          </div>
        </div>
        <div>
          <div className="text-[14px] coz-fg-tertiary">
            {I18n.t('status', {}, 'Status')}
          </div>
          <div className="mt-[4px]">
            <Tag color={classDetail.status === 'active' ? 'green' : 'grey'}>
              {I18n.t(classDetail.status, {}, classDetail.status)}
            </Tag>
          </div>
        </div>
      </Space>
      {classDetail.description ? (
        <div className="mt-[16px] text-[14px] coz-fg-secondary">
          {classDetail.description}
        </div>
      ) : null}
    </Card>
  </>
);
