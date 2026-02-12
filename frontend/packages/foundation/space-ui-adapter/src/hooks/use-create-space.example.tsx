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

/**
 * 使用示例：添加工作空间功能
 *
 * 本文件展示了如何使用 useCreateSpace hook 实现添加工作空间的功能
 */

import React from 'react';
import { Button } from '@coze-arch/coze-design';
import { useCreateSpace } from './use-create-space';

/**
 * 示例1: 基础用法
 * 创建成功后自动跳转到新空间
 */
export const BasicUsageExample = () => {
  const { node, open, canCreateTeamSpace } = useCreateSpace();

  return (
    <>
      <Button
        onClick={open}
        disabled={!canCreateTeamSpace}
      >
        添加工作空间
      </Button>
      {node}
    </>
  );
};

/**
 * 示例2: 自定义行为
 * 创建成功后执行自定义回调，不自动跳转
 */
export const CustomBehaviorExample = () => {
  const { node, open, canCreateTeamSpace } = useCreateSpace({
    autoNavigate: false,
    onSuccess: (spaceId) => {
      console.log('Created space:', spaceId);
      // 可以在这里执行自定义逻辑
      // 例如：发送统计事件、显示欢迎引导等
    },
  });

  return (
    <>
      <Button
        onClick={open}
        disabled={!canCreateTeamSpace}
      >
        {canCreateTeamSpace ? '添加工作空间' : '已达上限'}
      </Button>
      {node}
    </>
  );
};

/**
 * 示例3: 在下拉菜单中使用
 * 配合 SpaceSwitcherDropdown 组件使用
 */
export const DropdownMenuExample = () => {
  const {
    node: createSpaceModal,
    open: openCreateSpaceModal,
    canCreateTeamSpace
  } = useCreateSpace({
    autoNavigate: true,
    onSuccess: (spaceId) => {
      console.log('Workspace created successfully:', spaceId);
    },
  });

  const handleAddSpace = () => {
    if (!canCreateTeamSpace) {
      // 如果达到上限，可以显示提示或引导用户删除旧空间
      console.warn('Cannot create more team spaces');
      return;
    }
    openCreateSpaceModal();
  };

  return (
    <>
      <div onClick={handleAddSpace}>
        添加工作空间
      </div>
      {createSpaceModal}
    </>
  );
};

/**
 * 示例4: 检查创建权限
 * 在打开模态框前进行额外的权限检查
 */
export const PermissionCheckExample = () => {
  const { node, open, canCreateTeamSpace } = useCreateSpace();

  const handleOpenWithPermissionCheck = async () => {
    // 1. 检查团队空间数量限制
    if (!canCreateTeamSpace) {
      alert('您已达到团队空间创建上限');
      return;
    }

    // 2. 可以在这里添加额外的权限检查
    // const hasPermission = await checkUserPermission('create_workspace');
    // if (!hasPermission) {
    //   alert('您没有创建工作空间的权限');
    //   return;
    // }

    // 3. 所有检查通过，打开创建模态框
    open();
  };

  return (
    <>
      <Button onClick={handleOpenWithPermissionCheck}>
        添加工作空间
      </Button>
      {node}
    </>
  );
};

/**
 * 示例5: 与 useSpaceStore 配合使用
 * 实时监控空间数量变化
 */
export const StoreIntegrationExample = () => {
  const { node, open, canCreateTeamSpace } = useCreateSpace();

  // 从 store 获取实时数据
  const { createdTeamSpaceNum, maxTeamSpaceNum } = useSpaceStore(
    state => ({
      createdTeamSpaceNum: state.createdTeamSpaceNum,
      maxTeamSpaceNum: state.maxTeamSpaceNum,
    })
  );

  return (
    <>
      <div>
        <div>团队空间: {createdTeamSpaceNum} / {maxTeamSpaceNum}</div>
        <Button
          onClick={open}
          disabled={!canCreateTeamSpace}
        >
          添加工作空间
        </Button>
      </div>
      {node}
    </>
  );
};

/**
 * API 返回值说明
 *
 * useCreateSpace(options) 返回：
 * {
 *   node: JSX.Element              - 创建空间的模态框组件
 *   open: () => void              - 打开模态框的函数
 *   close: () => void             - 关闭模态框的函数
 *   canCreateTeamSpace: boolean   - 是否可以创建团队空间
 * }
 *
 * options 参数：
 * {
 *   autoNavigate?: boolean        - 创建成功后是否自动跳转，默认 true
 *   onSuccess?: (spaceId: string) => void  - 创建成功后的回调函数
 * }
 */
