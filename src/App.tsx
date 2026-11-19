import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Compass,
  HardDriveDownload,
  Languages,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  DEPARTMENT_TRACKS,
  type CourseStep,
  type DepartmentTrack,
  type TrackCategory,
} from './data/departments';
import {
  AuthorSection,
  AUTHOR_FACEBOOK_NAME,
  AUTHOR_FACEBOOK_URL,
  AUTHOR_GMAIL,
  AUTHOR_NAME,
  AUTHOR_PORTRAIT_SRC,
} from './components/AuthorSection';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { DepartmentWorkspace } from './components/DepartmentWorkspace';
import {
  MentorPanel,
  type LanguageMode,
  type MentorMode,
} from './components/MentorPanel';
import { DailyFocusWidget } from './components/DailyFocusWidget';
import { EarningsCalculator } from './components/EarningsCalculator';
import {
  EARNINGS_LEDGER_STORAGE_KEY,
  EarningsLedger,
  type EarningsLedgerEntry,
} from './components/EarningsLedger';
import { GlobalTopEarners } from './components/GlobalTopEarners';
import { InvoiceProposalStudio } from './components/InvoiceProposalStudio';
import { MilestoneDashboard } from './components/MilestoneDashboard';
import { PayoutWithdrawalTracker } from './components/PayoutWithdrawalTracker';
import { PricingSection } from './components/PricingSection';
import {
  ProgressionBadges,
  type BadgeDefinition,
  type EarnedBadgeRecord,
} from './components/ProgressionBadges';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { ResourceVault } from './components/ResourceVault';
import { SkillNicheQuiz } from './components/SkillNicheQuiz';
import { SuccessJournal } from './components/SuccessJournal';
import { useCloudSync } from './context/CloudSyncContext';
import { useUiLanguage } from './context/LanguageContext';

type CategoryFilter = 'all' | TrackCategory;

const CHECKLIST_STORAGE_KEY = 'aryan_ai_completed_checklists_v1';
const WEEKLY_MILESTONES_STORAGE_KEY = 'pgl03_weekly_milestones_v1';
const BADGES_STORAGE_KEY = 'pgl03_progression_badges_v1';
const INSIGHTS_STORAGE_KEY = 'pgl03_real_daily_insights_v1';

function readTotalLoggedRevenue(): number {
  let sum = 0;
  try {
    const rawLedger = localStorage.getItem(EARNINGS_LEDGER_STORAGE_KEY);
    if (rawLedger) {
      const parsed = JSON.parse(rawLedger) as unknown;
      if (Array.isArray(parsed)) {
        sum += (parsed as EarningsLedgerEntry[]).reduce(
          (acc, item) => acc + (Number(item.amountUsd) || 0),
          0
        );
      }
    }
  } catch {
    // ignore read error
  }
  try {
    const rawInsights = localStorage.getItem(INSIGHTS_STORAGE_KEY);
    if (rawInsights) {
      const parsed = JSON.parse(rawInsights) as unknown;
      if (Array.isArray(parsed)) {
        sum += (parsed as Array<{ revenueUsd?: number }>).reduce(
          (acc, item) => acc + (Number(item.revenueUsd) || 0),
          0
        );
      }
    }
  } catch {
    // ignore read error
  }
  return Math.round(sum * 100) / 100;
}

