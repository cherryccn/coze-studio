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

import React, { useState } from 'react';
import { Table, Button, Tag, Progress, Empty, Spin, Select } from '@coze-arch/coze-design';
import { I18n } from '@coze-arch/i18n';
import { useNavigate } from 'react-router-dom';
import { ProjectType, ProjectStatus } from '@coze-edu/common/types';
import { PROJECT_TYPE_LABELS } from '@coze-edu/common/constants';
import { useMyProjects } from '../../hooks';
import styles from './index.module.less';

const { Option } = Select;

/**
 * 我的学习项目列表
 */
const MyProjects: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>();

  // TODO: 从路由或context获取 spaceId
  const spaceId = 1;

  const { data: projects, loading } = useMyProjects(spaceId);

  const getStatusTag = (status: ProjectStatus) => {
    const statusConfig = {
      in_progress: { color: 'blue', text: I18n.t('edu.project.status.in_progress', {}, '进行中') },
      completed: { color: 'green', text: I18n.t('edu.project.status.completed', {}, '已完成') },
      abandoned: { color: 'grey', text: I18n.t('edu.project.status.abandoned', {}, '已放弃') },
    };

    const config = statusConfig[status] || statusConfig.in_progress;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getProjectTypeLabel = (type: ProjectType) => {
    const labelKey = PROJECT_TYPE_LABELS[type];
    return I18n.t(labelKey, {}, labelKey);
  };

  const calculateProgress = (currentStage: number, totalStages: number = 3) => {
    return Math.round((currentStage / totalStages) * 100);
  };

  const handleContinue = (projectId: number, projectType: ProjectType) => {
    // 根据项目类型跳转到对应的学习页面
    if (projectType === ProjectType.Script) {
      navigate(`/edu/projects/${projectId}/script-learning`);
    } else if (projectType === ProjectType.Template) {
      navigate(`/edu/projects/${projectId}/template-learning`);
    } else {
      navigate(`/edu/projects/${projectId}/bot-development`);
    }
  };

  const columns = [
    {
      title: I18n.t('edu.projects.table.title', {}, '项目名称'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <span className={styles.projectTitle}>{title}</span>,
    },
    {
      title: I18n.t('edu.projects.table.type', {}, '类型'),
      dataIndex: 'project_type',
      key: 'project_type',
      render: (type: ProjectType) => getProjectTypeLabel(type),
    },
    {
      title: I18n.t('edu.projects.table.progress', {}, '进度'),
      dataIndex: 'current_stage',
      key: 'progress',
      render: (currentStage: number, record: any) => {
        if (record.project_type !== ProjectType.Script) {
          return <span>-</span>;
        }
        const progress = calculateProgress(currentStage);
        return (
          <div className={styles.progressCell}>
            <Progress percent={progress} showInfo size="small" />
            <span className={styles.stageText}>
              {I18n.t('edu.projects.stage.current', { stage: currentStage }, `阶段 ${currentStage}/3`)}
            </span>
          </div>
        );
      },
    },
    {
      title: I18n.t('edu.projects.table.status', {}, '状态'),
      dataIndex: 'status',
      key: 'status',
      render: (status: ProjectStatus) => getStatusTag(status),
    },
    {
      title: I18n.t('edu.projects.table.score', {}, '评分'),
      dataIndex: 'total_score',
      key: 'total_score',
      render: (score: number | null) => {
        if (score === null || score === undefined) {
          return <span className={styles.noScore}>-</span>;
        }
        return <span className={styles.score}>{score.toFixed(1)}</span>;
      },
    },
    {
      title: I18n.t('edu.projects.table.created_at', {}, '创建时间'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleDateString('zh-CN'),
    },
    {
      title: I18n.t('edu.projects.table.actions', {}, '操作'),
      key: 'actions',
      render: (_: any, record: any) => (
        <div className={styles.actions}>
          {record.status === ProjectStatus.InProgress && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleContinue(record.id, record.project_type)}
            >
              {I18n.t('edu.projects.button.continue', {}, '继续学习')}
            </Button>
          )}
          <Button
            type="tertiary"
            size="small"
            onClick={() => navigate(`/edu/projects/${record.id}`)}
          >
            {I18n.t('edu.projects.button.detail', {}, '查看详情')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.myProjects}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {I18n.t('edu.my.projects.title', {}, '我的学习项目')}
        </h1>

        <div className={styles.filters}>
          <Select
            placeholder={I18n.t('edu.my.projects.filter.status', {}, '筛选状态')}
            value={statusFilter}
            onChange={value => setStatusFilter(value)}
            style={{ width: 150 }}
            allowClear
          >
            <Option value={ProjectStatus.InProgress}>
              {I18n.t('edu.project.status.in_progress', {}, '进行中')}
            </Option>
            <Option value={ProjectStatus.Completed}>
              {I18n.t('edu.project.status.completed', {}, '已完成')}
            </Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : !projects || projects.length === 0 ? (
        <Empty
          description={I18n.t('edu.my.projects.empty', {}, '暂无学习项目，去学习中心开始学习吧')}
        >
          <Button type="primary" onClick={() => navigate('/edu/learning-center')}>
            {I18n.t('edu.my.projects.go.learning', {}, '前往学习中心')}
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: total => I18n.t('edu.my.projects.total', { total }, `共 ${total} 个项目`),
          }}
        />
      )}
    </div>
  );
};

export default MyProjects;
