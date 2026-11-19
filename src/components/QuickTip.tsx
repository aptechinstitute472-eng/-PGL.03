import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, Lightbulb } from 'lucide-react';

interface QuickTipProps {
  title: string;
  tip: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

interface TipCoords {
  top: number;
  left: number;
  placeBelow: boolean;
}

const TIP_WIDTH = 288;

export function QuickTip({
  title,
  tip,
  actionLabel,
  onAction,
  className = '',
}: QuickTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<TipCoords>({
    top: 0,
    left: 0,
    placeBelow: true,
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const tooltipId = useId();

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const placeBelow = rect.bottom + 170 < viewportH || rect.top < 170;
    const rawLeft = rect.left + rect.width / 2 - TIP_WIDTH / 2;
    const clampedLeft = Math.max(
      12,
      Math.min(viewportW - TIP_WIDTH - 12, rawLeft)
    );

    setCoords({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left: clampedLeft,
      placeBelow,
    });
  }, []);

  const openTip = () => {
    clearCloseTimer();
    updatePosition();
    setIsOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => updatePosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        triggerRef.current &&
        target &&
        !triggerRef.current.contains(target)
      ) {
        const popoverEl = document.getElementById(tooltipId);
        if (!popoverEl || !popoverEl.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, tooltipId, updatePosition]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Quick tip: ${title}`}
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        onMouseEnter={openTip}
        onMouseLeave={scheduleClose}
        onFocus={openTip}
        onBlur={scheduleClose}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            setIsOpen(false);
          } else {
            openTip();
          }
        }}
        className={`inline-flex items-center justify-center rounded p-0.5 text-zinc-500 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors shrink-0 ${className}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: TIP_WIDTH,
              transform: coords.placeBelow ? 'none' : 'translateY(-100%)',
              zIndex: 60,
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-3.5 shadow-2xl text-left"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
              <Lightbulb className="h-3.5 w-3.5 shrink-0" />
              <span>Quick Tip · {title}</span>
            </div>
            <p className="mt-1.5 text-xs text-zinc-200 leading-relaxed">
              {tip}
            </p>
            {actionLabel && onAction && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAction();
                  }}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
                >
                  {actionLabel}
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
