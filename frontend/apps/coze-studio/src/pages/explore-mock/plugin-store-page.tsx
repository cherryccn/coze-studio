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

import { useMemo, useState, type CSSProperties } from 'react';

import { I18n } from '@coze-arch/i18n';
import { IconCozMagnifier } from '@coze-arch/coze-design/icons';
import {
  Avatar,
  Button,
  Input,
  Modal,
  Tag,
  Typography,
} from '@coze-arch/coze-design';

import {
  PLUGIN_CATEGORY_OPTIONS,
  PLUGIN_STORE_MOCK_DATA,
  type PluginAuthMode,
  type PluginCategory,
  type PluginStoreItem,
} from './store-mock-data';

import styles from './explore-store.module.less';

const authModeMeta: Record<
  PluginAuthMode,
  {
    label: string;
  }
> = {
  none: {
    label: I18n.t('mock_plugin_auth_none', {}, '免授权'),
  },
  'need-auth': {
    label: I18n.t('mock_plugin_auth_need', {}, '需授权'),
  },
  configured: {
    label: I18n.t('mock_plugin_auth_configured', {}, '已配置'),
  },
};

const formatInstallCount = (count: number) => count.toLocaleString('zh-CN');

const sourceMeta = {
  local: {
    label: I18n.t('mock_plugin_store_local_tab', {}, '本地插件'),
    style: {
      backgroundColor: 'rgba(var(--coze-brand-1), var(--coze-brand-1-alpha))',
      borderColor: 'rgba(var(--coze-brand-5), 0.18)',
      color: 'rgba(var(--coze-brand-5), 1)',
    },
  },
  coze: {
    label: I18n.t('mock_plugin_store_coze_tab', {}, 'Coze 插件'),
    style: {
      backgroundColor: '#E8F7EE',
      borderColor: '#B7E3C6',
      color: '#1E8E4D',
    },
  },
} as const;

const authModeStyleMap: Record<PluginAuthMode, CSSProperties> = {
  none: {
    backgroundColor: '#F2F3F5',
    borderColor: '#D8DDE4',
    color: '#4E5969',
  },
  'need-auth': {
    backgroundColor: '#FFF5E6',
    borderColor: '#FFD8A8',
    color: '#AD6800',
  },
  configured: {
    backgroundColor: 'rgba(var(--coze-brand-1), var(--coze-brand-1-alpha))',
    borderColor: 'rgba(var(--coze-brand-5), 0.18)',
    color: 'rgba(var(--coze-brand-5), 1)',
  },
};

const PluginCard = ({
  item,
  onOpenDetail,
  onInstall,
}: {
  item: PluginStoreItem;
  onOpenDetail: () => void;
  onInstall: () => void;
}) => (
  <div
    className={`group ${styles['plugin-card']}`}
    onClick={onOpenDetail}
    role="button"
    tabIndex={0}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenDetail();
      }
    }}
  >
    <div className={styles['plugin-head']}>
      <Avatar shape="square" className={styles['plugin-avatar']}>
        {item.name.slice(0, 1)}
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px] flex-wrap">
          <Typography.Text
            className={`min-w-0 truncate ${styles['card-title']}`}
          >
            {item.name}
          </Typography.Text>
          <span
            className={styles['label-pill']}
            style={sourceMeta[item.source].style}
          >
            {sourceMeta[item.source].label}
          </span>
          <span
            className={styles['label-pill']}
            style={authModeStyleMap[item.authMode]}
          >
            {authModeMeta[item.authMode].label}
          </span>
        </div>

        <Typography.Text
          className={`block line-clamp-2 ${styles['card-desc']}`}
        >
          {item.description}
        </Typography.Text>
      </div>
    </div>

    <div className={styles['plugin-tag-list']}>
      {item.tags.map(tag => (
        <Tag
          key={tag}
          size="mini"
          color="primary"
          className={styles['plugin-feature-tag']}
        >
          {tag}
        </Tag>
      ))}
    </div>

    <div className={styles['plugin-footer']}>
      <Typography.Text className={styles['card-meta']}>
        {I18n.t(
          'mock_plugin_store_meta',
          {
            author: item.authorName,
            count: formatInstallCount(item.installCount),
            rating: item.rating.toFixed(1),
          },
          `${item.authorName} · ${formatInstallCount(item.installCount)} 安装 · ${item.rating.toFixed(1)} 分`,
        )}
      </Typography.Text>

      <div className="mt-[6px]">
        {item.installed ? (
          <Button disabled className="w-full">
            {I18n.t('mock_plugin_installed', {}, '已安装')}
          </Button>
        ) : (
          <Button
            color="primary"
            className="w-full"
            onClick={event => {
              event.stopPropagation();
              onInstall();
            }}
          >
            {I18n.t('mock_plugin_install', {}, '安装')}
          </Button>
        )}
      </div>
    </div>
  </div>
);

