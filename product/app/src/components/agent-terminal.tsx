'use client';

import { useState, useRef, useEffect } from 'react';
import { StageId, STAGE_CONFIG, AgentMessage } from '@/lib/types';
import { Send, Loader2, Bot, User } from 'lucide-react';

interface AgentTerminalProps {
  projectId: string;
  projectName: string;
  stageId: StageId | null;
  className?: string;
}

export function AgentTerminal({ projectId, projectName, stageId, className = '' }: AgentTerminalProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: AgentMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          projectId,
          projectName,
          stageId,
          history: messages.slice(-10),
        }),
      });

      const data = await response.json();

      const assistantMessage: AgentMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process that request.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: 'Connection error. Please check your network and try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  const stageName = stageId ? STAGE_CONFIG[stageId].label : 'General';

  return (
    <div className={`flex flex-col h-[700px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[var(--accent-purple)]" />
          <span className="text-sm font-medium">Agent</span>
          <span className="text-xs text-[var(--text-muted)]">
            · {projectName} · {stageName}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">
              Ask me anything about your idea or this stage.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {stageId === 'validate' && (
                <>
                  <Suggestion text="Search more subreddits" onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                  <Suggestion text="Analyze Japanese market" onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                  <Suggestion text="Deep dive the top pain point" onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                </>
              )}
              {stageId === 'business-model' && (
                <>
                  <Suggestion text="Compare SaaS vs one-time pricing" onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                  <Suggestion text="Calculate LTV for this model" onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                </>
              )}
              {!stageId && (
                <Suggestion text="Help me brainstorm a new idea" onClick={text => { setInput(text); inputRef.current?.focus(); }} />
              )}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-[var(--accent-purple)]" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
              message.role === 'user'
                ? 'bg-[var(--accent-blue)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
            }`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-[var(--accent-purple)]" />
            </div>
            <div className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)]">
              <Loader2 className="h-4 w-4 text-[var(--text-muted)] animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent..."
            rows={1}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 rounded-lg bg-[var(--accent-purple)] text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Suggestion({ text, onClick }: { text: string; onClick: (text: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="px-3 py-1.5 rounded-full text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
    >
      {text}
    </button>
  );
}
