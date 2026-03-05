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
import {
  IconCozArrowDown,
  IconCozArrowRight,
} from '@coze-arch/coze-design/icons';
import {
  Button,
  Slider,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from '@coze-arch/coze-design';

import {
  CONTEXT_RANGE_MARKS,
  DEFAULT_CONTEXT_RANGE,
  INITIAL_FILTER_COLLAPSE_STATE,
  MODEL_FAMILY_OPTIONS,
  MODEL_STATUS_OPTIONS,
  MODEL_TAG_OPTIONS,
  MOCK_MODELS,
  USER_RIGHTS_OPTIONS,
  createInitialFilterValues,
  getContextLengthLevel,
  type FilterSectionKey,
  type ModelFilterValues,
  type OptionFilterKey,
  type SpaceModelItem,
} from './model-filter-config';
import { ModelFilterBar } from './model-filter-bar';

import styles from './models-tab-content.module.less';

interface FilterSectionProps {
  title: string;
  options: string[];
  selectedValues: string[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleOption: (value: string) => void;
}

interface ContextRangeFilterSectionProps {
  title: string;
  collapsed: boolean;
  selectedRange: [number, number];
  onToggleCollapse: () => void;
  onRangeChange: (value: [number, number]) => void;
}

const FilterSection = ({
  title,
  options,
  selectedValues,
  collapsed,
  onToggleCollapse,
  onToggleOption,
}: FilterSectionProps) => (
  <section className="py-[2px]">
    <button
      type="button"
      className="w-full appearance-none border-0 bg-transparent p-0 flex items-center gap-[6px] py-[2px] text-left"
      onClick={onToggleCollapse}
    >
      {collapsed ? (
        <IconCozArrowRight className="text-[14px] coz-fg-secondary shrink-0" />
      ) : (
        <IconCozArrowDown className="text-[14px] coz-fg-secondary shrink-0" />
      )}
      <Typography.Text className="text-[14px] font-[700] leading-[22px] coz-fg-primary">
        {title}
      </Typography.Text>
    </button>
    {collapsed ? null : (
      <div className="mt-[8px] pl-[20px] flex flex-col gap-[8px]">
        {options.map(option => {
          const isSelected = selectedValues.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggleOption(option)}
              className="w-full appearance-none border-0 bg-transparent p-0 flex items-center gap-[8px] text-left"
            >
              <span
                className={[
                  'h-[14px] w-[14px] shrink-0 rounded-full transition-colors',
                  isSelected
                    ? 'border-0'
                    : 'bg-transparent border border-solid coz-stroke-primary',
                ].join(' ')}
                style={
                  isSelected
                    ? { backgroundColor: 'rgba(var(--coze-brand-5))' }
                    : undefined
                }
              />
              <span className="text-[14px] font-[400] leading-[22px] coz-fg-primary">
                {option}
              </span>
            </button>
          );
        })}
      </div>
    )}
  </section>
);

const ContextRangeFilterSection = ({
  title,
  collapsed,
  selectedRange,
  onToggleCollapse,
  onRangeChange,
}: ContextRangeFilterSectionProps) => (
  <section className="py-[2px]">
    <button
      type="button"
      className="w-full appearance-none border-0 bg-transparent p-0 flex items-center gap-[6px] py-[2px] text-left"
      onClick={onToggleCollapse}
    >
      {collapsed ? (
        <IconCozArrowRight className="text-[14px] coz-fg-secondary shrink-0" />
      ) : (
        <IconCozArrowDown className="text-[14px] coz-fg-secondary shrink-0" />
      )}
      <Typography.Text className="text-[14px] font-[700] leading-[22px] coz-fg-primary">
        {title}
      </Typography.Text>
    </button>
    {collapsed ? null : (
      <div
        className={`mt-[12px] pl-[20px] pr-[4px] pb-[22px] ${styles['context-slider']}`}
      >
        <Slider
          range
          min={0}
          max={3}
          step={1}
          marks={CONTEXT_RANGE_MARKS}
          value={selectedRange}
          onChange={value => {
            if (!Array.isArray(value) || value.length !== 2) {
              return;
            }
            const min = Math.min(value[0], value[1]);
            const max = Math.max(value[0], value[1]);
            onRangeChange([min, max] as [number, number]);
          }}
        />
      </div>
    )}
  </section>
);