const PluginSummary = ({
  summary,
}: {
  summary: Array<{ key: string; label: string; value: number }>;
}) => (
  <div className={styles['stats-row']}>
    {summary.map(item => (
      <div key={item.key} className={styles['stats-card']}>
        <Typography.Text className={styles['stats-label']}>
          {item.label}
        </Typography.Text>
        <Typography.Text className={styles['stats-value']}>
          {item.value}
        </Typography.Text>
      </div>
    ))}
  </div>
);

const PluginFilterBar = ({
  category,
  keyword,
  onCategoryChange,
  onKeywordChange,
}: {
  category: PluginCategory;
  keyword: string;
  onCategoryChange: (value: PluginCategory) => void;
  onKeywordChange: (value: string) => void;
}) => {
  const getSmallTabClassName = (isActive: boolean) =>
    `${styles['store-tab']} ${styles['tab-sm']} ${
      isActive ? styles['store-tab-active'] : styles['store-tab-inactive']
    }`;

  return (
    <div className="px-[20px] py-[12px] flex flex-wrap items-center justify-between gap-[12px]">
      <div className="flex flex-wrap items-center gap-[8px]">
        {PLUGIN_CATEGORY_OPTIONS.map(option => {
          const isActive = option.value === category;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onCategoryChange(option.value)}
              className={getSmallTabClassName(isActive)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <Input
        className="w-[280px]"
        value={keyword}
        onChange={onKeywordChange}
        showClear
        prefix={<IconCozMagnifier className="coz-fg-secondary" />}
        placeholder={I18n.t(
          'mock_plugin_search_placeholder',
          {},
          '搜索插件名称、描述或作者',
        )}
      />
    </div>
  );
};

const PluginDetailModal = ({
  plugin,
  onClose,
  onInstall,
}: {
  plugin: PluginStoreItem | null;
  onClose: () => void;
  onInstall: (pluginId: string) => void;
}) => (
  <Modal
    visible={Boolean(plugin)}
    title={plugin?.name}
    onCancel={onClose}
    onOk={onClose}
    okText={I18n.t('confirm', {}, '确定')}
    cancelText={I18n.t('cancel')}
  >
    {plugin ? (
      <div className="flex flex-col gap-[10px]">
        <Typography.Text className={styles['card-desc']}>
          {plugin.description}
        </Typography.Text>
        <div className="flex flex-wrap gap-[6px]">
          {plugin.tags.map(tag => (
            <Tag key={tag} size="mini" color="primary">
              {tag}
            </Tag>
          ))}
        </div>
        <Typography.Text className={styles['card-meta']}>
          {I18n.t(
            'mock_plugin_store_meta',
            {
              author: plugin.authorName,
              count: formatInstallCount(plugin.installCount),
              rating: plugin.rating.toFixed(1),
            },
            `${plugin.authorName} · ${formatInstallCount(plugin.installCount)} 安装 · ${plugin.rating.toFixed(1)} 分`,
          )}
        </Typography.Text>
        <div className="flex items-center gap-[8px] pt-[4px]">
          {plugin.installed ? (
            <Button disabled>
              {I18n.t('mock_plugin_installed', {}, '已安装')}
            </Button>
          ) : (
            <Button color="primary" onClick={() => onInstall(plugin.id)}>
              {I18n.t('mock_plugin_install', {}, '安装')}
            </Button>
          )}
        </div>
      </div>
    ) : null}
  </Modal>
);

export const PluginStorePage = () => {
  const [category, setCategory] = useState<PluginCategory>('all');
  const [keyword, setKeyword] = useState('');
  const [detailPlugin, setDetailPlugin] = useState<PluginStoreItem | null>(
    null,
  );
  const [installedMap, setInstalledMap] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        PLUGIN_STORE_MOCK_DATA.map(item => [item.id, item.installed]),
      ),
  );

  const pluginList = useMemo(
    () =>
      PLUGIN_STORE_MOCK_DATA.map(item => ({
        ...item,
        installed: installedMap[item.id] ?? item.installed,
      })),
    [installedMap],
  );

  const filteredList = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return pluginList.filter(item => {
      const matchesCategory = category === 'all' || item.category === category;
      const searchContent = [item.name, item.description, item.authorName]
        .join(' ')
        .toLowerCase();
      const matchesKeyword =
        !normalizedKeyword || searchContent.includes(normalizedKeyword);
      return matchesCategory && matchesKeyword;
    });
  }, [category, keyword, pluginList]);

  const pluginSummary = useMemo(() => {
    const installedCount = pluginList.filter(item => item.installed).length;
    const needAuthCount = pluginList.filter(
      item => item.authMode === 'need-auth',
    ).length;

    return [
      {
        key: 'total',
        label: I18n.t('mock_plugin_summary_total', {}, '插件总数'),
        value: pluginList.length,
      },
      {
        key: 'installed',
        label: I18n.t('mock_plugin_summary_installed', {}, '已安装'),
        value: installedCount,
      },
      {
        key: 'needAuth',
        label: I18n.t('mock_plugin_summary_auth', {}, '需授权'),
        value: needAuthCount,
      },
    ];
  }, [pluginList]);

  const handleInstall = (pluginId: string) => {
    setInstalledMap(prev => ({
      ...prev,
      [pluginId]: true,
    }));
  };

  return (
    <div className="px-[24px] pb-[24px] pt-[8px]">
      <div className={`${styles['store-panel']} mt-[12px]`}>
        <div className={styles['panel-header']}>
          <Typography.Title heading={4} className={styles['panel-title']}>
            {I18n.t('mock_plugin_store_title', {}, '插件商店')}
          </Typography.Title>
          <Typography.Text className={styles['panel-desc']}>
            {I18n.t(
              'mock_plugin_store_desc',
              {},
              '仿照 Coze Studio 官方插件商店布局，支持分类筛选、搜索与安装态展示。',
            )}
          </Typography.Text>
        </div>
        <div className={styles['inset-divider']} />

        <PluginSummary summary={pluginSummary} />

        <PluginFilterBar
          category={category}
          keyword={keyword}
          onCategoryChange={setCategory}
          onKeywordChange={setKeyword}
        />
        <div className={styles['inset-divider']} />

        <div className={styles['list-container']}>
          {filteredList.length ? (
            <div className="grid grid-cols-3 auto-rows-min gap-[20px] [@media(min-width:1600px)]:grid-cols-4 [@media(max-width:1280px)]:grid-cols-2 [@media(max-width:860px)]:grid-cols-1">
              {filteredList.map(item => (
                <PluginCard
                  key={item.id}
                  item={item}
                  onOpenDetail={() => setDetailPlugin(item)}
                  onInstall={() => handleInstall(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed coz-stroke-primary py-[48px] text-center">
              <Typography.Text className="coz-fg-secondary text-[14px]">
                {I18n.t(
                  'mock_plugin_store_empty',
                  {},
                  '没有匹配的插件，试试更换筛选条件',
                )}
              </Typography.Text>
            </div>
          )}
        </div>
      </div>

      <PluginDetailModal
        plugin={detailPlugin}
        onClose={() => setDetailPlugin(null)}
        onInstall={handleInstall}
      />
    </div>
  );
};

export default PluginStorePage;
