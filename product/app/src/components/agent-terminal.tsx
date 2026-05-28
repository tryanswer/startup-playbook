'use client';

import { useState, useRef, useEffect } from 'react';
import { StageId, STAGE_CONFIG, AgentMessage } from '@/lib/types';
import { Send, Loader2, Bot, User, Terminal } from 'lucide-react';
import { BridgeClient } from '@/lib/bridge-client';
import { useI18n } from '@/lib/i18n-context';

type TerminalMode = 'chat' | 'codex' | 'claude';

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
        active
          ? 'bg-[var(--accent-purple)] text-white'
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
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

interface AgentTerminalProps {
  projectId: string;
  projectName: string;
  stageId: StageId | null;
  className?: string;
}

export function AgentTerminal({ projectId, projectName, stageId, className = '' }: AgentTerminalProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<TerminalMode>('chat');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bridgeClientRef = useRef<BridgeClient | null>(null);
  const terminalOutputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    terminalOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  // Initialize bridge client for codex/claude modes
  useEffect(() => {
    if (mode === 'chat') return;

    const bridge = new BridgeClient('ws://localhost:3001');
    bridgeClientRef.current = bridge;

    bridge.onOutput((data) => {
      setTerminalOutput(prev => [...prev, data]);
    });

    bridge.onExit((code) => {
      setTerminalOutput(prev => [...prev, `\n[Process exited with code ${code}]`]);
    });

    bridge.onError((message) => {
      setTerminalOutput(prev => [...prev, `\n[Error: ${message}]`]);
    });

    bridge.connect()
      .then(() => {
        setBridgeConnected(true);
        // Spawn the appropriate CLI
        const command = mode === 'codex' ? 'codex' : 'claude';
        bridge.spawn(command);
      })
      .catch(() => {
        setBridgeConnected(false);
      });

    return () => {
      bridge.disconnect();
      bridgeClientRef.current = null;
    };
  }, [mode]);

  async function handleSend() {
    if (mode === 'chat') {
      // Chat mode: use existing LLM chat logic
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
    } else {
      // Codex/Claude mode: send input to bridge
      if (!bridgeClientRef.current || !bridgeConnected) {
        setTerminalOutput(prev => [...prev, '\n[Bridge not connected. Run `npx sp-bridge` to start the bridge server.]']);
        return;
      }

      const trimmed = input.trim();
      if (!trimmed) return;

      // Send input with newline to CLI
      bridgeClientRef.current.sendInput(trimmed + '\n');
      setInput('');
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
          {mode === 'chat' ? (
            <Bot className="h-4 w-4 text-[var(--accent-purple)]" />
          ) : (
            <Terminal className="h-4 w-4 text-[var(--accent-green)]" />
          )}
          <span className="text-sm font-medium">Agent</span>
          <span className="text-xs text-[var(--text-muted)]">
            · {projectName} · {stageName}
          </span>
        </div>
        
        {/* Mode selector */}
        <div className="flex gap-1">
          <ModeButton active={mode === 'chat'} onClick={() => setMode('chat')} label={t('agent.title')} />
          <ModeButton active={mode === 'codex'} onClick={() => setMode('codex')} label="Codex" />
          <ModeButton active={mode === 'claude'} onClick={() => setMode('claude')} label="Claude" />
        </div>
      </div>

      {/* Messages / Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4">
        {mode === 'chat' ? (
          // Chat mode: show message bubbles
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)]">
                  {t('agent.empty')}
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {stageId === 'validate' && (
                    <>
                      <Suggestion text={t('agent.suggest.subreddits')} onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                      <Suggestion text={t('agent.suggest.japan')} onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                      <Suggestion text={t('agent.suggest.pain')} onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                    </>
                  )}
                  {stageId === 'business-model' && (
                    <>
                      <Suggestion text={t('agent.suggest.saas')} onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                      <Suggestion text={t('agent.suggest.ltv')} onClick={text => { setInput(text); inputRef.current?.focus(); }} />
                    </>
                  )}
                  {!stageId && (
                    <Suggestion text={t('agent.suggest.brainstorm')} onClick={text => { setInput(text); inputRef.current?.focus(); }} />
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
          </div>
        ) : (
          // Codex/Claude mode: show terminal output
          <div className="font-mono text-sm text-[var(--text-primary)] whitespace-pre-wrap">
            {!bridgeConnected ? (
              <div className="text-center py-12">
                <Terminal className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)] mb-2">
                  {t('agent.cancel')}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Run <code className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">npx sp-bridge</code> to connect local CLI tools
                </p>
              </div>
            ) : (
              <pre ref={terminalOutputRef} className="w-full">
                {terminalOutput.join('')}
              </pre>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border)]">
        {mode === 'chat' ? (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('agent.placeholder')}
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
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef as any}
              type="text"
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={bridgeConnected ? t('agent.placeholder') : t('agent.cancel')}
              disabled={!bridgeConnected}
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-green)] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !bridgeConnected}
              className="px-3 py-2 rounded-lg bg-[var(--accent-green)] text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
