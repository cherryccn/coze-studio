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

import { useCallback, useMemo, useState } from 'react';

import { I18n } from '@coze-arch/i18n';
import { IconCozPeopleFill } from '@coze-arch/coze-design/icons';
import { Avatar, Typography } from '@coze-arch/coze-design';

import {
  type CreatorFilterKey,
  type PublishRecordItem,
  type PublishScopeKey,
  usePublishManagement,
} from './use-publish-management';
import {
  PublishFilterBar,
  PublishManageModal,
  PublishScopeTabs,
} from './publish-tab-components';

import styles from './publish-tab-content.module.less';

interface PublishTabContentProps {
  spaceId?: string;
}

type SortField = 'updatedAt' | 'tokenConsumption';
type SortOrder = 'desc' | 'asc';

interface PublishScopeTabItem {
  key: PublishScopeKey;
  label: string;
}

const PUBLISH_SCOPE_TABS: PublishScopeTabItem[] = [
  {
    key: 'agent',
    label: I18n.t('space_config_publish_scope_agent', {}, '智能体'),
  },
  {
    key: 'app',
    label: I18n.t('space_config_publish_scope_app', {}, '应用'),
  },
  {
    key: 'workflow',
    label: I18n.t('space_config_publish_scope_workflow', {}, '工作流'),
  },
];

const CREATOR_FILTER_OPTIONS: Array<{
  label: string;
  value: CreatorFilterKey;
}> = [
  {
    value: 'all',
    label: I18n.t('space_config_publish_creator_filter_all', {}, '所有人'),
  },
  {
    value: 'mine',
    label: I18n.t('space_config_publish_creator_filter_mine', {}, '我创建的'),
  },
];

const PUBLISH_SCOPE_EMPTY_TEXT: Record<PublishScopeKey, string> = {
  agent: I18n.t(
    'space_config_publish_scope_agent_empty',
    {},
    '暂无符合条件的智能体',
  ),
  app: I18n.t('space_config_publish_scope_app_empty', {}, '暂无符合条件的应用'),
  workflow: I18n.t(
    'space_config_publish_scope_workflow_empty',
    {},
    '暂无符合条件的工作流',
  ),
};

const TABLE_GRID_TEMPLATE_DEFAULT =
  'minmax(360px, 2fr) minmax(160px, 1fr) minmax(130px, 0.85fr) minmax(170px, 0.95fr) minmax(120px, 0.7fr) minmax(72px, 0.5fr)';
const TABLE_GRID_TEMPLATE_NO_ACTION =
  'minmax(360px, 2fr) minmax(160px, 1fr) minmax(130px, 0.85fr) minmax(170px, 0.95fr) minmax(120px, 0.7fr)';
const TABLE_GRID_TEMPLATE_WORKFLOW =
  'minmax(360px, 2.4fr) minmax(180px, 1fr) minmax(180px, 1fr) minmax(120px, 0.7fr)';

const getTableLayout = ({
  hidePlatform,
  hideAction,
}: {
  hidePlatform: boolean;
  hideAction: boolean;
}) => {
  if (hidePlatform && hideAction) {
    return {
      gridTemplateColumns: TABLE_GRID_TEMPLATE_WORKFLOW,
      minWidth: 760,
    };
  }

  if (!hidePlatform && hideAction) {
    return {
      gridTemplateColumns: TABLE_GRID_TEMPLATE_NO_ACTION,
      minWidth: 900,
    };
  }

  return {
    gridTemplateColumns: TABLE_GRID_TEMPLATE_DEFAULT,
    minWidth: 960,
  };
};

