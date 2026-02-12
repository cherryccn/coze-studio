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

// Constants for class code generation
export const CODE_GENERATION = {
  PREFIX: 'CLASS-',
  START_INDEX: 2,
  END_INDEX: 8,
  BASE: 36,
} as const;

/**
 * Generate a random class code
 */
export const generateClassCode = (): string => {
  const randomPart = Math.random()
    .toString(CODE_GENERATION.BASE)
    .substring(CODE_GENERATION.START_INDEX, CODE_GENERATION.END_INDEX)
    .toUpperCase();
  return `${CODE_GENERATION.PREFIX}${randomPart}`;
};
