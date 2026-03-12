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

set -euo pipefail

BASE_URL="http://127.0.0.1:8888"
COOKIE_NAME="session_key"
SESSION_KEY=""
EXPECT_ACCESS=""
EXPECT_API=""
LABEL="qa01"
ACCOUNT_INFO_PATH="/passport/account/info/v2/"
PLATFORM_API_PATH="/api/platform/billing/budgets?page=1&size=20"

usage() {
    cat <<'EOF'
Usage:
  ./platform_management_qa01_smoke.sh \
    --session-key <session_key> \
    --expect-access <true|false> \
    --expect-api <allow|forbidden> \
    [--label <name>] \
    [--base-url <url>] \
    [--cookie-name <name>] \
    [--account-info-path <path>] \
    [--platform-api-path <path>]

Examples:
  ./platform_management_qa01_smoke.sh \
    --label scene-a-member \
    --session-key "$SESSION_A" \
    --expect-access true \
    --expect-api allow

  ./platform_management_qa01_smoke.sh \
    --label scene-c-member \
    --session-key "$SESSION_C" \
    --expect-access false \
    --expect-api forbidden
EOF
}

require_command() {
    local command_name="$1"
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "Error: required command not found: $command_name" >&2
        exit 1
    fi
}

normalize_bool() {
    local value
    value="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
    case "$value" in
        true|false)
            printf '%s' "$value"
            ;;
        *)
            echo "Error: invalid boolean value: $1" >&2
            exit 1
            ;;
    esac
}

normalize_api_expectation() {
    local value
    value="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
    case "$value" in
        allow|forbidden)
            printf '%s' "$value"
            ;;
        *)
            echo "Error: invalid API expectation: $1" >&2
            exit 1
            ;;
    esac
}

join_url() {
    local base="$1"
    local path="$2"

    if [[ "$path" =~ ^https?:// ]]; then
        printf '%s' "$path"
        return
    fi

    printf '%s%s' "${base%/}" "$path"
}

run_request() {
    local method="$1"
    local url="$2"
    local body="$3"
    local output_file="$4"

    local curl_args=(
        -sS
        -X "$method"
        "$url"
        -H "Cookie: ${COOKIE_NAME}=${SESSION_KEY}"
        -o "$output_file"
        -w "%{http_code}"
    )

    if [[ -n "$body" ]]; then
        curl_args+=(-H "Content-Type: application/json" --data "$body")
    fi

    curl "${curl_args[@]}"
}

read_json_value() {
    local file_path="$1"
    local expression="$2"

    python3 - "$file_path" "$expression" <<'PY'
import json
import sys

file_path = sys.argv[1]
expression = sys.argv[2]

with open(file_path, "r", encoding="utf-8") as handle:
    raw = handle.read().strip()

if not raw:
    print("")
    sys.exit(0)

try:
    data = json.loads(raw)
except Exception:
    print("__JSON_PARSE_ERROR__")
    sys.exit(0)

current = data
for part in expression.split("."):
    if part == "":
        continue
    if isinstance(current, dict):
        current = current.get(part)
    else:
        current = None
        break

if current is None:
    print("")
elif isinstance(current, bool):
    print("true" if current else "false")
else:
    print(current)
PY
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --session-key)
            SESSION_KEY="${2:-}"
            shift 2
            ;;
        --expect-access)
            EXPECT_ACCESS="${2:-}"
            shift 2
            ;;
        --expect-api)
            EXPECT_API="${2:-}"
            shift 2
            ;;
        --label)
            LABEL="${2:-}"
            shift 2
            ;;
        --base-url)
            BASE_URL="${2:-}"
            shift 2
            ;;
        --cookie-name)
            COOKIE_NAME="${2:-}"
            shift 2
            ;;
        --account-info-path)
            ACCOUNT_INFO_PATH="${2:-}"
            shift 2
            ;;
        --platform-api-path)
            PLATFORM_API_PATH="${2:-}"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Error: unknown argument: $1" >&2
            usage
            exit 1
            ;;
    esac
done

