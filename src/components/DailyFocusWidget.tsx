import { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  CornerDownLeft,
  Pencil,
  RotateCcw,
  Sparkles,
  Square,
  Target,
  Trash2,
} from 'lucide-react';
import type { CourseStep, DepartmentTrack } from '../data/departments';
import { QuickTip } from './QuickTip';

interface MicroTaskSlot {
  id: string;
  text: string;
  done: boolean;
}

type DailyFocusStore = Record<string, MicroTaskSlot[]>;

interface DailyFocusWidgetProps {
  department: DepartmentTrack;
  activeStep: CourseStep | null;
  onAskMentorAboutTask: (taskText: string) => void;
}

const DAILY_FOCUS_STORAGE_KEY = 'pgl03_daily_focus_v1';

function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createEmptySlots(): MicroTaskSlot[] {
  return [
    { id: 'slot-1', text: '', done: false },
    { id: 'slot-2', text: '', done: false },
    { id: 'slot-3', text: '', done: false },
  ];
}

function computeTrackStreak(store: DailyFocusStore, trackId: string, todayIso: string): {
  completedDays: number;
  currentStreak: number;
} {
  const completedDates = new Set<string>();
  const suffix = `::${trackId}`;

  for (const [key, slots] of Object.entries(store)) {
    if (!key.endsWith(suffix) || !Array.isArray(slots)) continue;
    const filled = slots.filter((s) => s.text.trim().length > 0);
    if (filled.length === 3 && filled.every((s) => s.done)) {
      completedDates.add(key.slice(0, key.length - suffix.length));
    }
  }

  let streak = 0;
  const cursor = new Date(`${todayIso}T00:00:00`);
  if (!completedDates.has(todayIso)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    if (!completedDates.has(iso)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    completedDays: completedDates.size,
    currentStreak: streak,
  };
}

export function DailyFocusWidget({
  department,
  activeStep,
  onAskMentorAboutTask,
}: DailyFocusWidgetProps) {
  const todayIso = getTodayIso();
  const storeKey = `${todayIso}::${department.id}`;

  const [store, setStore] = useState<DailyFocusStore>(() => {
    try {
      const raw = localStorage.getItem(DAILY_FOCUS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object') {
          return parsed as DailyFocusStore;
        }
      }
    } catch {
      // ignore storage read errors
    }
    return {};
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_FOCUS_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore storage write errors
    }
  }, [store]);

  useEffect(() => {
    setEditingIndex(null);
    setDraftText('');
  }, [department.id]);

  const slots: MicroTaskSlot[] = useMemo(() => {
    const existing = store[storeKey];
    if (Array.isArray(existing) && existing.length === 3) {
      return existing;
    }
    return createEmptySlots();
  }, [store, storeKey]);

  const updateSlots = (updater: (prev: MicroTaskSlot[]) => MicroTaskSlot[]) => {
    setStore((prev) => {
      const current =
        Array.isArray(prev[storeKey]) && prev[storeKey].length === 3
          ? prev[storeKey]
          : createEmptySlots();
      return {
        ...prev,
        [storeKey]: updater(current),
      };
    });
  };

  const handleSaveSlot = (index: number) => {
    const trimmed = draftText.trim();
    updateSlots((prev) =>
      prev.map((slot, i) =>
        i === index
          ? {
              ...slot,
              text: trimmed,
              done: trimmed ? slot.done : false,
            }
          : slot
      )
    );
    setEditingIndex(null);
    setDraftText('');
  };

  const handleToggleDone = (index: number) => {
    updateSlots((prev) =>
      prev.map((slot, i) =>
        i === index && slot.text.trim().length > 0
          ? { ...slot, done: !slot.done }
          : slot
      )
    );
  };

  const handleClearSlot = (index: number) => {
    updateSlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, text: '', done: false } : slot
      )
    );
    if (editingIndex === index) {
      setEditingIndex(null);
      setDraftText('');
    }
  };

  const handleSuggestFromStep = () => {
    const candidateChecklist =
      activeStep?.checklist ?? department.steps[0]?.checklist ?? [];
    const fallbackTasks = department.steps.flatMap((s) => s.checklist);
    const pool = [...candidateChecklist, ...fallbackTasks];

    updateSlots((prev) => {
      const usedTexts = new Set(
        prev.map((s) => s.text.trim()).filter(Boolean)
      );
      let poolCursor = 0;

      return prev.map((slot) => {
        if (slot.text.trim().length > 0) return slot;
        while (poolCursor < pool.length && usedTexts.has(pool[poolCursor])) {
          poolCursor += 1;
        }
        const picked = pool[poolCursor] ?? '';
        if (picked) {
          usedTexts.add(picked);
          poolCursor += 1;
        }
        return { ...slot, text: picked, done: false };
      });
    });
    setEditingIndex(null);
    setDraftText('');
  };

  const handleResetToday = () => {
    updateSlots(() => createEmptySlots());
    setEditingIndex(null);
    setDraftText('');
  };

  const filledCount = slots.filter((s) => s.text.trim().length > 0).length;
  const doneCount = slots.filter(
    (s) => s.text.trim().length > 0 && s.done
  ).length;
  const progressPct = Math.round((doneCount / 3) * 100);
  const { completedDays, currentStreak } = useMemo(
    () => computeTrackStreak(store, department.id, todayIso),
    [store, department.id, todayIso]
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            <Target className="h-4 w-4 shrink-0" />
            <span>Daily Focus</span>
            <QuickTip
              title="3-Task Daily Habit"
              tip={`Pick 3 specific ${department.shortName} micro-tasks you can finish in 30–60 minutes today. Small daily wins beat once-a-week cramming.`}
            />
          </div>
          <span className="text-zinc-600" aria-hidden="true">
            ·
          </span>
          <span className="text-sm font-semibold text-zinc-100 font-display truncate">
            3 Micro-Tasks for {department.shortName}
          </span>
          <span className="text-zinc-600 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="text-xs font-mono text-zinc-400 tabular-nums hidden sm:inline">
            {todayIso}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 text-xs font-mono tabular-nums">
            <span
              className={
                doneCount === 3 ? 'text-emerald-400 font-semibold' : 'text-zinc-200'
              }
            >
              {doneCount}/3 today
            </span>
            <span className="text-zinc-600" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <span>
                Streak: {currentStreak}d ({completedDays} total)
              </span>
              <QuickTip
                title="Real Streak Counter"
                tip="Your streak increases only on days where all 3 micro-tasks for this track are filled and checked off."
              />
            </span>
          </div>

          {filledCount < 3 && (
            <button
              type="button"
              onClick={handleSuggestFromStep}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Suggest from Step</span>
            </button>
          )}

          {filledCount > 0 && (
            <button
              type="button"
              onClick={handleResetToday}
              aria-label="Reset today's 3 micro-tasks"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Thin Habit Progress Bar */}
      <div className="h-1 w-full bg-zinc-950">
        <div
          className={`h-full transition-all duration-200 ${
            doneCount === 3 ? 'bg-emerald-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* 3 Micro-Task Columns separated by hairline dividers (no nested cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
        {slots.map((slot, idx) => {
          const isEditing = editingIndex === idx;
          const hasText = slot.text.trim().length > 0;

          return (
            <div
              key={slot.id}
              className="flex flex-col justify-between gap-2.5 p-4 bg-zinc-950/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-mono text-xs font-semibold tabular-nums ${
                    hasText && slot.done
                      ? 'text-emerald-400'
                      : hasText
                      ? 'text-blue-400'
                      : 'text-zinc-500'
                  }`}
                >
                  Focus 0{idx + 1}
                </span>

                {hasText && !isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onAskMentorAboutTask(slot.text)}
                      className="rounded px-2 py-0.5 text-[11px] font-medium text-blue-400 hover:bg-zinc-800 hover:text-blue-300 transition-colors whitespace-nowrap"
                    >
                      Ask AI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIndex(idx);
                        setDraftText(slot.text);
                      }}
                      aria-label={`Edit Focus 0${idx + 1}`}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearSlot(idx)}
                      aria-label={`Clear Focus 0${idx + 1}`}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {isEditing || !hasText ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isEditing) {
                      handleSaveSlot(idx);
                    } else if (draftText.trim()) {
                      handleSaveSlot(idx);
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={isEditing ? draftText : ''}
                    onFocus={() => {
                      if (!isEditing) {
                        setEditingIndex(idx);
                        setDraftText(slot.text);
                      }
                    }}
                    onBlur={() => {
                      if (isEditing) {
                        handleSaveSlot(idx);
                      }
                    }}
                    onChange={(e) => {
                      if (!isEditing) setEditingIndex(idx);
                      setDraftText(e.target.value);
                    }}
                    placeholder={`Set micro-task #${idx + 1} (e.g. Post 1 Reel)...`}
                    className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                  {isEditing && (
                    <button
                      type="submit"
                      onMouseDown={(e) => e.preventDefault()}
                      aria-label="Save micro-task"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                    >
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleDone(idx)}
                  className="flex items-start gap-2.5 text-left group"
                >
                  {slot.done ? (
                    <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs leading-relaxed ${
                      slot.done
                        ? 'text-zinc-500 line-through'
                        : 'text-zinc-200 group-hover:text-white'
                    }`}
                  >
                    {slot.text}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
