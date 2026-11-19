import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Lock,
  Trophy,
} from 'lucide-react';
import {
  DEPARTMENT_TRACKS,
  type DepartmentTrack,
} from '../data/departments';
import { QuickTip } from './QuickTip';

export type BadgeCategory = 'skill_certified' | 'income_milestone';

export interface EarnedBadgeRecord {
  id: string;
  title: string;
  category: BadgeCategory;
  earnedAt: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  category: BadgeCategory;
  categoryLabel: string;
  criteria: string;
  current: number;
  target: number;
  unit: string;
  trackId?: string;
}

interface ProgressionBadgesProps {
  earnedBadges: EarnedBadgeRecord[];
  definitions: BadgeDefinition[];
  onSelectTrack: (track: DepartmentTrack) => void;
}

type BadgeFilter = 'all' | BadgeCategory;

export function ProgressionBadges({
  earnedBadges,
  definitions,
  onSelectTrack,
}: ProgressionBadgesProps) {
  const [filter, setFilter] = useState<BadgeFilter>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const earnedMap = useMemo(() => {
    const map = new Map<string, EarnedBadgeRecord>();
    for (const b of earnedBadges) {
      map.set(b.id, b);
    }
    return map;
  }, [earnedBadges]);

  const counts = useMemo(() => {
    const skillDefs = definitions.filter(
      (d) => d.category === 'skill_certified'
    );
    const incomeDefs = definitions.filter(
      (d) => d.category === 'income_milestone'
    );
    const skillUnlocked = skillDefs.filter((d) => earnedMap.has(d.id)).length;
    const incomeUnlocked = incomeDefs.filter((d) => earnedMap.has(d.id)).length;

    return {
      total: definitions.length,
      unlocked: earnedMap.size,
      skillTotal: skillDefs.length,
      skillUnlocked,
      incomeTotal: incomeDefs.length,
      incomeUnlocked,
    };
  }, [definitions, earnedMap]);

  const visibleDefinitions = useMemo(() => {
    return definitions.filter((def) => {
      if (filter !== 'all' && def.category !== filter) return false;
      if (showUnlockedOnly && !earnedMap.has(def.id)) return false;
      return true;
    });
  }, [definitions, filter, showUnlockedOnly, earnedMap]);

  return (
    <section
      id="achievements"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Award className="h-4 w-4" />
            <span>Achievements · Progression Badges</span>
            <QuickTip
              title="How Badges Unlock"
              tip="Skill Certified badges unlock when you complete 100% of a track's SOP checklist. Income Milestone badges unlock from checklist milestones and real logged earnings."
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            Skill Certified &amp; Income Milestone Achievements
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            Earn virtual certifications and milestone credentials automatically as you check off roadmap deliverables and log real revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {(
              [
                { id: 'all', label: 'All Badges' },
                { id: 'skill_certified', label: 'Skill Certified' },
                { id: 'income_milestone', label: 'Income Milestone' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab.id
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
            onClick={() => setShowUnlockedOnly((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              showUnlockedOnly
                ? 'border-emerald-500/70 bg-emerald-950/50 text-emerald-300'
                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {showUnlockedOnly ? 'Showing Unlocked' : 'Show Unlocked Only'}
          </button>
        </div>
      </div>

      {/* 3-Column Summary Strip */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Achievements Unlocked</div>
          <div className="mt-1 text-2xl font-bold text-zinc-50 font-mono tabular-nums">
            {counts.unlocked} / {counts.total}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Skill Certified</div>
          <div className="mt-1 text-2xl font-bold text-blue-400 font-mono tabular-nums">
            {counts.skillUnlocked} / {counts.skillTotal}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Income Milestones</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {counts.incomeUnlocked} / {counts.incomeTotal}
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      {visibleDefinitions.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-zinc-200">
            No badges unlocked in this category yet
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Check off roadmap tasks in the Execution Studio or log real payouts in the Earnings Ledger to unlock your first progression badge.
          </p>
          <button
            type="button"
            onClick={() => setShowUnlockedOnly(false)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            Show All Available Badges
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleDefinitions.map((def) => {
            const earned = earnedMap.get(def.id);
            const isUnlocked = Boolean(earned);
            const pct = Math.min(
              100,
              Math.round((def.current / Math.max(1, def.target)) * 100)
            );
            const relatedTrack = def.trackId
              ? DEPARTMENT_TRACKS.find((t) => t.id === def.trackId)
              : undefined;

            return (
              <div
                key={def.id}
                className={`flex flex-col justify-between rounded-xl border p-4 space-y-4 transition-colors ${
                  isUnlocked
                    ? def.category === 'skill_certified'
                      ? 'border-blue-500/70 bg-zinc-950'
                      : 'border-emerald-500/70 bg-zinc-950'
                    : 'border-zinc-800 bg-zinc-950/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          isUnlocked
                            ? def.category === 'skill_certified'
                              ? 'text-blue-400'
                              : 'text-emerald-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {def.categoryLabel}
                      </span>
                      <span className="text-zinc-600" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                        {isUnlocked ? `Earned ${earned?.earnedAt}` : 'Locked'}
                      </span>
                    </div>

                    <div
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        isUnlocked
                          ? def.category === 'skill_certified'
                            ? 'border-blue-500/50 bg-blue-950/60 text-blue-400'
                            : 'border-emerald-500/50 bg-emerald-950/60 text-emerald-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      {isUnlocked ? (
                        def.category === 'skill_certified' ? (
                          <Award className="h-4 w-4" />
                        ) : (
                          <Trophy className="h-4 w-4" />
                        )
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 font-display leading-snug">
                      {def.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {def.criteria}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-zinc-400">
                      {def.unit === '$'
                        ? `$${Math.min(def.current, def.target).toLocaleString()} / $${def.target.toLocaleString()}`
                        : `${Math.min(def.current, def.target)} / ${def.target} ${def.unit}`}
                    </span>
                    <span
                      className={
                        isUnlocked
                          ? 'inline-flex items-center gap-1 font-semibold text-emerald-400'
                          : 'text-zinc-400'
                      }
                    >
                      {isUnlocked ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>100%</span>
                        </>
                      ) : (
                        <span>{pct}%</span>
                      )}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className={`h-full transition-all duration-200 ${
                        isUnlocked
                          ? def.category === 'skill_certified'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                          : 'bg-zinc-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {!isUnlocked && relatedTrack && (
                    <button
                      type="button"
                      onClick={() => onSelectTrack(relatedTrack)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span>Open {relatedTrack.shortName}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
