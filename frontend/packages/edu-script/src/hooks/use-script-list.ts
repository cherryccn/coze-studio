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

import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface ScriptQuery {
  keyword?: string;
  difficulty?: number | null;
  page?: number;
  page_size?: number;
}

interface ScriptItem {
  id: number;
  name: string;
  nameEn?: string;
  difficulty: number;
  duration: number;
  icon: string;
  description: string;
  createdAt: string;
}

interface ScriptListData {
  list: ScriptItem[];
  total: number;
  page: number;
  page_size: number;
}

export const useScriptList = () => {
  const { space_id } = useParams<{ space_id: string }>();
  const [data, setData] = useState<ScriptListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchScripts = useCallback(async (query: ScriptQuery = {}) => {
    if (!space_id) {
      setError(new Error('space_id is required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/space/${space_id}/edu/scripts`, {
        params: {
          keyword: query.keyword || '',
          difficulty: query.difficulty || undefined,
          page: query.page || 1,
          page_size: query.page_size || 20,
        },
      });

      if (response.data.code === 0) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.msg || 'Failed to fetch scripts');
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch scripts:', err);
    } finally {
      setLoading(false);
    }
  }, [space_id]);

  return {
    data,
    loading,
    error,
    fetchScripts,
  };
};