interface ModelListItemProps {
  model: SpaceModelItem;
  onToggleModelSwitch: (modelId: string, enabled: boolean) => void;
}

const ModelListItem = ({ model, onToggleModelSwitch }: ModelListItemProps) => (
  <article className="group rounded-[12px] border border-solid coz-stroke-primary p-[16px] transition-colors hover:coz-mg-secondary">
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-start justify-between gap-[12px]">
        <Typography.Text className="min-w-0 flex-1 text-[16px] font-[600] leading-[24px] coz-fg-primary">
          {model.name}
        </Typography.Text>
        <Tooltip
          theme="dark"
          trigger="hover"
          position="top"
          content={I18n.t(
            'space_config_model_enable_in_space',
            {},
            '可配置到空间',
          )}
        >
          <span className="inline-flex items-center p-[4px]">
            <Switch
              size="small"
              checked={model.enabledInSpace}
              onChange={(checked: boolean) =>
                onToggleModelSwitch(model.id, checked)
              }
            />
          </span>
        </Tooltip>
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {model.modelTags.map(tag => (
          <Tag
            key={tag}
            size="mini"
            color="primary"
            className="!bg-transparent !border border-solid coz-stroke-plus"
          >
            {tag}
          </Tag>
        ))}
      </div>
      <Typography.Text className="text-[13px] leading-[20px] coz-fg-secondary">
        {model.description}
      </Typography.Text>
      <div className="mt-[2px] flex items-center justify-between gap-[12px]">
        <div className="min-w-0 flex flex-wrap items-center gap-y-[4px] text-[12px] leading-[20px] coz-fg-dim">
          <span className="whitespace-nowrap">
            {I18n.t(
              'space_config_model_meta_context_length',
              { contextLength: model.contextLength },
              `上下文长度：${model.contextLength}`,
            )}
          </span>
          <span className="mx-[8px] coz-fg-dim">·</span>
          <span className="whitespace-nowrap">{model.provider}</span>
          <span className="mx-[8px] coz-fg-dim">·</span>
          <span className="whitespace-nowrap">
            {I18n.t(
              'space_config_model_meta_updated_at',
              { updateTime: model.updatedAt },
              `${model.updatedAt} 更新`,
            )}
          </span>
        </div>
        <button
          type="button"
          style={{ height: 38, minHeight: 38 }}
          className="shrink-0 inline-flex items-center rounded-[8px] border border-solid border-transparent px-[14px] text-[12px] font-[500] leading-[20px] coz-fg-secondary coz-mg-secondary opacity-0 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:pointer-events-auto hover:coz-mg-secondary-hovered hover:coz-fg-primary active:coz-mg-secondary-pressed"
        >
          <span>
            {I18n.t('space_config_model_view_detail', {}, '查看详情')}
          </span>
        </button>
      </div>
    </div>
  </article>
);

interface ModelFilterSidebarProps {
  hasActiveFilters: boolean;
  filterValues: ModelFilterValues;
  contextRange: [number, number];
  filterCollapseState: Record<FilterSectionKey, boolean>;
  onResetFilter: () => void;
  onToggleFilterSection: (key: FilterSectionKey) => void;
  onToggleFilterValue: (key: OptionFilterKey, value: string) => void;
  onContextRangeChange: (value: [number, number]) => void;
}

