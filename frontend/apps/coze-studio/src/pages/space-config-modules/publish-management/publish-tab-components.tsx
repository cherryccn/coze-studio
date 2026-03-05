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

import { I18n } from '@coze-arch/i18n';
import { IconCozMagnifier } from '@coze-arch/coze-design/icons';
import { Input, Modal, Select, Typography } from '@coze-arch/coze-design';

import type {
  CreatorFilterKey,
  PublishConnectorItem,
  PublishRecordItem,
  PublishScopeKey,
} from './use-publish-management';

import styles from './publish-tab-content.module.less';

export interface PublishScopeTabItem {
  key: PublishScopeKey;
  label: string;
}

export interface CreatorFilterOption {
  label: string;
  value: CreatorFilterKey;
}

export const PublishScopeTabs = ({
  tabs,
  activeScope,
  onScopeChange,
}: {
  tabs: PublishScopeTabItem[];
  activeScope: PublishScopeKey;
  onScopeChange: (scope: PublishScopeKey) => void;
}) => (
  <div className="flex flex-wrap items-center gap-[8px]">
    {tabs.map(tab => {
      const isActive = tab.key === activeScope;
      return (
        <button
          key={tab.key}
          type="button"
          className={`${styles['scope-tab']} ${
            isActive ? styles['scope-tab-active'] : styles['scope-tab-inactive']
          }`}
          onClick={() => onScopeChange(tab.key)}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export const PublishFilterBar = ({
  creatorFilter,
  creatorFilterOptions,
  onCreatorFilterChange,
  searchKeyword,
  onSearchKeywordChange,
  activeScopeLabel,
}: {
  creatorFilter: CreatorFilterKey;
  creatorFilterOptions: CreatorFilterOption[];
  onCreatorFilterChange: (value: CreatorFilterKey) => void;
  searchKeyword: string;
  onSearchKeywordChange: (value: string) => void;
  activeScopeLabel: string;
}) => (
  <div className="mt-[12px] flex flex-wrap items-center justify-between gap-[12px]">
    <Select
      className="w-[140px]"
      value={creatorFilter}
      optionList={creatorFilterOptions}
      onChange={value => onCreatorFilterChange(value as CreatorFilterKey)}
    />
    <Input
      value={searchKeyword}
      onChange={onSearchKeywordChange}
      className="w-[220px] md:w-[300px]"
      showClear
      prefix={<IconCozMagnifier className="text-[16px] coz-fg-secondary" />}
      placeholder={I18n.t(
        'space_config_publish_scope_search_placeholder',
        { scope: activeScopeLabel },
        `搜索${activeScopeLabel}`,
      )}
    />
  </div>
);

export const PublishManageModal = ({
  manageModalRecord,
  manageConnectors,
  selectedConnectorIDs,
  managingRecordLoading,
  onClose,
  onConfirm,
  onToggleConnector,
}: {
  manageModalRecord: PublishRecordItem | null;
  manageConnectors: PublishConnectorItem[];
  selectedConnectorIDs: string[];
  managingRecordLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onToggleConnector: (connectorID: string) => void;
}) => (
  <Modal
    visible={Boolean(manageModalRecord)}
    title={I18n.t('space_config_publish_unpublish_manage_title', {}, '管理')}
    onCancel={onClose}
    onOk={onConfirm}
    okText={I18n.t('space_config_publish_action_unpublish', {}, '下架')}
    cancelText={I18n.t('cancel')}
    maskClosable={!managingRecordLoading}
    okButtonProps={{
      disabled: selectedConnectorIDs.length === 0,
      loading: managingRecordLoading,
    }}
    cancelButtonProps={{
      disabled: managingRecordLoading,
    }}
  >
    <div className={styles['manage-modal-body']}>
      <Typography.Text className={styles['manage-modal-group-title']}>
        {I18n.t(
          'space_config_publish_unpublish_official_channel',
          {},
          '官方渠道',
        )}
      </Typography.Text>
      <div className={styles['manage-channel-list']}>
        {manageConnectors.length ? (
          manageConnectors.map(connector => {
            const checked = selectedConnectorIDs.includes(connector.id);
            return (
              <button
                key={connector.id}
                type="button"
                className={styles['manage-channel-item']}
                onClick={() => onToggleConnector(connector.id)}
                disabled={managingRecordLoading}
              >
                <span
                  className={`${styles['manage-channel-checkbox']} ${
                    checked ? styles['manage-channel-checkbox-checked'] : ''
                  }`}
                >
                  {checked ? '✓' : ''}
                </span>
                <span className={styles['manage-channel-icon']}>
                  {(connector.name || 'A').slice(0, 1).toUpperCase()}
                </span>
                <span className={styles['manage-channel-name']}>
                  {connector.name || 'API'}
                </span>
              </button>
            );
          })
        ) : (
          <Typography.Text className={styles['manage-channel-empty']}>
            {I18n.t(
              'space_config_publish_unpublish_no_connector',
              {},
              '当前智能体没有可下架的发布渠道',
            )}
          </Typography.Text>
        )}
      </div>
    </div>
  </Modal>
);
