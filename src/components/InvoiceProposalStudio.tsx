import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Plus, Trash2 } from 'lucide-react';
import type { DepartmentTrack } from '../data/departments';
import { useUiLanguage } from '../context/LanguageContext';
import {
  downloadClientInvoicePdf,
  downloadClientProposalPdf,
  type InvoiceLineItem,
} from '../utils/clientPdf';

interface InvoiceProposalStudioProps {
  selectedTrack: DepartmentTrack;
}

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function InvoiceProposalStudio({
  selectedTrack,
}: InvoiceProposalStudioProps) {
  const { t, uiLanguage } = useUiLanguage();
  const [mode, setMode] = useState<'invoice' | 'proposal'>('invoice');

  // Invoice fields
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${new Date().getFullYear()}-001`
  );
  const [issueDate, setIssueDate] = useState(getTodayIso);
  const [dueDate, setDueDate] = useState(getTodayIso);
  const [senderName, setSenderName] = useState('ArYan JAN BaLocH Studio');
  const [senderContact, setSenderContact] = useState('payments@pgl03-studio.com');
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [fxRate, setFxRate] = useState('278');
  const [paymentInstructions, setPaymentInstructions] = useState(
    'Payoneer USD Receiving Account / Wise Transfer / Local IBFT upon milestone approval.'
  );
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      description: `${selectedTrack.shortName} Execution & Deliverable Sprint`,
      qty: 1,
      unitPriceUsd: 250,
    },
  ]);

  // Proposal fields
  const [proposalNumber, setProposalNumber] = useState(
    `PROP-${new Date().getFullYear()}-01`
  );
  const [propClientName, setPropClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState(
    `${selectedTrack.shortName} Growth & Monetization Retainer`
  );
  const [scopeSummary, setScopeSummary] = useState(selectedTrack.summary);
  const [deliverablesText, setDeliverablesText] = useState(() =>
    selectedTrack.steps
      .slice(0, 4)
      .map((s) => `${s.title} — ${s.deliverable}`)
      .join('\n')
  );
  const [timeline, setTimeline] = useState('14 Days · 2 Milestone Checkpoints');
  const [totalUsd, setTotalUsd] = useState('450');
  const [paymentTerms, setPaymentTerms] = useState(
    '50% Upfront Deposit · 50% Upon Final Handoff & Loom Walkthrough'
  );

  const invoiceSubtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.qty) * Math.max(0, item.unitPriceUsd),
    0
  );

  const handleLoadTrackDefaults = () => {
    setProjectTitle(`${selectedTrack.shortName} Production & Retainer Package`);
    setScopeSummary(selectedTrack.summary);
    setDeliverablesText(
      selectedTrack.steps
        .slice(0, 4)
        .map((s) => `${s.title} — ${s.deliverable}`)
        .join('\n')
    );
  };

  const handleDownloadInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || items.length === 0) return;
    downloadClientInvoicePdf({
      invoiceNumber: invoiceNumber.trim() || 'INV-001',
      issueDate,
      dueDate,
      senderName: senderName.trim() || 'Freelancer',
      senderEmailOrContact: senderContact.trim() || 'Direct',
      clientName: clientName.trim(),
      clientCompany: clientCompany.trim(),
      items: items.filter((i) => i.description.trim()),
      paymentInstructions: paymentInstructions.trim(),
      fxRate: Number(fxRate) || 278,
    });
  };

  const handleDownloadProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propClientName.trim() || !projectTitle.trim()) return;
    const deliverables = deliverablesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    downloadClientProposalPdf({
      proposalNumber: proposalNumber.trim() || 'PROP-01',
      date: issueDate,
      senderName: senderName.trim() || 'Freelancer',
      clientName: propClientName.trim(),
      projectTitle: projectTitle.trim(),
      trackLabel: selectedTrack.shortName,
      scopeSummary: scopeSummary.trim(),
      deliverables: deliverables.length > 0 ? deliverables : [selectedTrack.earningModel],
      timeline: timeline.trim(),
      totalUsd: Number(totalUsd) || 0,
      paymentTerms: paymentTerms.trim(),
    });
  };

  return (
    <section
      id="invoices"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Client Billing &amp; Pitching · PDF Export</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            {t.invoicesHeading}
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            {uiLanguage === 'roman_urdu'
              ? 'Clients ko bhejne ke liye professional USD/PKR Invoice ya Project Proposal seedha PDF format mein banayein aur download karein.'
              : 'Generate client-ready USD/PKR invoices and scope proposals tailored to your active income track and download directly as clean PDFs.'}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setMode('invoice')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === 'invoice'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Client Invoice (.pdf)
          </button>
          <button
            type="button"
            onClick={() => setMode('proposal')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === 'proposal'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Project Proposal (.pdf)
          </button>
        </div>
      </div>

      {mode === 'invoice' ? (
        <form onSubmit={handleDownloadInvoice} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Your Name / Studio
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Client Full Name
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Client Company (Optional)
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="e.g. Apex Media LLC"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Invoice #
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                PKR FX Note Rate
              </label>
              <input
                type="number"
                value={fxRate}
                onChange={(e) => setFxRate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                Invoice Line Items
              </span>
              <button
                type="button"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    { description: '', qty: 1, unitPriceUsd: 100 },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center"
              >
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((row, i) =>
                        i === idx ? { ...row, description: e.target.value } : row
                      )
                    )
                  }
                  placeholder="Service deliverable description..."
                  className="col-span-12 sm:col-span-6 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((row, i) =>
                        i === idx ? { ...row, qty: Number(e.target.value) || 1 } : row
                      )
                    )
                  }
                  aria-label="Quantity"
                  className="col-span-4 sm:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPriceUsd}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((row, i) =>
                        i === idx
                          ? { ...row, unitPriceUsd: Number(e.target.value) || 0 }
                          : row
                      )
                    )
                  }
                  aria-label="Unit price USD"
                  className="col-span-6 sm:col-span-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={items.length <= 1}
                  onClick={() =>
                    setItems((prev) => prev.filter((_, i) => i !== idx))
                  }
                  aria-label="Remove item"
                  className="col-span-2 sm:col-span-1 flex justify-center rounded p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Payment Instructions (Payoneer / Wise / Bank)
              </label>
              <input
                type="text"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div>
                <div className="text-[11px] text-zinc-400">Invoice Total</div>
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  ${invoiceSubtotal.toLocaleString()} USD
                </div>
              </div>
              <button
                type="submit"
                disabled={!clientName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Invoice PDF</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleDownloadProposal} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs">
            <span className="text-zinc-300">
              Active Track Context:{' '}
              <strong className="text-blue-400">{selectedTrack.shortName}</strong>
            </span>
            <button
              type="button"
              onClick={handleLoadTrackDefaults}
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4"
            >
              Autofill Scope from {selectedTrack.shortName} Track
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Proposal #
              </label>
              <input
                type="text"
                value={proposalNumber}
                onChange={(e) => setProposalNumber(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Client Name / Brand
              </label>
              <input
                type="text"
                required
                value={propClientName}
                onChange={(e) => setPropClientName(e.target.value)}
                placeholder="e.g. Mark Reynolds · GrowthCo"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Total Quote (USD)
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalUsd}
                onChange={(e) => setTotalUsd(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-300">
              Project Title
            </label>
            <input
              type="text"
              required
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Project Scope Summary
              </label>
              <textarea
                rows={4}
                value={scopeSummary}
                onChange={(e) => setScopeSummary(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Deliverables (One Per Line)
              </label>
              <textarea
                rows={4}
                value={deliverablesText}
                onChange={(e) => setDeliverablesText(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Timeline &amp; Payment Terms
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!propClientName.trim() || !projectTitle.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-40"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Download Proposal PDF</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
