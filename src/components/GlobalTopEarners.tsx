import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Shuffle,
  Trophy,
} from 'lucide-react';
import {
  DEPARTMENT_TRACKS,
  type DepartmentTrack,
} from '../data/departments';
import {
  EARNINGS_LEDGER_STORAGE_KEY,
  type EarningsLedgerEntry,
} from './EarningsLedger';
import { QuickTip } from './QuickTip';

interface GlobalTopEarnersProps {
  selectedTrack: DepartmentTrack;
  onSelectTrack: (track: DepartmentTrack) => void;
}

interface TopEarnerRow {
  rank: number;
  anonAlias: string;
  primaryTrackId: string;
  monthlyTotalUsd: number;
  entryCount: number;
  updatedAt: string;
  isCurrentUser: boolean;
}

interface CurrentUserPosition {
  rank: number;
  anonAlias: string;
  primaryTrackId: string;
  monthlyTotalUsd: number;
  entryCount: number;
  gapToFirstUsd: number;
  gapToTopFiveUsd: number;
}

interface LeaderboardPayload {
  month: string;
  totalParticipants: number;
  communityTotalUsd: number;
  topFive: TopEarnerRow[];
  currentUserPosition: CurrentUserPosition | null;
}

interface LocalMonthlyAggregate {
  month: string;
  monthlyTotalUsd: number;
  entryCount: number;
  primaryTrackId: string;
}

const ANON_ID_STORAGE_KEY = 'pgl03_anon_earner_id_v1';
const ANON_ALIAS_STORAGE_KEY = 'pgl03_anon_earner_alias_v1';
const LEADERBOARD_OPT_IN_KEY = 'pgl03_leaderboard_opt_in_v1';
const PKR_RATE = 278;

