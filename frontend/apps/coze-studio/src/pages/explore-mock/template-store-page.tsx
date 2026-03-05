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

import { useMemo, useState } from 'react';

import { I18n } from '@coze-arch/i18n';
import { IconCozMagnifier } from '@coze-arch/coze-design/icons';
import {
  Button,
  Input,
  Modal,
  Tag,
  Toast,
  Typography,
} from '@coze-arch/coze-design';

import {
  TEMPLATE_CATEGORY_OPTIONS,
  TEMPLATE_STORE_MOCK_DATA,
  type TemplateCategory,
  type TemplateStoreItem,
} from './store-mock-data';

import styles from './explore-store.module.less';

const formatCount = (value: number) => value.toLocaleString('zh-CN');

const TemplateCard = ({
  item,
  onOpenDetail,
  onUse,
}: {
  item: TemplateStoreItem;
  onOpenDetail: () => void;
  onUse: () => void;
}) => (
  <div
    className={`group ${styles['template-card']}`}
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
    <div
      className="h-[132px] px-[14px] py-[12px] flex items-end justify-between"
      style={{ background: item.coverGradient }}
    >
      {item.isOfficial ? (
        <span
          className={`inline-flex h-[22px] items-center rounded-full px-[8px] text-[12px] font-[500] leading-[18px] bg-[rgba(255,255,255,0.78)] ${styles['card-primary-tag']}`}
        >
          {I18n.t('mock_store_official', {}, '官方精选')}
        </span>
      ) : (
        <span />
      )}
      <span className={styles['card-meta']}>
        {I18n.t(
          'mock_template_store_usage_count',
          { count: formatCount(item.usageCount) },
          `${formatCount(item.usageCount)} 使用`,
        )}
      </span>
    </div>

    <div className={styles['template-body']}>
      <div>
        <Typography.Text className={`block truncate ${styles['card-title']}`}>
          {item.name}
        </Typography.Text>
        <Typography.Text
          className={`block line-clamp-2 ${styles['card-desc']}`}
        >
          {item.description}
        </Typography.Text>
      </div>

      <div className="flex flex-wrap gap-[6px]">
        {item.tags.map(tag => (
          <Tag key={tag} size="mini" color="primary">
            {tag}
          </Tag>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Typography.Text className={styles['card-meta']}>
          {I18n.t(
            'mock_template_store_author',
            { name: item.authorName },
            `作者：${item.authorName}`,
          )}
        </Typography.Text>
        <Typography.Text className={styles['card-meta']}>
          {I18n.t(
            'mock_template_store_favorite_count',
            { count: formatCount(item.favoriteCount) },
            `${formatCount(item.favoriteCount)} 收藏`,
          )}
        </Typography.Text>
      </div>

      <div className={styles['template-footer']}>
        <Button
          color="primary"
          className="w-full"
          onClick={event => {
            event.stopPropagation();
            onUse();
          }}
        >
          {I18n.t('mock_template_store_use_now', {}, '立即使用')}
        </Button>
      </div>
    </div>
  </div>
);

const TemplateDetailModal = ({
  template,
  onClose,
  onUse,
}: {
  template: TemplateStoreItem | null;
  onClose: () => void;
  onUse: () => void;
}) => (
  <Modal
    visible={Boolean(template)}
    title={template?.name}
    onCancel={onClose}
    onOk={onUse}
    okText={I18n.t('mock_template_store_use_now', {}, '立即使用')}
    cancelText={I18n.t('cancel')}
  >
    {template ? (
      <div className="flex flex-col gap-[10px]">
        <div
          className="h-[140px] rounded-[8px]"
          style={{ background: template.coverGradient }}
        />
        <Typography.Text className={styles['card-desc']}>
          {template.description}
        </Typography.Text>
        <div className="flex flex-wrap gap-[6px]">
          {template.tags.map(tag => (
            <Tag key={tag} size="mini" color="primary">
              {tag}
            </Tag>
          ))}
        </div>
        <Typography.Text className={styles['card-meta']}>
          {I18n.t(
            'mock_template_store_author',
            { name: template.authorName },
            `作者：${template.authorName}`,
          )}
          {' · '}
          {I18n.t(
            'mock_template_store_usage_count',
            { count: formatCount(template.usageCount) },
            `${formatCount(template.usageCount)} 使用`,
          )}
          {' · '}
          {I18n.t(
            'mock_template_store_favorite_count',
            { count: formatCount(template.favoriteCount) },
            `${formatCount(template.favoriteCount)} 收藏`,
          )}
        </Typography.Text>
      </div>
    ) : null}
  </Modal>
);

export const TemplateStorePage = () => {
  const [category, setCategory] = useState<TemplateCategory>('all');
  const [keyword, setKeyword] = useState('');
  const [detailTemplate, setDetailTemplate] =
    useState<TemplateStoreItem | null>(null);

  const filteredList = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return TEMPLATE_STORE_MOCK_DATA.filter(item => {
      const matchesCategory = category === 'all' || item.category === category;
      const searchContent = [item.name, item.description, item.authorName]
        .join(' ')
        .toLowerCase();
      const matchesKeyword =
        !normalizedKeyword || searchContent.includes(normalizedKeyword);
      return matchesCategory && matchesKeyword;
    });
  }, [category, keyword]);

  const getTabClassName = (isActive: boolean) =>
    `${styles['store-tab']} ${
      isActive ? styles['store-tab-active'] : styles['store-tab-inactive']
    }`;

  const handleUseTemplate = (templateName: string) => {
    Toast.success({
      content: I18n.t(
        'mock_template_store_use_success',
        { name: templateName },
        `已使用模板：${templateName}`,
      ),
      showClose: false,
    });
    setDetailTemplate(null);
  };

  return (
    <div className="px-[24px] pb-[24px] pt-[8px]">
      <div className={`${styles['store-panel']} mt-[12px]`}>
        <div className={styles['panel-header']}>
          <Typography.Title heading={4} className={styles['panel-title']}>
            {I18n.t('mock_template_store_title', {}, '模板商店')}
          </Typography.Title>
          <Typography.Text className={styles['panel-desc']}>
            {I18n.t(
              'mock_template_store_desc',
              {},
              '仿照 Coze Studio 官方模板页的布局与层次，用于本地联调与页面演示。',
            )}
          </Typography.Text>
        </div>

        <div
          className={`${styles['toolbar-row']} flex flex-wrap items-center justify-between gap-[12px]`}
        >
          <div className="flex flex-wrap items-center gap-[8px]">
            {TEMPLATE_CATEGORY_OPTIONS.map(option => {
              const isActive = option.value === category;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={getTabClassName(isActive)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <Input
            className="w-[280px]"
            value={keyword}
            onChange={setKeyword}
            showClear
            prefix={<IconCozMagnifier className="coz-fg-secondary" />}
            placeholder={I18n.t(
              'mock_template_store_search_placeholder',
              {},
              '搜索模板名称、描述或作者',
            )}
          />
        </div>

        <div className={styles['list-container']}>
          {filteredList.length ? (
            <div className="grid grid-cols-3 auto-rows-min gap-[20px] [@media(min-width:1600px)]:grid-cols-4 [@media(max-width:1280px)]:grid-cols-2 [@media(max-width:860px)]:grid-cols-1">
              {filteredList.map(item => (
                <TemplateCard
                  key={item.id}
                  item={item}
                  onOpenDetail={() => setDetailTemplate(item)}
                  onUse={() => handleUseTemplate(item.name)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed coz-stroke-primary py-[48px] text-center">
              <Typography.Text className="coz-fg-secondary text-[14px]">
                {I18n.t(
                  'mock_template_store_empty',
                  {},
                  '没有匹配的模板，试试更换筛选条件',
                )}
              </Typography.Text>
            </div>
          )}
        </div>
      </div>

      <TemplateDetailModal
        template={detailTemplate}
        onClose={() => setDetailTemplate(null)}
        onUse={() => {
          if (detailTemplate) {
            handleUseTemplate(detailTemplate.name);
          }
        }}
      />
    </div>
  );
};

export default TemplateStorePage;
