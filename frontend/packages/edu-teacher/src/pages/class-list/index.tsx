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

import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useMemo } from 'react';

import { I18n } from '@coze-arch/i18n';
import {
  Button,
  Card,
  Empty,
  Spin,
  Space,
  Tag,
} from '@coze-arch/coze-design';
import { IconCozPlus, IconCozPeople, IconCozCalendar } from '@coze-arch/coze-design/icons';

import type { Class, CreateClassRequest } from '../../types';
import { useClasses } from '../../hooks/use-classes';
import ClassForm from '../../components/class-form';

import styles from './index.module.less';

const ClassList: React.FC = () => {
  const { space_id } = useParams<{ space_id: string }>();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { classes, loadingClasses, createClass, creatingClass } = useClasses(
    space_id || '',
  );

  // Cache i18n translations
  const classesCountText = useMemo(
    () =>
      I18n.t(
        'edu_teacher_classes_count',
        { count: classes.length },
        `${classes.length} 个班级`,
      ),
    [classes.length],
  );

  const handleCreateClass = async (values: CreateClassRequest) => {
    try {
      await createClass(values);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  const handleClassClick = (classId: string) => {
    navigate(`/space/${space_id}/edu/teacher/classes/${classId}`);
  };

  if (loadingClasses) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className="font-[500] text-[20px] coz-fg-primary">
            {I18n.t('edu_teacher_my_classes', {}, 'My Classes')}
          </div>
          <div className="text-[14px] coz-fg-tertiary mt-[4px]">
            {classesCountText}
          </div>
        </div>
        <Button
          theme="solid"
          type="primary"
          icon={<IconCozPlus />}
          onClick={() => setShowCreateModal(true)}
          data-testid="edu-teacher.class-list.create-button"
        >
          {I18n.t('edu_teacher_create_class', {}, 'Create Class')}
        </Button>
      </div>

      {/* Class List */}
      {classes.length === 0 ? (
        <div className={styles.empty}>
          <Empty
            title={I18n.t('edu_teacher_no_classes', {}, 'No classes yet')}
            description={I18n.t(
              'edu_teacher_create_first_class',
              {},
              'Create your first class to get started',
            )}
          >
            <Button
              theme="solid"
              type="primary"
              icon={<IconCozPlus />}
              onClick={() => setShowCreateModal(true)}
            >
              {I18n.t('edu_teacher_create_class', {}, 'Create Class')}
            </Button>
          </Empty>
        </div>
      ) : (
        <div className={styles.classGrid}>
          {classes.map((classItem: Class) => (
            <Card
              key={classItem.id}
              className="rounded-[6px] border-[1px] coz-stroke-primary coz-mg-card hover:shadow-[0_6px_8px_0_rgba(28,31,35,6%)] cursor-pointer"
              bordered
              onClick={() => handleClassClick(classItem.id)}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className="text-[16px] font-[500] coz-fg-primary overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                    {classItem.name}
                  </div>
                  <Tag color="blue" size="small">
                    {classItem.code}
                  </Tag>
                </div>

                {classItem.description ? (
                  <div className="text-[14px] coz-fg-secondary mt-[8px] mb-[12px] line-clamp-2">
                    {classItem.description}
                  </div>
                ) : null}

                <div className={`${styles.cardFooter} border-t coz-stroke-primary`}>
                  <Space size={16}>
                    <Space size={4}>
                      <IconCozPeople className="w-[16px] h-[16px]" />
                      <span className="text-[12px] coz-fg-tertiary">
                        {classItem.memberCount}{' '}
                        {I18n.t('edu_teacher_students', {}, 'students')}
                      </span>
                    </Space>
                    <Space size={4}>
                      <IconCozCalendar className="w-[16px] h-[16px]" />
                      <span className="text-[12px] coz-fg-tertiary">
                        {classItem.semester}
                      </span>
                    </Space>
                  </Space>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      <ClassForm
        visible={showCreateModal}
        loading={creatingClass}
        onSubmit={handleCreateClass}
        onCancel={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default ClassList;