function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthLabel(monthKey: string): string {
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;
  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const dt = new Date(year, monthIdx, 1);
  if (Number.isNaN(dt.getTime())) return monthKey;
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function generateAnonIdentity(): { id: string; alias: string } {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const id = `anon_${randomPart}`;
  const suffix = randomPart.slice(-4).toUpperCase();
  return { id, alias: `Earner #${suffix}` };
}

function readOrCreateAnonIdentity(): { id: string; alias: string } {
  try {
    const savedId = localStorage.getItem(ANON_ID_STORAGE_KEY);
    const savedAlias = localStorage.getItem(ANON_ALIAS_STORAGE_KEY);
    if (savedId && /^[a-zA-Z0-9_-]{8,64}$/.test(savedId) && savedAlias) {
      return { id: savedId, alias: savedAlias };
    }
  } catch {
    // ignore read error
  }
  const created = generateAnonIdentity();
  try {
    localStorage.setItem(ANON_ID_STORAGE_KEY, created.id);
    localStorage.setItem(ANON_ALIAS_STORAGE_KEY, created.alias);
  } catch {
    // ignore write error
  }
  return created;
}

function readLocalMonthlyAggregate(
  month: string,
  fallbackTrackId: string
): LocalMonthlyAggregate {
  try {
    const raw = localStorage.getItem(EARNINGS_LEDGER_STORAGE_KEY);
    if (!raw) {
      return {
        month,
        monthlyTotalUsd: 0,
        entryCount: 0,
        primaryTrackId: fallbackTrackId,
      };
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return {
        month,
        monthlyTotalUsd: 0,
        entryCount: 0,
        primaryTrackId: fallbackTrackId,
      };
    }

    const monthlyEntries = (parsed as EarningsLedgerEntry[]).filter(
      (entry) =>
        typeof entry?.date === 'string' &&
        entry.date.slice(0, 7) === month &&
        Number(entry.amountUsd) > 0
    );

    if (monthlyEntries.length === 0) {
      return {
        month,
        monthlyTotalUsd: 0,
        entryCount: 0,
        primaryTrackId: fallbackTrackId,
      };
    }

    let monthlyTotalUsd = 0;
    const byTrack = new Map<string, number>();

    for (const entry of monthlyEntries) {
      const amount = Number(entry.amountUsd) || 0;
      monthlyTotalUsd += amount;
      const trackKey =
        typeof entry.trackId === 'string' && entry.trackId
          ? entry.trackId
          : fallbackTrackId;
      byTrack.set(trackKey, (byTrack.get(trackKey) ?? 0) + amount);
    }

    let primaryTrackId = fallbackTrackId;
    let maxTrackUsd = -1;
    for (const [trackKey, usd] of byTrack.entries()) {
      if (usd > maxTrackUsd) {
        maxTrackUsd = usd;
        primaryTrackId = trackKey;
      }
    }

    return {
      month,
      monthlyTotalUsd: Math.round(monthlyTotalUsd * 100) / 100,
      entryCount: monthlyEntries.length,
      primaryTrackId,
    };
  } catch {
    return {
      month,
      monthlyTotalUsd: 0,
      entryCount: 0,
      primaryTrackId: fallbackTrackId,
    };
  }
}

export function GlobalTopEarners({
  selectedTrack,
  onSelectTrack,
}: GlobalTopEarnersProps) {
  const currentMonth = useMemo(() => getCurrentMonthKey(), []);
  const monthLabel = useMemo(
    () => formatMonthLabel(currentMonth),
    [currentMonth]
  );

  const [identity, setIdentity] = useState<{ id: string; alias: string }>(() =>
    readOrCreateAnonIdentity()
  );

  const [isOptedIn, setIsOptedIn] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(LEADERBOARD_OPT_IN_KEY);
      if (raw === 'false') return false;
    } catch {
      // ignore
    }
    return true;
  });

  const [localMonthly, setLocalMonthly] = useState<LocalMonthlyAggregate>(() =>
    readLocalMonthlyAggregate(currentMonth, selectedTrack.id)
  );

  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrSyncLeaderboard = useCallback(
    async (
      targetIdentity: { id: string; alias: string },
      aggregate: LocalMonthlyAggregate,
      optedIn: boolean
    ) => {
      setErrorMsg(null);
      setIsSyncing(true);
      try {
        let res: Response;
        if (optedIn) {
          res = await fetch('/api/leaderboard/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: targetIdentity.id,
              anonAlias: targetIdentity.alias,
              month: aggregate.month,
              monthlyTotalUsd: aggregate.monthlyTotalUsd,
              primaryTrackId: aggregate.primaryTrackId,
              entryCount: aggregate.entryCount,
            }),
          });
        } else {
          const params = new URLSearchParams({
            month: aggregate.month,
            participantId: targetIdentity.id,
          });
          res = await fetch(`/api/leaderboard?${params.toString()}`);
        }

        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            errBody.error || 'Failed to load Global Top Earners leaderboard.'
          );
        }

        const data = (await res.json()) as LeaderboardPayload;
        setLeaderboard(data);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Unable to reach leaderboard service.'
        );
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    []
  );

  // Sync on mount and whenever Earnings Ledger updates
  useEffect(() => {
    const agg = readLocalMonthlyAggregate(currentMonth, selectedTrack.id);
    setLocalMonthly(agg);
    void fetchOrSyncLeaderboard(identity, agg, isOptedIn);
  }, [currentMonth, selectedTrack.id, identity, isOptedIn, fetchOrSyncLeaderboard]);

  useEffect(() => {
    const handleLedgerChange = () => {
      const agg = readLocalMonthlyAggregate(currentMonth, selectedTrack.id);
      setLocalMonthly(agg);
      void fetchOrSyncLeaderboard(identity, agg, isOptedIn);
    };

    window.addEventListener('storage', handleLedgerChange);
    window.addEventListener('pgl03-ledger-updated', handleLedgerChange);
    return () => {
      window.removeEventListener('storage', handleLedgerChange);
      window.removeEventListener('pgl03-ledger-updated', handleLedgerChange);
    };
  }, [currentMonth, selectedTrack.id, identity, isOptedIn, fetchOrSyncLeaderboard]);

  const handleToggleOptIn = async () => {
    const nextOptIn = !isOptedIn;
    if (!nextOptIn) {
      setIsSyncing(true);
      setErrorMsg(null);
      try {
        await fetch('/api/leaderboard/sync', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: identity.id,
            month: currentMonth,
          }),
        });
      } catch {
        // fallback handled by next fetch
      }
    }

    setIsOptedIn(nextOptIn);
    try {
      localStorage.setItem(LEADERBOARD_OPT_IN_KEY, String(nextOptIn));
    } catch {
      // ignore
    }
  };

  const handleRotateAnonId = async () => {
    const oldId = identity.id;
    const nextIdentity = generateAnonIdentity();
    try {
      localStorage.setItem(ANON_ID_STORAGE_KEY, nextIdentity.id);
      localStorage.setItem(ANON_ALIAS_STORAGE_KEY, nextIdentity.alias);
    } catch {
      // ignore
    }

    setIsSyncing(true);
    try {
      await fetch('/api/leaderboard/sync', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: oldId,
          month: currentMonth,
        }),
      });
    } catch {
      // ignore cleanup failure
    }
    setIdentity(nextIdentity);
  };

  const leaderUsd = leaderboard?.topFive[0]?.monthlyTotalUsd ?? 0;

  const getTrackMeta = (trackId: string) =>
    DEPARTMENT_TRACKS.find((t) => t.id === trackId) ?? null;

  return (
    <section
      id="leaderboard"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Trophy className="h-4 w-4" />
            <span>Global Top Earners · {monthLabel}</span>
            <QuickTip
              title="Strict Anonymized Aggregation"
              tip="Only your anonymous handle, primary track, entry count, and monthly USD sum from the Earnings Ledger are aggregated. Task notes and client sources never leave your browser."
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            Monthly Top 5 Earners Leaderboard
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            Live rankings compiled strictly from anonymized Earnings Ledger totals logged in {monthLabel}—zero synthetic or placeholder earners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleOptIn}
            disabled={isSyncing}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isOptedIn
                ? 'border-emerald-500/40 bg-zinc-950 text-emerald-400 hover:bg-zinc-800'
                : 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {isOptedIn ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Sharing: Active</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Sharing: Paused</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRotateAnonId}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>New Anon ID</span>
          </button>

          <button
            type="button"
            onClick={() =>
              fetchOrSyncLeaderboard(identity, localMonthly, isOptedIn)
            }
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4-Column Leaderboard Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Your {monthLabel} Total</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            ${localMonthly.monthlyTotalUsd.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            Rs. {Math.round(localMonthly.monthlyTotalUsd * PKR_RATE).toLocaleString()} ·{' '}
            {localMonthly.entryCount}{' '}
            {localMonthly.entryCount === 1 ? 'entry' : 'entries'}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Your Monthly Rank</div>
          <div className="mt-1 text-2xl font-bold text-zinc-50 font-mono tabular-nums">
            {leaderboard?.currentUserPosition
              ? `#${leaderboard.currentUserPosition.rank}`
              : 'Unranked'}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400 truncate">
            {!isOptedIn
              ? 'Sharing paused'
              : leaderboard?.currentUserPosition
              ? leaderboard.currentUserPosition.rank === 1
                ? `${identity.alias} · Leading`
                : `$${leaderboard.currentUserPosition.gapToFirstUsd.toLocaleString()} behind #1`
              : `Log earnings in ${monthLabel} to rank`}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Active Ranked Earners</div>
          <div className="mt-1 text-2xl font-bold text-blue-400 font-mono tabular-nums">
            {leaderboard ? leaderboard.totalParticipants : '—'}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">
            Top 5 displayed below
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Aggregate Month Volume</div>
          <div className="mt-1 text-2xl font-bold text-zinc-50 font-mono tabular-nums">
            ${(leaderboard?.communityTotalUsd ?? 0).toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            Rs.{' '}
            {Math.round(
              (leaderboard?.communityTotalUsd ?? 0) * PKR_RATE
            ).toLocaleString()}{' '}
            PKR
          </div>
        </div>
      </div>

      {/* Top 5 Table / Loading / Error / Empty States */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-zinc-800 p-4 space-y-2">
            {[0, 1, 2, 3, 4].map((rowIdx) => (
              <div
                key={rowIdx}
                className="h-11 rounded-lg bg-zinc-900/70 animate-pulse"
              />
            ))}
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-red-400">{errorMsg}</p>
            <button
              type="button"
              onClick={() =>
                fetchOrSyncLeaderboard(identity, localMonthly, isOptedIn)
              }
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Retry Leaderboard Sync
            </button>
          </div>
        ) : !leaderboard || leaderboard.topFive.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-zinc-100">
              No monthly ledger earnings recorded yet for {monthLabel}
            </p>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">
              Global Top Earners strictly pulls real anonymized monthly totals from the Earnings Ledger above. Record your first task payout this month to claim the #1 spot.
            </p>
            <div className="pt-1">
              <a
                href="#ledger"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Log First Earning in Ledger</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-semibold w-16">Rank</th>
                  <th className="px-4 py-3 font-semibold">Anonymous Earner</th>
                  <th className="px-4 py-3 font-semibold">Primary Track</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Payouts
                  </th>
                  <th className="px-4 py-3 font-semibold">Pace vs #1</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Month Total (USD)
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    PKR Equivalent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                {leaderboard.topFive.map((row) => {
                  const trackObj = getTrackMeta(row.primaryTrackId);
                  const pctOfLeader =
                    leaderUsd > 0
                      ? Math.min(
                          100,
                          Math.max(4, Math.round((row.monthlyTotalUsd / leaderUsd) * 100))
                        )
                      : 100;

                  return (
                    <tr
                      key={`${row.rank}-${row.anonAlias}`}
                      className={
                        row.isCurrentUser
                          ? 'bg-blue-950/25 hover:bg-blue-950/35'
                          : 'hover:bg-zinc-900/50'
                      }
                    >
                      <td className="px-4 py-3 font-mono font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            row.rank === 1
                              ? 'text-amber-400'
                              : row.rank <= 3
                              ? 'text-zinc-100'
                              : 'text-zinc-400'
                          }
                        >
                          0{row.rank}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-zinc-100">
                          {row.anonAlias}
                        </span>
                        {row.isCurrentUser && (
                          <span className="ml-2 text-[11px] font-semibold text-blue-400">
                            (You)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {trackObj ? (
                          <button
                            type="button"
                            onClick={() => onSelectTrack(trackObj)}
                            className="text-zinc-300 hover:text-blue-400 hover:underline underline-offset-4 transition-colors"
                          >
                            {trackObj.shortName}
                          </button>
                        ) : (
                          <span className="text-zinc-400">
                            {row.primaryTrackId}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-right text-zinc-300 tabular-nums whitespace-nowrap">
                        {row.entryCount}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className={`h-full ${
                                row.rank === 1
                                  ? 'bg-emerald-400'
                                  : row.isCurrentUser
                                  ? 'bg-blue-500'
                                  : 'bg-zinc-400'
                              }`}
                              style={{ width: `${pctOfLeader}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                            {pctOfLeader}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-right text-emerald-400 tabular-nums whitespace-nowrap">
                        ${row.monthlyTotalUsd.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 font-mono text-right text-zinc-300 tabular-nums whitespace-nowrap">
                        Rs.{' '}
                        {Math.round(
                          row.monthlyTotalUsd * PKR_RATE
                        ).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {leaderboard.currentUserPosition &&
                  leaderboard.currentUserPosition.rank > 5 && (
                    <tr className="bg-blue-950/20 border-t border-zinc-700">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400 tabular-nums whitespace-nowrap">
                        #{leaderboard.currentUserPosition.rank}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-zinc-100">
                          {leaderboard.currentUserPosition.anonAlias}
                        </span>
                        <span className="ml-2 text-[11px] font-semibold text-blue-400">
                          (You)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        {getTrackMeta(
                          leaderboard.currentUserPosition.primaryTrackId
                        )?.shortName ??
                          leaderboard.currentUserPosition.primaryTrackId}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-zinc-300 tabular-nums whitespace-nowrap">
                        {leaderboard.currentUserPosition.entryCount}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-amber-400 tabular-nums whitespace-nowrap">
                        +${leaderboard.currentUserPosition.gapToTopFiveUsd.toLocaleString()} to Top 5
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-right text-emerald-400 tabular-nums whitespace-nowrap">
                        $
                        {leaderboard.currentUserPosition.monthlyTotalUsd.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-zinc-300 tabular-nums whitespace-nowrap">
                        Rs.{' '}
                        {Math.round(
                          leaderboard.currentUserPosition.monthlyTotalUsd *
                            PKR_RATE
                        ).toLocaleString()}
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Privacy Guarantee Note */}
      <div className="flex items-start sm:items-center gap-2 text-xs text-zinc-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          Privacy active: Your browser shares only anonymous handle{' '}
          <span className="font-mono text-zinc-200">{identity.alias}</span>, primary track, entry count, and your {monthLabel} USD aggregate—task titles and client names stay strictly local.
        </span>
      </div>
    </section>
  );
}
