import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CourseStep, DepartmentTrack } from '../data/departments';

interface StepVideoWalkthroughProps {
  department: DepartmentTrack;
  activeStep: CourseStep;
  onSelectStep: (step: CourseStep) => void;
}

const SCENE_DURATION_MS = 9000;

export function StepVideoWalkthrough({
  department,
  activeStep,
  onSelectStep,
}: StepVideoWalkthroughProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 1 within active step

  const activeIndex = Math.max(
    0,
    department.steps.findIndex((s) => s.id === activeStep.id)
  );
  const totalSteps = department.steps.length;

  // Speak step narration when voiceEnabled and playing
  useEffect(() => {
    if (!voiceEnabled || !isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Step ${activeStep.stepNumber}: ${activeStep.title}. ${activeStep.objective}. ${activeStep.instructions}`
      );
      utterance.rate = 1.02;
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeStep, isPlaying, voiceEnabled]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      setSceneProgress((prev) => {
        const next = prev + delta / SCENE_DURATION_MS;
        if (next >= 1) {
          if (activeIndex < totalSteps - 1) {
            onSelectStep(department.steps[activeIndex + 1]);
            return 0;
          }
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, activeIndex, totalSteps, department.steps, onSelectStep]);

  // Render animated instructional frame on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark studio canvas background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Subtle structural grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top bar inside video frame
    ctx.fillStyle = '#111114';
    ctx.fillRect(28, 24, w - 56, 44);
    ctx.strokeStyle = '#27272a';
    ctx.strokeRect(28, 24, w - 56, 44);

    ctx.fillStyle = '#60a5fa';
    ctx.font = '600 13px "IBM Plex Mono", monospace';
    ctx.fillText(
      `#PGL.03 VIDEO GUIDE  ·  ${department.shortName.toUpperCase()}  ·  STEP ${activeStep.stepNumber} OF 0${totalSteps}`,
      46,
      51
    );

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 12px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(activeStep.duration, w - 46, 51);
    ctx.textAlign = 'left';

    // Step Headline
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 28px "Bricolage Grotesque", sans-serif';
    ctx.fillText(activeStep.title, 32, 114, w - 64);

    // Objective Subtitle
    ctx.fillStyle = '#93c5fd';
    ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Goal: ${activeStep.objective}`, 32, 144, w - 64);

    // Left Box: Step Action Flow Diagram
    ctx.fillStyle = '#141418';
    ctx.fillRect(32, 170, 520, 224);
    ctx.strokeStyle = '#27272a';
    ctx.strokeRect(32, 170, 520, 224);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillText('ACTION CHECKLIST EXECUTION', 52, 198);

    // Animated sequential checklist highlight based on sceneProgress
    activeStep.checklist.forEach((item, idx) => {
      const y = 224 + idx * 54;
      const threshold = idx / Math.max(1, activeStep.checklist.length);
      const isHighlighted = sceneProgress >= threshold || !isPlaying;

      ctx.fillStyle = isHighlighted ? '#1e293b' : '#0f0f13';
      ctx.fillRect(50, y, 484, 42);
      ctx.strokeStyle = isHighlighted ? '#3b82f6' : '#27272a';
      ctx.strokeRect(50, y, 484, 42);

      ctx.fillStyle = isHighlighted ? '#34d399' : '#71717a';
      ctx.font = '700 13px "IBM Plex Mono", monospace';
      ctx.fillText(isHighlighted ? '[OK]' : '[  ]', 64, y + 26);

      ctx.fillStyle = isHighlighted ? '#f4f4f5' : '#a1a1aa';
      ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
      const clipped =
        item.length > 56 ? `${item.slice(0, 54)}...` : item;
      ctx.fillText(clipped, 108, y + 26);
    });

    // Right Box: Deliverable & Key Method
    ctx.fillStyle = '#141418';
    ctx.fillRect(572, 170, w - 604, 224);
    ctx.strokeStyle = '#27272a';
    ctx.strokeRect(572, 170, w - 604, 224);

    ctx.fillStyle = '#60a5fa';
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillText('HOW TO EXECUTE', 592, 198);

    // Wrap instructions cleanly inside right box
    ctx.fillStyle = '#d4d4d8';
    ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    const words = activeStep.instructions.split(' ');
    let line = '';
    let lineY = 228;
    const maxLineWidth = w - 644;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxLineWidth) {
        ctx.fillText(line, 592, lineY);
        line = word;
        lineY += 20;
        if (lineY > 330) {
          line = `${line}...`;
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (line && lineY <= 345) {
      ctx.fillText(line, 592, lineY);
    }

    // Deliverable Footer Strip inside right card
    ctx.fillStyle = '#09090b';
    ctx.fillRect(592, 344, w - 644, 34);
    ctx.strokeStyle = '#2563eb';
    ctx.strokeRect(592, 344, w - 644, 34);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.fillText(`DELIVERABLE: ${activeStep.deliverable}`, 604, 365, w - 668);

    // Bottom Timeline Bar inside canvas
    ctx.fillStyle = '#18181b';
    ctx.fillRect(32, h - 30, w - 64, 6);
    const overallProgress =
      (activeIndex + sceneProgress) / Math.max(1, totalSteps);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(32, h - 30, (w - 64) * Math.min(1, overallProgress), 6);
  }, [department.shortName, activeStep, activeIndex, totalSteps, sceneProgress, isPlaying]);

  const handleTogglePlay = () => {
    if (!isPlaying && sceneProgress >= 1 && activeIndex === totalSteps - 1) {
      onSelectStep(department.steps[0]);
      setSceneProgress(0);
    }
    setIsPlaying((p) => !p);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setSceneProgress(0);
    onSelectStep(department.steps[0]);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <canvas
          ref={canvasRef}
          width={960}
          height={440}
          className="w-full h-auto block"
        />

        {/* Video Transport Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause Guide</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Play Step Walkthrough</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restart</span>
            </button>

            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                voiceEnabled
                  ? 'border-blue-500 bg-blue-950/60 text-blue-300'
                  : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {voiceEnabled ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              <span>{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
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
      </div>

      {/* Chapter Scrubbing Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {department.steps.map((step) => {
          const active = step.id === activeStep.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setSceneProgress(0);
                onSelectStep(step);
              }}
              className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                active
                  ? 'border-blue-500 bg-blue-950/40 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="font-mono text-[11px] font-semibold text-blue-400 tabular-nums">
                Scene {step.stepNumber}
              </div>
              <div className="text-xs font-medium truncate mt-0.5">
                {step.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
