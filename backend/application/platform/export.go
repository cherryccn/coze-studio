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
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	cacheinfra "github.com/coze-dev/coze-studio/backend/infra/cache"
)

const (
	billingExportStatusProcessing = "processing"
	billingExportStatusSuccess    = "success"
	billingExportStatusFailed     = "failed"

	billingExportTaskTTL         = time.Hour
	billingExportTaskCacheTTL    = 2 * time.Hour
	billingExportTaskCachePrefix = "platform_billing_export_task_"
	billingExportPageSize        = 500
)

type BillingRecordsExportReq struct {
	StartTime      int64
	EndTime        int64
	Keyword        string
	SpaceIDs       []int64
	ProjectType    string
	OrderBy        string
	OrderDirection string
}

type BillingRecordsExportResp struct {
	TaskID string `json:"task_id"`
	Status string `json:"status"`
}

type BillingRecordsExportStatusResp struct {
	TaskID      string `json:"task_id"`
	Status      string `json:"status"`
	DownloadURL string `json:"download_url"`
	ExpireAt    int64  `json:"expire_at"`
}

type billingExportTask struct {
	TaskID      string
	Status      string
	DownloadURL string
	LocalFile   string
	ExpireAt    int64
	UpdatedAt   int64
}

func (p *PlatformApplicationService) CreateBillingRecordsExportTask(ctx context.Context, req *BillingRecordsExportReq) (*BillingRecordsExportResp, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}
	if req == nil {
		return nil, errors.New("export request is nil")
	}

	taskID := fmt.Sprintf("exp_%d", time.Now().UnixNano())
	task := billingExportTask{
		TaskID:    taskID,
		Status:    billingExportStatusProcessing,
		UpdatedAt: time.Now().UnixMilli(),
	}

	p.setExportTask(ctx, task)

	// Export in background to avoid request timeout.
	reqCopy := *req
	go p.runBillingRecordsExportTask(taskID, &reqCopy)

	return &BillingRecordsExportResp{
		TaskID: taskID,
		Status: task.Status,
	}, nil
}

func (p *PlatformApplicationService) GetBillingRecordsExportTaskStatus(ctx context.Context, taskID string) (*BillingRecordsExportStatusResp, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}

	task, exist := p.getExportTask(ctx, taskID)
	if !exist {
		return &BillingRecordsExportStatusResp{
			TaskID: taskID,
			Status: billingExportStatusProcessing,
		}, nil
	}

	if task.Status == billingExportStatusSuccess && task.ExpireAt > 0 && time.Now().UnixMilli() > task.ExpireAt {
		_ = os.Remove(resolveTaskLocalFile(task))
		p.deleteExportTask(ctx, taskID)

		return &BillingRecordsExportStatusResp{
			TaskID: taskID,
			Status: billingExportStatusFailed,
		}, nil
	}

	return &BillingRecordsExportStatusResp{
		TaskID:      task.TaskID,
		Status:      task.Status,
		DownloadURL: buildBillingExportDownloadURL(task.TaskID),
		ExpireAt:    task.ExpireAt,
	}, nil
}

func (p *PlatformApplicationService) GetBillingRecordsExportDownloadFile(ctx context.Context, taskID string) (string, string, error) {
	if p == nil || p.db == nil {
		return "", "", errors.New("platform application service is not initialized")
	}

	task, exist := p.getExportTask(ctx, taskID)
	if !exist {
		return "", "", errors.New("export task is not found")
	}
	if task.Status != billingExportStatusSuccess {
		return "", "", errors.New("export task is not completed")
	}
	if task.ExpireAt > 0 && time.Now().UnixMilli() > task.ExpireAt {
		_ = os.Remove(resolveTaskLocalFile(task))
		p.deleteExportTask(ctx, taskID)
		return "", "", errors.New("export task is expired")
	}

	filePath := resolveTaskLocalFile(task)
	if filePath == "" {
		return "", "", errors.New("export file is not ready")
	}

	if _, err := os.Stat(filePath); err != nil {
		return "", "", errors.New("export file does not exist")
	}

	return filePath, filepath.Base(filePath), nil
}

func (p *PlatformApplicationService) runBillingRecordsExportTask(taskID string, req *BillingRecordsExportReq) {
	task, exist := p.getExportTask(context.Background(), taskID)
	if !exist {
		return
	}

	if err := p.exportBillingRecordsToCSV(context.Background(), taskID, req); err != nil {
		task.Status = billingExportStatusFailed
		task.UpdatedAt = time.Now().UnixMilli()
		p.setExportTask(context.Background(), *task)
		return
	}
}

