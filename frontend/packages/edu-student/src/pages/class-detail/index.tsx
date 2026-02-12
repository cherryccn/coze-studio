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
import React from 'react';

import { I18n } from '@coze-arch/i18n';

import { useStudentClassDetail } from '../../hooks/use-student-class-detail';
import { ClassDetailHeader } from './class-detail-header';
import { MembersTable } from './members-table';

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

  const { classDetail, members, loading } = useStudentClassDetail(
    space_id || '',
    class_id || '',
  );

  if (loading) {
    return <LoadingView />;
  }

  if (!classDetail) {
    return null;
  }

  return (
    <div className={styles.container}>
      <ClassDetailHeader
        classDetail={classDetail}
        onBack={() => navigate(`/space/${space_id}/edu/student/classes`)}
      />

      <MembersTable members={members} loading={false} />
    </div>
  );
};

export default ClassDetail;
