import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  FolderKanban,
  Link2,
  Printer,
  Search,
} from 'lucide-react';
import {
  DEPARTMENT_TRACKS,
  type BlueprintTemplate,
  type DepartmentTrack,
} from '../data/departments';
import { downloadTrackChecklistPdf } from '../utils/pdfChecklist';
import { QuickTip } from './QuickTip';

interface ResourceVaultProps {
  selectedTrack: DepartmentTrack;
  onSelectTrack: (track: DepartmentTrack) => void;
  completedChecklistIds: string[];
  completedWeeklyTaskIds: string[];
}

interface CuratedLink {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
}

type ResourceTypeFilter = 'all' | 'pdf' | 'templates' | 'links';

const TRACK_CURATED_LINKS: Record<string, CuratedLink[]> = {
  youtube: [
    {
      id: 'yt-link-studio',
      title: 'YouTube Studio Dashboard & Analytics',
      url: 'https://studio.youtube.com/',
      category: 'Creator Portal',
      description:
        'Monitor real-time CTR, average view duration, YPP eligibility hours, and RPM metrics.',
    },
    {
      id: 'yt-link-adsense',
      title: 'Google AdSense for YouTube Help',
      url: 'https://support.google.com/youtube/answer/72857',
      category: 'Payouts & Tax',
      description:
        'Step-by-step guide to linking AdSense, verifying your postal PIN, and setting up $100 threshold payouts.',
    },
    {
      id: 'yt-link-policies',
      title: 'YouTube Channel Monetization Policies',
      url: 'https://support.google.com/youtube/answer/1311392',
      category: 'Compliance',
      description:
        'Official rules against reused/repetitious content so faceless and commentary channels pass review.',
    },
  ],
  facebook: [
    {
      id: 'fb-link-business',
      title: 'Meta Business Suite',
      url: 'https://business.facebook.com/',
      category: 'Creator Portal',
      description:
        'Schedule Reels, manage Page monetization status, and monitor payout accounts from one hub.',
    },
    {
      id: 'fb-link-monetization',
      title: 'Meta Partner Monetization Policies',
      url: 'https://www.facebook.com/business/help/169845596919485',
      category: 'Compliance',
      description:
        'Country availability, original-content criteria, and policy violation remediation steps.',
    },
    {
      id: 'fb-link-payouts',
      title: 'Meta Creator Payout Account Setup',
      url: 'https://www.facebook.com/business/help/378357612826845',
      category: 'Payouts & Tax',
      description:
        'Configure bank wires or PayPal/Payoneer payout details and submit tax forms cleanly.',
    },
  ],
  instagram: [
    {
      id: 'ig-link-creators',
      title: 'Instagram Creators Official Hub',
      url: 'https://creators.instagram.com/',
      category: 'Creator Portal',
      description:
        'Official Reels algorithm insights, creator monetization features, and growth playbooks.',
    },
    {
      id: 'ig-link-badges',
      title: 'Instagram Branded Content & Partnerships',
      url: 'https://help.instagram.com/116947042301556',
      category: 'Sponsorships',
      description:
        'Paid partnership label rules and Meta Creator Marketplace brand collaboration requirements.',
    },
    {
      id: 'ig-link-insights',
      title: 'Instagram Professional Account Setup',
      url: 'https://help.instagram.com/502981923235522',
      category: 'Setup Guide',
      description:
        'Switch to a Creator/Business account to unlock Insights, link stickers, and ad boosts.',
    },
  ],
  tiktok: [
    {
      id: 'tt-link-rewards',
      title: 'TikTok Creator Rewards Program Rules',
      url: 'https://support.tiktok.com/en/business-and-creator/creator-rewards-program',
      category: 'Monetization',
      description:
        'Official 1-minute+ video qualification rules, 10k follower threshold, and RPM calculations.',
    },
    {
      id: 'tt-link-studio',
      title: 'TikTok Creative Center & Trend Insights',
      url: 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
      category: 'Research Tool',
      description:
        'Track verified trending hooks, regional hashtags, and top-performing commercial scripts.',
    },
    {
      id: 'tt-link-shop',
      title: 'TikTok Shop Affiliate Seller Center',
      url: 'https://seller.tiktok.com/',
      category: 'Affiliate',
      description:
        'Browse high-commission Shop products and generate trackable product showcase links.',
    },
  ],
  n8n: [
    {
      id: 'n8n-link-templates',
      title: 'n8n Official Workflow Templates Library',
      url: 'https://n8n.io/workflows/',
      category: 'Templates Hub',
      description:
        'Explore 1,000+ community and official JSON workflows for AI agents, CRM sync, and lead scraping.',
    },
    {
      id: 'n8n-link-langchain',
      title: 'n8n AI Agents & LangChain Docs',
      url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/',
      category: 'Documentation',
      description:
        'Configure tool-calling AI agents, memory buffers, and structured output parsers in n8n.',
    },
    {
      id: 'n8n-link-selfhost',
      title: 'n8n Docker Self-Hosting Guide',
      url: 'https://docs.n8n.io/hosting/installation/docker/',
      category: 'Infrastructure',
      description:
        'Deploy client production n8n instances on a low-cost VPS with HTTPS webhook security.',
    },
  ],
  freelancing: [
    {
      id: 'fr-link-upwork',
      title: 'Upwork Profile & Proposal Best Practices',
      url: 'https://support.upwork.com/hc/en-us/sections/360002711173-Create-Your-Profile',
      category: 'Platform Guide',
      description:
        'Optimize your specialized profile, JSS protection, and client contract milestones.',
    },
    {
      id: 'fr-link-fiverr',
      title: 'Fiverr Seller Help & Gig SEO',
      url: 'https://help.fiverr.com/hc/en-us',
      category: 'Platform Guide',
      description:
        'Structure 3-tier packages, seller levels, and response-rate hygiene for organic search rank.',
    },
    {
      id: 'fr-link-payoneer',
      title: 'Payoneer Global USD Receiving Accounts',
      url: 'https://www.payoneer.com/solutions/freelancers/',
      category: 'Payouts & Tax',
      description:
        'Receive USD/EUR retainers from international agencies and Upwork/Fiverr at transparent FX rates.',
    },
  ],
  'video-ugc': [
    {
      id: 'vid-link-davinci',
      title: 'Blackmagic DaVinci Resolve Official Training',
      url: 'https://www.blackmagicdesign.com/products/davinciresolve/training',
      category: 'Training & Certification',
      description:
        'Free official lessons covering Cut/Edit pages, Fusion motion titles, and color grading.',
    },
    {
      id: 'vid-link-capcut',
      title: 'CapCut Desktop Creator Resources',
      url: 'https://www.capcut.com/resource',
      category: 'Editing Tool',
      description:
        'Auto-caption presets, keyframe pacing workflows, and commercial audio licensing checks.',
    },
    {
      id: 'vid-link-pexels',
      title: 'Pexels Commercial-Safe Stock Video',
      url: 'https://www.pexels.com/videos/',
      category: 'B-Roll Assets',
      description:
        'Royalty-free HD/4K B-roll clips safe for client UGC ads and faceless retention edits.',
    },
  ],
  'digital-commerce': [
    {
      id: 'dc-link-shopify',
      title: 'Shopify Partners & Store Development Docs',
      url: 'https://www.shopify.com/partners',
      category: 'Commerce Platform',
      description:
        'Build development stores free, earn recurring partner commissions, and configure checkout flows.',
    },
    {
      id: 'dc-link-gumroad',
      title: 'Gumroad Creator Help Center',
      url: 'https://help.gumroad.com/',
      category: 'Digital Products',
      description:
        'Launch Notion systems, prompt packs, and downloadable PDFs with built-in global tax handling.',
    },
    {
      id: 'dc-link-lemon',
      title: 'Lemon Squeezy Merchant-of-Record Docs',
      url: 'https://docs.lemonsqueezy.com/',
      category: 'Global Payments',
      description:
        'Sell digital templates and SaaS subscriptions globally with automatic VAT/sales tax compliance.',
    },
  ],
};

