import { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5 text-blue-400" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Smartphone className="h-3.5 w-3.5 text-blue-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-zinc-50 font-display">
                  Install #PGL.03 on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close iOS install guide"
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="space-y-2 text-xs text-zinc-300 leading-relaxed list-decimal list-inside">
                <li>
                  Tap the <strong className="text-white">Share</strong> button in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap{' '}
                  <strong className="text-white">Add to Home Screen</strong>.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-amber-300 shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
      <span>Offline Mode · Cached playbooks &amp; local ledger active</span>
    </div>
  );
}