const PublishTableRow = ({
  record,
  hidePlatform,
  hideAction,
  onUnpublish,
  unpublishing,
}: {
  record: PublishRecordItem;
  hidePlatform: boolean;
  hideAction: boolean;
  onUnpublish?: (record: PublishRecordItem) => void;
  unpublishing?: boolean;
}) => {
  const tableLayout = getTableLayout({ hidePlatform, hideAction });

  return (
    <div className={styles['table-row']} style={tableLayout}>
      <div className={styles['cell-project']}>
        <Avatar
          shape="square"
          className={styles['project-avatar']}
          src={record.iconUrl}
          style={{
            background:
              'linear-gradient(180deg, rgba(29,97,240,.14) 0%, rgba(29,97,240,.08) 100%)',
          }}
        >
          <span className={styles['project-avatar-text']}>
            {record.iconText}
          </span>
        </Avatar>
        <div className={styles['project-content']}>
          <div className={styles['project-title-line']}>
            <Typography.Text className={styles['project-title']}>
              {record.name}
            </Typography.Text>
          </div>
          <Typography.Text className={styles['project-desc']}>
            {record.description}
          </Typography.Text>
        </div>
      </div>
      <div className={styles['cell-creator']}>
        <div className={styles['creator-avatar']}>
          {record.creatorIconUrl ? (
            <img
              src={record.creatorIconUrl}
              alt={record.creatorName}
              className={styles['creator-avatar-image']}
            />
          ) : (
            <IconCozPeopleFill
              className={styles['creator-avatar-fallback-icon']}
            />
          )}
        </div>
        <Typography.Text className={styles['creator-name']}>
          {record.creatorName}
        </Typography.Text>
      </div>
      {!hidePlatform ? (
        <div className={styles['cell-platform']}>
          {record.publishPlatforms.length ? (
            <div className={styles['platform-list']}>
              {record.publishPlatforms.map(platform => (
                <span
                  key={`${record.id}-${platform}`}
                  className={styles['platform-pill']}
                >
                  {platform}
                </span>
              ))}
            </div>
          ) : (
            <span className={styles['platform-pill']}>--</span>
          )}
        </div>
      ) : null}
      <Typography.Text className={styles['cell-date']}>
        {record.updatedAt}
      </Typography.Text>
      <Typography.Text className={styles['cell-token']}>
        {record.tokenConsumption.toLocaleString()}
      </Typography.Text>
      {!hideAction ? (
        <div className={styles['cell-action']}>
          {record.status === 'online' ? (
            <button
              type="button"
              className={styles['action-link']}
              disabled={unpublishing}
              onClick={() => onUnpublish?.(record)}
            >
              {unpublishing
                ? I18n.t(
                    'space_config_publish_action_unpublishing',
                    {},
                    '下架中...',
                  )
                : I18n.t('space_config_publish_action_unpublish', {}, '下架')}
            </button>
          ) : (
            <span className={styles['action-placeholder']}>--</span>
          )}
        </div>
      ) : null}
    </div>
  );
};

const PublishListTable = ({
  records,
  hidePlatform,
  hideAction,
  activeSortField,
  activeSortOrder,
  onSortChange,
  onUnpublish,
  unpublishingRecordMap,
}: {
  records: PublishRecordItem[];
  hidePlatform: boolean;
  hideAction: boolean;
  activeSortField: SortField;
  activeSortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
  onUnpublish?: (record: PublishRecordItem) => void;
  unpublishingRecordMap?: Record<string, boolean>;
}) => {
  const tableLayout = getTableLayout({ hidePlatform, hideAction });
  const renderSortArrow = (field: SortField) =>
    activeSortField === field ? (activeSortOrder === 'desc' ? '↓' : '↑') : '↓↑';
  const isSortFieldActive = (field: SortField) => activeSortField === field;

  return (
    <div className={styles['table-wrapper']}>
      <Typography.Text className={styles['table-caption']}>
        {I18n.t('space_config_publish_table_caption', {}, '项目')}
      </Typography.Text>
      <div className={styles['table-header']} style={tableLayout}>
        <Typography.Text className={styles['header-text']}>
          {I18n.t('space_config_publish_table_project', {}, '项目')}
        </Typography.Text>
        <Typography.Text className={styles['header-text']}>
          {I18n.t('space_config_publish_table_creator', {}, '创建人')}
        </Typography.Text>
        {!hidePlatform ? (
          <Typography.Text className={styles['header-text']}>
            {I18n.t('space_config_publish_table_platform', {}, '已发布平台')}
          </Typography.Text>
        ) : null}
        <button
          type="button"
          className={`${styles['sort-header-button']} ${
            isSortFieldActive('updatedAt')
              ? styles['sort-header-button-active']
              : ''
          }`}
          onClick={() => onSortChange('updatedAt')}
        >
          <span>
            {I18n.t('space_config_publish_table_updated', {}, '最近发布时间')}
          </span>
          <span className={styles['sort-header-arrow']}>
            {renderSortArrow('updatedAt')}
          </span>
        </button>
        <button
          type="button"
          className={`${styles['sort-header-button']} ${
            isSortFieldActive('tokenConsumption')
              ? styles['sort-header-button-active']
              : ''
          }`}
          onClick={() => onSortChange('tokenConsumption')}
        >
          <span>
            {I18n.t('space_config_publish_table_token', {}, 'Token消耗')}
          </span>
          <span className={styles['sort-header-arrow']}>
            {renderSortArrow('tokenConsumption')}
          </span>
        </button>
        {!hideAction ? (
          <Typography.Text className={styles['header-text']} />
        ) : null}
      </div>
      <div className={styles['table-body']}>
        {records.map(record => (
          <PublishTableRow
            key={record.id}
            record={record}
            hidePlatform={hidePlatform}
            hideAction={hideAction}
            onUnpublish={onUnpublish}
            unpublishing={Boolean(unpublishingRecordMap?.[record.id])}
          />
        ))}
      </div>
    </div>
  );
};

