import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CheckSquare,
  Plus,
  RotateCcw,
  Square,
  TrendingUp,
} from 'lucide-react';
import {
  DEPARTMENT_TRACKS,
  type DepartmentTrack,
} from '../data/departments';
import type { DailyInsightEntry } from './InsightsMilestones';

type DashboardChartView = 'combined' | 'momentum' | 'all_tracks';

interface MilestoneDashboardProps {
  selectedTrack: DepartmentTrack;
  onSelectTrack: (track: DepartmentTrack) => void;
  completedChecklistIds: string[];
  completedWeeklyTaskIds: string[];
  onToggleWeeklyTask: (taskId: string) => void;
}

interface WeekChartRow {
  week: string;
  focusTitle: string;
  targetMetric: string;
  targetUsd: number;
  actualUsd: number;
  doneTasks: number;
  totalTasks: number;
  completionPct: number;
  cumulativeCompletionPct: number;
}

interface AllTrackChartRow {
  trackId: string;
  shortName: string;
  roadmapPct: number;
  weeklyPct: number;
  loggedUsd: number;
}

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number;
  dataKey?: string;
  color?: string;
  payload?: WeekChartRow & AllTrackChartRow;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
  chartView: DashboardChartView;
}

const INSIGHTS_STORAGE_KEY = 'pgl03_real_daily_insights_v1';
const TARGETS_STORAGE_KEY = 'pgl03_weekly_revenue_targets_v1';
const PKR_RATE = 278;

function getDefaultWeeklyTargets(track: DepartmentTrack): [number, number, number, number] {
  if (track.category === 'automation') {
    return [100, 350, 750, 1400];
  }
  if (track.category === 'freelancing') {
    return [75, 250, 550, 1000];
  }
  if (track.id === 'youtube') {
    return [0, 75, 250, 600];
  }
  return [25, 100, 300, 650];
}