export default function App() {
  const { uiLanguage, setUiLanguage, t } = useUiLanguage();
  const {
    user,
    authLoading,
    syncStatus,
    syncError,
    lastSyncedAt,
    signInWithGoogle,
    signOutUser,
    syncWorkspaceToCloud,
    triggerFullSync,
  } = useCloudSync();

  const [selectedTrackId, setSelectedTrackId] = useState<string>('n8n');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [failedThumbIds, setFailedThumbIds] = useState<string[]>([]);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const selectedTrack: DepartmentTrack = useMemo(
    () =>
      DEPARTMENT_TRACKS.find((d) => d.id === selectedTrackId) ??
      DEPARTMENT_TRACKS[0],
    [selectedTrackId]
  );

  const [activeStepId, setActiveStepId] = useState<string>(
    selectedTrack.steps[0]?.id ?? ''
  );
  const [languageMode, setLanguageMode] = useState<LanguageMode>('bilingual');
  const [mentorMode, setMentorMode] = useState<MentorMode>('step_coach');
  const [queuedPrompt, setQueuedPrompt] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const [customSkillInput, setCustomSkillInput] = useState('');

  const [completedChecklistIds, setCompletedChecklistIds] = useState<string[]>(
    () => {
      try {
        const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            return parsed.filter((x): x is string => typeof x === 'string');
          }
        }
      } catch {
        // ignore storage read issues
      }
      return [];
    }
  );

  const [completedWeeklyTaskIds, setCompletedWeeklyTaskIds] = useState<
    string[]
  >(() => {
    try {
      const raw = localStorage.getItem(WEEKLY_MILESTONES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((x): x is string => typeof x === 'string');
        }
      }
    } catch {
      // ignore storage read issues
    }
    return [];
  });

  const [earnedBadges, setEarnedBadges] = useState<EarnedBadgeRecord[]>(() => {
    try {
      const raw = localStorage.getItem(BADGES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as EarnedBadgeRecord[];
        }
      }
    } catch {
      // ignore storage read issues
    }
    return [];
  });

  const [totalLoggedRevenueUsd, setTotalLoggedRevenueUsd] = useState<number>(
    () => readTotalLoggedRevenue()
  );

  const workspaceRef = useRef<HTMLElement | null>(null);
  const mentorContainerRef = useRef<HTMLDivElement | null>(null);
  const skipNextCloudSyncRef = useRef(false);

  const handleSwitchGlobalLanguage = (nextLang: 'en' | 'roman_urdu') => {
    setUiLanguage(nextLang);
    setLanguageMode(nextLang === 'roman_urdu' ? 'roman_urdu' : 'bilingual');
  };

  useEffect(() => {
    const syncRevenue = () => setTotalLoggedRevenueUsd(readTotalLoggedRevenue());
    const reloadHydratedState = () => {
      skipNextCloudSyncRef.current = true;
      try {
        const rawChecklist = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (rawChecklist) {
          const parsed = JSON.parse(rawChecklist) as unknown;
          if (Array.isArray(parsed)) {
            setCompletedChecklistIds(
              parsed.filter((x): x is string => typeof x === 'string')
            );
          }
        }
        const rawWeekly = localStorage.getItem(WEEKLY_MILESTONES_STORAGE_KEY);
        if (rawWeekly) {
          const parsedW = JSON.parse(rawWeekly) as unknown;
          if (Array.isArray(parsedW)) {
            setCompletedWeeklyTaskIds(
              parsedW.filter((x): x is string => typeof x === 'string')
            );
          }
        }
      } catch {
        // ignore read error
      }
      syncRevenue();
    };

    window.addEventListener('storage', syncRevenue);
    window.addEventListener('pgl03-ledger-updated', syncRevenue);
    window.addEventListener('pgl03-insights-updated', syncRevenue);
    window.addEventListener('pgl03-cloud-hydrated', reloadHydratedState);
    return () => {
      window.removeEventListener('storage', syncRevenue);
      window.removeEventListener('pgl03-ledger-updated', syncRevenue);
      window.removeEventListener('pgl03-insights-updated', syncRevenue);
      window.removeEventListener('pgl03-cloud-hydrated', reloadHydratedState);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        CHECKLIST_STORAGE_KEY,
        JSON.stringify(completedChecklistIds)
      );
    } catch {
      // ignore storage write issues
    }
  }, [completedChecklistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        WEEKLY_MILESTONES_STORAGE_KEY,
        JSON.stringify(completedWeeklyTaskIds)
      );
    } catch {
      // ignore storage write issues
    }
  }, [completedWeeklyTaskIds]);

  useEffect(() => {
    if (!user) return;
    if (skipNextCloudSyncRef.current) {
      skipNextCloudSyncRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void syncWorkspaceToCloud({
        selectedTrackId,
        languageMode,
        uiLanguage,
        completedChecklistIds,
        completedWeeklyTaskIds,
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    user,
    selectedTrackId,
    languageMode,
    uiLanguage,
    completedChecklistIds,
    completedWeeklyTaskIds,
    syncWorkspaceToCloud,
  ]);

  const badgeDefinitions: BadgeDefinition[] = useMemo(() => {
    let certifiedTracksCount = 0;

    const trackCerts: BadgeDefinition[] = DEPARTMENT_TRACKS.map((track) => {
      const total = track.steps.reduce((acc, s) => acc + s.checklist.length, 0);
      const done = track.steps.reduce(
        (acc, s) =>
          acc +
          s.checklist.filter((_, idx) =>
            completedChecklistIds.includes(`${s.id}-chk-${idx}`)
          ).length,
        0
      );
      if (total > 0 && done >= total) {
        certifiedTracksCount += 1;
      }
      return {
        id: `cert-${track.id}`,
        title: `${track.shortName} Skill Certified`,
        category: 'skill_certified',
        categoryLabel: 'Skill Certified',
        criteria: `Complete 100% of all ${total} action checklist items in ${track.shortName}.`,
        current: done,
        target: Math.max(1, total),
        unit: 'tasks',
        trackId: track.id,
      };
    });

    const multiTrackBadge: BadgeDefinition = {
      id: 'cert-multi-track',
      title: 'Multi-Track Skill Certified',
      category: 'skill_certified',
      categoryLabel: 'Skill Certified',
      criteria: 'Earn 100% Skill Certified status across any 2 income tracks.',
      current: certifiedTracksCount,
      target: 2,
      unit: 'tracks',
    };

    const milestoneBadges: BadgeDefinition[] = [
      {
        id: 'mile-starter-3',
        title: 'Execution Starter',
        category: 'income_milestone',
        categoryLabel: 'Income Milestone',
        criteria: 'Check off your first 3 SOP checklist tasks in any track.',
        current: completedChecklistIds.length,
        target: 3,
        unit: 'tasks',
      },
      {
        id: 'mile-sop-12',
        title: 'Momentum Operator',
        category: 'income_milestone',
        categoryLabel: 'Income Milestone',
        criteria: 'Check off 12 roadmap checklist tasks across tracks.',
        current: completedChecklistIds.length,
        target: 12,
        unit: 'tasks',
      },
      {
        id: 'mile-weekly-4',
        title: 'Weekly Sprint Finisher',
        category: 'income_milestone',
        categoryLabel: 'Income Milestone',
        criteria: 'Complete 4 weekly milestone tasks in the Milestone Dashboard.',
        current: completedWeeklyTaskIds.length,
        target: 4,
        unit: 'milestones',
      },
      {
        id: 'mile-first-dollar',
        title: 'First Dollar Logged',
        category: 'income_milestone',
        categoryLabel: 'Income Milestone',
        criteria: 'Record your first $1+ real revenue entry in the Earnings Ledger.',
        current: Math.floor(totalLoggedRevenueUsd),
        target: 1,
        unit: '$',
      },
      {
        id: 'mile-rev-100',
        title: '$100 Income Milestone',
        category: 'income_milestone',
        categoryLabel: 'Income Milestone',
        criteria: 'Log $100+ cumulative real income across your active tracks.',
        current: Math.floor(totalLoggedRevenueUsd),
        target: 100,
        unit: '$',
      },
      {
        id: 'mile-rev-500',
        title: '$500 Income Milestone',
        category: 'income_milestone',
        categoryLabel: 'Income Milestone',
        criteria: 'Log $500+ cumulative real income toward scaling retainers.',
        current: Math.floor(totalLoggedRevenueUsd),
        target: 500,
        unit: '$',
      },
      {
        id: 'mile-rev-1000',
        title: '$1,000 Pro Income Milestone',
        category: 'income_milestone',
        categoryLabel: 'Income Milestone',
        criteria: 'Reach $1,000+ cumulative logged earnings across tracks.',
        current: Math.floor(totalLoggedRevenueUsd),
        target: 1000,
        unit: '$',
      },
    ];

    return [...milestoneBadges, ...trackCerts, multiTrackBadge];
  }, [completedChecklistIds, completedWeeklyTaskIds, totalLoggedRevenueUsd]);

  useEffect(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    setEarnedBadges((prev) => {
      const prevMap = new Map(prev.map((b) => [b.id, b]));
      const next: EarnedBadgeRecord[] = [];
      let changed = false;

      for (const def of badgeDefinitions) {
        if (def.current >= def.target) {
          const existing = prevMap.get(def.id);
          if (existing) {
            next.push(existing);
          } else {
            changed = true;
            next.push({
              id: def.id,
              title: def.title,
              category: def.category,
              earnedAt: todayIso,
            });
          }
        } else if (prevMap.has(def.id)) {
          changed = true;
        }
      }

      if (!changed && next.length === prev.length) {
        return prev;
      }

      try {
        localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore write errors
      }
      return next;
    });
  }, [badgeDefinitions]);

  const activeStep: CourseStep | null = useMemo(
    () =>
      selectedTrack.steps.find((s) => s.id === activeStepId) ??
      selectedTrack.steps[0] ??
      null,
    [selectedTrack, activeStepId]
  );

  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DEPARTMENT_TRACKS.filter((track) => {
      const matchesCategory =
        categoryFilter === 'all' || track.category === categoryFilter;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        track.title.toLowerCase().includes(q) ||
        track.shortName.toLowerCase().includes(q) ||
        track.summary.toLowerCase().includes(q) ||
        track.earningModel.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, searchQuery]);

  const totalStepsCount = useMemo(
    () => DEPARTMENT_TRACKS.reduce((sum, d) => sum + d.steps.length, 0),
    []
  );

  const totalTasksCount = useMemo(
    () =>
      DEPARTMENT_TRACKS.reduce(
        (sum, d) =>
          sum + d.steps.reduce((s2, st) => s2 + st.checklist.length, 0),
        0
      ),
    []
  );

  const handleSelectTrack = (track: DepartmentTrack, scroll = true) => {
    setSelectedTrackId(track.id);
    setActiveStepId(track.steps[0]?.id ?? '');
    if (scroll) {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setCompletedChecklistIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleToggleWeeklyTask = (taskId: string) => {
    setCompletedWeeklyTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAnalyzeInsights = (summaryPrompt: string) => {
    setMentorMode('full_dossier');
    setQueuedPrompt({
      id: Date.now(),
      text: summaryPrompt,
    });
    mentorContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  const handleCoachStep = (step: CourseStep) => {
    setActiveStepId(step.id);
    setMentorMode('step_coach');
    setQueuedPrompt({
      id: Date.now(),
      text: step.mentorPrompt,
    });
    mentorContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  const handleAskMentorAboutDailyTask = (taskText: string) => {
    setMentorMode('step_coach');
    setQueuedPrompt({
      id: Date.now(),
      text: `Help me complete today's Daily Focus micro-task for ${selectedTrack.shortName}: "${taskText}". Break it into a fast 15-minute execution checklist so I finish it today.`,
    });
    mentorContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  const handleAskMentorFromWin = (reflection: string, trackTitle: string) => {
    setMentorMode('step_coach');
    setQueuedPrompt({
      id: Date.now(),
      text: `Here is my recent win/reflection in ${trackTitle}: "${reflection}". Celebrate briefly and give me the exact 1–2 next compounding actions I should take tomorrow to build on this momentum.`,
    });
    mentorContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  const handleOpenCustomSkillMentor = (e: React.FormEvent) => {
    e.preventDefault();
    const skill = customSkillInput.trim();
    if (!skill) return;
    setMentorMode('full_dossier');
    setQueuedPrompt({
      id: Date.now(),
      text: `I want to learn and earn online from "${skill}". Give me complete details (eligibility, tools needed, realistic income, and a step-by-step action plan starting from Step 1).`,
    });
    setCustomSkillInput('');
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getTrackProgress = (track: DepartmentTrack) => {
    const total = track.steps.reduce((acc, s) => acc + s.checklist.length, 0);
    const done = track.steps.reduce(
      (acc, s) =>
        acc +
        s.checklist.filter((_, idx) =>
          completedChecklistIds.includes(`${s.id}-chk-${idx}`)
        ).length,
      0
    );
    return {
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Brand Wordmark (Single Text Element) */}
          <a
            href="#top"
            className="text-lg sm:text-xl font-bold tracking-tight text-zinc-50 font-display whitespace-nowrap shrink-0"
          >
            #PGL.03
          </a>

          {/* Zone 2: 5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a
              href="#tracks"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navTracks}
            </a>
            <a
              href="#workspace"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navStudio}
            </a>
            <a
              href="#milestones"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navMilestones}
            </a>
            <a
              href="#ledger"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navLedger}
            </a>
            <a
              href="#plans"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t.navPlans}
            </a>
          </nav>

          {/* Zone 3: 1 Primary CTA Button */}
          <div className="flex items-center shrink-0">
            <a
              href="#plans"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
            >
              {t.enrollCta}
            </a>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Workspace Utility Bar: Cloud Sync, Roman Urdu Mode Switch, JSON Backup & PWA Install */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-2 text-zinc-300">
                <Cloud
                  className={`h-3.5 w-3.5 shrink-0 ${
                    syncStatus === 'synced'
                      ? 'text-emerald-400'
                      : syncStatus === 'error'
                      ? 'text-red-400'
                      : 'text-blue-400'
                  }`}
                />
                {user ? (
                  <span className="font-medium text-zinc-100 truncate max-w-[220px]">
                    {user.displayName || user.email || t.cloudSyncedLabel}
                  </span>
                ) : (
                  <span className="text-zinc-400">{t.localOnlyLabel}</span>
                )}
              </div>

              {user && lastSyncedAt && (
                <span className="hidden sm:inline font-mono text-[11px] text-zinc-500 tabular-nums">
                  {syncStatus === 'syncing'
                    ? 'Syncing...'
                    : `Synced ${lastSyncedAt}`}
                </span>
              )}

              {syncError && (
                <span className="text-[11px] text-amber-400 truncate max-w-[260px]">
                  {syncError}
                </span>
              )}

              {!authLoading &&
                (user ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void triggerFullSync()}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${
                          syncStatus === 'syncing' ? 'animate-spin' : ''
                        }`}
                      />
                      <span>Sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void signOutUser()}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>{t.signOutBtn}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600/20 border border-blue-500/40 px-2.5 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-600/30 transition-colors whitespace-nowrap shrink-0"
                  >
                    <LogIn className="h-3 w-3" />
                    <span>{t.signInBtn}</span>
                  </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PWAInstallButton />

              <button
                type="button"
                onClick={() => setIsBackupOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <HardDriveDownload className="h-3.5 w-3.5 text-blue-400" />
                <span>{t.backupBtn}</span>
              </button>

              <div
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5"
                role="group"
                aria-label="Interface language switch"
              >
                <Languages className="h-3.5 w-3.5 text-zinc-400 ml-2 mr-0.5 shrink-0" />
                <button
                  type="button"
                  onClick={() => handleSwitchGlobalLanguage('en')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    uiLanguage === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchGlobalLanguage('roman_urdu')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    uiLanguage === 'roman_urdu'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Roman Urdu
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial SaaS Hero Split */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-10 space-y-6">
              <div className="space-y-4">
                <a
                  href="#author"
                  className="inline-flex items-center gap-3 group"
                >
                  <img
                    src={AUTHOR_PORTRAIT_SRC}
                    alt={AUTHOR_NAME}
                    referrerPolicy="no-referrer"
                    className="h-11 w-11 rounded-lg object-cover object-[50%_12%] border border-zinc-700 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <div className="text-lg sm:text-xl font-bold tracking-tight text-blue-400 font-display group-hover:text-blue-300 transition-colors">
                      #PGL.03
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-zinc-300 tracking-[0.01em] group-hover:text-white transition-colors">
                      {AUTHOR_NAME} · Earning Guide
                    </div>
                  </div>
                </a>

                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50 font-display text-balance leading-[1.08]">
                  {t.heroTitle}
                </h1>

                <p className="text-base text-zinc-300 leading-relaxed max-w-2xl tracking-[0.01em]">
                  {t.heroSubtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#workspace"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t.startLearning}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#plans"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{t.viewPlans}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    handleSwitchGlobalLanguage(
                      uiLanguage === 'roman_urdu' ? 'en' : 'roman_urdu'
                    );
                    workspaceRef.current?.scrollIntoView({
                      behavior: 'smooth',
                    });
                  }}
                  className="text-xs font-semibold text-zinc-400 hover:text-white underline underline-offset-4 px-2 py-2 transition-colors whitespace-nowrap shrink-0"
                >
                  {uiLanguage === 'roman_urdu'
                    ? 'Switch to English UI'
                    : 'Open in Roman Urdu'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 min-h-[280px]">
              {!heroImgFailed ? (
                <img
                  src="/src/assets/images/hero_creator_studio_1795091708946.jpg"
                  alt="Modern creator and automation engineering workstation"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800">
                  <Compass className="h-10 w-10 text-blue-400 mb-3" />
                  <p className="text-sm font-semibold">
                    #PGL.03 Earning Studio
                  </p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent p-6 text-white">
                <p className="text-xs font-medium text-blue-400">
                  Guided Execution · Real Monetization Playbooks
                </p>
                <p className="text-sm font-semibold mt-1 text-zinc-100">
                  8 Income Tracks · Social Ads, n8n Automation &amp; Client Retainers
                </p>
              </div>
            </div>
          </div>

          {/* 4-Column Executive Metric Strip */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
            <div className="p-4 sm:p-5">
              <div className="text-xs text-zinc-400">Specialization Tracks</div>
              <div className="mt-1 text-2xl font-bold text-zinc-50 font-mono tabular-nums">
                0{DEPARTMENT_TRACKS.length}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs text-zinc-400">Guided Action Steps</div>
              <div className="mt-1 text-2xl font-bold text-zinc-50 font-mono tabular-nums">
                {totalStepsCount}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs text-zinc-400">Your Progress</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                {completedChecklistIds.length} / {totalTasksCount}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs text-zinc-400">AI Mentor Coaching</div>
              <div className="mt-1 text-base font-semibold text-zinc-100 pt-1">
                English · Roman Urdu
              </div>
            </div>
          </div>
        </section>

        {/* Specialization Track Directory */}
        <section
          id="tracks"
          className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-50 font-display">
                {t.tracksHeading}
              </h2>
              <p className="text-sm text-zinc-300 tracking-[0.01em]">
                {t.tracksSubheading}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
                {(
                  [
                    { id: 'all', label: 'All Tracks' },
                    { id: 'social', label: 'Social Monetization' },
                    { id: 'automation', label: 'n8n & AI' },
                    { id: 'freelancing', label: 'Freelancing' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search YouTube, n8n, TikTok..."
                  className="w-56 rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {filteredTracks.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-zinc-100">
                No income track matched "{searchQuery}"
              </p>
              <p className="text-xs text-zinc-400">
                Reset the filter or use the custom skill builder below to generate a roadmap for "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
              >
                Show All 8 Tracks
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTracks.map((track, idx) => {
                const isSelected = track.id === selectedTrack.id;
                const progress = getTrackProgress(track);
                const thumbFailed = failedThumbIds.includes(track.id);

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleSelectTrack(track, true)}
                    className={`group flex flex-col justify-between overflow-hidden rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-zinc-900 ring-1 ring-blue-500/70'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="relative h-32 w-full overflow-hidden border-b border-zinc-800 bg-zinc-950">
                        {!thumbFailed ? (
                          <img
                            src={track.imageUrl}
                            alt={track.title}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedThumbIds((prev) => [...prev, track.id])
                            }
                            className="h-full w-full object-cover opacity-80 group-hover:scale-[1.03] group-hover:opacity-95 transition-all duration-200"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-xs font-mono text-zinc-500">
                            {track.shortName}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent" />
                        <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-blue-400 tabular-nums">
                            0{idx + 1}. {track.shortName}
                          </span>
                          <span className="font-mono text-zinc-300 tabular-nums">
                            {progress.done}/{progress.total}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="text-xs text-zinc-400 truncate">
                          {track.categoryLabel} · {track.level}
                        </div>

                        <h3 className="text-base font-bold text-zinc-50 font-display leading-snug group-hover:text-blue-400 transition-colors">
                          {track.title}
                        </h3>

                        <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                          {track.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2">
                      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-zinc-400 tabular-nums truncate">
                          {track.timeToFirstDollar}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap shrink-0 ${
                            isSelected ? 'text-blue-400' : 'text-zinc-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <span>Open</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom Any-Skill Launcher */}
          <form
            onSubmit={handleOpenCustomSkillMentor}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4"
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-200">
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
              <span>
                Need a custom step-by-step plan for another freelancing skill (SEO, WordPress, Graphic Design, Amazon VA, Prompt Engineering)?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                placeholder="Type any skill (e.g. WordPress)..."
                className="w-full sm:w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!customSkillInput.trim()}
                className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
              >
                Build Plan
              </button>
            </div>
          </form>
        </section>

        {/* AI Skill & Income Niche Matcher Quiz */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          <SkillNicheQuiz
            onActivateTrack={(track) => handleSelectTrack(track, true)}
          />
        </section>

        {/* Pro 3-Pane Learning Studio */}
        <section
          id="workspace"
          ref={workspaceRef}
          className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-50 font-display">
                {t.studioHeading}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t.studioSubheading}
              </p>
            </div>

            <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto pb-1">
              {DEPARTMENT_TRACKS.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track, false)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    track.id === selectedTrack.id
                      ? 'bg-blue-600 text-white'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {track.shortName}
                </button>
              ))}
            </div>
          </div>

          <DailyFocusWidget
            department={selectedTrack}
            activeStep={activeStep}
            onAskMentorAboutTask={handleAskMentorAboutDailyTask}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-[240px_minmax(0,1fr)_450px] gap-6 items-start">
            {/* Desktop Left Persistent Track Rail */}
            <aside className="hidden xl:flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-1 sticky top-20">
              <div className="px-2.5 py-2 text-xs font-semibold text-zinc-400">
                All Income Tracks
              </div>
              {DEPARTMENT_TRACKS.map((track, idx) => {
                const isActive = track.id === selectedTrack.id;
                const prog = getTrackProgress(track);
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleSelectTrack(track, false)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                      isActive
                        ? 'bg-zinc-950 text-blue-400 border border-blue-500/60 font-semibold'
                        : 'text-zinc-300 border border-transparent hover:bg-zinc-800/70 hover:text-white'
                    }`}
                  >
                    <span className="truncate">
                      0{idx + 1}. {track.shortName}
                    </span>
                    <span
                      className={`font-mono text-[11px] tabular-nums shrink-0 ${
                        prog.pct === 100
                          ? 'text-emerald-400'
                          : isActive
                          ? 'text-blue-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {prog.pct}%
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* Center Course Playbook & Roadmap */}
            <div className="lg:col-span-7 xl:col-span-1 min-w-0">
              <DepartmentWorkspace
                department={selectedTrack}
                activeStepId={activeStep?.id ?? ''}
                onSelectStep={(step) => setActiveStepId(step.id)}
                onCoachStep={handleCoachStep}
                completedChecklistIds={completedChecklistIds}
                onToggleChecklistItem={handleToggleChecklistItem}
                languageMode={languageMode}
                completedWeeklyTaskIds={completedWeeklyTaskIds}
                onToggleWeeklyTask={handleToggleWeeklyTask}
                onAnalyzeWithAI={handleAnalyzeInsights}
              />
            </div>

            {/* Right Live Streaming AI Mentor */}
            <div
              id="mentor-desk"
              ref={mentorContainerRef}
              className="lg:col-span-5 xl:col-span-1 lg:sticky lg:top-20 min-w-0"
            >
              <MentorPanel
                department={selectedTrack}
                activeStep={activeStep}
                languageMode={languageMode}
                onLanguageChange={setLanguageMode}
                mentorMode={mentorMode}
                onMentorModeChange={setMentorMode}
                queuedPrompt={queuedPrompt}
                onClearQueuedPrompt={() => setQueuedPrompt(null)}
              />
            </div>
          </div>
        </section>

        {/* Recharts Milestone & Revenue Growth Dashboard */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <MilestoneDashboard
            selectedTrack={selectedTrack}
            onSelectTrack={(track) => handleSelectTrack(track, false)}
            completedChecklistIds={completedChecklistIds}
            completedWeeklyTaskIds={completedWeeklyTaskIds}
            onToggleWeeklyTask={handleToggleWeeklyTask}
          />
        </section>

        {/* Dedicated Achievements & Progression Badges Section */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <ProgressionBadges
            earnedBadges={earnedBadges}
            definitions={badgeDefinitions}
            onSelectTrack={(track) => handleSelectTrack(track, true)}
          />
        </section>

        {/* Task-Level Earnings Ledger */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <EarningsLedger
            selectedTrack={selectedTrack}
            onSelectTrack={(track) => handleSelectTrack(track, false)}
          />
        </section>

        {/* Anonymized Global Top 5 Monthly Earners Leaderboard */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <GlobalTopEarners
            selectedTrack={selectedTrack}
            onSelectTrack={(track) => handleSelectTrack(track, false)}
          />
        </section>

        {/* Payoneer, Wise, Bank & Local Payout Withdrawal Tracker */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <PayoutWithdrawalTracker />
        </section>

        {/* Client Invoice & Proposal PDF Studio */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <InvoiceProposalStudio selectedTrack={selectedTrack} />
        </section>

        {/* Daily Wins & Reflections Success Journal */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <SuccessJournal
            selectedTrack={selectedTrack}
            onSelectTrack={(track) => handleSelectTrack(track, false)}
            onAskMentorFromWin={handleAskMentorFromWin}
          />
        </section>

        {/* Downloadable Templates, PDF Checklists & Curated Resource Vault */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <ResourceVault
            selectedTrack={selectedTrack}
            onSelectTrack={(track) => handleSelectTrack(track, false)}
            completedChecklistIds={completedChecklistIds}
            completedWeeklyTaskIds={completedWeeklyTaskIds}
          />
        </section>

        {/* Monetization & Freelancing Calculator */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <EarningsCalculator />
        </section>

        {/* Commercial Membership Plans & Enrollment */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <PricingSection />
        </section>

        {/* Author Profile, Atmospheric Background Wall & Innovation Contacts */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <AuthorSection />
        </div>
      </main>

      {/* Restrained Minimal Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 mt-10">
        <div className="mx-auto flex max-w-[1400px] flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-6 text-xs text-zinc-400">
          <div>
            <div className="font-bold text-zinc-100 font-display text-sm">
              #PGL.03
            </div>
            <div className="text-xs text-blue-400 mt-0.5">
              {AUTHOR_NAME}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#tracks" className="hover:text-white transition-colors">
              Income Tracks
            </a>
            <a href="#quiz" className="hover:text-white transition-colors">
              Skill Quiz
            </a>
            <a href="#workspace" className="hover:text-white transition-colors">
              Studio
            </a>
            <a href="#milestones" className="hover:text-white transition-colors">
              Milestones
            </a>
            <a href="#achievements" className="hover:text-white transition-colors">
              Achievements
            </a>
            <a href="#ledger" className="hover:text-white transition-colors">
              Ledger
            </a>
            <a href="#leaderboard" className="hover:text-white transition-colors">
              Leaderboard
            </a>
            <a href="#withdrawals" className="hover:text-white transition-colors">
              Withdrawals
            </a>
            <a href="#invoices" className="hover:text-white transition-colors">
              Invoices
            </a>
            <a href="#journal" className="hover:text-white transition-colors">
              Journal
            </a>
            <a href="#resources" className="hover:text-white transition-colors">
              Resources
            </a>
            <a href="#calculator" className="hover:text-white transition-colors">
              Simulator
            </a>
            <a href="#plans" className="hover:text-white transition-colors">
              Plans
            </a>
            <a href="#author" className="hover:text-white transition-colors">
              Author
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <a
              href={`mailto:${AUTHOR_GMAIL}`}
              className="hover:text-white transition-colors"
            >
              {AUTHOR_GMAIL}
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={AUTHOR_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              FB: {AUTHOR_FACEBOOK_NAME}
            </a>
          </div>
        </div>
      </footer>

      <BackupRestoreModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
      <OfflineIndicator />
    </div>
  );
}
