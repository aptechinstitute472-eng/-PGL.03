import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  DEPARTMENT_TRACKS,
  type CourseStep,
  type DepartmentTrack,
  type TrackCategory,
} from './data/departments';
import { DepartmentWorkspace } from './components/DepartmentWorkspace';
import {
  MentorPanel,
  type LanguageMode,
  type MentorMode,
} from './components/MentorPanel';
import { EarningsCalculator } from './components/EarningsCalculator';
import { MilestoneDashboard } from './components/MilestoneDashboard';
import { PricingSection } from './components/PricingSection';

type CategoryFilter = 'all' | TrackCategory;

const CHECKLIST_STORAGE_KEY = 'aryan_ai_completed_checklists_v1';
const WEEKLY_MILESTONES_STORAGE_KEY = 'pgl03_weekly_milestones_v1';

export default function App() {
  const [selectedTrackId, setSelectedTrackId] = useState<string>('n8n');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [failedThumbIds, setFailedThumbIds] = useState<string[]>([]);

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

  const workspaceRef = useRef<HTMLElement | null>(null);
  const mentorContainerRef = useRef<HTMLDivElement | null>(null);

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
              Income Tracks
            </a>
            <a
              href="#workspace"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Studio
            </a>
            <a
              href="#milestones"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Milestones
            </a>
            <a
              href="#calculator"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Simulator
            </a>
            <a
              href="#plans"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Plans
            </a>
          </nav>

          {/* Zone 3: 1 Primary CTA Button */}
          <div className="flex items-center shrink-0">
            <a
              href="#plans"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
            >
              Enroll for Earning
            </a>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Commercial SaaS Hero Split */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl font-bold tracking-tight text-blue-400 font-display">
                    #PGL.03
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-zinc-300 tracking-[0.01em]">
                    Earning Guide by ArYan JAN BaLocH
                  </div>
                </div>

                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50 font-display text-balance leading-[1.08]">
                  Master high-income digital skills, monetization, and AI automation.
                </h1>

                <p className="text-base text-zinc-300 leading-relaxed max-w-2xl tracking-[0.01em]">
                  One complete platform covering YouTube, Facebook, Instagram, TikTok, n8n AI workflows, and high-ticket freelancing. Explore verified monetization thresholds, copy-ready blueprints, and live step-by-step AI mentoring in English and Roman Urdu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#workspace"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Start Learning Now</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#plans"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>View Membership Plans</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setLanguageMode('roman_urdu');
                    workspaceRef.current?.scrollIntoView({
                      behavior: 'smooth',
                    });
                  }}
                  className="text-xs font-semibold text-zinc-400 hover:text-white underline underline-offset-4 px-2 py-2 transition-colors whitespace-nowrap shrink-0"
                >
                  Open in Roman Urdu
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
                Curriculum &amp; Income Tracks
              </h2>
              <p className="text-sm text-zinc-300 tracking-[0.01em]">
                Select any track below to review eligibility benchmarks, blueprints, and step-by-step AI guidance.
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

        {/* Pro 3-Pane Learning Studio */}
        <section
          id="workspace"
          ref={workspaceRef}
          className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-50 font-display">
                Execution Studio &amp; Live AI Mentor
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Choose a track on the left, track your checklist in the center, and get step-by-step coaching on the right.
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

        {/* Monetization & Freelancing Calculator */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <EarningsCalculator />
        </section>

        {/* Commercial Membership Plans & Enrollment */}
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          <PricingSection />
        </section>
      </main>

      {/* Restrained Minimal Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 mt-10">
        <div className="mx-auto flex max-w-[1400px] flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-6 text-xs text-zinc-400">
          <div>
            <div className="font-bold text-zinc-100 font-display text-sm">
              #PGL.03
            </div>
            <div className="text-xs text-blue-400 mt-0.5">
              Earning Guide by ArYan JAN BaLocH
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#tracks" className="hover:text-white transition-colors">
              Income Tracks
            </a>
            <a href="#workspace" className="hover:text-white transition-colors">
              Studio
            </a>
            <a href="#milestones" className="hover:text-white transition-colors">
              Milestones
            </a>
            <a href="#calculator" className="hover:text-white transition-colors">
              Simulator
            </a>
            <a href="#plans" className="hover:text-white transition-colors">
              Plans
            </a>
          </div>
          <div>
            Register for Earning · Freelancing, Monetization &amp; n8n Automation
          </div>
        </div>
      </footer>
    </div>
  );
}
