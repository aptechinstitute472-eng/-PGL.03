import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileCode2,
  ListChecks,
  PlayCircle,
  Sparkles,
  Square,
} from 'lucide-react';
import type { CourseStep, DepartmentTrack } from '../data/departments';
import type { LanguageMode } from './MentorPanel';
import { StepVideoWalkthrough } from './StepVideoWalkthrough';
import { ContentTemplateStudio } from './ContentTemplateStudio';
import { InsightsMilestones } from './InsightsMilestones';

type WorkspaceTab =
  | 'roadmap'
  | 'video'
  | 'content'
  | 'insights'
  | 'dossier'
  | 'blueprints';

interface DepartmentWorkspaceProps {
  department: DepartmentTrack;
  activeStepId: string;
  onSelectStep: (step: CourseStep) => void;
  onCoachStep: (step: CourseStep) => void;
  completedChecklistIds: string[];
  onToggleChecklistItem: (itemId: string) => void;
  languageMode: LanguageMode;
  completedWeeklyTaskIds: string[];
  onToggleWeeklyTask: (taskId: string) => void;
  onAnalyzeWithAI: (summaryPrompt: string) => void;
}

export function DepartmentWorkspace({
  department,
  activeStepId,
  onSelectStep,
  onCoachStep,
  completedChecklistIds,
  onToggleChecklistItem,
  languageMode,
  completedWeeklyTaskIds,
  onToggleWeeklyTask,
  onAnalyzeWithAI,
}: DepartmentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('roadmap');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeStep =
    department.steps.find((s) => s.id === activeStepId) ?? department.steps[0];

  const totalChecklistItems = department.steps.reduce(
    (sum, s) => sum + s.checklist.length,
    0
  );
  const completedInTrack = department.steps.reduce((sum, step) => {
    const doneCount = step.checklist.filter((_, idx) =>
      completedChecklistIds.includes(`${step.id}-chk-${idx}`)
    ).length;
    return sum + doneCount;
  }, 0);
  const progressPct =
    totalChecklistItems > 0
      ? Math.round((completedInTrack / totalChecklistItems) * 100)
      : 0;

  const handleCopyBlueprint = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const tabs: Array<{
    id: WorkspaceTab;
    label: string;
    icon: typeof ListChecks;
  }> = [
    {
      id: 'roadmap',
      label: `Roadmap (${department.steps.length})`,
      icon: ListChecks,
    },
    { id: 'video', label: 'Video Guide', icon: PlayCircle },
    { id: 'content', label: 'Content & Images', icon: Sparkles },
    { id: 'insights', label: 'Daily Insights', icon: BarChart3 },
    { id: 'dossier', label: 'Rules & Payouts', icon: BookOpen },
    {
      id: 'blueprints',
      label: `Blueprints (${department.blueprints.length})`,
      icon: FileCode2,
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header Strip */}
      <div className="border-b border-zinc-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="font-semibold text-blue-400">
                {department.categoryLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span>{department.level}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {department.timeToFirstDollar}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 font-display text-balance">
              {department.title}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed tracking-[0.01em]">
              {department.summary}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs text-zinc-400">Track Completion</div>
            <div className="text-2xl font-bold text-zinc-50 font-mono tabular-nums">
              {progressPct}%
            </div>
            <div className="text-xs text-zinc-400 tabular-nums">
              {completedInTrack} / {totalChecklistItems} tasks done
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-950">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Segmented Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panel Body */}
      <div className="p-5 sm:p-6">
        {activeTab === 'roadmap' && (
          <div className="space-y-3">
            {department.steps.map((step) => {
              const isExpanded = step.id === activeStepId;
              const stepDoneCount = step.checklist.filter((_, idx) =>
                completedChecklistIds.includes(`${step.id}-chk-${idx}`)
              ).length;
              const isStepComplete =
                step.checklist.length > 0 &&
                stepDoneCount === step.checklist.length;

              return (
                <div
                  key={step.id}
                  className={`rounded-xl border transition-colors ${
                    isExpanded
                      ? 'border-blue-500/70 bg-zinc-950'
                      : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectStep(step)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                          isStepComplete
                            ? 'text-emerald-400'
                            : isExpanded
                            ? 'text-blue-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {step.stepNumber}.
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-100 truncate">
                          {step.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          <span className="tabular-nums">{step.duration}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {stepDoneCount}/{step.checklist.length} tasks
                          </span>
                          {isStepComplete && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-emerald-400">
                                Completed
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-zinc-800 px-4 py-4 space-y-4">
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-blue-400">
                          Objective: {step.objective}
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed tracking-[0.01em]">
                          {step.instructions}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-zinc-300">
                          Action Checklist
                        </div>
                        <div className="space-y-1.5">
                          {step.checklist.map((item, idx) => {
                            const checkId = `${step.id}-chk-${idx}`;
                            const checked =
                              completedChecklistIds.includes(checkId);
                            return (
                              <button
                                key={checkId}
                                type="button"
                                onClick={() => onToggleChecklistItem(checkId)}
                                className="flex w-full items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left text-xs transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                              >
                                {checked ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                                )}
                                <span
                                  className={
                                    checked
                                      ? 'text-zinc-500 line-through'
                                      : 'text-zinc-200'
                                  }
                                >
                                  {item}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                        <div className="text-xs text-zinc-400">
                          Deliverable:{' '}
                          <span className="font-medium text-zinc-200">
                            {step.deliverable}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStep(step);
                              setActiveTab('video');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                          >
                            <PlayCircle className="h-3.5 w-3.5 text-blue-400" />
                            <span>Watch Step Video</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onCoachStep(step)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                          >
                            <span>Ask AI Mentor About Step {step.stepNumber}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'video' && activeStep && (
          <StepVideoWalkthrough
            department={department}
            activeStep={activeStep}
            onSelectStep={onSelectStep}
          />
        )}

        {activeTab === 'content' && (
          <ContentTemplateStudio
            department={department}
            languageMode={languageMode}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsMilestones
            department={department}
            completedWeeklyTaskIds={completedWeeklyTaskIds}
            onToggleWeeklyTask={onToggleWeeklyTask}
            onAnalyzeWithAI={onAnalyzeWithAI}
          />
        )}

        {activeTab === 'dossier' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-blue-400">
                  Roman Urdu Overview
                </div>
                <a
                  href={department.officialDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4 whitespace-nowrap shrink-0"
                >
                  <span>{department.officialDocLabel}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed tracking-[0.01em]">
                {department.romanUrduIntro}
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-zinc-100 font-display">
                Monetization Criteria &amp; Payout Benchmarks
              </h3>
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-300">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Metric</th>
                      <th className="px-4 py-2.5 font-semibold">
                        Requirement / Rate
                      </th>
                      <th className="px-4 py-2.5 font-semibold">
                        Operational Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                    {department.eligibility.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/40">
                        <td className="px-4 py-3 font-medium text-zinc-100 whitespace-nowrap">
                          {row.metric}
                        </td>
                        <td className="px-4 py-3 font-mono text-blue-400 tabular-nums whitespace-nowrap">
                          {row.requirement}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-zinc-100 font-display">
                  Income Channels
                </h4>
                <ul className="space-y-2 text-xs text-zinc-300">
                  {department.revenueStreams.map((stream, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-blue-400 tabular-nums">
                        0{i + 1}.
                      </span>
                      <span>{stream}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-zinc-100 font-display">
                  Required Stack &amp; Payout Tools
                </h4>
                <ul className="space-y-2 text-xs text-zinc-300">
                  {department.requiredTools.map((tool, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span>{tool}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Policy Compliance &amp; Ban Prevention</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-100/90 leading-relaxed">
                {department.policyWarnings.map((warn, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono font-semibold text-amber-400 tabular-nums">
                      •
                    </span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'blueprints' && (
          <div className="space-y-4">
            {department.blueprints.map((bp) => (
              <div
                key={bp.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-900/70 px-4 py-3">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100 font-display">
                      {bp.title}
                    </h4>
                    <p className="text-xs text-zinc-400">{bp.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyBlueprint(bp.id, bp.content)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedId === bp.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Template</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto bg-zinc-950 p-4 text-xs leading-relaxed font-mono text-zinc-200">
                  <code>{bp.content}</code>
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