function DashboardTooltip({
  active,
  payload,
  label,
  chartView,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const row = payload[0]?.payload;
  if (!row) return null;

  if (chartView === 'all_tracks') {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 shadow-lg space-y-1.5">
        <div className="font-semibold text-zinc-50 font-display">{label}</div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">Roadmap SOP Progress</span>
          <span className="font-mono font-semibold text-blue-400 tabular-nums">
            {row.roadmapPct}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">Weekly Milestones</span>
          <span className="font-mono font-semibold text-emerald-400 tabular-nums">
            {row.weeklyPct}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-6 border-t border-zinc-800 pt-1">
          <span className="text-zinc-400">Logged Earnings</span>
          <span className="font-mono font-semibold text-zinc-100 tabular-nums">
            ${row.loggedUsd.toLocaleString()} USD
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 shadow-lg space-y-1.5 max-w-[260px]">
      <div>
        <div className="font-mono font-semibold text-blue-400">{row.week}</div>
        <div className="text-zinc-200 font-medium truncate">{row.focusTitle}</div>
      </div>
      <div className="space-y-1 border-t border-zinc-800 pt-1.5">
        <div className="flex items-center justify-between gap-5">
          <span className="text-zinc-400">Target Revenue</span>
          <span className="font-mono font-semibold text-zinc-200 tabular-nums">
            ${row.targetUsd.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="text-zinc-400">Logged Revenue</span>
          <span className="font-mono font-semibold text-emerald-400 tabular-nums">
            ${row.actualUsd.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="text-zinc-400">Week Completion</span>
          <span className="font-mono font-semibold text-blue-400 tabular-nums">
            {row.doneTasks}/{row.totalTasks} ({row.completionPct}%)
          </span>
        </div>
        {chartView === 'momentum' && (
          <div className="flex items-center justify-between gap-5">
            <span className="text-zinc-400">Cumulative</span>
            <span className="font-mono font-semibold text-zinc-100 tabular-nums">
              {row.cumulativeCompletionPct}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MilestoneDashboard({
  selectedTrack,
  onSelectTrack,
  completedChecklistIds,
  completedWeeklyTaskIds,
  onToggleWeeklyTask,
}: MilestoneDashboardProps) {
  const [chartView, setChartView] = useState<DashboardChartView>('combined');
  const [showLogForm, setShowLogForm] = useState(false);
  const [logWeekIndex, setLogWeekIndex] = useState<number>(0);
  const [logRevenueUsd, setLogRevenueUsd] = useState<string>('');
  const [logNote, setLogNote] = useState<string>('');

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
      // ignore storage read errors
    }
    return [];
  });

  const [customTargetsByTrack, setCustomTargetsByTrack] = useState<
    Record<string, [number, number, number, number]>
  >(() => {
    try {
      const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, [number, number, number, number]>;
        }
      }
    } catch {
      // ignore storage read errors
    }
    return {};
  });

  useEffect(() => {
    const syncEntries = () => {
      try {
        const raw = localStorage.getItem(INSIGHTS_STORAGE_KEY);
        if (!raw) {
          setEntries([]);
          return;
        }
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setEntries(parsed as DailyInsightEntry[]);
        }
      } catch {
        // ignore read error
      }
    };

    window.addEventListener('storage', syncEntries);
    window.addEventListener('pgl03-insights-updated', syncEntries);
    return () => {
      window.removeEventListener('storage', syncEntries);
      window.removeEventListener('pgl03-insights-updated', syncEntries);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        TARGETS_STORAGE_KEY,
        JSON.stringify(customTargetsByTrack)
      );
    } catch {
      // ignore write error
    }
  }, [customTargetsByTrack]);

  const weeklyTargets = useMemo<[number, number, number, number]>(() => {
    return (
      customTargetsByTrack[selectedTrack.id] ??
      getDefaultWeeklyTargets(selectedTrack)
    );
  }, [customTargetsByTrack, selectedTrack]);

  const trackEntries = useMemo(
    () =>
      entries
        .filter((e) => e.trackId === selectedTrack.id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [entries, selectedTrack.id]
  );

  // Bucket real user-logged revenue entries across Week 01 - Week 04 from earliest logged day
  const weeklyActualRevenue = useMemo<[number, number, number, number]>(() => {
    const buckets: [number, number, number, number] = [0, 0, 0, 0];
    if (trackEntries.length === 0) return buckets;

    const firstDateMs = new Date(`${trackEntries[0].date}T00:00:00`).getTime();
    for (const entry of trackEntries) {
      const entryMs = new Date(`${entry.date}T00:00:00`).getTime();
      const diffDays = Number.isFinite(entryMs - firstDateMs)
        ? Math.max(0, Math.floor((entryMs - firstDateMs) / (1000 * 60 * 60 * 24)))
        : 0;
      const weekIdx = Math.min(3, Math.floor(diffDays / 7));
      buckets[weekIdx] += entry.revenueUsd;
    }
    return buckets;
  }, [trackEntries]);

  const weeklyChartData: WeekChartRow[] = useMemo(() => {
    let cumulativeDone = 0;
    let cumulativeTotal = 0;

    return selectedTrack.weeklyMilestones.map((wk, wIdx) => {
      const totalTasks = wk.tasks.length;
      const doneTasks = wk.tasks.filter((_, tIdx) =>
        completedWeeklyTaskIds.includes(`${selectedTrack.id}-wk-${wIdx}-${tIdx}`)
      ).length;

      cumulativeDone += doneTasks;
      cumulativeTotal += totalTasks;

      const completionPct =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      const cumulativeCompletionPct =
        cumulativeTotal > 0
          ? Math.round((cumulativeDone / cumulativeTotal) * 100)
          : 0;

      return {
        week: wk.week,
        focusTitle: wk.focusTitle,
        targetMetric: wk.targetMetric,
        targetUsd: weeklyTargets[wIdx] ?? 0,
        actualUsd: Math.round((weeklyActualRevenue[wIdx] ?? 0) * 100) / 100,
        doneTasks,
        totalTasks,
        completionPct,
        cumulativeCompletionPct,
      };
    });
  }, [
    selectedTrack,
    completedWeeklyTaskIds,
    weeklyTargets,
    weeklyActualRevenue,
  ]);

  const allTracksChartData: AllTrackChartRow[] = useMemo(() => {
    return DEPARTMENT_TRACKS.map((track) => {
      const totalSop = track.steps.reduce(
        (sum, s) => sum + s.checklist.length,
        0
      );
      const doneSop = track.steps.reduce(
        (sum, s) =>
          sum +
          s.checklist.filter((_, idx) =>
            completedChecklistIds.includes(`${s.id}-chk-${idx}`)
          ).length,
        0
      );

      const totalWk = track.weeklyMilestones.reduce(
        (sum, wk) => sum + wk.tasks.length,
        0
      );
      const doneWk = track.weeklyMilestones.reduce(
        (sum, wk, wIdx) =>
          sum +
          wk.tasks.filter((_, tIdx) =>
            completedWeeklyTaskIds.includes(`${track.id}-wk-${wIdx}-${tIdx}`)
          ).length,
        0
      );

      const loggedUsd = entries
        .filter((e) => e.trackId === track.id)
        .reduce((sum, e) => sum + e.revenueUsd, 0);

      return {
        trackId: track.id,
        shortName: track.shortName,
        roadmapPct: totalSop > 0 ? Math.round((doneSop / totalSop) * 100) : 0,
        weeklyPct: totalWk > 0 ? Math.round((doneWk / totalWk) * 100) : 0,
        loggedUsd: Math.round(loggedUsd * 100) / 100,
      };
    });
  }, [completedChecklistIds, completedWeeklyTaskIds, entries]);

  const summary = useMemo(() => {
    const targetSum = weeklyTargets.reduce((a, b) => a + b, 0);
    const actualSum = trackEntries.reduce((a, e) => a + e.revenueUsd, 0);

    const totalWeeklyTasks = weeklyChartData.reduce(
      (sum, row) => sum + row.totalTasks,
      0
    );
    const doneWeeklyTasks = weeklyChartData.reduce(
      (sum, row) => sum + row.doneTasks,
      0
    );
    const weeklyPct =
      totalWeeklyTasks > 0
        ? Math.round((doneWeeklyTasks / totalWeeklyTasks) * 100)
        : 0;

    const totalSopTasks = selectedTrack.steps.reduce(
      (sum, s) => sum + s.checklist.length,
      0
    );
    const doneSopTasks = selectedTrack.steps.reduce(
      (sum, s) =>
        sum +
        s.checklist.filter((_, idx) =>
          completedChecklistIds.includes(`${s.id}-chk-${idx}`)
        ).length,
      0
    );
    const sopPct =
      totalSopTasks > 0 ? Math.round((doneSopTasks / totalSopTasks) * 100) : 0;

    const targetAttainmentPct =
      targetSum > 0 ? Math.min(999, Math.round((actualSum / targetSum) * 100)) : 0;

    return {
      targetSum,
      actualSum,
      targetAttainmentPct,
      totalWeeklyTasks,
      doneWeeklyTasks,
      weeklyPct,
      totalSopTasks,
      doneSopTasks,
      sopPct,
    };
  }, [
    weeklyTargets,
    trackEntries,
    weeklyChartData,
    selectedTrack,
    completedChecklistIds,
  ]);

  const handleUpdateTarget = (weekIndex: number, value: string) => {
    const num = Math.max(0, Math.round(Number(value) || 0));
    setCustomTargetsByTrack((prev) => {
      const current =
        prev[selectedTrack.id] ?? getDefaultWeeklyTargets(selectedTrack);
      const next: [number, number, number, number] = [...current] as [
        number,
        number,
        number,
        number
      ];
      next[weekIndex] = num;
      return { ...prev, [selectedTrack.id]: next };
    });
  };

  const handleResetTargets = () => {
    setCustomTargetsByTrack((prev) => {
      const copy = { ...prev };
      delete copy[selectedTrack.id];
      return copy;
    });
  };

  const handleQuickLogRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(logRevenueUsd);
    if (!Number.isFinite(amount) || amount < 0) return;

    const baseDate =
      trackEntries.length > 0
        ? new Date(`${trackEntries[0].date}T00:00:00`)
        : new Date();
    const entryDate = new Date(baseDate);
    if (trackEntries.length > 0) {
      entryDate.setDate(baseDate.getDate() + logWeekIndex * 7);
    }

    const newEntry: DailyInsightEntry = {
      id: `log-${Date.now()}`,
      trackId: selectedTrack.id,
      date: entryDate.toISOString().slice(0, 10),
      outputsPublished: 1,
      viewsOrReach: 0,
      primaryMetric: 0,
      followersGained: 0,
      revenueUsd: Math.round(amount * 100) / 100,
      notes:
        logNote.trim() || `Week 0${logWeekIndex + 1} milestone revenue logged`,
    };

    const nextEntries = [...entries, newEntry];
    setEntries(nextEntries);
    try {
      localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(nextEntries));
      window.dispatchEvent(new Event('pgl03-insights-updated'));
    } catch {
      // ignore storage write errors
    }

    setLogRevenueUsd('');
    setLogNote('');
    setShowLogForm(false);
  };

  return (
    <section
      id="milestones"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <TrendingUp className="h-4 w-4" />
            <span>Milestone Dashboard · Visual Growth Tracking</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            Weekly Revenue Targets &amp; Task Completion Progress
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            Compare your weekly USD targets against actual logged earnings and track real-time completion across Week 01 to Week 04.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select track for milestone dashboard"
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

          <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {(
              [
                { id: 'combined', label: 'Revenue & Tasks' },
                { id: 'momentum', label: 'Task Momentum' },
                { id: 'all_tracks', label: 'All 8 Tracks' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setChartView(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  chartView === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowLogForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Real Revenue</span>
          </button>
        </div>
      </div>

      {/* Inline Real Revenue Logger */}
      {showLogForm && (
        <form
          onSubmit={handleQuickLogRevenue}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 items-end"
        >
          <div className="sm:col-span-3 space-y-1">
            <label
              htmlFor="ms-log-week"
              className="block text-xs font-medium text-zinc-300"
            >
              Milestone Week
            </label>
            <select
              id="ms-log-week"
              value={logWeekIndex}
              onChange={(e) => setLogWeekIndex(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            >
              {selectedTrack.weeklyMilestones.map((wk, idx) => (
                <option key={wk.week} value={idx}>
                  {wk.week} · {wk.focusTitle.slice(0, 26)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label
              htmlFor="ms-log-usd"
              className="block text-xs font-medium text-zinc-300"
            >
              Actual Revenue Earned (USD)
            </label>
            <input
              id="ms-log-usd"
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="e.g. 125"
              value={logRevenueUsd}
              onChange={(e) => setLogRevenueUsd(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label
              htmlFor="ms-log-note"
              className="block text-xs font-medium text-zinc-300"
            >
              Source / Client / Payout Note
            </label>
            <input
              id="ms-log-note"
              type="text"
              placeholder="e.g. Fiverr order #2 or AdSense payout"
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap"
            >
              Save Entry
            </button>
          </div>
        </form>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">4-Week Revenue Target</div>
          <div className="mt-1 text-2xl font-bold text-zinc-50 font-mono tabular-nums">
            ${summary.targetSum.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            Rs. {(summary.targetSum * PKR_RATE).toLocaleString()} PKR
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Actual Logged Revenue</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            ${summary.actualSum.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            {summary.targetAttainmentPct}% of 4-week goal
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Weekly Milestones Done</div>
          <div className="mt-1 text-2xl font-bold text-blue-400 font-mono tabular-nums">
            {summary.weeklyPct}%
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            {summary.doneWeeklyTasks} / {summary.totalWeeklyTasks} weekly tasks
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Track Roadmap SOP</div>
          <div className="mt-1 text-2xl font-bold text-zinc-100 font-mono tabular-nums">
            {summary.sopPct}%
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            {summary.doneSopTasks} / {summary.totalSopTasks} action steps
          </div>
        </div>
      </div>

      {/* Main Dynamic Recharts Canvas */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 font-display">
              {chartView === 'combined' &&
                `${selectedTrack.shortName} · Weekly Target ($), Logged Revenue ($) & Task Completion (%)`}
              {chartView === 'momentum' &&
                `${selectedTrack.shortName} · Weekly vs Cumulative Execution Momentum (%)`}
              {chartView === 'all_tracks' &&
                'All 8 Income Tracks · Roadmap & Weekly Milestone Completion (%)'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {chartView === 'all_tracks'
                ? 'Select any track from the dropdown above to inspect its weekly revenue chart.'
                : 'Chart updates automatically as you check off weekly milestones or log real earnings.'}
            </p>
          </div>

          {chartView !== 'all_tracks' && (
            <button
              type="button"
              onClick={handleResetTargets}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Targets</span>
            </button>
          )}
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'combined' ? (
              <ComposedChart
                data={weeklyChartData}
                margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#27272a"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="usd"
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: number) => `$${val}`}
                />
                <YAxis
                  yAxisId="pct"
                  orientation="right"
                  domain={[0, 100]}
                  stroke="#60a5fa"
                  tick={{ fill: '#60a5fa', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={<DashboardTooltip chartView={chartView} />}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar
                  yAxisId="usd"
                  dataKey="targetUsd"
                  name="Target Revenue ($)"
                  fill="#3f3f46"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Bar
                  yAxisId="usd"
                  dataKey="actualUsd"
                  name="Logged Revenue ($)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="completionPct"
                  name="Task Completion (%)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: '#3b82f6',
                    stroke: '#09090b',
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            ) : chartView === 'momentum' ? (
              <AreaChart
                data={weeklyChartData}
                margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="pglBlueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient
                    id="pglEmeraldFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#27272a"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <Tooltip
                  content={<DashboardTooltip chartView={chartView} />}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="completionPct"
                  name="Weekly Task Completion (%)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#pglBlueFill)"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeCompletionPct"
                  name="Cumulative Milestone Pace (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#pglEmeraldFill)"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={allTracksChartData}
                margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#27272a"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#a1a1aa"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={<DashboardTooltip chartView={chartView} />}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar
                  dataKey="roadmapPct"
                  name="Roadmap SOP (%)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="weeklyPct"
                  name="Weekly Milestones (%)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive 4-Week Target & Task Control Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {selectedTrack.weeklyMilestones.map((wk, wIdx) => {
          const row = weeklyChartData[wIdx];
          return (
            <div
              key={`${selectedTrack.id}-${wk.week}`}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-400">
                    {wk.week}
                  </span>
                  <span className="font-mono text-xs text-emerald-400 tabular-nums">
                    {row.completionPct}% done
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
                    {wk.focusTitle}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">{wk.targetMetric}</p>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${row.completionPct}%` }}
                  />
                </div>

                {/* Editable Weekly USD Target + Actual */}
                <div className="grid grid-cols-2 gap-2 border-y border-zinc-800 py-2.5">
                  <div>
                    <label
                      htmlFor={`target-${selectedTrack.id}-${wIdx}`}
                      className="block text-[11px] text-zinc-400 mb-1"
                    >
                      Target (USD)
                    </label>
                    <input
                      id={`target-${selectedTrack.id}-${wIdx}`}
                      type="number"
                      min={0}
                      step={25}
                      value={row.targetUsd}
                      onChange={(e) => handleUpdateTarget(wIdx, e.target.value)}
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-100 tabular-nums focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 mb-1">
                      Logged (USD)
                    </div>
                    <div className="rounded border border-zinc-800/70 bg-zinc-900/50 px-2 py-1 font-mono text-xs font-semibold text-emerald-400 tabular-nums">
                      ${row.actualUsd.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Direct Task Toggles */}
                <div className="space-y-1.5">
                  {wk.tasks.map((task, tIdx) => {
                    const taskId = `${selectedTrack.id}-wk-${wIdx}-${tIdx}`;
                    const checked = completedWeeklyTaskIds.includes(taskId);
                    return (
                      <button
                        key={taskId}
                        type="button"
                        onClick={() => onToggleWeeklyTask(taskId)}
                        className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left text-xs transition-colors hover:bg-zinc-900"
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
                              : 'text-zinc-300'
                          }
                        >
                          {task}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
