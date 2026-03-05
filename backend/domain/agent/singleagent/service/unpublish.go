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

	"github.com/coze-dev/coze-studio/backend/domain/agent/singleagent/entity"
	"github.com/coze-dev/coze-studio/backend/pkg/lang/conv"
	"github.com/coze-dev/coze-studio/backend/types/consts"
)

func (s *singleAgentImpl) UnpublishAgent(ctx context.Context, agentID int64, connectorIDs []int64) (*entity.PublishInfo, map[int64]bool, error) {
	pubInfo, err := s.GetPublishedInfo(ctx, agentID)
	if err != nil {
		return nil, nil, err
	}

	if pubInfo.ConnectorID2PublishTime == nil {
		pubInfo.ConnectorID2PublishTime = map[int64]int64{}
	}

	result := make(map[int64]bool, len(connectorIDs))
	seen := make(map[int64]struct{}, len(connectorIDs))
	for _, connectorID := range connectorIDs {
		if _, ok := seen[connectorID]; ok {
			continue
		}
		seen[connectorID] = struct{}{}

		if _, exist := pubInfo.ConnectorID2PublishTime[connectorID]; !exist {
			result[connectorID] = false
			continue
		}

		delete(pubInfo.ConnectorID2PublishTime, connectorID)
		result[connectorID] = true
	}

	var latestPublishTime int64
	for _, publishTime := range pubInfo.ConnectorID2PublishTime {
		if publishTime > latestPublishTime {
			latestPublishTime = publishTime
		}
	}
	pubInfo.AgentID = agentID
	pubInfo.LastPublishTimeMS = latestPublishTime

	err = s.PublishInfoRepo.Save(ctx, consts.PublishInfoKeyPrefix, conv.Int64ToStr(agentID), pubInfo)
	if err != nil {
		return nil, nil, err
	}

	return pubInfo, result, nil
}