func (p *PlatformApplicationService) exportBillingRecordsToCSV(ctx context.Context, taskID string, req *BillingRecordsExportReq) error {
	exportDir := filepath.Join(os.TempDir(), "coze-platform-exports")
	if err := os.MkdirAll(exportDir, 0o755); err != nil {
		return err
	}

	filePath := filepath.Join(exportDir, taskID+".csv")
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	header := []string{
		"id", "request_id", "space_id", "space_name", "project_type", "project_id", "project_name",
		"model_id", "usage_tokens", "unit_price", "amount", "status", "occurred_at", "created_at",
	}
	if err = writer.Write(header); err != nil {
		return err
	}

	page := 1
	for {
		recordsResp, queryErr := p.GetBillingRecords(ctx, &BillingRecordsReq{
			StartTime:      req.StartTime,
			EndTime:        req.EndTime,
			Page:           page,
			Size:           billingExportPageSize,
			Keyword:        req.Keyword,
			SpaceIDs:       req.SpaceIDs,
			ProjectType:    req.ProjectType,
			OrderBy:        req.OrderBy,
			OrderDirection: req.OrderDirection,
		})
		if queryErr != nil {
			return queryErr
		}

		for _, item := range recordsResp.List {
			row := []string{
				strconv.FormatInt(item.ID, 10),
				item.RequestID,
				strconv.FormatInt(item.SpaceID, 10),
				item.SpaceName,
				item.ProjectType,
				strconv.FormatInt(item.ProjectID, 10),
				item.ProjectName,
				item.ModelID,
				strconv.FormatInt(item.UsageTokens, 10),
				item.UnitPrice,
				item.Amount,
				item.Status,
				strconv.FormatInt(item.OccurredAt, 10),
				strconv.FormatInt(item.CreatedAt, 10),
			}
			if err = writer.Write(row); err != nil {
				return err
			}
		}

		if len(recordsResp.List) == 0 || int64(page*recordsResp.Size) >= recordsResp.Total {
			break
		}
		page++
	}

	writer.Flush()
	if err = writer.Error(); err != nil {
		return err
	}

	task, exist := p.getExportTask(ctx, taskID)
	if !exist {
		return nil
	}
	task.Status = billingExportStatusSuccess
	task.LocalFile = filePath
	task.DownloadURL = buildBillingExportDownloadURL(taskID)
	task.ExpireAt = time.Now().Add(billingExportTaskTTL).UnixMilli()
	task.UpdatedAt = time.Now().UnixMilli()
	p.setExportTask(ctx, *task)

	return nil
}

func (p *PlatformApplicationService) setExportTask(ctx context.Context, task billingExportTask) {
	if ctx == nil {
		ctx = context.Background()
	}

	p.exportTaskMu.Lock()
	if p.exportTasks == nil {
		p.exportTasks = make(map[string]billingExportTask)
	}
	p.exportTasks[task.TaskID] = task
	p.exportTaskMu.Unlock()

	if p.cacheCli == nil {
		return
	}

	b, err := json.Marshal(task)
	if err != nil {
		return
	}

	_ = p.cacheCli.Set(ctx, makeBillingExportTaskCacheKey(task.TaskID), string(b), billingExportTaskCacheTTL).Err()
}

func (p *PlatformApplicationService) getExportTask(ctx context.Context, taskID string) (*billingExportTask, bool) {
	if ctx == nil {
		ctx = context.Background()
	}

	if p.cacheCli != nil {
		payload, err := p.cacheCli.Get(ctx, makeBillingExportTaskCacheKey(taskID)).Result()
		if err == nil {
			var task billingExportTask
			if unmarshalErr := json.Unmarshal([]byte(payload), &task); unmarshalErr == nil {
				p.exportTaskMu.Lock()
				if p.exportTasks == nil {
					p.exportTasks = make(map[string]billingExportTask)
				}
				p.exportTasks[task.TaskID] = task
				p.exportTaskMu.Unlock()

				return &task, true
			}
		}
		if err != nil && !errors.Is(err, cacheinfra.Nil) {
			// Fall back to in-memory task cache.
		}
	}

	p.exportTaskMu.RLock()
	defer p.exportTaskMu.RUnlock()

	task, ok := p.exportTasks[taskID]
	if !ok {
		return nil, false
	}

	copied := task
	return &copied, true
}

func (p *PlatformApplicationService) deleteExportTask(ctx context.Context, taskID string) {
	if ctx == nil {
		ctx = context.Background()
	}

	p.exportTaskMu.Lock()
	delete(p.exportTasks, taskID)
	p.exportTaskMu.Unlock()

	if p.cacheCli != nil {
		_ = p.cacheCli.Del(ctx, makeBillingExportTaskCacheKey(taskID)).Err()
	}
}

func makeBillingExportTaskCacheKey(taskID string) string {
	return billingExportTaskCachePrefix + taskID
}

func buildBillingExportDownloadURL(taskID string) string {
	return "/api/platform/billing/records/export/download?task_id=" + taskID
}

func resolveTaskLocalFile(task *billingExportTask) string {
	if task == nil {
		return ""
	}
	if task.LocalFile != "" {
		return task.LocalFile
	}
	// Compatibility for historical tasks saved before LocalFile was introduced.
	return task.DownloadURL
}
