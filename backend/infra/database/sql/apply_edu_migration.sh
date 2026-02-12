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

# Apply education platform space integration migration

set -e

echo "=== Education Platform Space Migration ==="
echo ""

# Database connection info
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="root"
MYSQL_DATABASE="opencoze"
SPACE_ID="7602171965524148224"

# Step 1: Get user_id (assuming the first admin user)
echo "Step 1: Finding user_id..."
USER_ID=$(docker exec -i coze-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} --default-character-set=utf8mb4 -sN -e "SELECT id FROM user LIMIT 1;")

if [ -z "$USER_ID" ]; then
    echo "Error: Could not find user_id. Please check your user table."
    exit 1
fi

echo "Found user_id: $USER_ID"
echo ""

# Step 2: Apply migration
echo "Step 2: Applying database migration..."
docker exec -i coze-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} --default-character-set=utf8mb4 < backend/infra/database/sql/edu_migration_add_space.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration applied successfully"
else
    echo "✗ Migration failed"
    exit 1
fi
echo ""

# Step 3: Update test data
echo "Step 3: Updating test data with space context..."
docker exec -i coze-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} --default-character-set=utf8mb4 <<EOF
UPDATE edu_scripts
SET space_id = ${SPACE_ID},
    owner_id = ${USER_ID},
    visibility = 'team'
WHERE id = 1;
EOF

if [ $? -eq 0 ]; then
    echo "✓ Test data updated successfully"
else
    echo "✗ Update failed"
    exit 1
fi
echo ""

# Step 4: Verify changes
echo "Step 4: Verifying migration..."
echo ""
echo "--- edu_scripts table structure ---"
docker exec -i coze-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} --default-character-set=utf8mb4 -e "DESCRIBE edu_scripts;"
echo ""

echo "--- Test script data ---"
docker exec -i coze-mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} --default-character-set=utf8mb4 -e "SELECT id, name, space_id, owner_id, visibility, difficulty FROM edu_scripts WHERE id = 1;"
echo ""

echo "=== Migration completed successfully ==="
echo ""
echo "Summary:"
echo "  - Added space_id, owner_id, visibility to edu_scripts"
echo "  - Added space_id to edu_student_projects"
echo "  - Updated test script (id=1) with:"
echo "    space_id: ${SPACE_ID}"
echo "    owner_id: ${USER_ID}"
echo "    visibility: team"
