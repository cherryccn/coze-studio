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

import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Empty } from '@coze-arch/coze-design';
import { IconSend } from '@coze-arch/coze-design/icons';
import { I18n } from '@coze-arch/i18n';
import styles from './bot-chat.module.less';

interface BotChatProps {
  projectId: number;
  stageOrder: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Bot聊天组件
 */
const BotChat: React.FC<BotChatProps> = ({ projectId, stageOrder }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: I18n.t(
        'edu.bot.welcome',
        {},
        '你好！我是你的学习助手。在学习过程中遇到任何问题都可以问我。'
      ),
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [projectId, stageOrder]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSending(true);

    try {
      // TODO: 调用真实的 Bot API
      // const response = await chatWithBot(projectId, stageOrder, inputValue);

      // 临时：模拟Bot回复
      await new Promise(resolve => setTimeout(resolve, 1000));
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: I18n.t(
          'edu.bot.mock.response',
          {},
          '这是一个模拟回复。真实的Bot API集成正在开发中...'
        ),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Send message failed:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.botChat}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {I18n.t('edu.bot.chat.title', {}, 'AI学习助手')}
        </h3>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <Empty
            description={I18n.t('edu.bot.chat.empty', {}, '开始和AI助手对话吧')}
          />
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.role === 'user' ? styles.userMessage : styles.botMessage
              }`}
            >
              <Avatar
                size="small"
                className={styles.avatar}
                style={{
                  backgroundColor: message.role === 'user' ? '#4A90E2' : '#52C41A',
                }}
              >
                {message.role === 'user' ? 'U' : 'AI'}
              </Avatar>
              <div className={styles.messageContent}>
                <div className={styles.messageText}>{message.content}</div>
                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <Input
          value={inputValue}
          onChange={setInputValue}
          onKeyPress={handleKeyPress}
          placeholder={I18n.t('edu.bot.chat.input.placeholder', {}, '输入你的问题...')}
          suffix={
            <Button
              icon={<IconSend />}
              onClick={handleSendMessage}
              loading={sending}
              disabled={!inputValue.trim()}
              type="primary"
              size="small"
            />
          }
          disabled={sending}
        />
      </div>
    </div>
  );
};

export default BotChat;
