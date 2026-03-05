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

import { useCallback, useEffect, useState } from 'react';

import { I18n } from '@coze-arch/i18n';
import { Toast } from '@coze-arch/coze-design';
import { WorkFlowStatus, WorkflowMode } from '@coze-arch/bot-api/workflow_api';
import {
  IntelligenceStatus,
  IntelligenceType,
  SearchScope,
} from '@coze-arch/bot-api/intelligence_api';
import { intelligenceApi, workflowApi } from '@coze-arch/bot-api';

import {
  formatDateTime,
  getIconText,
  isSuccessCode,
  parseTimestampValue,
  parseTokenConsumption,
  resolveWorkflowIconURL,
} from './publish-management-utils';

export type PublishScopeKey = 'agent' | 'app' | 'workflow';
export type PublishRecordStatus = 'online' | 'draft' | 'offline';
export type CreatorFilterKey = 'all' | 'mine';

export interface PublishConnectorItem {
  id: string;
  name: string;
}

export interface PublishRecordItem {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  creatorIconUrl?: string;
  iconText: string;
  iconUrl?: string;
  publishPlatforms: string[];
  publishConnectorIds: string[];
  publishConnectors: PublishConnectorItem[];
  updatedAt: string;
  updatedAtValue: number;
  tokenConsumption: number;
  status: PublishRecordStatus;
}

const DEFAULT_PAGE_SIZE = 100;

const extractPublishConnectors = (
  connectors?: Array<{ id?: string; name?: string }>,
): PublishConnectorItem[] => {
  const connectorMap = new Map<string, PublishConnectorItem>();
  (connectors || []).forEach(connector => {
    const connectorID = connector?.id?.trim();
    if (!connectorID) {
      return;
    }
    const connectorName = connector?.name?.trim() || connectorID;
    if (!connectorMap.has(connectorID)) {
      connectorMap.set(connectorID, {
        id: connectorID,
        name: connectorName,
      });
    }
  });
  return Array.from(connectorMap.values());
};

const toAppStatus = (
  status?: IntelligenceStatus,
  hasPublished?: boolean,
): PublishRecordStatus => {
  if (status === IntelligenceStatus.Deleted) {
    return 'offline';
  }
  return hasPublished ? 'online' : 'draft';
};

const toWorkflowStatus = (status?: WorkFlowStatus): PublishRecordStatus => {
  if (status === WorkFlowStatus.Deleted) {
    return 'offline';
  }
  return status === WorkFlowStatus.HadPublished ? 'online' : 'draft';
};

const loadAgentRecords = async ({
  spaceId,
  creatorFilter,
  keyword,
}: {
  spaceId: string;
  creatorFilter: CreatorFilterKey;
  keyword: string;
}): Promise<PublishRecordItem[]> => {
  const response = await intelligenceApi.GetDraftIntelligenceList({
    space_id: spaceId,
    name: keyword || undefined,
    types: [IntelligenceType.Bot],
    status: [
      IntelligenceStatus.Using,
      IntelligenceStatus.Banned,
      IntelligenceStatus.MoveFailed,
      IntelligenceStatus.Deleted,
    ],
    search_scope:
      creatorFilter === 'mine' ? SearchScope.CreateByMe : SearchScope.All,
    size: DEFAULT_PAGE_SIZE,
  });

  if (!isSuccessCode(response?.code)) {
    throw new Error(response?.msg || 'load publish agents failed');
  }

  return (response?.data?.intelligences || [])
    .map<PublishRecordItem>(item => {
      const publishConnectors = extractPublishConnectors(
        item.publish_info?.connectors,
      );
      const updatedAtRaw =
        item.basic_info?.publish_time ||
        item.basic_info?.update_time ||
        item.basic_info?.create_time;
      const totalToken = parseTokenConsumption(
        (item as unknown as { total_token?: string }).total_token,
        (item.publish_info as unknown as { total_token?: string } | undefined)
          ?.total_token,
      );

      return {
        id: item.basic_info?.id || '',
        name: item.basic_info?.name || '--',
        description: item.basic_info?.description || '--',
        creatorName:
          item.owner_info?.nickname ||
          item.owner_info?.user_unique_name ||
          '--',
        creatorIconUrl: item.owner_info?.avatar_url,
        iconText: getIconText(item.basic_info?.name),
        iconUrl: item.basic_info?.icon_url,
        publishPlatforms: publishConnectors.map(connector => connector.name),
        publishConnectorIds: publishConnectors.map(connector => connector.id),
        publishConnectors,
        updatedAt: formatDateTime(updatedAtRaw),
        updatedAtValue: parseTimestampValue(updatedAtRaw),
        tokenConsumption: totalToken,
        status: toAppStatus(
          item.basic_info?.status,
          item.publish_info?.has_published,
        ),
      };
    })
    .filter(item => item.id);
};

