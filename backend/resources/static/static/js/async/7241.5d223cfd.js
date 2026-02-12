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

"use strict";(self.webpackChunk_coze_studio_app=self.webpackChunk_coze_studio_app||[]).push([["7241"],{815935:function(e,r,t){t.r(r),t.d(r,{default:()=>f});var o=t("151064"),a=t("455069"),l=t("189400"),n=t("149528"),u=t("66860"),s=t("189284"),i=e=>{var r=(0,n.eo)(),t=(0,n.Qy)(),o=(0,n.d0)();(0,a.useEffect)(()=>{if(t.refresh){var a;null===(a=e.current)||void 0===a||a.reload(),o((0,n.Fl)(r.uri.removeQueryObject("refresh")),{replace:!0})}},[t.refresh,e,r,o])},c=t("537845"),d=()=>{var{sendOpen:e}=(0,n.tF)(),{widget:r}=(0,n.BX)(),t=(0,n.d0)(),o=(0,n.Cg)();return(0,c.Z)(()=>({navigate:t,ideGlobalStore:o,setWidgetUIState:e=>r.setUIState(e),sendMsgOpenWidget:e}))},v=(e,r)=>{var t=(0,c.Z)(e=>{var t;if("process"===e.name&&(null===(t=e.data)||void 0===t?void 0:t.executeId)&&r.current)r.current.getProcess({executeId:e.data.executeId});else if("debug"===e.name&&r.current){var{nodeId:o,executeId:a,subExecuteId:l}=(null==e?void 0:e.data)||{};o&&setTimeout(()=>{var e;null===(e=r.current)||void 0===e||e.scrollToNode(o)},1e3),a&&r.current.showTestRunResult(a,l)}});(0,n.yg)(e,t)},f=()=>{var e=(0,a.useRef)(null),r=(0,n.aQ)(),t=(0,n.vp)(),{version:c}=(0,n.jo)(),[f]=(0,s.V)(),p=(0,u.Un)(e=>e.refetch),{uri:g,widget:m}=(0,n.BX)(),w=(0,n.eo)(),I=(0,a.useMemo)(()=>null==g?void 0:g.displayName,[g]),h=d(),b=(0,a.useCallback)(e=>{var r,t=null===(r=e.info)||void 0===r?void 0:r.name;t&&(m.setTitle(t),m.setUIState("normal")),m.setIconType(String(e.flowMode))},[m]),j=()=>{w.refresh(),w.context.widget.setUIState("loading")};return((0,n.q9)(r=>{var t;if(!!f["bot.automation.project_multi_tab"])null===(t=e.current)||void 0===t||t.onResourceChange(r,j)}),(0,a.useEffect)(()=>{var r=m.onFocus(()=>{var r,t;null===(r=e.current)||void 0===r||r.triggerFitView(),null===(t=e.current)||void 0===t||t.loadGlobalVariables()});return()=>{var e;null==r||null===(e=r.dispose)||void 0===e||e.call(r)}},[]),i(e),v(g,e),r&&I)?(0,o.jsx)(l.Lw,{ref:e,spaceId:r,workflowId:I,projectCommitVersion:c,renderHeader:()=>null,onInit:b,projectId:t,getProjectApi:h,className:"project-ide-workflow-playground",refetchProjectResourceList:p,renameProjectResource:e=>{w.container.get(u.OC).renameResource(e)}}):null}}}]);
//# sourceMappingURL=7241.5d223cfd.js.map