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

// Export types
export {
  ClassStatus,
  MemberRole,
  type Class,
  type ClassMember,
  type InviteCode,
  type CreateClassRequest,
  type UpdateClassRequest,
  type AddMembersRequest,
  type CreateInviteCodeRequest,
} from './types';

// Export API functions
export {
  createClass,
  getMyClasses,
  getClass,
  updateClass,
  deleteClass,
  addClassMembers,
  getClassMembers,
  removeClassMember,
  createInviteCode,
  getInviteCodes,
  deactivateInviteCode,
} from './api/class';

// Export hooks
export { useClasses } from './hooks/use-classes';
export { useClassDetail } from './hooks/use-class-detail';
export { useClassMembers } from './hooks/use-class-members';
export { useInviteCodes } from './hooks/use-invite-codes';

// Export components
export { default as ClassForm } from './components/class-form';

// Export pages
export { default as ClassList } from './pages/class-list';
export { default as ClassDetail } from './pages/class-detail';
