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

package platformaccess

import "strings"

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// HasPlatformManagementAccess returns whether the current user can access the
// embedded platform management module.
//
// When no admin email is configured, MVP/demo environments default to allowing
// any logged-in account so the feature can be previewed without extra switches.
func HasPlatformManagementAccess(userEmail, adminEmails string) bool {
	normalizedUserEmail := normalizeEmail(userEmail)
	if normalizedUserEmail == "" {
		return false
	}

	if strings.TrimSpace(adminEmails) == "" {
		return true
	}

	for _, adminEmail := range strings.Split(adminEmails, ",") {
		if normalizeEmail(adminEmail) == normalizedUserEmail {
			return true
		}
	}

	return false
}
