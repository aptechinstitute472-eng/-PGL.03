import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Landmark,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  WITHDRAWALS_STORAGE_KEY,
  useCloudSync,
  type CloudWithdrawalItem,
} from '../context/CloudSyncContext';
import { useUiLanguage } from '../context/LanguageContext';
import {
  EARNINGS_LEDGER_STORAGE_KEY,
  type EarningsLedgerEntry,
} from './EarningsLedger';
import { QuickTip } from './QuickTip';

type WithdrawalMethod = CloudWithdrawalItem['method'];

const METHODS: WithdrawalMethod[] = [
  'Payoneer',
  'Wise',
  'Local Bank (IBFT)',
  'JazzCash / Easypaisa',
  'Upwork / Fiverr Direct',
];

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readLedgerUsdSum(): number {
  try {
    const raw = localStorage.getItem(EARNINGS_LEDGER_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return 0;
    return (
      Math.round(
        (parsed as EarningsLedgerEntry[]).reduce(
          (sum, e) => sum + (Number(e.amountUsd) || 0),
          0
        ) * 100
      ) / 100
    );
  } catch {
    return 0;
  }
}

export function PayoutWithdrawalTracker() {
  const { t, uiLanguage } = useUiLanguage();
  const {
    saveWithdrawalCloud,
    markWithdrawalClearedCloud,
    deleteWithdrawalCloud,
  } = useCloudSync();

  const [withdrawals, setWithdrawals] = useState<CloudWithdrawalItem[]>(() => {
    try {
      const raw = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) return parsed as CloudWithdrawalItem[];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [ledgerTotalUsd, setLedgerTotalUsd] = useState<number>(() =>
    readLedgerUsdSum()
  );

  const [method, setMethod] = useState<WithdrawalMethod>('Payoneer');
  const [platformSource, setPlatformSource] = useState('Upwork');
  const [grossUsd, setGrossUsd] = useState('');
  const [feeUsd, setFeeUsd] = useState('2.00');
  const [fxRate, setFxRate] = useState('278');
  const [status, setStatus] = useState<'Pending' | 'Cleared'>('Cleared');
  const [date, setDate] = useState(getTodayIso);
  const [referenceNote, setReferenceNote] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | WithdrawalMethod>(
    'all'
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        WITHDRAWALS_STORAGE_KEY,
        JSON.stringify(withdrawals)
      );
    } catch {
      // ignore
    }
  }, [withdrawals]);

  useEffect(() => {
    const syncAll = () => {
      setLedgerTotalUsd(readLedgerUsdSum());
      try {
        const raw = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) setWithdrawals(parsed as CloudWithdrawalItem[]);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', syncAll);
    window.addEventListener('pgl03-ledger-updated', syncAll);
    window.addEventListener('pgl03-withdrawals-updated', syncAll);
    window.addEventListener('pgl03-cloud-hydrated', syncAll);
    return () => {
      window.removeEventListener('storage', syncAll);
      window.removeEventListener('pgl03-ledger-updated', syncAll);
      window.removeEventListener('pgl03-withdrawals-updated', syncAll);
      window.removeEventListener('pgl03-cloud-hydrated', syncAll);
    };
  }, []);

  const summary = useMemo(() => {
    const cleared = withdrawals.filter((w) => w.status === 'Cleared');
    const pending = withdrawals.filter((w) => w.status === 'Pending');
    const clearedNetUsd = cleared.reduce(
      (s, w) => s + Math.max(0, w.grossUsd - w.feeUsd),
      0
    );
    const clearedNetPkr = cleared.reduce((s, w) => s + w.netPkr, 0);
    const pendingUsd = pending.reduce((s, w) => s + w.grossUsd, 0);
    const totalFeesUsd = withdrawals.reduce((s, w) => s + w.feeUsd, 0);
    const totalWithdrawnGrossUsd = withdrawals.reduce(
      (s, w) => s + w.grossUsd,
      0
    );
    const availableBalanceUsd = Math.max(
      0,
      Math.round((ledgerTotalUsd - totalWithdrawnGrossUsd) * 100) / 100
    );

    return {
      clearedNetUsd: Math.round(clearedNetUsd * 100) / 100,
      clearedNetPkr: Math.round(clearedNetPkr),
      pendingUsd: Math.round(pendingUsd * 100) / 100,
      totalFeesUsd: Math.round(totalFeesUsd * 100) / 100,
      availableBalanceUsd,
    };
  }, [withdrawals, ledgerTotalUsd]);

  const visibleWithdrawals = useMemo(() => {
    return withdrawals
      .filter((w) => methodFilter === 'all' || w.method === methodFilter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [withdrawals, methodFilter]);

  const parsedGross = Number(grossUsd) || 0;
  const parsedFee = Math.max(0, Number(feeUsd) || 0);
  const parsedFx = Math.max(1, Number(fxRate) || 278);
  const previewNetUsd = Math.max(0, Math.round((parsedGross - parsedFee) * 100) / 100);
  const previewNetPkr = Math.round(previewNetUsd * parsedFx);

  const handleAddWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedGross <= 0) return;

    const item: CloudWithdrawalItem = {
      id: `wd_${Date.now()}`,
      method,
      platformSource: platformSource.trim() || 'Client / Platform',
      grossUsd: Math.round(parsedGross * 100) / 100,
      feeUsd: Math.min(parsedGross, Math.round(parsedFee * 100) / 100),
      fxRate: parsedFx,
      netPkr: previewNetPkr,
      status,
      date: date || getTodayIso(),
      referenceNote: referenceNote.trim(),
    };

    setWithdrawals((prev) => [item, ...prev]);
    void saveWithdrawalCloud(item);
    setGrossUsd('');
    setReferenceNote('');
  };

  const handleMarkCleared = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'Cleared' } : w))
    );
    void markWithdrawalClearedCloud(id);
  };

  const handleDelete = (id: string) => {
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));
    void deleteWithdrawalCloud(id);
  };

  const handleExportCsv = () => {
    if (visibleWithdrawals.length === 0) return;
    const headers = [
      'Date',
      'Method',
      'Source',
      'Gross_USD',
      'Fee_USD',
      'FX_Rate',
      'Net_PKR',
      'Status',
      'Reference',
    ];
    const lines = visibleWithdrawals.map((w) =>
      [
        w.date,
        `"${w.method}"`,
        `"${w.platformSource.replace(/"/g, '""')}"`,
        w.grossUsd.toFixed(2),
        w.feeUsd.toFixed(2),
        w.fxRate.toString(),
        w.netPkr.toString(),
        w.status,
        `"${w.referenceNote.replace(/"/g, '""')}"`,
      ].join(',')
    );
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgl03-withdrawals-${getTodayIso()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="withdrawals"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Landmark className="h-4 w-4" />
            <span>Payout Withdrawal Tracker · Payoneer, Wise &amp; Bank</span>
            <QuickTip
              title="Real Net PKR & Fee Tracking"
              tip="Track actual fees and exchange rates from Upwork, AdSense, Payoneer, or Wise into your Pakistani bank or wallet so you know your exact take-home PKR."
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            {t.withdrawalsHeading}
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            {uiLanguage === 'roman_urdu'
              ? 'Payoneer, Wise, IBFT bank transfer, ya JazzCash ke zariye nikali gayi rakam, fees, aur asal PKR rate ka mukammal hisab rakhein.'
              : 'Log transfers across Payoneer, Wise, local banks, and mobile wallets—automatically calculating fees, net PKR received, and remaining ledger balance.'}
          </p>
        </div>

        <button
          type="button"
          disabled={visibleWithdrawals.length === 0}
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 self-start lg:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Withdrawals CSV</span>
        </button>
      </div>

      {/* 4-Column Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Cleared Net Received</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            Rs. {summary.clearedNetPkr.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            ${summary.clearedNetUsd.toLocaleString()} net USD
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Pending Clearance</div>
          <div className="mt-1 text-2xl font-bold text-amber-400 font-mono tabular-nums">
            ${summary.pendingUsd.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">In transit to bank</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Total Transfer Fees</div>
          <div className="mt-1 text-2xl font-bold text-zinc-100 font-mono tabular-nums">
            ${summary.totalFeesUsd.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">Platform &amp; FX deductions</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs text-zinc-400">Unwithdrawn Ledger Balance</div>
          <div className="mt-1 text-2xl font-bold text-blue-400 font-mono tabular-nums">
            ${summary.availableBalanceUsd.toLocaleString()}
          </div>
          <div className="mt-0.5 text-xs font-mono text-zinc-400 tabular-nums">
            Out of ${ledgerTotalUsd.toLocaleString()} logged
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleAddWithdrawal}
          className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-zinc-100 font-display border-b border-zinc-800 pb-3">
            Record Payout Withdrawal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="wd-method"
                className="block text-xs font-medium text-zinc-300"
              >
                Withdrawal Method
              </label>
              <select
                id="wd-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as WithdrawalMethod)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="wd-source"
                className="block text-xs font-medium text-zinc-300"
              >
                From Platform / Client
              </label>
              <input
                id="wd-source"
                type="text"
                required
                value={platformSource}
                onChange={(e) => setPlatformSource(e.target.value)}
                placeholder="e.g. Upwork, AdSense, Direct"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label
                htmlFor="wd-gross"
                className="block text-xs font-medium text-zinc-300"
              >
                Gross (USD)
              </label>
              <input
                id="wd-gross"
                type="number"
                min={1}
                step="0.01"
                required
                value={grossUsd}
                onChange={(e) => setGrossUsd(e.target.value)}
                placeholder="250"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="wd-fee"
                className="block text-xs font-medium text-zinc-300"
              >
                Fee (USD)
              </label>
              <input
                id="wd-fee"
                type="number"
                min={0}
                step="0.01"
                value={feeUsd}
                onChange={(e) => setFeeUsd(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="wd-fx"
                className="block text-xs font-medium text-zinc-300"
              >
                PKR Rate
              </label>
              <input
                id="wd-fx"
                type="number"
                min={1}
                step="0.1"
                value={fxRate}
                onChange={(e) => setFxRate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="wd-date"
                className="block text-xs font-medium text-zinc-300"
              >
                Date
              </label>
              <input
                id="wd-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="wd-status"
                className="block text-xs font-medium text-zinc-300"
              >
                Transfer Status
              </label>
              <select
                id="wd-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'Pending' | 'Cleared')
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="Cleared">Cleared (Received)</option>
                <option value="Pending">Pending Clearance</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="wd-ref"
              className="block text-xs font-medium text-zinc-300"
            >
              Reference ID / Bank Note (Optional)
            </label>
            <input
              id="wd-ref"
              type="text"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g. Meezan IBAN · Trx #88412"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs">
            <span className="text-zinc-400">Net Bank Deposit</span>
            <span className="font-mono font-semibold text-emerald-400 tabular-nums">
              ${previewNetUsd.toLocaleString()} · Rs. {previewNetPkr.toLocaleString()}
            </span>
          </div>

          <button
            type="submit"
            disabled={!grossUsd || parsedGross <= 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Withdrawal</span>
          </button>
        </form>

        <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-100 font-display">
              Withdrawal History
            </h3>
            <select
              aria-label="Filter withdrawals by method"
              value={methodFilter}
              onChange={(e) =>
                setMethodFilter(e.target.value as 'all' | WithdrawalMethod)
              }
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Methods</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {visibleWithdrawals.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <p className="text-sm font-semibold text-zinc-200">
                No withdrawals recorded yet
              </p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Log your Payoneer, Wise, or bank transfers on the left to track exact fees, PKR exchange rates, and clearance status.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 font-semibold">Method &amp; Source</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Gross</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Net PKR</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {visibleWithdrawals.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-mono text-zinc-300 tabular-nums whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">
                          {row.method}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {row.platformSource}
                          {row.referenceNote ? ` · ${row.referenceNote}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-zinc-200 tabular-nums whitespace-nowrap">
                        ${row.grossUsd.toLocaleString()}
                        <div className="text-[11px] text-zinc-500">
                          -${row.feeUsd} fee
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-right text-emerald-400 tabular-nums whitespace-nowrap">
                        Rs. {row.netPkr.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.status === 'Cleared' ? (
                          <span className="text-emerald-400 font-medium">
                            Cleared
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkCleared(row.id)}
                            className="inline-flex items-center gap-1 text-amber-400 hover:text-emerald-400 font-medium transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Mark Cleared</span>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          aria-label="Delete withdrawal record"
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
