import { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  DEPARTMENT_TRACKS,
  type DepartmentTrack,
} from '../data/departments';
import { useUiLanguage } from '../context/LanguageContext';

interface SkillNicheQuizProps {
  onActivateTrack: (track: DepartmentTrack) => void;
}

interface QuizAnswers {
  dailyHours: string;
  strength: string;
  cameraComfort: string;
  device: string;
  goalTimeline: string;
}

interface QuizRecommendation {
  recommendedTrackId: string;
  runnerUpTrackId: string;
  matchScore: number;
  headline: string;
  rationale: string;
  firstWeekPlan: string[];
  estimated30DayTarget: string;
  estimated90DayTarget: string;
}

const DEFAULT_ANSWERS: QuizAnswers = {
  dailyHours: '2-3 hours/day',
  strength: 'Tech, Logic & AI Workflows',
  cameraComfort: 'Faceless or B2B client work',
  device: 'Laptop / Desktop PC',
  goalTimeline: 'Fast cashflow in 14-30 days',
};

export function SkillNicheQuiz({ onActivateTrack }: SkillNicheQuizProps) {
  const { uiLanguage, t } = useUiLanguage();
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULT_ANSWERS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<QuizRecommendation | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/quiz/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          languageMode: uiLanguage === 'roman_urdu' ? 'roman_urdu' : 'bilingual',
          availableTracks: DEPARTMENT_TRACKS.map((tr) => ({
            id: tr.id,
            title: tr.title,
            timeToFirstDollar: tr.timeToFirstDollar,
            earningModel: tr.earningModel,
          })),
        }),
      });

      const body = (await res.json().catch(() => ({}))) as QuizRecommendation & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          body.error || 'Could not generate AI skill match right now.'
        );
      }
      setResult(body);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to analyze quiz responses.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const matchedTrack = result
    ? DEPARTMENT_TRACKS.find((tr) => tr.id === result.recommendedTrackId) ??
      DEPARTMENT_TRACKS[0]
    : null;

  const runnerUpTrack = result
    ? DEPARTMENT_TRACKS.find((tr) => tr.id === result.runnerUpTrackId) ?? null
    : null;

  return (
    <section
      id="quiz"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Compass className="h-4 w-4" />
            <span>AI Diagnostic · Track Matcher</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            {t.quizHeading}
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            {uiLanguage === 'roman_urdu'
              ? 'Apni daily timing, device, aur pasand ke mutabiq 5 sawalon ke jawab dein—Gemini AI aap ke liye sab se behtar earning track aur 7-day plan tayyar karega.'
              : 'Answer 5 quick questions about your schedule, strengths, and hardware—Gemini AI will match you with the highest-fit income track and build your 7-day launch plan.'}
          </p>
        </div>
        {result && (
          <button
            type="button"
            onClick={() => setResult(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retake Quiz</span>
          </button>
        )}
      </div>

      {!result ? (
        <form onSubmit={handleAnalyze} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="quiz-hours"
                className="block text-xs font-medium text-zinc-300"
              >
                1. Daily Available Hours
              </label>
              <select
                id="quiz-hours"
                value={answers.dailyHours}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, dailyHours: e.target.value }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="1-2 hours/day">1–2 hours/day (Part-time)</option>
                <option value="2-3 hours/day">2–3 hours/day (Focused)</option>
                <option value="4-6+ hours/day">4–6+ hours/day (Full sprint)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quiz-strength"
                className="block text-xs font-medium text-zinc-300"
              >
                2. Natural Strength / Interest
              </label>
              <select
                id="quiz-strength"
                value={answers.strength}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, strength: e.target.value }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="Tech, Logic & AI Workflows">
                  Tech, Logic &amp; AI Workflows (No-Code / n8n)
                </option>
                <option value="Video Editing, Reels & Storytelling">
                  Video Editing, Reels &amp; Storytelling
                </option>
                <option value="Writing, Outreach & Client Sales">
                  Writing, Outreach &amp; Client Sales
                </option>
                <option value="Design, E-Commerce & Digital Stores">
                  Design, E-Commerce &amp; Digital Stores
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quiz-camera"
                className="block text-xs font-medium text-zinc-300"
              >
                3. Camera &amp; Personal Brand Comfort
              </label>
              <select
                id="quiz-camera"
                value={answers.cameraComfort}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, cameraComfort: e.target.value }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="Faceless or B2B client work">
                  Faceless or B2B client work (No face)
                </option>
                <option value="Comfortable on camera">
                  Comfortable speaking on camera
                </option>
                <option value="Voiceover + screen recording only">
                  Voiceover + screen recording only
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quiz-device"
                className="block text-xs font-medium text-zinc-300"
              >
                4. Primary Hardware
              </label>
              <select
                id="quiz-device"
                value={answers.device}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, device: e.target.value }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="Laptop / Desktop PC">
                  Laptop / Desktop PC
                </option>
                <option value="Smartphone only">Smartphone only</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor="quiz-goal"
                className="block text-xs font-medium text-zinc-300"
              >
                5. Earning Speed Priority
              </label>
              <select
                id="quiz-goal"
                value={answers.goalTimeline}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, goalTimeline: e.target.value }))
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="Fast cashflow in 14-30 days">
                  Fast cashflow in 14–30 days (Freelance / Client services)
                </option>
                <option value="Compounding creator asset in 60-120 days">
                  Compounding creator asset in 60–120 days (AdSense / Monetization)
                </option>
                <option value="High-ticket monthly B2B retainers">
                  High-ticket monthly B2B retainers ($500–$2,500/mo clients)
                </option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyzing Best Track...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Get AI Track Recommendation</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        matchedTrack && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 rounded-xl border border-blue-500/60 bg-zinc-950 p-5 space-y-4">
              <div className="text-xs font-mono text-blue-400">
                Primary Match · {result.matchScore}% Fit
              </div>
              <h3 className="text-xl font-bold text-zinc-50 font-display">
                {matchedTrack.title}
              </h3>
              <p className="text-xs font-medium text-emerald-400">
                {result.headline}
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {result.rationale}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800 text-xs">
                <div>
                  <div className="text-zinc-500">30-Day Target</div>
                  <div className="font-mono font-semibold text-zinc-100 mt-0.5">
                    {result.estimated30DayTarget}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">90-Day Target</div>
                  <div className="font-mono font-semibold text-emerald-400 mt-0.5">
                    {result.estimated90DayTarget}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onActivateTrack(matchedTrack)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  <span>Activate {matchedTrack.shortName} in Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                {runnerUpTrack && (
                  <button
                    type="button"
                    onClick={() => onActivateTrack(runnerUpTrack)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Alt: {runnerUpTrack.shortName}
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="text-xs font-semibold text-zinc-100">
                Your Custom 7-Day Launch Plan ({matchedTrack.shortName})
              </div>
              <ol className="space-y-2.5">
                {result.firstWeekPlan.map((stepText, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-200"
                  >
                    <span className="font-mono font-bold text-blue-400 shrink-0 tabular-nums">
                      D0{idx + 1}
                    </span>
                    <span className="leading-relaxed">{stepText}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )
      )}
    </section>
  );
}
