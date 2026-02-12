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

"use strict";(self.webpackChunk_coze_studio_app=self.webpackChunk_coze_studio_app||[]).push([["9258"],{172374:function(e,t,n){n.r(t),n.d(t,{EditorFullInputInner:function(){return i},EditorInput:function(){return c}});var r=n(808549),u=n(120454),o=n(473980),l=n(151064),a=n(455069),s=n(674343),i=(0,a.forwardRef)((e,t)=>{var{value:n,onChange:i,getEditor:c}=e,d=(0,o._)(e,["value","onChange","getEditor"]),[g,C]=(0,a.useState)(n),[v,f]=(0,a.useState)(!1),p=(0,a.useRef)(g);(0,a.useEffect)(()=>{p.current=g},[g]);var _=(0,a.useRef)({setHTML:e=>{C(e)},setText:e=>{C(e)},setContent:e=>{C(e.deltas[0].insert)},getContent:()=>{var e;return{deltas:[{insert:null!==(e=p.current)&&void 0!==e?e:""}]}},getText:()=>p.current||"",getRootContainer:()=>null,getContentState:()=>({getZoneState:e=>null}),selection:{getSelection:()=>({start:0,end:0,zoneId:"0"})},registerCommand:()=>null,scrollModule:{scrollTo:()=>null},on:()=>null});return(0,a.useImperativeHandle)(t,()=>({setDeltaContent(e){_.current&&e&&_.current.setContent(e)},getEditor:()=>_.current,getMarkdown(){var e;return(null===(e=_.current)||void 0===e?void 0:e.getText())||""}})),(0,a.useEffect)(()=>{null==c||c(_.current)},[c]),(0,l.jsx)(s.Kx,(0,u._)((0,r._)({},d),{value:g,onChange:e=>{if(C(e),!v)null==i||i(e)},onCompositionStart:()=>f(!0),onCompositionEnd:e=>{f(!1),null==i||i(e.currentTarget.value)}}))}),c=(0,s.Q2)(i,{valueKey:"value",onKeyChangeFnName:"onChange"})}}]);
//# sourceMappingURL=9258.eeb164de.js.map