import { useRef, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Download,
  HardDriveUpload,
  RefreshCw,
  X,
} from 'lucide-react';
import { useCloudSync } from '../context/CloudSyncContext';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKUP_STORAGE_KEYS = [
  'aryan_ai_completed_checklists_v1',
  'pgl03_weekly_milestones_v1',
  'pgl03_earnings_ledger_v1',
  'pgl03_weekly_revenue_targets_v1',
  'pgl03_real_daily_insights_v1',
  'pgl03_daily_focus_v1',
  'pgl03_success_journal_v1',
  'pgl03_progression_badges_v1',
  'pgl03_withdrawals_v1',
  'pgl03_enrollments_v1',
  'pgl03_ui_language_v1',
] as const;

interface BackupPayload {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function BackupRestoreModal({
  isOpen,
  onClose,
}: BackupRestoreModalProps) {
  const { user, syncStatus, lastSyncedAt, triggerFullSync } = useCloudSync();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    setErrorMessage(null);
    const collected: Record<string, unknown> = {};
    let populatedCount = 0;

    for (const key of BACKUP_STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          populatedCount += 1;
          try {
            collected[key] = JSON.parse(raw);
          } catch {
            collected[key] = raw;
          }
        }
      } catch {
        // ignore read issue
      }
    }

    const payload: BackupPayload = {
      app: '#PGL.03 Earning Guide by ArYan JAN BaLocH',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: collected,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgl03-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatusMessage(
      `Exported ${populatedCount} workspace modules to JSON backup.`
    );
  };

  const handleFileImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setErrorMessage(null);
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<BackupPayload>;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.data ||
        typeof parsed.data !== 'object'
      ) {
        throw new Error(
          'Invalid backup format. Please select a #PGL.03 JSON backup file.'
        );
      }

      let restoredKeys = 0;
      for (const key of BACKUP_STORAGE_KEYS) {
        if (key in parsed.data && parsed.data[key] !== undefined) {
          const val = parsed.data[key];
          localStorage.setItem(
            key,
            typeof val === 'string' ? val : JSON.stringify(val)
          );
          restoredKeys += 1;
        }
      }

      if (restoredKeys === 0) {
        throw new Error('No recognized workspace keys found in this JSON file.');
      }

      window.dispatchEvent(new Event('pgl03-cloud-hydrated'));
      window.dispatchEvent(new Event('pgl03-ledger-updated'));
      window.dispatchEvent(new Event('pgl03-withdrawals-updated'));
      window.dispatchEvent(new Event('pgl03-journal-updated'));
      window.dispatchEvent(new Event('pgl03-enrollments-updated'));
      window.dispatchEvent(new Event('pgl03-insights-updated'));
      window.dispatchEvent(new Event('pgl03-targets-updated'));
      window.dispatchEvent(new Event('pgl03-ui-language-updated'));

      if (user) {
        await triggerFullSync();
      }

      setStatusMessage(
        `Restored ${restoredKeys} workspace modules successfully${
          user ? ' and synced to cloud' : ''
        }.`
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to restore JSON backup.'
      );
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="text-xs font-semibold text-blue-400">
              Data Portability &amp; Cloud Sync
            </div>
            <h3
              id="backup-modal-title"
              className="text-lg font-bold text-zinc-50 font-display mt-0.5"
            >
              Full Progress Backup &amp; Restore (JSON)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close backup modal"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-zinc-300 inline-flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 text-blue-400" />
              Cloud Account Status
            </span>
            <span className="font-mono text-zinc-200">
              {user
                ? `${user.email ?? 'Signed In'} · ${syncStatus}`
                : 'Local Browser Only'}
            </span>
          </div>
          {user && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-zinc-500">
                {lastSyncedAt
                  ? `Last synced at ${lastSyncedAt}`
                  : 'Connected to Firestore'}
              </span>
              <button
                type="button"
                onClick={() => void triggerFullSync()}
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Sync Now</span>
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Export a single <span className="font-mono text-zinc-100">.json</span>{' '}
          archive containing your checklists, 4-week milestones, Earnings Ledger, Payoneer/Wise withdrawals, Success Journal, Badges, and Daily Focus tasks—or restore from a previous backup.
        </p>

        {statusMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Full JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <HardDriveUpload className="h-3.5 w-3.5" />
            <span>Restore from JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => void handleFileImport(e)}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
