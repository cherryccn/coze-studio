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

import { type FC, useCallback, useMemo, useState } from 'react';

import { useSpaceStore } from '@coze-foundation/space-store-adapter';
import { usePlatformManagementAccess } from '@coze-foundation/account-adapter';
import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import { Button, Select, Tabs, Typography } from '@coze-arch/coze-design';

import type {
  FilterSummaryItem,
  PlatformFilters,
  ProjectTypeKey,
  TimeRangeKey,
} from './platform-management-modules/types';
import { StatsPanel } from './platform-management-modules/stats-panel';
import { FilterSummaryChips } from './platform-management-modules/filter-summary-chips';
import { BillingRecordsPanel } from './platform-management-modules/billing-records-panel';
import { BillingOverviewPanel } from './platform-management-modules/billing-overview-panel';
import { BillingBudgetsPanel } from './platform-management-modules/billing-budgets-panel';

const { TabPane } = Tabs;

interface PlatformManagementTab {
  key: string;
  label: string;
  placeholder: string;
}

interface SpaceOptionSource {
  id?: string | number;
  space_id?: string | number;
  name?: string;
}

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

const DEFAULT_FILTERS: PlatformFilters = {
  timeRange: 'last_7_days',
  spaceId: 'all',
  projectType: 'all',
};

const TIME_RANGE_OPTION_DEFS: Array<{
  value: TimeRangeKey;
  i18nKey: string;
  fallback: string;
}> = [
  {
    value: 'today',
    i18nKey: 'platform_management_filter_time_today',
    fallback: '今天',
  },
  {
    value: 'last_7_days',
    i18nKey: 'platform_management_filter_time_7d',
    fallback: '近7天',
  },
  {
    value: 'last_30_days',
    i18nKey: 'platform_management_filter_time_30d',
    fallback: '近30天',
  },
  {
    value: 'custom',
    i18nKey: 'platform_management_filter_time_custom',
    fallback: '自定义',
  },
];

const PROJECT_TYPE_OPTION_DEFS: Array<{
  value: ProjectTypeKey;
  i18nKey: string;
  fallback: string;
}> = [
  {
    value: 'all',
    i18nKey: 'platform_management_filter_project_all',
    fallback: '全部',
  },
  {
    value: 'agent',
    i18nKey: 'platform_management_filter_project_agent',
    fallback: '智能体',
  },
  {
    value: 'app',
    i18nKey: 'platform_management_filter_project_app',
    fallback: '应用',
  },
  {
    value: 'workflow',
    i18nKey: 'platform_management_filter_project_workflow',
    fallback: '工作流',
  },
];

interface PlatformFilterBarProps {
  filters: PlatformFilters;
  timeRangeOptions: Array<{ value: TimeRangeKey; label: string }>;
  spaceOptions: Array<{ value: string; label: string }>;
  projectTypeOptions: Array<{ value: ProjectTypeKey; label: string }>;
  onFilterChange: (patch: Partial<PlatformFilters>) => void;
  onReset: () => void;
}

const PlatformFilterBar: FC<PlatformFilterBarProps> = ({
  filters,
  timeRangeOptions,
  spaceOptions,
  projectTypeOptions,
  onFilterChange,
  onReset,
}) => (
  <div className="coz-mg-card rounded-[12px] px-[16px] py-[12px] border border-solid coz-stroke-primary mb-[16px]">
    <div className="flex flex-wrap items-center gap-[12px]">
      <Select
        className="w-[160px]"
        value={filters.timeRange}
        optionList={timeRangeOptions}
        onChange={value => onFilterChange({ timeRange: value as TimeRangeKey })}
      />
      <Select
        className="w-[180px]"
        value={filters.spaceId}
        optionList={spaceOptions}
        onChange={value => onFilterChange({ spaceId: String(value) })}
      />
      <Select
        className="w-[160px]"
        value={filters.projectType}
        optionList={projectTypeOptions}
        onChange={value =>
          onFilterChange({ projectType: value as ProjectTypeKey })
        }
      />
      <Button
        onClick={onReset}
        className="px-[16px] border border-solid coz-stroke-primary"
        style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
      >
        {tNoOptions('platform_management_filter_reset', '重置')}
      </Button>
    </div>
  </div>
);

interface PlatformTabPlaceholderProps {
  description: string;
  filterSummary: FilterSummaryItem[];
}

const PlatformTabPlaceholder: FC<PlatformTabPlaceholderProps> = ({
  description,
  filterSummary,
}) => (
  <div className="py-[20px] flex flex-col gap-[12px]">
    <Typography.Text className="coz-fg-secondary">
      {description}
    </Typography.Text>
    <FilterSummaryChips filterSummary={filterSummary} />
  </div>
);

const buildPlatformTabs = (): PlatformManagementTab[] => [
  {
    key: 'billing',
    label: tNoOptions('platform_management_tab_billing', '计费管理'),
    placeholder: tNoOptions(
      'platform_management_tab_billing_placeholder',
      '计费管理页面骨架已创建，后续将接入筛选区与数据卡片。',
    ),
  },
  {
    key: 'stats',
    label: tNoOptions('platform_management_tab_stats', '统计模块'),
    placeholder: tNoOptions(
      'platform_management_tab_stats_placeholder',
      '统计模块页面骨架已创建，后续将接入趋势图与排行榜。',
    ),
  },
];

