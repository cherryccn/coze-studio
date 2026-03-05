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

export type InviteStatusKey =
  | 'joined'
  | 'pending'
  | 'rejected'
  | 'revoked'
  | 'expired';

export type InviteFilterKey = 'all' | InviteStatusKey;

export interface InviteRecordItem {
  id: string;
  nickname: string;
  username: string;
  status: InviteStatusKey;
  inviteTime: string;
}

export interface InviteFilterOption {
  key: InviteFilterKey;
  i18nKey: string;
  fallback: string;
}

export interface AddMemberCandidateItem {
  id: string;
  nickname: string;
  username: string;
  iconUrl?: string;
  isJoined: boolean;
  isInviting: boolean;
}
