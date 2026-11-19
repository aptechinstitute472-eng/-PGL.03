import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCloudSync } from '../context/CloudSyncContext';
import {
  DEPARTMENT_TRACKS,
  type DepartmentTrack,
} from '../data/departments';
import type { DailyInsightEntry } from './InsightsMilestones';
import { QuickTip } from './QuickTip';

export type LedgerCadence = 'daily' | 'weekly';

export interface EarningsLedgerEntry {
  id: string;
  trackId: string;
  cadence: LedgerCadence;
  weekIndex: number; // 0..3 -> Week 01..Week 04
  date: string;
  taskTitle: string;
  source: string;
  amountUsd: number;
}

interface EarningsLedgerProps {
  selectedTrack: DepartmentTrack;
  onSelectTrack: (track: DepartmentTrack) => void;
}

export const EARNINGS_LEDGER_STORAGE_KEY = 'pgl03_earnings_ledger_v1';
export const WEEKLY_TARGETS_STORAGE_KEY = 'pgl03_weekly_revenue_targets_v1';
const INSIGHTS_STORAGE_KEY = 'pgl03_real_daily_insights_v1';
const PKR_RATE = 278;

export function getDefaultWeeklyTargets(
  track: DepartmentTrack
): [number, number, number, number] {
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

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function EarningsLedger({
  selectedTrack,
  onSelectTrack,
}: EarningsLedgerProps) {
  const { saveLedgerEntryCloud, deleteLedgerEntryCloud } = useCloudSync();
  const [ledgerEntries, setLedgerEntries] = useState<EarningsLedgerEntry[]>(() => {
    try {
      const raw = localStorage.getItem(EARNINGS_LEDGER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as EarningsLedgerEntry[];
        }
      }
    } catch {
      // ignore storage read error
    }
    return [];
  });

  const [insightsEntries, setInsightsEntries] = useState<DailyInsightEntry[]>(() => {
    try {
      const raw = localStorage.getItem(INSIGHTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as DailyInsightEntry[];
        }
      }
    } catch {
      // ignore storage read error
    }
    return [];
  });

  const [customTargetsByTrack, setCustomTargetsByTrack] = useState<
    Record<string, [number, number, number, number]>
  >(() => {
    try {
      const raw = localStorage.getItem(WEEKLY_TARGETS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, [number, number, number, number]>;
        }
      }
    } catch {
      // ignore storage read error
    }
    return {};
  });

  // Form state
  const [cadence, setCadence] = useState<LedgerCadence>('daily');
  const [weekIndex, setWeekIndex] = useState<number>(0);
  const [date, setDate] = useState<string>(getTodayIso);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [amountUsd, setAmountUsd] = useState<string>('');

  // Table Filters & Right Panel View Mode
  const [rightViewMode, setRightViewMode] = useState<'targets' | 'projection'>(
    'targets'
  );
  const [scopeFilter, setScopeFilter] = useState<'selected' | 'all'>('selected');
  const [cadenceFilter, setCadenceFilter] = useState<'all' | LedgerCadence>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(
        EARNINGS_LEDGER_STORAGE_KEY,
        JSON.stringify(ledgerEntries)
      );
      window.dispatchEvent(new Event('pgl03-ledger-updated'));
    } catch {
      // ignore storage write error
    }
  }, [ledgerEntries]);

  useEffect(() => {
    const syncExternal = () => {
      try {
        const rawInsights = localStorage.getItem(INSIGHTS_STORAGE_KEY);
        if (rawInsights) {
          const parsed = JSON.parse(rawInsights) as unknown;
          if (Array.isArray(parsed)) {
            setInsightsEntries(parsed as DailyInsightEntry[]);
          }
        } else {
          setInsightsEntries([]);
        }
      } catch {
        // ignore
      }

      try {
        const rawTargets = localStorage.getItem(WEEKLY_TARGETS_STORAGE_KEY);
        if (rawTargets) {
          const parsed = JSON.parse(rawTargets) as unknown;
          if (parsed && typeof parsed === 'object') {
            setCustomTargetsByTrack(
              parsed as Record<string, [number, number, number, number]>
            );
          }
        } else {
          setCustomTargetsByTrack({});
        }
      } catch {
        // ignore
      }
    };

    const syncHydratedLedger = () => {
      try {
        const raw = localStorage.getItem(EARNINGS_LEDGER_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            setLedgerEntries(parsed as EarningsLedgerEntry[]);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', syncExternal);
    window.addEventListener('pgl03-insights-updated', syncExternal);
    window.addEventListener('pgl03-targets-updated', syncExternal);
    window.addEventListener('pgl03-cloud-hydrated', syncHydratedLedger);
    return () => {
      window.removeEventListener('storage', syncExternal);
      window.removeEventListener('pgl03-insights-updated', syncExternal);
      window.removeEventListener('pgl03-targets-updated', syncExternal);
      window.removeEventListener('pgl03-cloud-hydrated', syncHydratedLedger);
    };
  }, []);

  const taskSuggestions = useMemo(() => {
    const stepDeliverables = selectedTrack.steps.map(
      (s) => `Step ${s.stepNumber}: ${s.deliverable}`
    );
    const milestoneTasks = selectedTrack.weeklyMilestones.flatMap((w) => w.tasks);
    return Array.from(new Set([...stepDeliverables, ...milestoneTasks]));
  }, [selectedTrack]);

  const weeklyTargets = useMemo<[number, number, number, number]>(
    () =>
      customTargetsByTrack[selectedTrack.id] ??
      getDefaultWeeklyTargets(selectedTrack),
    [customTargetsByTrack, selectedTrack]
  );

  // Bucket any insights revenue entries for the selected track by Week 01..04
  const insightsByWeek = useMemo<[number, number, number, number]>(() => {
    const buckets: [number, number, number, number] = [0, 0, 0, 0];
    const trackInsights = insightsEntries
      .filter((e) => e.trackId === selectedTrack.id && e.revenueUsd > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (trackInsights.length === 0) return buckets;
    const firstMs = new Date(`${trackInsights[0].date}T00:00:00`).getTime();
    for (const item of trackInsights) {
      const itemMs = new Date(`${item.date}T00:00:00`).getTime();
      const diffDays = Number.isFinite(itemMs - firstMs)
        ? Math.max(0, Math.floor((itemMs - firstMs) / (1000 * 60 * 60 * 24)))
        : 0;
      const idx = Math.min(3, Math.floor(diffDays / 7));
      buckets[idx] += item.revenueUsd;
    }
    return buckets;
  }, [insightsEntries, selectedTrack.id]);

  // Aggregate ledger entries per week for the selected track
  const trackLedgerEntries = useMemo(
    () => ledgerEntries.filter((e) => e.trackId === selectedTrack.id),
    [ledgerEntries, selectedTrack.id]
  );

  const weekComparison = useMemo(() => {
    return selectedTrack.weeklyMilestones.map((wk, idx) => {
      const targetUsd = weeklyTargets[idx] ?? 0;
      const ledgerForWeek = trackLedgerEntries.filter(
        (e) => e.weekIndex === idx
      );
      const ledgerSum = ledgerForWeek.reduce((sum, e) => sum + e.amountUsd, 0);
      const insightsSum = insightsByWeek[idx] ?? 0;
      const actualUsd = Math.round((ledgerSum + insightsSum) * 100) / 100;
      const varianceUsd = Math.round((actualUsd - targetUsd) * 100) / 100;
      const attainmentPct =
        targetUsd > 0
          ? Math.min(200, Math.round((actualUsd / targetUsd) * 100))
          : actualUsd > 0
          ? 100
          : 0;

      return {
        week: wk.week,
        focusTitle: wk.focusTitle,
        targetUsd,
        actualUsd,
        varianceUsd,
        attainmentPct,
        entryCount: ledgerForWeek.length,
      };
    });
  }, [selectedTrack.weeklyMilestones, weeklyTargets, trackLedgerEntries, insightsByWeek]);

  const totals = useMemo(() => {
    const totalTargetUsd = weeklyTargets.reduce((a, b) => a + b, 0);
    const totalActualUsd = weekComparison.reduce(
      (sum, row) => sum + row.actualUsd,
      0
    );
    const dailyTotalUsd = trackLedgerEntries
      .filter((e) => e.cadence === 'daily')
      .reduce((sum, e) => sum + e.amountUsd, 0);
    const weeklyTotalUsd = trackLedgerEntries
      .filter((e) => e.cadence === 'weekly')
      .reduce((sum, e) => sum + e.amountUsd, 0);
    const varianceUsd = Math.round((totalActualUsd - totalTargetUsd) * 100) / 100;
    const attainmentPct =
      totalTargetUsd > 0
        ? Math.round((totalActualUsd / totalTargetUsd) * 100)
        : 0;
    const avgEntryUsd =
      trackLedgerEntries.length > 0
        ? Math.round(
            (trackLedgerEntries.reduce((s, e) => s + e.amountUsd, 0) /
              trackLedgerEntries.length) *
              100
          ) / 100
        : 0;

    return {
      totalTargetUsd,
      totalActualUsd: Math.round(totalActualUsd * 100) / 100,
      dailyTotalUsd: Math.round(dailyTotalUsd * 100) / 100,
      weeklyTotalUsd: Math.round(weeklyTotalUsd * 100) / 100,
      varianceUsd,
      attainmentPct,
      avgEntryUsd,
      count: trackLedgerEntries.length,
    };
  }, [weeklyTargets, weekComparison, trackLedgerEntries]);

  // Historical velocity & 30-day Monthly Income Projection
  const projectionAnalysis = useMemo(() => {
    const combined = [
      ...ledgerEntries.map((e) => ({ date: e.date, usd: e.amountUsd })),
      ...insightsEntries
        .filter((e) => e.revenueUsd > 0)
        .map((e) => ({ date: e.date, usd: e.revenueUsd })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    if (combined.length === 0) {
      return {
        hasData: false,
        dailyVelocityUsd: 0,
        growthMultiplier: 1,
        projected30DayUsd: 0,
        chartPoints: [] as Array<{
          label: string;
          actualUsd: number | null;
          projectedUsd: number;
        }>,
      };
    }

    const totalHistoricalUsd = combined.reduce((s, x) => s + x.usd, 0);
    const firstMs = new Date(`${combined[0].date}T00:00:00`).getTime();
    const lastMs = new Date(`${combined[combined.length - 1].date}T00:00:00`).getTime();
    const spanDays = Number.isFinite(lastMs - firstMs)
      ? Math.max(1, Math.round((lastMs - firstMs) / (1000 * 60 * 60 * 24)) + 1)
      : 1;

    const baseDailyVelocity = totalHistoricalUsd / Math.max(1, spanDays);

    let growthMultiplier = 1;
    if (combined.length >= 2) {
      const mid = Math.floor(combined.length / 2);
      const earlyAvg =
        combined.slice(0, mid).reduce((s, x) => s + x.usd, 0) / Math.max(1, mid);
      const recentAvg =
        combined.slice(mid).reduce((s, x) => s + x.usd, 0) /
        Math.max(1, combined.length - mid);
      if (earlyAvg > 0) {
        growthMultiplier = Math.min(2.25, Math.max(0.75, recentAvg / earlyAvg));
      }
    }

    const dailyVelocityUsd = Math.round(baseDailyVelocity * 100) / 100;
    const adjustedDailyRate = baseDailyVelocity * (0.7 + 0.3 * growthMultiplier);
    const projected30DayUsd = Math.round(adjustedDailyRate * 30);

    const chartPoints = [
      {
        label: 'Day 01',
        actualUsd: Math.round(combined[0].usd),
        projectedUsd: Math.round(adjustedDailyRate),
      },
      {
        label: 'Day 07',
        actualUsd:
          spanDays >= 5
            ? Math.round(
                combined
                  .slice(0, Math.ceil(combined.length * 0.5))
                  .reduce((s, x) => s + x.usd, 0)
              )
            : Math.round(totalHistoricalUsd),
        projectedUsd: Math.round(adjustedDailyRate * 7),
      },
      {
        label: 'Day 14',
        actualUsd: Math.round(totalHistoricalUsd),
        projectedUsd: Math.round(adjustedDailyRate * 14),
      },
      {
        label: 'Day 21',
        actualUsd: null,
        projectedUsd: Math.round(adjustedDailyRate * 21),
      },
      {
        label: 'Day 30',
        actualUsd: null,
        projectedUsd: projected30DayUsd,
      },
    ];

    return {
      hasData: true,
      dailyVelocityUsd,
      growthMultiplier: Math.round(growthMultiplier * 100) / 100,
      projected30DayUsd,
      chartPoints,
    };
  }, [ledgerEntries, insightsEntries]);

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ledgerEntries
      .filter((entry) => {
        if (scopeFilter === 'selected' && entry.trackId !== selectedTrack.id) {
          return false;
        }
        if (cadenceFilter !== 'all' && entry.cadence !== cadenceFilter) {
          return false;
        }
        if (!q) return true;
        return (
          entry.taskTitle.toLowerCase().includes(q) ||
          entry.source.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [ledgerEntries, scopeFilter, selectedTrack.id, cadenceFilter, searchQuery]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const numericUsd = Number(amountUsd);
    if (!taskTitle.trim() || !Number.isFinite(numericUsd) || numericUsd <= 0) {
      return;
    }

    const newEntry: EarningsLedgerEntry = {
      id: `ledger-${Date.now()}`,
      trackId: selectedTrack.id,
      cadence,
      weekIndex,
      date: date || getTodayIso(),
      taskTitle: taskTitle.trim(),
      source: source.trim() || `${selectedTrack.shortName} Direct`,
      amountUsd: Math.round(numericUsd * 100) / 100,
    };

    setLedgerEntries((prev) => [newEntry, ...prev]);
    void saveLedgerEntryCloud(newEntry);
    setTaskTitle('');
    setSource('');
    setAmountUsd('');
  };

  const handleDeleteEntry = (id: string) => {
    setLedgerEntries((prev) => prev.filter((e) => e.id !== id));
    void deleteLedgerEntryCloud(id);
  };

  const handleExportCsv = () => {
    if (visibleRows.length === 0) return;
    const headers = [
      'Date',
      'Track',
      'Cadence',
      'Week',
      'Task',
      'Source',
      'Amount_USD',
      'Amount_PKR',
    ];
    const lines = visibleRows.map((row) => {
      const trackName =
        DEPARTMENT_TRACKS.find((t) => t.id === row.trackId)?.shortName ??
        row.trackId;
      const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [
        row.date,
        escapeCsv(trackName),
        row.cadence,
        `Week 0${row.weekIndex + 1}`,
        escapeCsv(row.taskTitle),
        escapeCsv(row.source),
        row.amountUsd.toFixed(2),
        Math.round(row.amountUsd * PKR_RATE).toString(),
      ].join(',');
    });
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pgl03-earnings-ledger-${getTodayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const parsedInputUsd = Number(amountUsd);
  const previewPkr =
    Number.isFinite(parsedInputUsd) && parsedInputUsd > 0
      ? Math.round(parsedInputUsd * PKR_RATE)
      : 0;

  return (
    <section
      id="ledger"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Receipt className="h-4 w-4" />
            <span>Earnings Ledger · Task-Level Income Log</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            Log Daily &amp; Weekly Earnings Against Milestone Targets
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            Record real payouts tied to specific tasks and compare aggregated income against your 4-week milestone targets for {selectedTrack.shortName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select track for earnings ledger"
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

          <button
            type="button"
            disabled={visibleRows.length === 0}
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4-Column Aggregated KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="p-4 sm:p-5">
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Total Logged ({selectedTrack.shortName})</span>
            <QuickTip
              title="Aggregated Track Income"
              tip={`Combines daily ($${totals.dailyTotalUsd.toLocaleString()}) and weekly ($${totals.weeklyTotalUsd.toLocaleString()}) task earnings plus any revenue logged in Daily Insights.`}
            />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            ${totals.totalActualUsd.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            Rs. {Math.round(totals.totalActualUsd * PKR_RATE).toLocaleString()} PKR
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <span>4-Week Milestone Target</span>
            <QuickTip
              title="Target Benchmark"
              tip="Synced directly with your editable Week 01–04 targets in the Milestone Dashboard above."
            />
          </div>
          <div className="mt-1 text-2xl font-bold text-zinc-50 font-mono tabular-nums">
            ${totals.totalTargetUsd.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            {totals.attainmentPct}% target attainment
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Target Variance</span>
            <QuickTip
              title="Goal Gap or Surplus"
              tip="Shows exact USD remaining to hit your 4-week target, or surplus earned above goal."
            />
          </div>
          <div
            className={`mt-1 text-2xl font-bold font-mono tabular-nums ${
              totals.varianceUsd >= 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {totals.varianceUsd >= 0
              ? `+$${totals.varianceUsd.toLocaleString()}`
              : `-$${Math.abs(totals.varianceUsd).toLocaleString()}`}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">
            {totals.varianceUsd >= 0 ? 'Ahead of 4-week target' : 'Remaining to goal'}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Average Per Task Entry</span>
            <QuickTip
              title="Task Payout Efficiency"
              tip="Average USD earned per logged deliverable in this track so you can spot your highest-paying work."
            />
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-400 font-mono tabular-nums">
            ${totals.avgEntryUsd.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            {totals.count} ledger {totals.count === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      </div>

      {/* Simple Manual Earnings Input Form + Week-by-Week Target Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form */}
        <form
          onSubmit={handleAddEntry}
          className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-100 font-display">
              Add Earnings Entry
            </h3>
            <div
              className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5"
              role="group"
              aria-label="Earnings cadence"
            >
              {(['daily', 'weekly'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCadence(mode)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0 ${
                    cadence === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="ledger-week"
                className="block text-xs font-medium text-zinc-300"
              >
                Milestone Week
              </label>
              <select
                id="ledger-week"
                value={weekIndex}
                onChange={(e) => setWeekIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                {selectedTrack.weeklyMilestones.map((wk, idx) => (
                  <option key={wk.week} value={idx}>
                    {wk.week} (Goal: ${weeklyTargets[idx] ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="ledger-date"
                className="block text-xs font-medium text-zinc-300"
              >
                Date
              </label>
              <input
                id="ledger-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="ledger-task"
              className="block text-xs font-medium text-zinc-300"
            >
              Specific Task / Deliverable Completed
            </label>
            <input
              id="ledger-task"
              type="text"
              required
              list={`ledger-tasks-${selectedTrack.id}`}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={`e.g. Built ${selectedTrack.shortName} workflow or published reel`}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
            <datalist id={`ledger-tasks-${selectedTrack.id}`}>
              {taskSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="ledger-amount"
                className="block text-xs font-medium text-zinc-300"
              >
                Amount Earned (USD)
              </label>
              <input
                id="ledger-amount"
                type="number"
                min={0.01}
                step="0.01"
                required
                placeholder="e.g. 85.00"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
              <div className="text-[11px] font-mono text-zinc-400 tabular-nums">
                {previewPkr > 0
                  ? `≈ Rs. ${previewPkr.toLocaleString()} PKR`
                  : 'Enter real USD earned'}
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="ledger-source"
                className="block text-xs font-medium text-zinc-300"
              >
                Client / Platform Source
              </label>
              <input
                id="ledger-source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Fiverr, AdSense, Direct"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!taskTitle.trim() || !amountUsd}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Record {cadence === 'daily' ? 'Daily' : 'Weekly'} Earning</span>
          </button>
        </form>

        {/* Right: Actual Income vs Weekly Milestone Targets OR Earnings Projection Line Chart */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 font-display">
                {rightViewMode === 'targets'
                  ? `${selectedTrack.shortName} · Actual Income vs Weekly Milestone Targets`
                  : 'Monthly Earnings Projection (Growth Velocity Forecast)'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {rightViewMode === 'targets'
                  ? 'Live comparison across Week 01 to Week 04 as you log payouts.'
                  : '30-day revenue forecast derived from your historical Earnings Ledger velocity.'}
              </p>
            </div>

            <div className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setRightViewMode('targets')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  rightViewMode === 'targets'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Weekly Targets
              </button>
              <button
                type="button"
                onClick={() => setRightViewMode('projection')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  rightViewMode === 'projection'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                <span>Earnings Projection</span>
              </button>
            </div>
          </div>

          {rightViewMode === 'targets' ? (
            <div className="space-y-3.5">
              {weekComparison.map((row) => {
                const isMet =
                  row.targetUsd > 0
                    ? row.actualUsd >= row.targetUsd
                    : row.actualUsd > 0;
                return (
                  <div key={row.week} className="space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-mono font-semibold text-blue-400">
                          {row.week}
                        </span>
                        <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-medium text-zinc-200">
                          {row.focusTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                        <span className="text-emerald-400 font-semibold">
                          ${row.actualUsd.toLocaleString()}
                        </span>
                        <span className="text-zinc-500">/</span>
                        <span className="text-zinc-300">
                          ${row.targetUsd.toLocaleString()}
                        </span>
                        <span
                          className={
                            isMet ? 'text-emerald-400' : 'text-zinc-400'
                          }
                        >
                          (
                          {row.varianceUsd >= 0
                            ? `+$${row.varianceUsd.toLocaleString()}`
                            : `-$${Math.abs(row.varianceUsd).toLocaleString()}`}
                          )
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className={`h-full transition-all duration-200 ${
                          isMet ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, row.attainmentPct))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !projectionAnalysis.hasData ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-200">
                Log at least 1 payout to activate your 30-day projection
              </p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Once you record task earnings in the form on the left, this chart calculates your daily run-rate and growth velocity into a 30-day monthly income forecast.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-xs">
                <div>
                  <div className="text-zinc-400">Daily Velocity</div>
                  <div className="font-mono font-bold text-zinc-100 tabular-nums mt-0.5">
                    ${projectionAnalysis.dailyVelocityUsd}/day
                  </div>
                </div>
                <div>
                  <div className="text-zinc-400">Velocity Multiplier</div>
                  <div className="font-mono font-bold text-blue-400 tabular-nums mt-0.5">
                    {projectionAnalysis.growthMultiplier}x
                  </div>
                </div>
                <div>
                  <div className="text-zinc-400">30-Day Forecast</div>
                  <div className="font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                    ${projectionAnalysis.projected30DayUsd.toLocaleString()}/mo
                  </div>
                </div>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={projectionAnalysis.chartPoints}
                    margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 11 }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="actualUsd"
                      name="Actual Logged ($)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981' }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="projectedUsd"
                      name="Projected Monthly Pace ($)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 3, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filterable Ledger Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              {(
                [
                  { id: 'selected', label: selectedTrack.shortName },
                  { id: 'all', label: 'All Tracks' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScopeFilter(opt.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    scopeFilter === opt.id
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              {(['all', 'daily', 'weekly'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCadenceFilter(c)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                    cadenceFilter === c
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search task or source..."
              className="w-48 sm:w-56 rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <div className="p-8 text-center space-y-1.5">
            <p className="text-sm font-semibold text-zinc-200">
              No earnings logged yet
            </p>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Use the form above to record real daily or weekly payouts from your completed tasks. Every entry updates your weekly target comparison and Milestone Dashboard chart live.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Track</th>
                  <th className="px-4 py-2.5 font-semibold">Cadence</th>
                  <th className="px-4 py-2.5 font-semibold">Week</th>
                  <th className="px-4 py-2.5 font-semibold">Task &amp; Source</th>
                  <th className="px-4 py-2.5 font-semibold text-right">USD</th>
                  <th className="px-4 py-2.5 font-semibold text-right">PKR</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                {visibleRows.map((row) => {
                  const trackLabel =
                    DEPARTMENT_TRACKS.find((t) => t.id === row.trackId)
                      ?.shortName ?? row.trackId;
                  return (
                    <tr key={row.id} className="hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-mono text-zinc-200 tabular-nums whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        {trackLabel}
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-400 whitespace-nowrap">
                        {row.cadence}
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-400 tabular-nums whitespace-nowrap">
                        Week 0{row.weekIndex + 1}
                      </td>
                      <td className="px-4 py-3 max-w-[280px]">
                        <div className="font-medium text-zinc-100 truncate">
                          {row.taskTitle}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {row.source}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-right text-emerald-400 tabular-nums whitespace-nowrap">
                        ${row.amountUsd.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-zinc-300 tabular-nums whitespace-nowrap">
                        Rs. {Math.round(row.amountUsd * PKR_RATE).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(row.id)}
                          aria-label="Delete ledger entry"
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