const ModelFilterSidebar = ({
  hasActiveFilters,
  filterValues,
  contextRange,
  filterCollapseState,
  onResetFilter,
  onToggleFilterSection,
  onToggleFilterValue,
  onContextRangeChange,
}: ModelFilterSidebarProps) => (
  <aside className="shrink-0 w-[260px] rounded-[12px] border border-solid coz-stroke-primary p-[12px]">
    <div className="mb-[10px] flex items-center justify-between gap-[8px]">
      <Typography.Text className="text-[14px] font-[600] leading-[20px] coz-fg-primary">
        {I18n.t('space_config_model_filter_title', {}, '筛选功能')}
      </Typography.Text>
      <Button
        color="secondary"
        size="small"
        disabled={!hasActiveFilters}
        onClick={onResetFilter}
      >
        {I18n.t('space_config_model_filter_clear', {}, '清空筛选')}
      </Button>
    </div>
    <div className="flex flex-col gap-[20px]">
      <FilterSection
        title={I18n.t('space_config_model_filter_user_rights', {}, '用户权益')}
        options={USER_RIGHTS_OPTIONS}
        selectedValues={filterValues.userRights}
        collapsed={filterCollapseState.userRights}
        onToggleCollapse={() => onToggleFilterSection('userRights')}
        onToggleOption={value => onToggleFilterValue('userRights', value)}
      />
      <FilterSection
        title={I18n.t('space_config_model_filter_status', {}, '模型状态')}
        options={MODEL_STATUS_OPTIONS}
        selectedValues={filterValues.modelStatus}
        collapsed={filterCollapseState.modelStatus}
        onToggleCollapse={() => onToggleFilterSection('modelStatus')}
        onToggleOption={value => onToggleFilterValue('modelStatus', value)}
      />
      <ContextRangeFilterSection
        title={I18n.t(
          'space_config_model_filter_context_length',
          {},
          '上下文长度',
        )}
        collapsed={filterCollapseState.contextLength}
        selectedRange={contextRange}
        onToggleCollapse={() => onToggleFilterSection('contextLength')}
        onRangeChange={onContextRangeChange}
      />
      <FilterSection
        title={I18n.t('space_config_model_filter_tag', {}, '模型标签')}
        options={MODEL_TAG_OPTIONS}
        selectedValues={filterValues.modelTag}
        collapsed={filterCollapseState.modelTag}
        onToggleCollapse={() => onToggleFilterSection('modelTag')}
        onToggleOption={value => onToggleFilterValue('modelTag', value)}
      />
      <FilterSection
        title={I18n.t('space_config_model_filter_family', {}, '模型家族')}
        options={MODEL_FAMILY_OPTIONS}
        selectedValues={filterValues.modelFamily}
        collapsed={filterCollapseState.modelFamily}
        onToggleCollapse={() => onToggleFilterSection('modelFamily')}
        onToggleOption={value => onToggleFilterValue('modelFamily', value)}
      />
    </div>
  </aside>
);

const filterModels = ({
  models,
  keyword,
  filterValues,
  contextRange,
}: {
  models: SpaceModelItem[];
  keyword: string;
  filterValues: ModelFilterValues;
  contextRange: [number, number];
}) =>
  models.filter(model => {
    const searchContent = [
      model.name,
      model.description,
      model.provider,
      model.modelFamily,
      model.userRights,
      model.modelStatus,
      model.modelTags.join(' '),
    ]
      .join(' ')
      .toLowerCase();

    const contextLevel = getContextLengthLevel(model.contextLength);

    const matchesSearch = !keyword || searchContent.includes(keyword);
    const matchesUserRights =
      filterValues.userRights.length === 0 ||
      filterValues.userRights.includes(model.userRights);
    const matchesModelStatus =
      filterValues.modelStatus.length === 0 ||
      filterValues.modelStatus.includes(model.modelStatus);
    const matchesContextLength =
      contextLevel >= contextRange[0] && contextLevel <= contextRange[1];
    const matchesModelTag =
      filterValues.modelTag.length === 0 ||
      filterValues.modelTag.some(tag => model.modelTags.includes(tag));
    const matchesModelFamily =
      filterValues.modelFamily.length === 0 ||
      filterValues.modelFamily.includes(model.modelFamily);

    return (
      matchesSearch &&
      matchesUserRights &&
      matchesModelStatus &&
      matchesContextLength &&
      matchesModelTag &&
      matchesModelFamily
    );
  });

