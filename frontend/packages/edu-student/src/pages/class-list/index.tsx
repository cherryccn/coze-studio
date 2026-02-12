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
import React, { useMemo } from 'react';

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

import type { Class } from '../../types';
import { useStudentClasses } from '../../hooks/use-student-classes';

import styles from './index.module.less';

const ClassList: React.FC = () => {
  const { space_id } = useParams<{ space_id: string }>();
  const navigate = useNavigate();

  const { classes, loading } = useStudentClasses(space_id || '');

  // Cache i18n translations
  const classesCountText = useMemo(
    () =>
      I18n.t(
        'edu_student_classes_count',
        { count: classes.length },
        `${classes.length} 个班级`,
      ),
    [classes.length],
  );

  const handleClassClick = (classId: string) => {
    navigate(`/space/${space_id}/edu/student/classes/${classId}`);
  };

  const handleJoinClass = () => {
    navigate(`/space/${space_id}/edu/student/join`);
  };

  if (loading) {
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
            {I18n.t('edu_student_my_classes', {}, '我的班级')}
          </div>
          <div className="text-[14px] coz-fg-tertiary mt-[4px]">
            {classesCountText}
          </div>
        </div>
        <Button
          theme="solid"
          type="primary"
          icon={<IconCozPlus />}
          onClick={handleJoinClass}
          data-testid="edu-student.class-list.join-button"
        >
          {I18n.t('edu_join_class', {}, '加入班级')}
        </Button>
      </div>

      {/* Class List */}
      {classes.length === 0 ? (
        <div className={styles.empty}>
          <Empty
            title={I18n.t('edu_student_no_classes', {}, '还没有加入任何班级')}
            description={I18n.t(
              'edu_student_join_first_class',
              {},
              '使用教师提供的邀请码加入班级',
            )}
          >
            <Button
              theme="solid"
              type="primary"
              icon={<IconCozPlus />}
              onClick={handleJoinClass}
            >
              {I18n.t('edu_join_class', {}, '加入班级')}
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
                        {I18n.t('edu_members', {}, 'Members')}
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
    </div>
  );
};

export default ClassList;
