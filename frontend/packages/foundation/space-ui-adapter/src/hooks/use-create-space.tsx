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

import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { SpaceType } from '@coze-foundation/space-ui-base';
import { useSpaceStore } from '@coze-foundation/space-store';
import { I18n } from '@coze-arch/i18n';
import {
  Modal,
  Input,
  Toast,
  Upload,
} from '@coze-arch/coze-design';
import { IconCozEdit, IconCozUpload } from '@coze-arch/coze-design/icons';
import { type FileItem, type UploadProps } from '@coze-arch/bot-semi/Upload';
import { FileBizType } from '@coze-arch/bot-api/developer_api';
import { customUploadRequest } from '@coze-common/biz-components/picture-upload';

import s from './use-create-space.module.less';

export type UploadValue = { uid: string | undefined; url: string }[];

export interface UseCreateSpaceOptions {
  /**
   * 创建成功后是否自动跳转到新空间
   * @default true
   */
  autoNavigate?: boolean;
  /**
   * 创建成功后的回调
   */
  onSuccess?: (spaceId: string) => void;
}

export interface UseCreateSpaceReturnType {
  open: () => void;
  close: () => void;
  node: JSX.Element;
}

export const useCreateSpace = (
  options: UseCreateSpaceOptions = {},
): UseCreateSpaceReturnType => {
  const { autoNavigate = true, onSuccess } = options;
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState<UploadValue>([]);
  const [loading, setLoading] = useState(false);
  const uploadRef = useRef<Upload>(null);

  const createSpace = useSpaceStore(state => state.createSpace);
  const fetchSpaces = useSpaceStore(state => state.fetchSpaces);

  // 自定义上传请求
  const customRequest: UploadProps['customRequest'] = options => {
    customUploadRequest({
      ...options,
      fileBizType: FileBizType.BIZ_BOT_ICON,
      onSuccess: data => {
        options.onSuccess(data);
        setIconUrl([
          {
            uid: data?.upload_uri || '',
            url: data?.upload_url || '',
          },
        ]);
      },
    });
  };

  // TODO: 后续实现团队空间数量限制检查
  // const createdTeamSpaceNum = useSpaceStore(state => state.createdTeamSpaceNum);
  // const maxTeamSpaceNum = useSpaceStore(state => state.maxTeamSpaceNum);
  // const canCreateTeamSpace = useMemo(
  //   () => createdTeamSpaceNum < maxTeamSpaceNum,
  //   [createdTeamSpaceNum, maxTeamSpaceNum],
  // );

  const handleCreate = async () => {
    // 验证空间名称
    if (!spaceName.trim()) {
      Toast.warning(
        I18n.t(
          'team_create_name_placeholder',
          {},
          'Please enter workspace name',
        ),
      );
      return;
    }

    // TODO: 后续添加团队空间数量限制检查
    // if (!canCreateTeamSpace) {
    //   Toast.warning(
    //     I18n.t(
    //       'workspace_create_limit_reached',
    //       { max: maxTeamSpaceNum },
    //       `You have reached the maximum number of team spaces (${maxTeamSpaceNum})`,
    //     ),
    //   );
    //   return;
    // }

    setLoading(true);
    try {
      const result = await createSpace({
        name: spaceName.trim(),
        description: description.trim(),
        icon_uri: iconUrl?.[0]?.url || '',
        space_type: SpaceType.Team,
      });

      // 检查机审结果
      if (result?.check_not_pass) {
        Toast.warning(
          I18n.t(
            'workspace_create_check_failed',
            {},
            'Workspace name or description contains inappropriate content. Please modify and try again.',
          ),
        );
        setLoading(false);
        return;
      }

      // 刷新空间列表，确保新空间在列表中
      console.log('[CreateSpace] Starting to refresh space list after creation');
      console.log('[CreateSpace] Created space result:', result);
      await fetchSpaces(true);

      console.log('[CreateSpace] Space list refreshed, result.id:', result?.id, 'type:', typeof result?.id);

      // 轮询检查新空间是否已在列表中（最多等待5秒）
      let spaceFoundInList = false;
      if (result?.id) {
        let retryCount = 0;
        const maxRetries = 10;
        const checkInterval = 500; // 500ms

        // 确保ID是字符串格式
        const targetSpaceId = String(result.id);
        console.log('[CreateSpace] Target space ID (string):', targetSpaceId);

        while (retryCount < maxRetries) {
          // 重新获取最新的 store 状态
          const spaceStore = useSpaceStore.getState();
          const currentSpaceList = spaceStore.spaceList;

          console.log('[CreateSpace] Retry', retryCount, 'Current space list:',
            currentSpaceList.map(s => ({ id: s.id, idType: typeof s.id, name: s.name }))
          );

          // 尝试两种方式查找：直接查找和字符串匹配
          const spaceExists = spaceStore.checkSpaceID(targetSpaceId);
          const manualCheck = currentSpaceList.some(s => String(s.id) === targetSpaceId);

          console.log('[CreateSpace] Space exists (checkSpaceID):', spaceExists);
          console.log('[CreateSpace] Space exists (manual check):', manualCheck);

          if (spaceExists || manualCheck) {
            // 找到新空间
            spaceFoundInList = true;
            console.log('[CreateSpace] ✅ New space found in list:', targetSpaceId);
            break;
          }

          // 等待后重试
          console.log('[CreateSpace] Space not found, waiting', checkInterval, 'ms before retry');
          await new Promise(resolve => setTimeout(resolve, checkInterval));

          console.log('[CreateSpace] Refreshing space list again...');
          await fetchSpaces(true);
          retryCount++;
        }

        if (!spaceFoundInList) {
          const finalSpaceList = useSpaceStore.getState().spaceList;
          console.error(
            '[CreateSpace] ❌ New space NOT found in list after', maxRetries, 'retries.',
            '\nTarget Space ID:', targetSpaceId, '(type:', typeof targetSpaceId, ')',
            '\nCurrent space list IDs:', finalSpaceList.map(s => `${s.id} (${typeof s.id})`),
            '\nCurrent space list:', finalSpaceList.map(s => ({ id: s.id, name: s.name }))
          );
        }
      }

      Toast.success(
        I18n.t(
          'workspace_creation_success',
          {},
          'Workspace created successfully',
        ),
      );

      // 关闭弹窗并清空表单
      setVisible(false);
      setSpaceName('');
      setDescription('');
      setIconUrl([]);

      // 创建成功后的处理
      if (result?.id && spaceFoundInList) {
        console.log('[CreateSpace] Proceeding with navigation, space found in list');
        onSuccess?.(result.id);

        // 自动跳转到新创建的空间
        if (autoNavigate) {
          // 先设置当前空间
          try {
            const spaceStore = useSpaceStore.getState();
            const targetSpaceId = String(result.id);
            console.log('[CreateSpace] Setting current space to:', targetSpaceId);
            spaceStore.setSpace(targetSpaceId);
            console.log('[CreateSpace] ✅ Current space set successfully');
          } catch (e) {
            console.error('[CreateSpace] ❌ Failed to set current space:', e);
            // 即使设置失败也尝试跳转，让路由处理
          }

          // 使用 setTimeout 确保状态更新完成
          const targetUrl = `/space/${result.id}/develop`;
          console.log('[CreateSpace] Navigating to:', targetUrl);
          setTimeout(() => {
            navigate(targetUrl);
          }, 100);
        }
      } else if (result?.id && !spaceFoundInList) {
        console.warn('[CreateSpace] Space not found, showing refresh prompt');
        // 如果空间没有在列表中找到，提示用户刷新页面
        Toast.info(
          I18n.t(
            'workspace_created_please_refresh',
            {},
            'Workspace created successfully. Please refresh the page to see the new workspace.',
          ),
        );
        onSuccess?.(result.id);
      }
    } catch (error) {
      const errorMessage =
        (error as Error)?.message ||
        I18n.t('workspace_creation_failed', {}, 'Failed to create workspace');

      Toast.error(errorMessage);
      console.error('Create space error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setSpaceName('');
    setDescription('');
    setIconUrl([]);
  };

  const node = (
    <Modal
      visible={visible}
      title={I18n.t(
        'enterprise_workspace_management_create_space_title',
        {},
        'Create Workspace',
      )}
      okText={I18n.t('Confirm', {}, 'Confirm')}
      cancelText={I18n.t('Cancel', {}, 'Cancel')}
      centered
      confirmLoading={loading}
      onOk={handleCreate}
      onCancel={handleCancel}
    >
      <div className="py-[12px]">
        {/* 工作空间图标（可选） */}
        <div className="mb-[16px]">
          <div className="mb-[8px] text-[14px] coz-fg-primary">
            {I18n.t('workspace_icon', {}, 'Workspace Icon')}
            <span className="ml-[4px] text-[12px] coz-fg-tertiary">
              ({I18n.t('Optional', {}, 'Optional')})
            </span>
          </div>
          <Upload
            action=""
            className={s.upload}
            limit={1}
            customRequest={customRequest}
            fileList={iconUrl}
            accept=".jpeg,.jpg,.png,.gif"
            showReplace={false}
            showUploadList={false}
            ref={uploadRef}
            maxSize={2 * 1024}
            onSizeError={() => {
              Toast.error({
                content: I18n.t(
                  'dataset_upload_image_warning',
                  {},
                  'Please upload an image less than 2MB',
                ),
                showClose: false,
              });
            }}
          >
            <div className={s['avatar-wrap']}>
              {iconUrl[0]?.url ? (
                <img
                  src={iconUrl[0].url}
                  alt="workspace icon"
                  className={s.avatar}
                />
              ) : (
                <div className={s.placeholder}>
                  <IconCozUpload className="text-[32px] coz-fg-tertiary" />
                </div>
              )}
              <div className={s.mask}>
                <div className="relative inline-flex">
                  <IconCozEdit className="text-[24px]" />
                </div>
              </div>
            </div>
          </Upload>
        </div>

        {/* 空间名称 */}
        <div className="mb-[16px]">
          <div className="mb-[8px] text-[14px] coz-fg-primary">
            {I18n.t('team_create_name', {}, 'Workspace Name')}
            <span className="text-[#f53f3f] ml-[4px]">*</span>
          </div>
          <Input
            value={spaceName}
            onChange={value => setSpaceName(value)}
            placeholder={I18n.t(
              'team_create_name_placeholder',
              {},
              'Please enter workspace name',
            )}
            maxLength={50}
            showClear
          />
        </div>

        {/* 空间描述（可选） */}
        <div>
          <div className="mb-[8px] text-[14px] coz-fg-primary">
            {I18n.t('workspace_description', {}, 'Description')}
            <span className="ml-[4px] text-[12px] coz-fg-tertiary">
              ({I18n.t('Optional', {}, 'Optional')})
            </span>
          </div>
          <textarea
            className="w-full p-[8px] border border-[#e0e0e0] rounded-[4px] text-[14px] coz-fg-primary resize-none focus:border-[#3370ff] focus:outline-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={I18n.t(
              'workspace_description_placeholder',
              {},
              'Enter workspace description',
            )}
            maxLength={200}
            rows={3}
            style={{
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>
    </Modal>
  );

  return {
    node,
    open: () => {
      setVisible(true);
    },
    close: handleCancel,
  };
};