if [[ -z "$SESSION_KEY" ]]; then
    echo "Error: --session-key is required" >&2
    usage
    exit 1
fi

if [[ -z "$EXPECT_ACCESS" ]]; then
    echo "Error: --expect-access is required" >&2
    usage
    exit 1
fi

if [[ -z "$EXPECT_API" ]]; then
    echo "Error: --expect-api is required" >&2
    usage
    exit 1
fi

require_command curl
require_command python3

EXPECT_ACCESS="$(normalize_bool "$EXPECT_ACCESS")"
EXPECT_API="$(normalize_api_expectation "$EXPECT_API")"

ACCOUNT_INFO_URL="$(join_url "$BASE_URL" "$ACCOUNT_INFO_PATH")"
PLATFORM_API_URL="$(join_url "$BASE_URL" "$PLATFORM_API_PATH")"

ACCOUNT_INFO_BODY_FILE="$(mktemp)"
PLATFORM_API_BODY_FILE="$(mktemp)"
trap 'rm -f "$ACCOUNT_INFO_BODY_FILE" "$PLATFORM_API_BODY_FILE"' EXIT

ACCOUNT_INFO_HTTP_STATUS="$(run_request "POST" "$ACCOUNT_INFO_URL" '{}' "$ACCOUNT_INFO_BODY_FILE")"
PLATFORM_API_HTTP_STATUS="$(run_request "GET" "$PLATFORM_API_URL" "" "$PLATFORM_API_BODY_FILE")"

ACCOUNT_INFO_CODE="$(read_json_value "$ACCOUNT_INFO_BODY_FILE" "code")"
ACCOUNT_INFO_ACCESS="$(read_json_value "$ACCOUNT_INFO_BODY_FILE" "data.platform_management_access")"
PLATFORM_API_CODE="$(read_json_value "$PLATFORM_API_BODY_FILE" "code")"

ACCOUNT_INFO_OK="false"
if [[ "$ACCOUNT_INFO_HTTP_STATUS" == "200" && "$ACCOUNT_INFO_CODE" == "0" && "$ACCOUNT_INFO_ACCESS" == "$EXPECT_ACCESS" ]]; then
    ACCOUNT_INFO_OK="true"
fi

PLATFORM_API_OK="false"
if [[ "$EXPECT_API" == "allow" ]]; then
    if [[ "$PLATFORM_API_HTTP_STATUS" != "403" && "$PLATFORM_API_CODE" != "40301" ]]; then
        PLATFORM_API_OK="true"
    fi
else
    if [[ "$PLATFORM_API_HTTP_STATUS" == "403" && "$PLATFORM_API_CODE" == "40301" ]]; then
        PLATFORM_API_OK="true"
    fi
fi

printf 'Scenario: %s\n' "$LABEL"
printf 'Base URL: %s\n' "$BASE_URL"
printf 'Account info: http=%s code=%s platform_management_access=%s expected_access=%s result=%s\n' \
    "$ACCOUNT_INFO_HTTP_STATUS" \
    "${ACCOUNT_INFO_CODE:-<empty>}" \
    "${ACCOUNT_INFO_ACCESS:-<empty>}" \
    "$EXPECT_ACCESS" \
    "$ACCOUNT_INFO_OK"
printf 'Platform API: http=%s code=%s expected_api=%s result=%s\n' \
    "$PLATFORM_API_HTTP_STATUS" \
    "${PLATFORM_API_CODE:-<empty>}" \
    "$EXPECT_API" \
    "$PLATFORM_API_OK"

if [[ "$ACCOUNT_INFO_OK" == "true" && "$PLATFORM_API_OK" == "true" ]]; then
    echo "Smoke result: PASS"
    echo "Manual browser checks still required:"
    echo "  1. Verify sidebar menu visibility for 平台管理"
    echo "  2. Verify /platform page content or 无权限文案"
    exit 0
fi

echo "Smoke result: FAIL"
echo "Account info response body:"
cat "$ACCOUNT_INFO_BODY_FILE"
echo
echo "Platform API response body:"
cat "$PLATFORM_API_BODY_FILE"
echo
exit 1