const PublishListEmpty = ({ scope }: { scope: PublishScopeKey }) => (
  <div className="rounded-[6px] border border-dashed coz-stroke-primary px-[16px] py-[40px] text-center">
    <Typography.Text className="coz-fg-secondary text-[14px]">
      {PUBLISH_SCOPE_EMPTY_TEXT[scope]}
    </Typography.Text>
  </div>
);

const PublishListLoading = () => (
  <div className="rounded-[6px] border border-dashed coz-stroke-primary px-[16px] py-[40px] text-center">
    <Typography.Text className="coz-fg-secondary text-[14px]">
      {I18n.t('space_config_publish_loading', {}, '加载中...')}
    </Typography.Text>
  </div>
);

const usePublishManageState = ({
  unpublishingRecordMap,
  unpublishAgent,
}: {
  unpublishingRecordMap: Record<string, boolean>;
  unpublishAgent: (
    record: PublishRecordItem,
    connectorIds?: string[],
  ) => Promise<boolean>;
}) => {
  const [manageModalRecord, setManageModalRecord] =
    useState<PublishRecordItem | null>(null);
  const [selectedConnectorIDs, setSelectedConnectorIDs] = useState<string[]>(
    [],
  );

  const manageConnectors = useMemo(
    () => manageModalRecord?.publishConnectors || [],
    [manageModalRecord],
  );

  const managingRecordLoading = Boolean(
    manageModalRecord && unpublishingRecordMap[manageModalRecord.id],
  );

  const closeManageModal = useCallback(() => {
    if (managingRecordLoading) {
      return;
    }
    setManageModalRecord(null);
    setSelectedConnectorIDs([]);
  }, [managingRecordLoading]);

  const openManageModal = useCallback((record: PublishRecordItem) => {
    setManageModalRecord(record);
    setSelectedConnectorIDs(
      record.publishConnectors.map(connector => connector.id),
    );
  }, []);

  const toggleConnector = useCallback((connectorID: string) => {
    setSelectedConnectorIDs(prev =>
      prev.includes(connectorID)
        ? prev.filter(id => id !== connectorID)
        : [...prev, connectorID],
    );
  }, []);

  const handleConfirmUnpublish = useCallback(async () => {
    if (!manageModalRecord || !selectedConnectorIDs.length) {
      return;
    }

    const success = await unpublishAgent(
      manageModalRecord,
      selectedConnectorIDs,
    );
    if (success) {
      setManageModalRecord(null);
      setSelectedConnectorIDs([]);
    }
  }, [manageModalRecord, selectedConnectorIDs, unpublishAgent]);

  const clearManageModal = useCallback(() => {
    setManageModalRecord(null);
    setSelectedConnectorIDs([]);
  }, []);

  return {
    manageModalRecord,
    manageConnectors,
    selectedConnectorIDs,
    managingRecordLoading,
    openManageModal,
    closeManageModal,
    toggleConnector,
    handleConfirmUnpublish,
    clearManageModal,
  };
};

