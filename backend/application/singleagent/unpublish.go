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

package singleagent

import (
	"context"

	intelligence "github.com/coze-dev/coze-studio/backend/api/model/app/intelligence/common"
	searchEntity "github.com/coze-dev/coze-studio/backend/domain/search/entity"
	"github.com/coze-dev/coze-studio/backend/pkg/lang/ptr"
	"github.com/coze-dev/coze-studio/backend/pkg/logs"
)

func (s *SingleAgentApplicationService) UnpublishAgent(ctx context.Context, agentID int64, connectorIDs []int64) (map[int64]bool, error) {
	_, err := s.ValidateAgentDraftAccess(ctx, agentID)
	if err != nil {
		return nil, err
	}

	pubInfo, result, err := s.DomainSVC.UnpublishAgent(ctx, agentID, connectorIDs)
	if err != nil {
		return nil, err
	}

	hasPublished := 0
	publishTime := int64(0)
	if pubInfo != nil {
		publishTime = pubInfo.LastPublishTimeMS
		if publishTime > 0 {
			hasPublished = 1
		}
	}

	err = s.appContext.EventBus.PublishProject(ctx, &searchEntity.ProjectDomainEvent{
		OpType: searchEntity.Updated,
		Project: &searchEntity.ProjectDocument{
			ID:            agentID,
			Type:          intelligence.IntelligenceType_Bot,
			HasPublished:  ptr.Of(hasPublished),
			PublishTimeMS: ptr.Of(publishTime),
		},
	})
	if err != nil {
		logs.CtxWarnf(ctx, "unpublish project event failed, agentID: %d, err : %v", agentID, err)
	}

	return result, nil
}
