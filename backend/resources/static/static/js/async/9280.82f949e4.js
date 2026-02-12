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

"use strict";(self.webpackChunk_coze_studio_app=self.webpackChunk_coze_studio_app||[]).push([["9280"],{137004:function(e,a,t){t.r(a);let o=Object.freeze(JSON.parse('{"displayName":"Desktop","name":"desktop","patterns":[{"include":"#layout"},{"include":"#keywords"},{"include":"#values"},{"include":"#inCommands"},{"include":"#inCategories"}],"repository":{"inCategories":{"patterns":[{"match":"(?<=^Categories.*)AudioVideo|(?<=^Categories.*)Audio|(?<=^Categories.*)Video|(?<=^Categories.*)Development|(?<=^Categories.*)Education|(?<=^Categories.*)Game|(?<=^Categories.*)Graphics|(?<=^Categories.*)Network|(?<=^Categories.*)Office|(?<=^Categories.*)Science|(?<=^Categories.*)Settings|(?<=^Categories.*)System|(?<=^Categories.*)Utility","name":"markup.bold"}]},"inCommands":{"patterns":[{"match":"(?<=^Exec.*\\\\s)-+\\\\S+","name":"variable.parameter"},{"match":"(?<=^Exec.*)\\\\s%[FUcfiku]\\\\s","name":"variable.language"},{"match":"\\".*\\"","name":"string"}]},"keywords":{"patterns":[{"match":"^(?:Type|Version|Name|GenericName|NoDisplay|Comment|Icon|Hidden|OnlyShowIn|NotShowIn|DBusActivatable|TryExec|Exec|Path|Terminal|Actions|MimeType|Categories|Implements|Keywords|StartupNotify|StartupWMClass|URL|PrefersNonDefaultGPU|Encoding)\\\\b","name":"keyword"},{"match":"^X-[- 0-9A-z]*","name":"keyword.other"},{"match":"(?<!^)\\\\[.+]","name":"constant.language"},{"match":"^(?:GtkTheme|MetacityTheme|IconTheme|CursorTheme|ButtonLayout|ApplicationFont)\\\\b","name":"keyword"}]},"layout":{"patterns":[{"begin":"^\\\\[Desktop","end":"]","name":"markup.heading"},{"begin":"^\\\\[X-\\\\w*","end":"]","name":"markup.heading"},{"match":"^\\\\s*#.*","name":"comment"},{"match":";","name":"strong"}]},"values":{"patterns":[{"match":"(?<=^\\\\S+)=","name":"keyword.operator"},{"match":"\\\\b(?:tru|fals)e\\\\b","name":"variable.other"},{"match":"(?<=^Version.*)\\\\d+(\\\\.?\\\\d*)","name":"variable.other"}]}},"scopeName":"source.desktop"}'));a.default=[o]}}]);
//# sourceMappingURL=9280.82f949e4.js.map