const PlatformManagementNoPermission: FC = () => (
  <div className="w-full h-full px-[24px] py-[24px]">
    <div className="max-w-[1200px]">
      <Typography.Title heading={3} className="mb-[20px]">
        {tNoOptions('platform_management_menu_title', '平台管理')}
      </Typography.Title>
      <div className="coz-mg-card rounded-[12px] px-[16px] py-[24px] border border-solid coz-stroke-primary">
        <Typography.Text className="coz-fg-secondary block">
          {tNoOptions(
            'platform_management_no_permission',
            '暂无权限查看平台管理内容',
          )}
        </Typography.Text>
      </div>
    </div>
  </div>
);

const buildSpaceOptions = (spaceList: SpaceOptionSource[] | undefined) => {
  const options: Array<{ value: string; label: string }> = [
    {
      value: 'all',
      label: tNoOptions('platform_management_filter_space_all', '全部空间'),
    },
  ];

  (spaceList ?? []).forEach(space => {
    const id = String(space.id ?? space.space_id ?? '');
    if (!id) {
      return;
    }
    options.push({
      value: id,
      label: space.name || id,
    });
  });

  return options;
};

const buildFilterSummary = ({
  filters,
  projectTypeOptions,
  spaceOptionMap,
  timeRangeOptions,
}: {
  filters: PlatformFilters;
  projectTypeOptions: Array<{ value: ProjectTypeKey; label: string }>;
  spaceOptionMap: Map<string, string>;
  timeRangeOptions: Array<{ value: TimeRangeKey; label: string }>;
}): FilterSummaryItem[] => {
  const timeRangeLabel =
    timeRangeOptions.find(option => option.value === filters.timeRange)
      ?.label ?? filters.timeRange;
  const projectTypeLabel =
    projectTypeOptions.find(option => option.value === filters.projectType)
      ?.label ?? filters.projectType;
  const spaceLabel =
    spaceOptionMap.get(filters.spaceId) ?? filters.spaceId ?? '-';

  return [
    {
      key: 'timeRange',
      label: tNoOptions('platform_management_filter_label_time', '时间范围'),
      value: timeRangeLabel,
    },
    {
      key: 'space',
      label: tNoOptions('platform_management_filter_label_space', '空间'),
      value: spaceLabel,
    },
    {
      key: 'projectType',
      label: tNoOptions('platform_management_filter_label_project', '项目类型'),
      value: projectTypeLabel,
    },
  ];
};

const PlatformManagementPage: FC = () => {
  const spaceList = useSpaceStore(state => state.spaceList);
  const hasPlatformManagementAccess = usePlatformManagementAccess();
  const tabs = useMemo(() => buildPlatformTabs(), []);

  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? 'billing');
  const [filters, setFilters] = useState<PlatformFilters>(DEFAULT_FILTERS);

  const timeRangeOptions = useMemo(
    () =>
      TIME_RANGE_OPTION_DEFS.map(option => ({
        value: option.value,
        label: tNoOptions(option.i18nKey, option.fallback),
      })),
    [],
  );

  const projectTypeOptions = useMemo(
    () =>
      PROJECT_TYPE_OPTION_DEFS.map(option => ({
        value: option.value,
        label: tNoOptions(option.i18nKey, option.fallback),
      })),
    [],
  );

  const spaceOptions = useMemo(
    () => buildSpaceOptions((spaceList ?? []) as SpaceOptionSource[]),
    [spaceList],
  );

  const spaceOptionMap = useMemo(
    () =>
      spaceOptions.reduce<Map<string, string>>((acc, option) => {
        acc.set(option.value, option.label);
        return acc;
      }, new Map<string, string>()),
    [spaceOptions],
  );

  const handleFilterChange = useCallback((patch: Partial<PlatformFilters>) => {
    setFilters(previous => ({
      ...previous,
      ...patch,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filterSummary = useMemo<FilterSummaryItem[]>(
    () =>
      buildFilterSummary({
        filters,
        projectTypeOptions,
        spaceOptionMap,
        timeRangeOptions,
      }),
    [filters, projectTypeOptions, spaceOptionMap, timeRangeOptions],
  );

  if (!hasPlatformManagementAccess) {
    return <PlatformManagementNoPermission />;
  }

  return (
    <div className="w-full h-full px-[24px] py-[24px]">
      <div className="max-w-[1200px]">
        <Typography.Title heading={3} className="mb-[20px]">
          {tNoOptions('platform_management_page_title', '平台管理')}
        </Typography.Title>
        <PlatformFilterBar
          filters={filters}
          timeRangeOptions={timeRangeOptions}
          spaceOptions={spaceOptions}
          projectTypeOptions={projectTypeOptions}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />
        <div className="coz-mg-card rounded-[12px] px-[16px] py-[12px] border border-solid coz-stroke-primary">
          <Tabs
            activeKey={activeTab}
            onChange={key => setActiveTab(String(key))}
          >
            {tabs.map(tab => (
              <TabPane tab={tab.label} itemKey={tab.key} key={tab.key}>
                {tab.key === 'billing' ? (
                  <div className="flex flex-col gap-[16px]">
                    <BillingOverviewPanel
                      filters={filters}
                      filterSummary={filterSummary}
                      onResetFilters={handleReset}
                    />
                    <BillingRecordsPanel
                      filters={filters}
                      onResetFilters={handleReset}
                    />
                    <BillingBudgetsPanel
                      selectedSpaceId={filters.spaceId}
                      spaceOptions={spaceOptions}
                      onResetFilters={handleReset}
                    />
                  </div>
                ) : tab.key === 'stats' ? (
                  <StatsPanel
                    filters={filters}
                    filterSummary={filterSummary}
                    onResetFilters={handleReset}
                  />
                ) : (
                  <PlatformTabPlaceholder
                    description={tab.placeholder}
                    filterSummary={filterSummary}
                  />
                )}
              </TabPane>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PlatformManagementPage;