function downloadTextOrJsonFile(
  filename: string,
  content: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildTrackOfflineTextPack(track: DepartmentTrack): string {
  const lines: string[] = [
    `#PGL.03 - Earning Guide by ArYan JAN BaLocH`,
    `TRACK: ${track.title}`,
    `Category: ${track.categoryLabel} | Level: ${track.level} | Time to First Dollar: ${track.timeToFirstDollar}`,
    `Earning Model: ${track.earningModel}`,
    `Official Doc: ${track.officialDocUrl}`,
    '',
    '=== SUMMARY ===',
    track.summary,
    '',
    '=== ROMAN URDU OVERVIEW ===',
    track.romanUrduIntro,
    '',
    '=== ELIGIBILITY & BENCHMARKS ===',
    ...track.eligibility.map(
      (e) => `- ${e.metric}: ${e.requirement} (${e.notes})`
    ),
    '',
    '=== REQUIRED TOOLS ===',
    ...track.requiredTools.map((t) => `- ${t}`),
    '',
    '=== STEP-BY-STEP SOP CHECKLIST ===',
  ];

  for (const step of track.steps) {
    lines.push(
      '',
      `${step.stepNumber}. ${step.title} (${step.duration})`,
      `   Objective: ${step.objective}`,
      `   Instructions: ${step.instructions}`,
      ...step.checklist.map((item) => `   [ ] ${item}`),
      `   Deliverable: ${step.deliverable}`
    );
  }

  lines.push('', '=== 4-WEEK MILESTONES ===');
  for (const wk of track.weeklyMilestones) {
    lines.push(
      '',
      `${wk.week}: ${wk.focusTitle} | Target: ${wk.targetMetric}`,
      ...wk.tasks.map((t) => `   [ ] ${t}`)
    );
  }

  lines.push('', '=== BLUEPRINT TEMPLATES ===');
  for (const bp of track.blueprints) {
    lines.push(
      '',
      `--- ${bp.title} (${bp.format.toUpperCase()}) ---`,
      bp.summary,
      bp.content
    );
  }

  return lines.join('\n');
}

export function ResourceVault({
  selectedTrack,
  onSelectTrack,
  completedChecklistIds,
  completedWeeklyTaskIds,
}: ResourceVaultProps) {
  const [typeFilter, setTypeFilter] = useState<ResourceTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBlueprintIds, setExpandedBlueprintIds] = useState<string[]>(
    []
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const trackStats = useMemo(() => {
    const totalChecklist = selectedTrack.steps.reduce(
      (sum, step) => sum + step.checklist.length,
      0
    );
    const doneChecklist = selectedTrack.steps.reduce(
      (sum, step) =>
        sum +
        step.checklist.filter((_, idx) =>
          completedChecklistIds.includes(`${step.id}-chk-${idx}`)
        ).length,
      0
    );

    const totalWeekly = selectedTrack.weeklyMilestones.reduce(
      (sum, wk) => sum + wk.tasks.length,
      0
    );
    const doneWeekly = selectedTrack.weeklyMilestones.reduce(
      (sum, wk, wIdx) =>
        sum +
        wk.tasks.filter((_, tIdx) =>
          completedWeeklyTaskIds.includes(`${selectedTrack.id}-wk-${wIdx}-${tIdx}`)
        ).length,
      0
    );

    return { totalChecklist, doneChecklist, totalWeekly, doneWeekly };
  }, [selectedTrack, completedChecklistIds, completedWeeklyTaskIds]);

  const curatedLinks: CuratedLink[] = useMemo(() => {
    const primaryLink: CuratedLink = {
      id: `${selectedTrack.id}-official-primary`,
      title: selectedTrack.officialDocLabel,
      url: selectedTrack.officialDocUrl,
      category: 'Official Documentation',
      description: `Primary verified documentation and monetization requirements for ${selectedTrack.shortName}.`,
    };
    const extraLinks = TRACK_CURATED_LINKS[selectedTrack.id] ?? [];
    return [primaryLink, ...extraLinks];
  }, [selectedTrack]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredBlueprints = useMemo(() => {
    if (!normalizedQuery) return selectedTrack.blueprints;
    return selectedTrack.blueprints.filter(
      (bp) =>
        bp.title.toLowerCase().includes(normalizedQuery) ||
        bp.summary.toLowerCase().includes(normalizedQuery) ||
        bp.content.toLowerCase().includes(normalizedQuery)
    );
  }, [selectedTrack.blueprints, normalizedQuery]);

  const filteredLinks = useMemo(() => {
    if (!normalizedQuery) return curatedLinks;
    return curatedLinks.filter(
      (link) =>
        link.title.toLowerCase().includes(normalizedQuery) ||
        link.category.toLowerCase().includes(normalizedQuery) ||
        link.description.toLowerCase().includes(normalizedQuery)
    );
  }, [curatedLinks, normalizedQuery]);

  const showPdfSection = typeFilter === 'all' || typeFilter === 'pdf';
  const showTemplatesSection =
    typeFilter === 'all' || typeFilter === 'templates';
  const showLinksSection = typeFilter === 'all' || typeFilter === 'links';

  const announceDownload = (msg: string) => {
    setDownloadStatus(msg);
    window.setTimeout(() => {
      setDownloadStatus((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const handleDownloadBlueprint = (bp: BlueprintTemplate) => {
    const ext = bp.format === 'json' ? 'json' : 'txt';
    const mime = bp.format === 'json' ? 'application/json' : 'text/plain';
    downloadTextOrJsonFile(`pgl03-${bp.id}.${ext}`, bp.content, mime);
    announceDownload(`Downloaded pgl03-${bp.id}.${ext}`);
  };

  const handleCopyBlueprint = async (bp: BlueprintTemplate) => {
    try {
      await navigator.clipboard.writeText(bp.content);
      setCopiedId(bp.id);
      window.setTimeout(() => {
        setCopiedId((curr) => (curr === bp.id ? null : curr));
      }, 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const toggleExpandBlueprint = (id: string) => {
    setExpandedBlueprintIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="resources"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <FolderKanban className="h-4 w-4" />
            <span>Resource Vault · Templates, PDFs &amp; Verified Links</span>
            <QuickTip
              title="Offline Packs & Real Docs"
              tip="Download a live PDF synced with your checked boxes, or grab a blank printable PDF. All templates export directly as .json or .txt files for immediate use."
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            Track Resource Vault &amp; Offline Playbooks
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            Access downloadable workflow templates, multi-page PDF execution checklists, and official monetization portals tailored to each income track.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {downloadStatus && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              <span>{downloadStatus}</span>
            </span>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter templates or links..."
              className="w-56 rounded-lg border border-zinc-800 bg-zinc-950 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Track Switcher + Resource Type Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DEPARTMENT_TRACKS.map((track) => {
            const active = track.id === selectedTrack.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onSelectTrack(track)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'border border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {track.shortName}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1 self-start xl:self-auto">
          {(
            [
              { id: 'all', label: 'All Resources' },
              { id: 'pdf', label: 'PDF Checklists' },
              { id: 'templates', label: `Templates (${selectedTrack.blueprints.length})` },
              { id: 'links', label: `Links (${curatedLinks.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                typeFilter === tab.id
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. PDF Checklists & Study Pack */}
      {showPdfSection && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span className="font-semibold text-blue-400 inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  PDF Execution Pack
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums text-zinc-300">
                  {trackStats.doneChecklist}/{trackStats.totalChecklist} SOP tasks
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums text-zinc-300">
                  {trackStats.doneWeekly}/{trackStats.totalWeekly} weekly tasks
                </span>
              </div>

              <h3 className="text-lg font-bold text-zinc-50 font-display">
                {selectedTrack.shortName} Complete SOP &amp; 4-Week Milestone Checklist (.pdf)
              </h3>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Includes all {selectedTrack.steps.length} execution steps, deliverables, 4-week milestone tasks, eligibility benchmarks, policy alerts, and official documentation links formatted as a multi-page printable PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  downloadTrackChecklistPdf(
                    selectedTrack,
                    completedChecklistIds,
                    completedWeeklyTaskIds
                  );
                  announceDownload(
                    `Generated pgl03-${selectedTrack.id}-sop-checklist.pdf`
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Synced PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  downloadTrackChecklistPdf(selectedTrack, [], []);
                  announceDownload(
                    `Generated blank pgl03-${selectedTrack.id}-sop-checklist.pdf`
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Blank Printable PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const content = buildTrackOfflineTextPack(selectedTrack);
                  downloadTextOrJsonFile(
                    `pgl03-${selectedTrack.id}-full-playbook.txt`,
                    content,
                    'text/plain'
                  );
                  announceDownload(
                    `Downloaded pgl03-${selectedTrack.id}-full-playbook.txt`
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Full Study Pack (.txt)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Downloadable Templates */}
      {showTemplatesSection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-blue-400" />
              <span>
                Downloadable Blueprints &amp; Templates for {selectedTrack.shortName}
              </span>
              <QuickTip
                title="Ready-to-Import Templates"
                tip="JSON files import straight into n8n or workflow tools, while TXT blueprints give you copy-ready scripts, outreach pitches, and video structures."
              />
            </h3>
            <span className="text-xs font-mono text-zinc-400 tabular-nums">
              {filteredBlueprints.length} template
              {filteredBlueprints.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredBlueprints.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-xs text-zinc-400">
              No templates matched "{searchQuery}" in {selectedTrack.shortName}.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredBlueprints.map((bp) => {
                const isExpanded = expandedBlueprintIds.includes(bp.id);
                const isCopied = copiedId === bp.id;
                const ext = bp.format === 'json' ? 'json' : 'txt';

                return (
                  <div
                    key={bp.id}
                    className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-mono text-blue-400">
                            {ext.toUpperCase()} Template · {selectedTrack.shortName}
                          </div>
                          <h4 className="text-base font-bold text-zinc-50 font-display">
                            {bp.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyBlueprint(bp)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadBlueprint(bp)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>.{ext}</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {bp.summary}
                      </p>

                      <pre
                        className={`overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 text-[11px] font-mono text-zinc-300 leading-relaxed ${
                          isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-28 overflow-hidden'
                        }`}
                      >
                        {bp.content}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
                      <span className="font-mono text-zinc-500 tabular-nums">
                        {bp.content.split('\n').length} lines
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpandBlueprint(bp.id)}
                        className="inline-flex items-center gap-1 font-semibold text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
                      >
                        {isExpanded ? (
                          <>
                            <span>Collapse Preview</span>
                            <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Expand Full Template</span>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Curated Official Links */}
      {showLinksSection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-400" />
              <span>
                Curated Official Links &amp; Tools for {selectedTrack.shortName}
              </span>
            </h3>
            <span className="text-xs font-mono text-zinc-400 tabular-nums">
              {filteredLinks.length} verified link
              {filteredLinks.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredLinks.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-xs text-zinc-400">
              No curated links matched "{searchQuery}" in {selectedTrack.shortName}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredLinks.map((link) => {
                let hostname = link.url;
                try {
                  hostname = new URL(link.url).hostname.replace(/^www\./, '');
                } catch {
                  // fallback
                }

                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-blue-500/70 transition-colors space-y-2.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-emerald-400">
                          {link.category} · {hostname}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-400 transition-colors shrink-0" />
                      </div>
                      <h4 className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">
                        {link.title}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {link.description}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
