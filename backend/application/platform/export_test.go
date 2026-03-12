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

package platform

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestGetBillingRecordsExportTaskStatusDefaultProcessing(t *testing.T) {
	svc := &PlatformApplicationService{
		db:          mustNewDryRunDB(t),
		exportTasks: make(map[string]billingExportTask),
	}

	resp, err := svc.GetBillingRecordsExportTaskStatus(context.Background(), "exp_not_exist")
	if err != nil {
		t.Fatalf("GetBillingRecordsExportTaskStatus returned error: %v", err)
	}
	if resp.Status != billingExportStatusProcessing {
		t.Fatalf("unexpected status: %s", resp.Status)
	}
}

func TestCreateBillingRecordsExportTask(t *testing.T) {
	svc := &PlatformApplicationService{
		db:          mustNewDryRunDB(t),
		exportTasks: make(map[string]billingExportTask),
	}

	createResp, err := svc.CreateBillingRecordsExportTask(context.Background(), &BillingRecordsExportReq{
		StartTime:      1,
		EndTime:        2,
		Keyword:        "",
		ProjectType:    "all",
		OrderBy:        "occurred_at",
		OrderDirection: "desc",
	})
	if err != nil {
		t.Fatalf("CreateBillingRecordsExportTask returned error: %v", err)
	}
	if createResp.TaskID == "" {
		t.Fatalf("task_id should not be empty")
	}
	if createResp.Status != billingExportStatusProcessing {
		t.Fatalf("unexpected create status: %s", createResp.Status)
	}

	var statusResp *BillingRecordsExportStatusResp
	for i := 0; i < 30; i++ {
		statusResp, err = svc.GetBillingRecordsExportTaskStatus(context.Background(), createResp.TaskID)
		if err != nil {
			t.Fatalf("GetBillingRecordsExportTaskStatus returned error: %v", err)
		}
		if statusResp.Status == billingExportStatusSuccess {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}

	if statusResp.Status != billingExportStatusSuccess {
		t.Fatalf("export task does not become success, current status: %s", statusResp.Status)
	}
	if statusResp.DownloadURL == "" {
		t.Fatalf("download_url should not be empty when status is success")
	}
	expectedDownloadPath := "/api/platform/billing/records/export/download?task_id=" + createResp.TaskID
	if statusResp.DownloadURL != expectedDownloadPath {
		t.Fatalf("unexpected download_url, got=%s", statusResp.DownloadURL)
	}

	filePath, fileName, err := svc.GetBillingRecordsExportDownloadFile(context.Background(), createResp.TaskID)
	if err != nil {
		t.Fatalf("GetBillingRecordsExportDownloadFile returned error: %v", err)
	}
	if filePath == "" || fileName == "" {
		t.Fatalf("download file path/name should not be empty")
	}
	defer os.Remove(filePath)
}