export const PublishTabContent = ({ spaceId }: PublishTabContentProps) => {
  const [activeScope, setActiveScope] = useState<PublishScopeKey>('agent');
  const [creatorFilter, setCreatorFilter] = useState<CreatorFilterKey>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSortField, setActiveSortField] =
    useState<SortField>('updatedAt');
  const [activeSortOrder, setActiveSortOrder] = useState<SortOrder>('desc');

  const activeScopeLabel =
    PUBLISH_SCOPE_TABS.find(tab => tab.key === activeScope)?.label ?? '';
  const normalizedKeyword = useMemo(
    () => searchKeyword.trim(),
    [searchKeyword],
  );

  const { loading, records, unpublishingRecordMap, unpublishAgent } =
    usePublishManagement({
      scope: activeScope,
      spaceId,
      creatorFilter,
      keyword: normalizedKeyword,
    });

  const {
    manageModalRecord,
    manageConnectors,
    selectedConnectorIDs,
    managingRecordLoading,
    openManageModal,
    closeManageModal,
    toggleConnector,
    handleConfirmUnpublish,
    clearManageModal,
  } = usePublishManageState({
    unpublishingRecordMap,
    unpublishAgent,
  });

  const sortedRecords = useMemo(() => {
    const nextRecords = [...records];
    const orderFactor = activeSortOrder === 'desc' ? -1 : 1;

    nextRecords.sort((a, b) => {
      const aValue =
        activeSortField === 'updatedAt' ? a.updatedAtValue : a.tokenConsumption;
      const bValue =
        activeSortField === 'updatedAt' ? b.updatedAtValue : b.tokenConsumption;
      if (aValue !== bValue) {
        return (aValue - bValue) * orderFactor;
      }

      if (a.updatedAtValue !== b.updatedAtValue) {
        return b.updatedAtValue - a.updatedAtValue;
      }

      return a.name.localeCompare(b.name, 'zh-Hans-CN');
    });

    return nextRecords;
  }, [activeSortField, activeSortOrder, records]);

  const handleSortChange = useCallback(
    (field: SortField) => {
      if (field === activeSortField) {
        setActiveSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
        return;
      }

      setActiveSortField(field);
      setActiveSortOrder('desc');
    },
    [activeSortField],
  );

  const handleScopeChange = useCallback(
    (scope: PublishScopeKey) => {
      setActiveScope(scope);
      clearManageModal();
    },
    [clearManageModal],
  );

  return (
    <div className="pt-[8px]">
      <div className="rounded-[12px] border border-solid coz-stroke-primary p-[12px]">
        <PublishScopeTabs
          tabs={PUBLISH_SCOPE_TABS}
          activeScope={activeScope}
          onScopeChange={handleScopeChange}
        />
        <PublishFilterBar
          creatorFilter={creatorFilter}
          creatorFilterOptions={CREATOR_FILTER_OPTIONS}
          onCreatorFilterChange={setCreatorFilter}
          searchKeyword={searchKeyword}
          onSearchKeywordChange={setSearchKeyword}
          activeScopeLabel={activeScopeLabel}
        />
        <div className="mt-[12px]">
          {loading ? (
            <PublishListLoading />
          ) : records.length ? (
            <PublishListTable
              records={sortedRecords}
              hidePlatform={activeScope === 'workflow'}
              hideAction={activeScope !== 'agent'}
              activeSortField={activeSortField}
              activeSortOrder={activeSortOrder}
              onSortChange={handleSortChange}
              onUnpublish={openManageModal}
              unpublishingRecordMap={unpublishingRecordMap}
            />
          ) : (
            <PublishListEmpty scope={activeScope} />
          )}
        </div>
      </div>

      <PublishManageModal
        manageModalRecord={manageModalRecord}
        manageConnectors={manageConnectors}
        selectedConnectorIDs={selectedConnectorIDs}
        managingRecordLoading={managingRecordLoading}
        onClose={closeManageModal}
        onConfirm={handleConfirmUnpublish}
        onToggleConnector={toggleConnector}
      />
    </div>
  );
};
