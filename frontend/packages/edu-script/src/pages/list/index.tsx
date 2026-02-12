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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Spin, Empty, Tag, Typography, Button } from '@coze-arch/coze-design';
import { IconSearch } from '@coze-arch/bot-icons';
import { I18n } from '@coze-arch/i18n';
import classNames from 'classnames';
import { useScriptList } from '../../hooks/use-script-list';
import styles from './index.module.less';

const { Title, Text, Paragraph } = Typography;

interface ScriptItem {
  id: number;
  name: string;
  nameEn?: string;
  difficulty: number;
  duration: number;
  icon: string;
  description: string;
  createdAt: string;
}

const difficultyMap = {
  1: { text: '简单', color: 'green' },
  2: { text: '中等', color: 'orange' },
  3: { text: '困难', color: 'red' },
};

const ScriptListPage: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const { data, loading, fetchScripts } = useScriptList();

  useEffect(() => {
    fetchScripts({ keyword, difficulty });
  }, [keyword, difficulty]);

  const handleCardClick = (scriptId: number) => {
    navigate(`/edu/scripts/${scriptId}`);
  };

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <Title heading={3}>
          {I18n.t('edu_script_library_title', {}, '剧本库')}
        </Title>
        <Text type="secondary">
          {I18n.t('edu_script_library_subtitle', {}, '选择一个剧本开始你的实训之旅')}
        </Text>
      </div>

      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        <Input
          prefix={<IconSearch />}
          placeholder={I18n.t('edu_search_scripts', {}, '搜索剧本名称或描述')}
          value={keyword}
          onChange={setKeyword}
          style={{ width: 300 }}
        />
        <Select
          placeholder={I18n.t('edu_select_difficulty', {}, '选择难度')}
          value={difficulty}
          onChange={setDifficulty}
          style={{ width: 150 }}
          allowClear
        >
          <Select.Option value={1}>简单</Select.Option>
          <Select.Option value={2}>中等</Select.Option>
          <Select.Option value={3}>困难</Select.Option>
        </Select>
      </div>

      {/* 剧本列表 */}
      <Spin spinning={loading}>
        <div className={styles.scriptList}>
          {data?.list?.length === 0 ? (
            <Empty
              description={I18n.t('edu_no_scripts', {}, '暂无剧本')}
            />
          ) : (
            data?.list?.map((script: ScriptItem) => (
              <div
                key={script.id}
                className={classNames(styles.scriptCard, styles.hoverable)}
                onClick={() => handleCardClick(script.id)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.icon}>{script.icon}</span>
                  <div className={styles.titleSection}>
                    <Title heading={5} className={styles.title}>
                      {script.name}
                    </Title>
                    {script.nameEn && (
                      <Text type="tertiary" size="small">{script.nameEn}</Text>
                    )}
                  </div>
                </div>

                <Text type="secondary" className={styles.description}>
                  {script.description}
                </Text>

                <div className={styles.cardFooter}>
                  <Tag color={difficultyMap[script.difficulty as 1 | 2 | 3].color}>
                    {difficultyMap[script.difficulty as 1 | 2 | 3].text}
                  </Tag>
                  <Text type="tertiary" size="small">
                    {script.duration} 分钟
                  </Text>
                </div>
              </div>
            ))
          )}
        </div>
      </Spin>
    </div>
  );
};

export default ScriptListPage;
