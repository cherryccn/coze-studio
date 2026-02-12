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

/*! For license information please see 7625.6de03b43.js.LICENSE.txt */
"use strict";(self.webpackChunk_coze_studio_app=self.webpackChunk_coze_studio_app||[]).push([["7625"],{589325:function(e,s,t){t.r(s),t.d(s,{conf:function(){return n},language:function(){return r}});var n={comments:{lineComment:"#"},brackets:[["{","}"],["[","]"],["(",")"]],autoClosingPairs:[{open:"'",close:"'",notIn:["string"]},{open:'"',close:'"',notIn:["string"]},{open:"{",close:"}"},{open:"[",close:"]"},{open:"(",close:")"}]},r={defaultToken:"",tokenPostfix:".rq",brackets:[{token:"delimiter.curly",open:"{",close:"}"},{token:"delimiter.parenthesis",open:"(",close:")"},{token:"delimiter.square",open:"[",close:"]"},{token:"delimiter.angle",open:"<",close:">"}],keywords:["add","as","asc","ask","base","by","clear","construct","copy","create","data","delete","desc","describe","distinct","drop","false","filter","from","graph","group","having","in","insert","limit","load","minus","move","named","not","offset","optional","order","prefix","reduced","select","service","silent","to","true","undef","union","using","values","where","with"],builtinFunctions:["a","abs","avg","bind","bnode","bound","ceil","coalesce","concat","contains","count","datatype","day","encode_for_uri","exists","floor","group_concat","hours","if","iri","isblank","isiri","isliteral","isnumeric","isuri","lang","langmatches","lcase","max","md5","min","minutes","month","now","rand","regex","replace","round","sameterm","sample","seconds","sha1","sha256","sha384","sha512","str","strafter","strbefore","strdt","strends","strlang","strlen","strstarts","struuid","substr","sum","timezone","tz","ucase","uri","uuid","year"],ignoreCase:!0,tokenizer:{root:[[/<[^\s\u00a0>]*>?/,"tag"],{include:"@strings"},[/#.*/,"comment"],[/[{}()\[\]]/,"@brackets"],[/[;,.]/,"delimiter"],[/[_\w\d]+:(\.(?=[\w_\-\\%])|[:\w_-]|\\[-\\_~.!$&'()*+,;=/?#@%]|%[a-f\d][a-f\d])*/,"tag"],[/:(\.(?=[\w_\-\\%])|[:\w_-]|\\[-\\_~.!$&'()*+,;=/?#@%]|%[a-f\d][a-f\d])+/,"tag"],[/[$?]?[_\w\d]+/,{cases:{"@keywords":{token:"keyword"},"@builtinFunctions":{token:"predefined.sql"},"@default":"identifier"}}],[/\^\^/,"operator.sql"],[/\^[*+\-<>=&|^\/!?]*/,"operator.sql"],[/[*+\-<>=&|\/!?]/,"operator.sql"],[/@[a-z\d\-]*/,"metatag.html"],[/\s+/,"white"]],strings:[[/'([^'\\]|\\.)*$/,"string.invalid"],[/'$/,"string.sql","@pop"],[/'/,"string.sql","@stringBody"],[/"([^"\\]|\\.)*$/,"string.invalid"],[/"$/,"string.sql","@pop"],[/"/,"string.sql","@dblStringBody"]],stringBody:[[/[^\\']+/,"string.sql"],[/\\./,"string.escape"],[/'/,"string.sql","@pop"]],dblStringBody:[[/[^\\"]+/,"string.sql"],[/\\./,"string.escape"],[/"/,"string.sql","@pop"]]}}}}]);
//# sourceMappingURL=7625.6de03b43.js.map