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

import "testing"

func TestHasPlatformManagementAccess(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name        string
		userEmail   string
		adminEmails string
		want        bool
	}{
		{
			name:        "allow current user when config is empty",
			userEmail:   "demo@example.com",
			adminEmails: "",
			want:        true,
		},
		{
			name:        "allow configured admin email",
			userEmail:   "demo@example.com",
			adminEmails: "owner@example.com, demo@example.com",
			want:        true,
		},
		{
			name:        "trim and ignore case",
			userEmail:   "Demo@Example.com ",
			adminEmails: " owner@example.com , demo@example.com ",
			want:        true,
		},
		{
			name:        "block non admin when config exists",
			userEmail:   "member@example.com",
			adminEmails: "owner@example.com,demo@example.com",
			want:        false,
		},
		{
			name:        "block empty user email",
			userEmail:   "",
			adminEmails: "",
			want:        false,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got := HasPlatformManagementAccess(tt.userEmail, tt.adminEmails)
			if got != tt.want {
				t.Fatalf("HasPlatformManagementAccess() = %v, want %v", got, tt.want)
			}
		})
	}
}
