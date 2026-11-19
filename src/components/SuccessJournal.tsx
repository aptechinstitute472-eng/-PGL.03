import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookHeart,
  Hash,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useCloudSync } from '../context/CloudSyncContext';
import {
  DEPARTMENT_TRACKS,
  type DepartmentTrack,
} from '../data/departments';
import { QuickTip } from './QuickTip';

export interface JournalEntry {
  id: string;
  trackId: string;
  date: string;
  reflection: string;
  tags: string[];
  earnedUsd?: number;
}

interface SuccessJournalProps {
  selectedTrack: DepartmentTrack;
  onSelectTrack: (track: DepartmentTrack) => void;
  onAskMentorFromWin: (reflection: string, trackTitle: string) => void;
}

const JOURNAL_STORAGE_KEY = 'pgl03_success_journal_v1';

const PRESET_WIN_TAGS = [
  'SmallWin',
  'FirstDollar',
  'ClientReply',
  'MonetizationStep',
  'SkillShipped',
  'Consistency',
];

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeTag(raw: string): string {
  return raw.replace(/^#+/, '').replace(/\s+/g, '').trim();
}

export function SuccessJournal({
  selectedTrack,
  onSelectTrack,
  onAskMentorFromWin,
}: SuccessJournalProps) {
  const { saveJournalEntryCloud, deleteJournalEntryCloud } = useCloudSync();
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as JournalEntry[];
        }
      }
    } catch {
      // ignore storage read error
    }
    return [];
  });

  // Composer state
  const [reflection, setReflection] = useState('');
  const [earnedUsdInput, setEarnedUsdInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['SmallWin']);
  const [customTagInput, setCustomTagInput] = useState('');

  // Filters
  const [trackFilter, setTrackFilter] = useState<'all' | 'selected'>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore storage write error
    }
  }, [entries]);

  useEffect(() => {
    const syncHydrated = () => {
      try {
        const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) setEntries(parsed as JournalEntry[]);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('pgl03-journal-updated', syncHydrated);
    window.addEventListener('pgl03-cloud-hydrated', syncHydrated);
    return () => {
      window.removeEventListener('pgl03-journal-updated', syncHydrated);
      window.removeEventListener('pgl03-cloud-hydrated', syncHydrated);
    };
  }, []);

  const currentTrackTag = normalizeTag(selectedTrack.shortName);

  const togglePresetTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const clean = normalizeTag(customTagInput);
    if (!clean) return;
    if (!selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean]);
    }
    setCustomTagInput('');
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reflection.trim();
    if (!trimmed) return;

    const customPending = normalizeTag(customTagInput);
    const mergedTags = Array.from(
      new Set([
        currentTrackTag,
        ...selectedTags,
        ...(customPending ? [customPending] : []),
      ])
    ).filter(Boolean);

    const parsedUsd = Number(earnedUsdInput);
    const earnedUsd =
      earnedUsdInput.trim() && Number.isFinite(parsedUsd) && parsedUsd > 0
        ? Math.round(parsedUsd * 100) / 100
        : undefined;

    const newEntry: JournalEntry = {
      id: `win-${Date.now()}`,
      trackId: selectedTrack.id,
      date: getTodayIso(),
      reflection: trimmed,
      tags: mergedTags,
      earnedUsd,
    };

    setEntries((prev) => [newEntry, ...prev]);
    void saveJournalEntryCloud({
      id: newEntry.id,
      trackId: newEntry.trackId,
      date: newEntry.date,
      reflection: newEntry.reflection,
      tags: newEntry.tags,
    });
    setReflection('');
    setEarnedUsdInput('');
    setCustomTagInput('');
    setSelectedTags(['SmallWin']);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
    void deleteJournalEntryCloud(id);
  };

  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.tags) {
        set.add(tag);
      }
    }
    return Array.from(set);
  }, [entries]);

  const stats = useMemo(() => {
    const trackWins = entries.filter((e) => e.trackId === selectedTrack.id).length;
    const uniqueDays = new Set(entries.map((e) => e.date)).size;
    return {
      totalWins: entries.length,
      trackWins,
      uniqueDays,
    };
  }, [entries, selectedTrack.id]);

  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (trackFilter === 'selected' && entry.trackId !== selectedTrack.id) {
        return false;
      }
      if (
        activeTagFilter !== 'all' &&
        !entry.tags.some((t) => t.toLowerCase() === activeTagFilter.toLowerCase())
      ) {
        return false;
      }
      if (!q) return true;
      return (
        entry.reflection.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [entries, trackFilter, selectedTrack.id, activeTagFilter, searchQuery]);

  return (
    <section
      id="journal"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <BookHeart className="h-4 w-4" />
            <span>Success Journal · Daily Reflections &amp; Small Wins</span>
            <QuickTip
              title="Why Log Small Wins"
              tip="Documenting small daily progress (your first client reply, a finished edit, or $10 earned) keeps motivation steady between big payouts."
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            Capture Daily Wins &amp; Track-Tagged Reflections
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            Write short reflections about your earnings, client breakthroughs, or daily consistency—automatically tagged to your active track.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select track for success journal"
            value={selectedTrack.id}
            onChange={(e) => {
              const found = DEPARTMENT_TRACKS.find(
                (t) => t.id === e.target.value
              );
              if (found) onSelectTrack(found);
            }}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-100 focus:border-blue-500 focus:outline-none"
          >
            {DEPARTMENT_TRACKS.map((track) => (
              <option key={track.id} value={track.id}>
                {track.shortName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Column Real Stats Strip */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Total Wins Logged</div>
          <div className="mt-1 text-2xl font-bold text-zinc-50 font-mono tabular-nums">
            {stats.totalWins}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400 truncate">
            {selectedTrack.shortName} Wins
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-400 font-mono tabular-nums">
            {stats.trackWins}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Days Journaled</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {stats.uniqueDays}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Reflection Composer */}
        <form
          onSubmit={handleSubmitEntry}
          className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-100 font-display">
              Post Today&apos;s Reflection
            </h3>
            <span className="font-mono text-xs text-blue-400">
              #{currentTrackTag}
            </span>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="journal-reflection"
              className="block text-xs font-medium text-zinc-300"
            >
              What did you ship, learn, or earn today?
            </label>
            <textarea
              id="journal-reflection"
              rows={3}
              required
              maxLength={420}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={`e.g. Finished ${selectedTrack.shortName} outreach pitch #5 and got a positive client reply...`}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 tabular-nums">
              <span>Auto-tagged with #{currentTrackTag}</span>
              <span>{reflection.length}/420</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <span>Select Win Tags</span>
              <QuickTip
                title="Tag System"
                tip="Tags group your milestones so you can filter back to #FirstDollar or #ClientReply wins whenever you need a boost."
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_WIN_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => togglePresetTag(tag)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Hash className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  placeholder="Add custom tag (e.g. PageApproved)"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-7 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
              >
                Add Tag
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="journal-earned"
              className="block text-xs font-medium text-zinc-300"
            >
              Earnings Milestone Today (USD, optional)
            </label>
            <input
              id="journal-earned"
              type="number"
              min={0}
              step="0.01"
              value={earnedUsdInput}
              onChange={(e) => setEarnedUsdInput(e.target.value)}
              placeholder="Leave blank for non-cash win (e.g. 45)"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!reflection.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Post Reflection</span>
          </button>
        </form>

        {/* Right: Filterable Reflections Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTrackFilter('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  trackFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Tracks
              </button>
              <button
                type="button"
                onClick={() => setTrackFilter('selected')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  trackFilter === 'selected'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {selectedTrack.shortName}
              </button>

              {allAvailableTags.length > 0 && (
                <select
                  aria-label="Filter journal by tag"
                  value={activeTagFilter}
                  onChange={(e) => setActiveTagFilter(e.target.value)}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-mono text-zinc-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Tags</option>
                  {allAvailableTags.map((t) => (
                    <option key={t} value={t}>
                      #{t}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wins..."
                className="w-40 sm:w-48 rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {visibleEntries.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center space-y-1.5">
              <p className="text-sm font-semibold text-zinc-200">
                No journal reflections posted yet
              </p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Start with one small win today—publishing a video, completing an n8n workflow test, sending a client pitch, or earning your first payout.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleEntries.map((entry) => {
                const track =
                  DEPARTMENT_TRACKS.find((t) => t.id === entry.trackId) ??
                  selectedTrack;
                return (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-zinc-400">
                        <span className="font-mono text-zinc-300 tabular-nums">
                          {entry.date}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-zinc-200">
                          {track.shortName}
                        </span>
                        {entry.tags.map((tag) => (
                          <span
                            key={`${entry.id}-${tag}`}
                            className="font-mono text-blue-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {typeof entry.earnedUsd === 'number' &&
                          entry.earnedUsd > 0 && (
                            <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                              +${entry.earnedUsd.toLocaleString()} USD
                            </span>
                          )}
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          aria-label="Delete reflection"
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {entry.reflection}
                    </p>

                    <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onAskMentorFromWin(entry.reflection, track.title)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <span>Plan Next Win with AI Mentor</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