export const ModelsTabContent = () => {
  const [modelSearchKeyword, setModelSearchKeyword] = useState('');
  const [models, setModels] = useState<SpaceModelItem[]>(MOCK_MODELS);
  const [filterValues, setFilterValues] = useState<ModelFilterValues>(
    createInitialFilterValues,
  );
  const [contextRange, setContextRange] = useState<[number, number]>(
    DEFAULT_CONTEXT_RANGE,
  );
  const [filterCollapseState, setFilterCollapseState] = useState<
    Record<FilterSectionKey, boolean>
  >(INITIAL_FILTER_COLLAPSE_STATE);

  const normalizedKeyword = modelSearchKeyword.trim().toLowerCase();

  const filteredModels = useMemo(
    () =>
      filterModels({
        models,
        keyword: normalizedKeyword,
        filterValues,
        contextRange,
      }),
    [contextRange, filterValues, models, normalizedKeyword],
  );

  const hasActiveFilters = useMemo(() => {
    const hasActiveOptionFilter = Object.values(filterValues).some(
      values => values.length > 0,
    );

    const isContextRangeDefault =
      contextRange[0] === DEFAULT_CONTEXT_RANGE[0] &&
      contextRange[1] === DEFAULT_CONTEXT_RANGE[1];

    return hasActiveOptionFilter || !isContextRangeDefault;
  }, [contextRange, filterValues]);

  const handleToggleFilterValue = (key: OptionFilterKey, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: [value],
    }));
  };

  const handleToggleFilterSection = (key: FilterSectionKey) => {
    setFilterCollapseState(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleModelSwitch = (modelId: string, enabled: boolean) => {
    setModels(prev =>
      prev.map(model =>
        model.id === modelId ? { ...model, enabledInSpace: enabled } : model,
      ),
    );
  };

  const handleResetFilters = () => {
    setFilterValues(createInitialFilterValues());
    setContextRange(DEFAULT_CONTEXT_RANGE);
  };

  return (
    <div className="flex flex-col gap-[12px] pt-[8px]">
      <ModelFilterBar
        resultCount={filteredModels.length}
        searchKeyword={modelSearchKeyword}
        onSearchKeywordChange={setModelSearchKeyword}
      />
      <div className="rounded-[12px] border border-solid coz-stroke-primary p-[12px]">
        <div className="flex items-start gap-[16px]">
          <div className="min-w-0 flex-1 flex flex-col gap-[12px]">
            {filteredModels.length ? (
              filteredModels.map(model => (
                <ModelListItem
                  key={model.id}
                  model={model}
                  onToggleModelSwitch={handleToggleModelSwitch}
                />
              ))
            ) : (
              <div className="rounded-[12px] border border-dashed coz-stroke-primary px-[16px] py-[32px] text-center">
                <Typography.Text className="coz-fg-secondary text-[13px]">
                  {I18n.t(
                    'space_config_model_empty_search_result',
                    {},
                    '暂无符合条件的模型，请调整筛选条件后重试。',
                  )}
                </Typography.Text>
              </div>
            )}
          </div>
          <ModelFilterSidebar
            hasActiveFilters={hasActiveFilters}
            filterValues={filterValues}
            contextRange={contextRange}
            filterCollapseState={filterCollapseState}
            onResetFilter={handleResetFilters}
            onToggleFilterSection={handleToggleFilterSection}
            onToggleFilterValue={handleToggleFilterValue}
            onContextRangeChange={setContextRange}
          />
        </div>
      </div>
    </div>
  );
};
