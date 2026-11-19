import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckSquare,
  Plus,
  Square,
  Trash2,
} from 'lucide-react';
import type { DepartmentTrack } from '../data/departments';

export interface DailyInsightEntry {
  id: string;
  trackId: string;
  date: string;
  outputsPublished: number;
  viewsOrReach: number;
  primaryMetric: number;
  followersGained: number;
  revenueUsd: number;
  notes: string;
}

interface InsightsMilestonesProps {
  department: DepartmentTrack;
  completedWeeklyTaskIds: string[];
  onToggleWeeklyTask: (taskId: string) => void;
  onAnalyzeWithAI: (summaryPrompt: string) => void;
}

const INSIGHTS_STORAGE_KEY = 'pgl03_real_daily_insights_v1';

export function InsightsMilestones({
  department,
  completedWeeklyTaskIds,
  onToggleWeeklyTask,
  onAnalyzeWithAI,
}: InsightsMilestonesProps) {
  const [entries, setEntries] = useState<DailyInsightEntry[]>(() => {
    try {
      const raw = localStorage.getItem(INSIGHTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as DailyInsightEntry[];
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const todayIso = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayIso);
  const [outputsPublished, setOutputsPublished] = useState('1');
  const [viewsOrReach, setViewsOrReach] = useState('');
  const [primaryMetric, setPrimaryMetric] = useState('');
  const [followersGained, setFollowersGained] = useState('');
  const [revenueUsd, setRevenueUsd] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(entries));
      window.dispatchEvent(new Event('pgl03-insights-updated'));
    } catch {
      // ignore storage write errors
    }
  }, [entries]);

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const raw = localStorage.getItem(INSIGHTS_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setEntries((prev) => {
            const next = parsed as DailyInsightEntry[];
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
          });
        }
      } catch {
        // ignore storage read errors
      }
    };
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('pgl03-insights-updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('pgl03-insights-updated', syncFromStorage);
    };
  }, []);

  const trackEntries = useMemo(
    () =>
      entries
        .filter((e) => e.trackId === department.id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [entries, department.id]
  );

  const totals = useMemo(() => {
    return trackEntries.reduce(
      (acc, item) => ({
        outputs: acc.outputs + item.outputsPublished,
        views: acc.views + item.viewsOrReach,
        primary: acc.primary + item.primaryMetric,
        followers: acc.followers + item.followersGained,
        revenue: acc.revenue + item.revenueUsd,
      }),
      { outputs: 0, views: 0, primary: 0, followers: 0, revenue: 0 }
    );
  }, [trackEntries]);

  const primaryPct = Math.min(
    100,
    Math.round((totals.primary / Math.max(1, department.insightTargets.primaryGoal)) * 100)
  );
  const secondaryPct = Math.min(
    100,
    Math.round(
      (totals.followers / Math.max(1, department.insightTargets.secondaryGoal)) * 100
    )
  );

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: DailyInsightEntry = {
      id: `log-${Date.now()}`,
      trackId: department.id,
      date: date || todayIso,
      outputsPublished: Math.max(0, Number(outputsPublished) || 0),
      viewsOrReach: Math.max(0, Number(viewsOrReach) || 0),
      primaryMetric: Math.max(0, Number(primaryMetric) || 0),
      followersGained: Math.max(0, Number(followersGained) || 0),
      revenueUsd: Math.max(0, Number(revenueUsd) || 0),
      notes: notes.trim(),
    };
    setEntries((prev) => [...prev, newEntry]);
    setViewsOrReach('');
    setPrimaryMetric('');
    setFollowersGained('');
    setRevenueUsd('0');
    setNotes('');
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleRunAiAudit = () => {
    const recentRows = trackEntries
      .slice(-7)
      .map(
        (r) =>
          `${r.date}: outputs=${r.outputsPublished}, reach=${r.viewsOrReach}, ${department.insightTargets.primaryLabel}=${r.primaryMetric}, gained=${r.followersGained}, revenue=$${r.revenueUsd}${r.notes ? ` (${r.notes})` : ''}`
      )
      .join('\n');

    const prompt =
      trackEntries.length === 0
        ? `I haven't logged daily metrics for ${department.title} yet. Give me a day-by-day tracking plan for Week 1 telling me exactly which numbers to copy from my dashboard every night.`
        : `Analyze my REAL logged daily insights for ${department.title}:\nTotal ${department.insightTargets.primaryLabel}: ${totals.primary} / ${department.insightTargets.primaryGoal} ${department.insightTargets.primaryUnit}\nTotal ${department.insightTargets.secondaryLabel}: ${totals.followers} / ${department.insightTargets.secondaryGoal} ${department.insightTargets.secondaryUnit}\nTotal Revenue: $${totals.revenue}\n\nRecent Days:\n${recentRows}\n\nBased ONLY on these real numbers, tell me what is working, what needs fixing tomorrow, and my exact next milestone step.`;

    onAnalyzeWithAI(prompt);
  };

  const maxChartViews = Math.max(
    1,
    ...trackEntries.map((e) => e.viewsOrReach)
  );

  return (
    <div className="space-y-6">
      {/* 4-Week Step-by-Step Milestone Plan */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-50 font-display">
              4-Week Execution Milestones · {department.shortName}
            </h3>
            <p className="text-xs text-zinc-400">
              Follow each week sequentially and check off milestones as you execute them.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {department.weeklyMilestones.map((wk, wIdx) => {
            const doneInWeek = wk.tasks.filter((_, tIdx) =>
              completedWeeklyTaskIds.includes(
                `${department.id}-wk-${wIdx}-${tIdx}`
              )
            ).length;
            return (
              <div
                key={wk.week}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-semibold text-blue-400">
                      {wk.week} · {wk.targetMetric}
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-100 mt-0.5">
                      {wk.focusTitle}
                    </h4>
                  </div>
                  <span className="font-mono text-xs text-zinc-400 tabular-nums shrink-0">
                    {doneInWeek}/{wk.tasks.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {wk.tasks.map((task, tIdx) => {
                    const taskId = `${department.id}-wk-${wIdx}-${tIdx}`;
                    const checked = completedWeeklyTaskIds.includes(taskId);
                    return (
                      <button
                        key={taskId}
                        type="button"
                        onClick={() => onToggleWeeklyTask(taskId)}
                        className="flex w-full items-start gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-2 text-left text-xs transition-colors hover:border-zinc-700"
                      >
                        {checked ? (
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            checked
                              ? 'text-zinc-500 line-through'
                              : 'text-zinc-200'
                          }
                        >
                          {task}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Day-by-Day Insights Log & Threshold Progress */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
              <BarChart3 className="h-4 w-4" />
              <span>Real Day-by-Day Insights Log (Zero Fake Data)</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-50 font-display mt-0.5">
              Track Actual Daily Numbers Toward {department.shortName} Monetization
            </h3>
          </div>

          <button
            type="button"
            onClick={handleRunAiAudit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Analyze My Real Insights with AI</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Real Progress Against Official Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                {department.insightTargets.primaryLabel}
              </span>
              <span className="font-mono font-semibold text-blue-400 tabular-nums">
                {primaryPct}%
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-zinc-50 tabular-nums">
              {totals.primary.toLocaleString()} /{' '}
              {department.insightTargets.primaryGoal.toLocaleString()}{' '}
              {department.insightTargets.primaryUnit}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-950">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${primaryPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                {department.insightTargets.secondaryLabel}
              </span>
              <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                {secondaryPct}%
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-zinc-50 tabular-nums">
              {totals.followers.toLocaleString()} /{' '}
              {department.insightTargets.secondaryGoal.toLocaleString()}{' '}
              {department.insightTargets.secondaryUnit}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-950">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${secondaryPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 space-y-1">
            <div className="text-xs text-zinc-400">Logged Earnings &amp; Reach</div>
            <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
              ${totals.revenue.toLocaleString()} USD
            </div>
            <div className="text-xs font-mono text-zinc-400 tabular-nums">
              {totals.views.toLocaleString()} views · {totals.outputs} posts
            </div>
          </div>
        </div>

        {/* Log Real Daily Entry Form */}
        <form
          onSubmit={handleAddEntry}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3.5"
        >
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              Posts / Tasks
            </label>
            <input
              type="number"
              min={0}
              value={outputsPublished}
              onChange={(e) => setOutputsPublished(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              Views / Reach
            </label>
            <input
              type="number"
              min={0}
              required
              placeholder="e.g. 1240"
              value={viewsOrReach}
              onChange={(e) => setViewsOrReach(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1 truncate">
              {department.insightTargets.primaryLabel}
            </label>
            <input
              type="number"
              min={0}
              required
              placeholder={department.insightTargets.primaryUnit}
              value={primaryMetric}
              onChange={(e) => setPrimaryMetric(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1 truncate">
              +{department.insightTargets.secondaryUnit}
            </label>
            <input
              type="number"
              min={0}
              required
              placeholder="0"
              value={followersGained}
              onChange={(e) => setFollowersGained(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Day</span>
            </button>
          </div>

          <div className="col-span-2 sm:col-span-2">
            <input
              type="number"
              min={0}
              step="0.01"
              value={revenueUsd}
              onChange={(e) => setRevenueUsd(e.target.value)}
              placeholder="Revenue USD (0)"
              aria-label="Revenue USD"
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note (e.g. Reel #4 hit 42% 3s hold rate)"
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </form>

        {/* Empty State or Real Daily Chart + Table */}
        {trackEntries.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center space-y-1.5">
            <p className="text-sm font-semibold text-zinc-200">
              No daily metrics logged for {department.shortName} yet
            </p>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">
              Copy your real daily numbers from Meta Business Suite, YouTube Studio, TikTok Studio, or Upwork above to track genuine day-by-day momentum.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pure Real-Data Daily Bar Trend */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Daily Reach / Views Trend (Real Logged Entries)</span>
                <span className="font-mono tabular-nums">
                  {trackEntries.length} days logged
                </span>
              </div>
              <div className="flex items-end gap-2 h-24 pt-2">
                {trackEntries.slice(-14).map((entry) => {
                  const pctHeight = Math.max(
                    8,
                    Math.round((entry.viewsOrReach / maxChartViews) * 100)
                  );
                  return (
                    <div
                      key={entry.id}
                      className="flex-1 flex flex-col items-center gap-1 min-w-0"
                      title={`${entry.date}: ${entry.viewsOrReach.toLocaleString()} views`}
                    >
                      <div className="w-full flex items-end justify-center h-16">
                        <div
                          className="w-full max-w-[28px] rounded-t bg-blue-500/85 hover:bg-blue-400 transition-colors"
                          style={{ height: `${pctHeight}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 truncate w-full text-center tabular-nums">
                        {entry.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real Log Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold text-right">Posts</th>
                    <th className="px-3 py-2 font-semibold text-right">Views/Reach</th>
                    <th className="px-3 py-2 font-semibold text-right">
                      {department.insightTargets.primaryUnit}
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      +{department.insightTargets.secondaryUnit}
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">USD</th>
                    <th className="px-3 py-2 font-semibold">Notes</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                  {trackEntries
                    .slice()
                    .reverse()
                    .map((row) => (
                      <tr key={row.id} className="hover:bg-zinc-900/50">
                        <td className="px-3 py-2 font-mono text-zinc-200 tabular-nums whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="px-3 py-2 font-mono text-right text-zinc-300 tabular-nums">
                          {row.outputsPublished}
                        </td>
                        <td className="px-3 py-2 font-mono text-right text-zinc-100 tabular-nums">
                          {row.viewsOrReach.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-right text-blue-400 tabular-nums">
                          {row.primaryMetric.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-right text-emerald-400 tabular-nums">
                          +{row.followersGained.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-right text-zinc-100 tabular-nums">
                          ${row.revenueUsd}
                        </td>
                        <td className="px-3 py-2 text-zinc-400 max-w-[200px] truncate">
                          {row.notes || '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(row.id)}
                            aria-label="Delete log entry"
                            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