const loadAppRecords = async ({
  spaceId,
  creatorFilter,
  keyword,
}: {
  spaceId: string;
  creatorFilter: CreatorFilterKey;
  keyword: string;
}): Promise<PublishRecordItem[]> => {
  const response = await intelligenceApi.GetDraftIntelligenceList({
    space_id: spaceId,
    name: keyword || undefined,
    types: [IntelligenceType.Project],
    status: [
      IntelligenceStatus.Using,
      IntelligenceStatus.Banned,
      IntelligenceStatus.MoveFailed,
      IntelligenceStatus.Deleted,
    ],
    search_scope:
      creatorFilter === 'mine' ? SearchScope.CreateByMe : SearchScope.All,
    size: DEFAULT_PAGE_SIZE,
  });

  if (!isSuccessCode(response?.code)) {
    throw new Error(response?.msg || 'load publish apps failed');
  }

  return (response?.data?.intelligences || [])
    .map<PublishRecordItem>(item => {
      const publishConnectors = extractPublishConnectors(
        item.publish_info?.connectors,
      );
      const updatedAtRaw =
        item.basic_info?.publish_time ||
        item.basic_info?.update_time ||
        item.basic_info?.create_time;
      const totalToken = parseTokenConsumption(
        (item as unknown as { total_token?: string }).total_token,
        (item.publish_info as unknown as { total_token?: string } | undefined)
          ?.total_token,
      );

      return {
        id: item.basic_info?.id || '',
        name: item.basic_info?.name || '--',
        description: item.basic_info?.description || '--',
        creatorName:
          item.owner_info?.nickname ||
          item.owner_info?.user_unique_name ||
          '--',
        creatorIconUrl: item.owner_info?.avatar_url,
        iconText: getIconText(item.basic_info?.name),
        iconUrl: item.basic_info?.icon_url,
        publishPlatforms: publishConnectors.map(connector => connector.name),
        publishConnectorIds: publishConnectors.map(connector => connector.id),
        publishConnectors,
        updatedAt: formatDateTime(updatedAtRaw),
        updatedAtValue: parseTimestampValue(updatedAtRaw),
        tokenConsumption: totalToken,
        status: toAppStatus(
          item.basic_info?.status,
          item.publish_info?.has_published,
        ),
      };
    })
    .filter(item => item.id);
};

const loadWorkflowRecords = async ({
  spaceId,
  creatorFilter,
  keyword,
}: {
  spaceId: string;
  creatorFilter: CreatorFilterKey;
  keyword: string;
}): Promise<PublishRecordItem[]> => {
  const response = await workflowApi.GetWorkFlowList({
    space_id: spaceId,
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    name: keyword || undefined,
    login_user_create: creatorFilter === 'mine' ? true : undefined,
    flow_mode: WorkflowMode.Workflow,
  });

  if (!isSuccessCode(response?.code)) {
    throw new Error(response?.msg || 'load publish workflows failed');
  }

  return (response?.data?.workflow_list || [])
    .filter(item =>
      creatorFilter === 'mine' ? Boolean(item.creator?.self) : true,
    )
    .map<PublishRecordItem>(item => {
      const updatedAtRaw = item.update_time || item.create_time;
      const workflowItem = item as unknown as {
        total_token?: string | number;
        token?: string | number;
        usage?: { token?: string | number };
        input_token?: string | number;
        output_token?: string | number;
      };
      const totalToken = parseTokenConsumption(
        workflowItem.total_token,
        workflowItem.token,
        workflowItem.usage?.token,
        Number(workflowItem.input_token || 0) +
          Number(workflowItem.output_token || 0),
      );

      return {
        id: item.workflow_id || '',
        name: item.name || '--',
        description: item.desc || '--',
        creatorName:
          item.creator?.name || item.creator?.user_unique_name || '--',
        creatorIconUrl: item.creator?.avatar_url,
        iconText: getIconText(item.name),
        iconUrl: resolveWorkflowIconURL(item),
        publishPlatforms: [],
        publishConnectorIds: [],
        publishConnectors: [],
        updatedAt: formatDateTime(updatedAtRaw),
        updatedAtValue: parseTimestampValue(updatedAtRaw),
        tokenConsumption: totalToken,
        status: toWorkflowStatus(item.status),
      };
    })
    .filter(item => item.id);
};

