#!/bin/bash
#
# Copyright 2025 coze-dev Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#


# 测试教师端班级管理 API
# 使用方式: ./test-class-api.sh

API_BASE="http://localhost:8888"
SPACE_ID="1"  # 需要根据实际情况修改

echo "========================================="
echo "教师端班级管理 API 测试"
echo "========================================="
echo ""

# 测试1: 创建班级
echo "1. 测试创建班级..."
CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/api/space/${SPACE_ID}/edu/classes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试班级-2024春季",
    "code": "TEST-2024S",
    "semester": "2024 Spring",
    "description": "这是一个测试班级"
  }')
echo "响应: ${CREATE_RESPONSE}"
echo ""

# 测试2: 获取我的班级列表
echo "2. 测试获取班级列表..."
LIST_RESPONSE=$(curl -s "${API_BASE}/api/space/${SPACE_ID}/edu/classes/my")
echo "响应: ${LIST_RESPONSE}"
echo ""

# 测试3: 获取班级详情
# 注意：需要从上一步的响应中提取 class_id
echo "3. 测试获取班级详情..."
CLASS_ID="1"  # 需要根据实际情况修改
DETAIL_RESPONSE=$(curl -s "${API_BASE}/api/space/${SPACE_ID}/edu/classes/${CLASS_ID}")
echo "响应: ${DETAIL_RESPONSE}"
echo ""

# 测试4: 添加班级成员
echo "4. 测试添加班级成员..."
ADD_MEMBERS_RESPONSE=$(curl -s -X POST "${API_BASE}/api/space/${SPACE_ID}/edu/classes/${CLASS_ID}/members" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["student1@example.com", "student2@example.com"]
  }')
echo "响应: ${ADD_MEMBERS_RESPONSE}"
echo ""

# 测试5: 获取班级成员列表
echo "5. 测试获取成员列表..."
MEMBERS_RESPONSE=$(curl -s "${API_BASE}/api/space/${SPACE_ID}/edu/classes/${CLASS_ID}/members")
echo "响应: ${MEMBERS_RESPONSE}"
echo ""

# 测试6: 创建邀请码
echo "6. 测试创建邀请码..."
INVITE_CODE_RESPONSE=$(curl -s -X POST "${API_BASE}/api/space/${SPACE_ID}/edu/classes/${CLASS_ID}/invite-codes" \
  -H "Content-Type: application/json" \
  -d '{
    "maxUses": 10
  }')
echo "响应: ${INVITE_CODE_RESPONSE}"
echo ""

# 测试7: 获取邀请码列表
echo "7. 测试获取邀请码列表..."
CODES_RESPONSE=$(curl -s "${API_BASE}/api/space/${SPACE_ID}/edu/classes/${CLASS_ID}/invite-codes")
echo "响应: ${CODES_RESPONSE}"
echo ""

echo "========================================="
echo "测试完成！"
echo "========================================="
