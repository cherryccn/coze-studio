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
import { TextArea, Tabs, Card } from '@coze-arch/coze-design';
import { I18n } from '@coze-arch/i18n';
import ReactMarkdown from 'react-markdown';
import styles from './output-editor.module.less';

const { TabPane } = Tabs;

interface OutputEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 产出内容编辑器（支持Markdown）
 */
const OutputEditor: React.FC<OutputEditorProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [activeTab, setActiveTab] = useState('edit');

  return (
    <div className={styles.outputEditor}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {I18n.t('edu.output.editor.title', {}, '我的产出')}
        </h3>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="button">
          <TabPane
            tab={I18n.t('edu.output.editor.edit', {}, '编辑')}
            itemKey="edit"
          />
          <TabPane
            tab={I18n.t('edu.output.editor.preview', {}, '预览')}
            itemKey="preview"
          />
        </Tabs>
      </div>

      <div className={styles.content}>
        {activeTab === 'edit' ? (
          <TextArea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={styles.textarea}
            autosize={{ minRows: 20 }}
          />
        ) : (
          <Card className={styles.preview}>
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <div className={styles.emptyPreview}>
                {I18n.t('edu.output.editor.empty.preview', {}, '暂无内容')}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default OutputEditor;