const loadPublishRecordsByScope = async ({
  scope,
  spaceId,
  creatorFilter,
  keyword,
}: {
  scope: PublishScopeKey;
  spaceId: string;
  creatorFilter: CreatorFilterKey;
  keyword: string;
}): Promise<PublishRecordItem[]> => {
  if (scope === 'agent') {
    return loadAgentRecords({ spaceId, creatorFilter, keyword });
  }

  if (scope === 'app') {
    return loadAppRecords({ spaceId, creatorFilter, keyword });
  }

  return loadWorkflowRecords({ spaceId, creatorFilter, keyword });
};

const usePublishRecordList = ({
  scope,
  spaceId,
  creatorFilter,
  keyword,
}: {
  scope: PublishScopeKey;
  spaceId?: string;
  creatorFilter: CreatorFilterKey;
  keyword: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<PublishRecordItem[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadRecords = async () => {
      if (!spaceId) {
        setRecords([]);
        return;
      }
      setLoading(true);
      try {
        const nextRecords = await loadPublishRecordsByScope({
          scope,
          spaceId,
          creatorFilter,
          keyword,
        });
        if (!cancelled) {
          setRecords(nextRecords);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'load publish list failed';
        if (!cancelled) {
          setRecords([]);
          Toast.error(
            I18n.t(
              'space_config_publish_load_failed',
              { message },
              '发布列表加载失败，请稍后重试',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadRecords();
    return () => {
      cancelled = true;
    };
  }, [scope, spaceId, creatorFilter, keyword, refreshVersion]);

  const refreshRecords = useCallback(() => {
    setRefreshVersion(version => version + 1);
  }, []);

  return {
    loading,
    records,
    refreshRecords,
  };
};

export const usePublishManagement = ({
  scope,
  spaceId,
  creatorFilter,
  keyword,
}: {
  scope: PublishScopeKey;
  spaceId?: string;
  creatorFilter: CreatorFilterKey;
  keyword: string;
}) => {
  const { loading, records, refreshRecords } = usePublishRecordList({
    scope,
    spaceId,
    creatorFilter,
    keyword,
  });
  const [unpublishingRecordMap, setUnpublishingRecordMap] = useState<
    Record<string, boolean>
  >({});

  const unpublishAgent = useCallback(
    async (record: PublishRecordItem, connectorIds?: string[]) => {
      if (scope !== 'agent') {
        return false;
      }

      if (!record.id) {
        return false;
      }

      const targetConnectorIDs = (
        connectorIds?.length ? connectorIds : record.publishConnectorIds
      ).filter(Boolean);

      if (!targetConnectorIDs.length) {
        Toast.warning(
          I18n.t(
            'space_config_publish_unpublish_no_connector',
            {},
            '当前智能体没有可下架的发布渠道',
          ),
        );
        return false;
      }

      setUnpublishingRecordMap(prev => ({ ...prev, [record.id]: true }));
      try {
        const response = await intelligenceApi.PublishIntelligenceUnList({
          intelligence_id: record.id,
          connector_ids: targetConnectorIDs,
          intelligence_type: IntelligenceType.Bot,
        });

        if (Number(response?.code) === 404) {
          throw new Error(
            I18n.t(
              'space_config_publish_unpublish_api_not_found',
              {},
              '下架接口未找到（404），请重启后端并确认已同步最新代码',
            ),
          );
        }

        if (!isSuccessCode(response?.code)) {
          throw new Error(response?.msg || 'unpublish agent failed');
        }

        const resultMap = response?.data?.connector_unlist_result_map || {};
        const failedReason = targetConnectorIDs
          .map(connectorID => resultMap?.[connectorID])
          .find(item => item && item.is_success === false)?.fail_reason;

        if (failedReason) {
          throw new Error(failedReason);
        }

        Toast.success(
          I18n.t(
            'space_config_publish_unpublish_success',
            {},
            '智能体下架成功',
          ),
        );
        refreshRecords();
        return true;
      } catch (error) {
        const rawMessage =
          error instanceof Error ? error.message : 'unpublish agent failed';
        const normalizedMessage = rawMessage.toLowerCase();
        const message =
          normalizedMessage.includes('404') ||
          normalizedMessage.includes('not found')
            ? I18n.t(
                'space_config_publish_unpublish_api_not_found',
                {},
                '下架接口未找到（404），请重启后端并确认已同步最新代码',
              )
            : rawMessage;
        Toast.error(
          I18n.t(
            'space_config_publish_unpublish_failed',
            { message },
            `智能体下架失败：${message}`,
          ),
        );
        return false;
      } finally {
        setUnpublishingRecordMap(prev => ({ ...prev, [record.id]: false }));
      }
    },
    [refreshRecords, scope],
  );

  return {
    loading,
    records,
    unpublishingRecordMap,
    unpublishAgent,
  };
};
