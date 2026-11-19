import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  MessageSquare,
  RotateCcw,
  Square,
} from 'lucide-react';
import type { CourseStep, DepartmentTrack } from '../data/departments';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuickTip } from './QuickTip';

export type LanguageMode = 'english' | 'roman_urdu' | 'bilingual';
export type MentorMode = 'step_coach' | 'full_dossier' | 'deliverable_builder';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MentorPanelProps {
  department: DepartmentTrack;
  activeStep: CourseStep | null;
  languageMode: LanguageMode;
  onLanguageChange: (mode: LanguageMode) => void;
  mentorMode: MentorMode;
  onMentorModeChange: (mode: MentorMode) => void;
  queuedPrompt: { id: number; text: string } | null;
  onClearQueuedPrompt: () => void;
}

export function MentorPanel({
  department,
  activeStep,
  languageMode,
  onLanguageChange,
  mentorMode,
  onMentorModeChange,
  queuedPrompt,
  onClearQueuedPrompt,
}: MentorPanelProps) {
  const storageKey = `aryan_ai_chat_${department.id}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [
      {
        id: `welcome-${department.id}`,
        role: 'assistant',
        content: `### ${department.title}\n\nWelcome to your **${department.shortName}** AI Mentor. Switch between **English**, **Roman Urdu**, or **Mix** above, click any roadmap step on the left, or ask a question below.\n\n**How would you like to begin?**\n1. Complete monetization rules & payout breakdown\n2. Guided Step 01 execution task\n3. Custom script, gig description, or n8n workflow`,
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setErrorMsg(null);
          return;
        }
      }
    } catch {
      // ignore
    }
    setMessages([
      {
        id: `welcome-${department.id}`,
        role: 'assistant',
        content: `### ${department.title}\n\nWelcome to your **${department.shortName}** AI Mentor. Switch between **English**, **Roman Urdu**, or **Mix** above, click any roadmap step on the left, or ask a question below.\n\n**How would you like to begin?**\n1. Complete monetization rules & payout breakdown\n2. Guided Step 01 execution task\n3. Custom script, gig description, or n8n workflow`,
      },
    ]);
    setErrorMsg(null);
  }, [department.id, department.shortName, department.title, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isStreaming) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const assistantMsgId = `assistant-${Date.now() + 1}`;
    const updatedHistory = [...messages, userMsg];

    setMessages([
      ...updatedHistory,
      { id: assistantMsgId, role: 'assistant', content: '' },
    ]);
    setInput('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          departmentId: department.id,
          departmentTitle: department.title,
          departmentSummary: `${department.summary} | Earning Model: ${department.earningModel}`,
          activeStepTitle: activeStep
            ? `${activeStep.stepNumber}. ${activeStep.title}`
            : undefined,
          activeStepInstructions: activeStep?.instructions,
          languageMode,
          mentorMode,
          messages: updatedHistory
            .filter((m) => m.id !== `welcome-${department.id}`)
            .slice(-12)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errData.error || `Mentor API returned status ${response.status}.`
        );
      }

      if (!response.body) {
        throw new Error('Streaming response body is unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEvent of events) {
          const lines = rawEvent.split('\n');
          let eventName = 'message';
          let dataLine = '';

          for (const l of lines) {
            if (l.startsWith('event:')) {
              eventName = l.slice(6).trim();
            } else if (l.startsWith('data:')) {
              dataLine += l.slice(5).trim();
            }
          }

          if (!dataLine) continue;
          const parsed = JSON.parse(dataLine) as {
            text?: string;
            error?: string;
          };

          if (eventName === 'error') {
            throw new Error(parsed.error || 'AI stream encountered an error.');
          }

          if (eventName === 'chunk' && parsed.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + parsed.text }
                  : m
              )
            );
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to reach #PGL.03 AI Mentor right now.';
      setErrorMsg(message);
      setMessages((prev) =>
        prev.filter((m) => !(m.id === assistantMsgId && m.content === ''))
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  useEffect(() => {
    if (queuedPrompt && queuedPrompt.text) {
      void sendMessage(queuedPrompt.text);
      onClearQueuedPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedPrompt]);

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleReset = () => {
    if (isStreaming) handleStop();
    const initialMsg: ChatMessage = {
      id: `welcome-${department.id}`,
      role: 'assistant',
      content: `### ${department.title}\n\nConversation reset. Choose a step on the left or ask anything about **${department.shortName}** in English or Roman Urdu.`,
    };
    setMessages([initialMsg]);
    setErrorMsg(null);
  };

  return (
    <div className="flex h-[740px] flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Mentor Header & Controls */}
      <div className="border-b border-zinc-800 bg-zinc-950/70 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-50 font-display truncate">
              #PGL.03 AI Mentor · {department.shortName}
            </h3>
            <p className="text-xs text-zinc-400 truncate">
              {activeStep
                ? `Step ${activeStep.stepNumber}: ${activeStep.title}`
                : 'General Track Coaching'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Language & Coaching Mode Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5"
            role="group"
            aria-label="Language preference"
          >
            {(
              [
                { id: 'english', label: 'English' },
                { id: 'roman_urdu', label: 'Roman Urdu' },
                { id: 'bilingual', label: 'Mix' },
              ] as const
            ).map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => onLanguageChange(lang.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  languageMode === lang.id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1.5">
            <div
              className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5"
              role="group"
              aria-label="Coaching mode"
            >
              {(
                [
                  { id: 'step_coach', label: 'Step Coach' },
                  { id: 'full_dossier', label: 'Full Info' },
                  { id: 'deliverable_builder', label: 'Builder' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onMentorModeChange(mode.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    mentorMode === mode.id
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <QuickTip
              title="AI Mentor Modes"
              tip="Step Coach walks through one micro-step at a time. Full Info audits eligibility & payouts. Builder writes ready-to-paste scripts, gigs & n8n JSON."
            />
          </div>
        </div>
      </div>

      {/* Chat Message Viewport */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-zinc-950/50"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[92%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white text-sm leading-relaxed'
                  : 'border border-zinc-800 bg-zinc-900 text-zinc-200 w-full'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : msg.content ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  <span>Preparing step-by-step response...</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-900/70 bg-red-950/40 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-100">
                Request could not be completed
              </p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="border-t border-zinc-800 bg-zinc-950/60 px-4 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {department.quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isStreaming}
              onClick={() => void sendMessage(qp)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="border-t border-zinc-800 bg-zinc-900 p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder={
              languageMode === 'roman_urdu'
                ? `${department.shortName} ke baray mein poochein (e.g. Step 1 samjhao)...`
                : `Ask anything about ${department.shortName} or share your niche idea...`
            }
            className="flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              aria-label="Stop generating"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
