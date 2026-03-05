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

import { type FC } from 'react';

import { I18n } from '@coze-arch/i18n';
import { IconCozEmpty } from '@coze-arch/coze-design/icons';
import { Typography } from '@coze-arch/coze-design';

const TaskPage: FC = () => (
  <div className="w-full h-full flex flex-col items-center justify-center py-[120px]">
    <IconCozEmpty className="w-[56px] h-[56px] coz-fg-dim" />
    <Typography.Title heading={4} className="mt-[12px]">
      {I18n.t('task_center_title', {}, '任务中心')}
    </Typography.Title>
    <Typography.Text className="mt-[4px] coz-fg-secondary">
      {I18n.t(
        'task_center_coming_soon',
        {},
        '任务中心页面尚未开放，可按需补充实现。',
      )}
    </Typography.Text>
  </div>
);

export default TaskPage;
