import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  TEMPLATE_IMAGE_PRESETS,
  type DepartmentTrack,
} from '../data/departments';
import type { LanguageMode } from './MentorPanel';

interface GeneratedKit {
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
  thumbnailHeadline: string;
  thumbnailSubtext: string;
  policyCheckNotes: string;
}

type CanvasFormat = '16:9' | '4:5' | '9:16';

const FORMAT_DIMENSIONS: Record<CanvasFormat, { w: number; h: number; label: string }> = {
  '16:9': { w: 1280, h: 720, label: '16:9 YouTube Thumbnail' },
  '4:5': { w: 1080, h: 1350, label: '4:5 Facebook / IG Post' },
  '9:16': { w: 1080, h: 1920, label: '9:16 Reels / TikTok Cover' },
};

const ACCENT_HEX: Record<string, string> = {
  Blue: '#3b82f6',
  Amber: '#f59e0b',
  Emerald: '#10b981',
  Crimson: '#ef4444',
};

interface ContentTemplateStudioProps {
  department: DepartmentTrack;
  languageMode: LanguageMode;
}

export function ContentTemplateStudio({
  department,
  languageMode,
}: ContentTemplateStudioProps) {
  const [topic, setTopic] = useState(
    `${department.shortName} monetization step-by-step guide`
  );
  const [format, setFormat] = useState<CanvasFormat>(
    department.id === 'facebook' || department.id === 'instagram'
      ? '4:5'
      : department.id === 'tiktok'
      ? '9:16'
      : '16:9'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatedKit, setGeneratedKit] = useState<GeneratedKit | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Image Template Editor State
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(
    department.exampleTemplateImage
  );
  const [headlineText, setHeadlineText] = useState('ZERO TO MONETIZED');
  const [subtext, setSubtext] = useState(
    `${department.shortName} Step-by-Step Guide`
  );
  const [brandWatermark, setBrandWatermark] = useState('#PGL.03 · ArYan JAN BaLocH');
  const [accentColorName, setAccentColorName] = useState<string>('Blue');
  const [scrimOpacity, setScrimOpacity] = useState<number>(0.72);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    setSelectedPresetUrl(department.exampleTemplateImage);
    setSubtext(`${department.shortName} Step-by-Step Guide`);
    setTopic(`${department.shortName} monetization step-by-step guide`);
  }, [department.id, department.exampleTemplateImage, department.shortName]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLoadedImg(img);
    img.onerror = () => setLoadedImg(null);
    img.src = selectedPresetUrl;
  }, [selectedPresetUrl]);

  // Draw live editable graphic template onto HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dims = FORMAT_DIMENSIONS[format];
    canvas.width = dims.w;
    canvas.height = dims.h;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, dims.w, dims.h);

    if (loadedImg) {
      // Cover-fit image
      const scale = Math.max(
        dims.w / loadedImg.width,
        dims.h / loadedImg.height
      );
      const drawW = loadedImg.width * scale;
      const drawH = loadedImg.height * scale;
      const dx = (dims.w - drawW) / 2;
      const dy = (dims.h - drawH) / 2;
      ctx.drawImage(loadedImg, dx, dy, drawW, drawH);
    }

    // Contrast gradient scrim
    const grad = ctx.createLinearGradient(0, dims.h * 0.25, 0, dims.h);
    grad.addColorStop(0, `rgba(9, 9, 11, ${Math.max(0.15, scrimOpacity * 0.35)})`);
    grad.addColorStop(1, `rgba(9, 9, 11, ${Math.min(0.95, scrimOpacity + 0.15)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, dims.w, dims.h);

    const accentHex = ACCENT_HEX[accentColorName] ?? '#3b82f6';
    const pad = Math.round(dims.w * 0.065);

    // Top brand watermark
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `600 ${Math.round(dims.w * 0.022)}px "IBM Plex Mono", monospace`;
    ctx.fillText(brandWatermark, pad, pad + 18);

    // Accent bar above headline
    const baseY = dims.h - pad * 1.4;
    ctx.fillStyle = accentHex;
    ctx.fillRect(pad, baseY - Math.round(dims.w * 0.16), 96, 8);

    // Editable Headline
    ctx.fillStyle = '#ffffff';
    const headFontSize =
      format === '16:9'
        ? Math.round(dims.w * 0.062)
        : Math.round(dims.w * 0.072);
    ctx.font = `700 ${headFontSize}px "Bricolage Grotesque", sans-serif`;

    const words = headlineText.toUpperCase().split(' ');
    const lines: string[] = [];
    let current = '';
    const maxW = dims.w - pad * 2;
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > maxW && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    const visibleLines = lines.slice(0, 3);
    const lineHeight = Math.round(headFontSize * 1.08);
    const startHeadY =
      baseY - Math.round(dims.w * 0.05) - (visibleLines.length - 1) * lineHeight;

    visibleLines.forEach((l, i) => {
      ctx.fillText(l, pad, startHeadY + i * lineHeight, maxW);
    });

    // Subtext
    ctx.fillStyle = '#e4e4e7';
    const subFontSize = Math.round(dims.w * 0.028);
    ctx.font = `500 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(subtext, pad, baseY + 10, maxW);
  }, [
    format,
    loadedImg,
    headlineText,
    subtext,
    brandWatermark,
    accentColorName,
    scrimOpacity,
  ]);

  const handleGenerateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: department.id,
          trackTitle: department.title,
          topic: topic.trim(),
          languageMode,
          targetFormat: FORMAT_DIMENSIONS[format].label,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as GeneratedKit & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      setGeneratedKit(data);
      if (data.thumbnailHeadline) {
        setHeadlineText(data.thumbnailHeadline);
      }
      if (data.thumbnailSubtext) {
        setSubtext(data.thumbnailSubtext);
      }
    } catch (err: unknown) {
      setGenError(
        err instanceof Error ? err.message : 'Could not generate content kit.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pgl03-${department.id}-${format.replace(':', 'x')}.png`;
    link.href = url;
    link.click();
  };

  const handleCopyFullScript = async () => {
    if (!generatedKit) return;
    const text = [
      `HOOK: ${generatedKit.hook}`,
      `\nSCRIPT:\n${generatedKit.script}`,
      `\nCAPTION:\n${generatedKit.caption}`,
      `\nHASHTAGS: ${generatedKit.hashtags.join(' ')}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Reference Visual Example Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 items-center">
        <div className="md:col-span-5 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <img
            src={department.exampleTemplateImage}
            alt={department.exampleTemplateCaption}
            referrerPolicy="no-referrer"
            className="h-36 w-full object-cover"
          />
        </div>
        <div className="md:col-span-7 space-y-1.5">
          <div className="text-xs font-semibold text-blue-400">
            Example Production Reference · {department.shortName}
          </div>
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
            {department.exampleTemplateCaption}
          </p>
          <p className="text-xs text-zinc-400">
            Generate your complete script and post copy below, then customize and download the edited image template directly as a PNG.
          </p>
        </div>
      </div>

      {/* AI Content Kit Generator Form */}
      <form
        onSubmit={handleGenerateKit}
        className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span>AI Content Kit Generator (Hook + Script + Caption + Thumbnail Copy)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={`Enter your ${department.shortName} topic or client niche...`}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Full Kit</span>
              </>
            )}
          </button>
        </div>

        {genError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/40 p-3 text-xs text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{genError}</span>
          </div>
        )}
      </form>

      {/* AI Generated Script & Copy Output */}
      {generatedKit && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <h4 className="text-sm font-semibold text-zinc-50 font-display">
              Generated Content Kit ({FORMAT_DIMENSIONS[format].label})
            </h4>
            <button
              type="button"
              onClick={handleCopyFullScript}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
            >
              {copiedScript ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied All</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Script &amp; Caption</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <div className="font-semibold text-blue-400 mb-1">
                3-Second Hook
              </div>
              <p className="text-zinc-100 font-medium">{generatedKit.hook}</p>
            </div>

            <div>
              <div className="font-semibold text-blue-400 mb-1">
                Step-by-Step Script
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900 p-3 font-sans text-xs text-zinc-200 leading-relaxed">
                {generatedKit.script}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-blue-400 mb-1">
                  Post Caption &amp; CTA
                </div>
                <p className="text-zinc-300 whitespace-pre-wrap">
                  {generatedKit.caption}
                </p>
                <p className="mt-2 font-mono text-zinc-400">
                  {generatedKit.hashtags.join(' ')}
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                <div className="font-semibold text-amber-300 mb-1">
                  Monetization Safety Note
                </div>
                <p className="text-amber-100/90">
                  {generatedKit.policyCheckNotes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Image Template Editor */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-50 font-display">
            <ImageIcon className="h-4 w-4 text-blue-400" />
            <span>Editable Visual Template &amp; Thumbnail Studio</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Edited PNG</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Template Background Image
              </label>
              <select
                value={selectedPresetUrl}
                onChange={(e) => setSelectedPresetUrl(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                {TEMPLATE_IMAGE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Export Aspect Format
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(FORMAT_DIMENSIONS) as CanvasFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`rounded-md border px-2 py-1.5 text-xs font-mono font-medium transition-colors ${
                      format === f
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="tpl-headline"
                className="block text-xs font-medium text-zinc-300"
              >
                Headline Text
              </label>
              <input
                id="tpl-headline"
                type="text"
                value={headlineText}
                onChange={(e) => setHeadlineText(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="tpl-subtext"
                className="block text-xs font-medium text-zinc-300"
              >
                Subheadline Text
              </label>
              <input
                id="tpl-subtext"
                type="text"
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="tpl-brand"
                className="block text-xs font-medium text-zinc-300"
              >
                Top Brand Label
              </label>
              <input
                id="tpl-brand"
                type="text"
                value={brandWatermark}
                onChange={(e) => setBrandWatermark(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Accent Bar Color
                </label>
                <select
                  value={accentColorName}
                  onChange={(e) => setAccentColorName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                >
                  {Object.keys(ACCENT_HEX).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <label htmlFor="tpl-scrim">Darkness</label>
                  <span className="font-mono tabular-nums">
                    {Math.round(scrimOpacity * 100)}%
                  </span>
                </div>
                <input
                  id="tpl-scrim"
                  type="range"
                  min={0.3}
                  max={0.9}
                  step={0.05}
                  value={scrimOpacity}
                  onChange={(e) => setScrimOpacity(Number(e.target.value))}
                  className="w-full accent-blue-500 mt-2"
                />
              </div>
            </div>
          </div>

          {/* Live Canvas Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <canvas
              ref={canvasRef}
              className="max-h-[420px] w-auto max-w-full rounded-lg border border-zinc-800"
            />
            <p className="text-[11px] font-mono text-zinc-400 mt-2">
              Output: {FORMAT_DIMENSIONS[format].w} × {FORMAT_DIMENSIONS[format].h} px PNG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
