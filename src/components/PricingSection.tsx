import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  X,
} from 'lucide-react';
import {
  ENROLLMENTS_STORAGE_KEY,
  useCloudSync,
  type CloudEnrollmentItem,
} from '../context/CloudSyncContext';
import { useUiLanguage } from '../context/LanguageContext';
import { DEPARTMENT_TRACKS } from '../data/departments';
import { downloadEnrollmentReceiptPdf } from '../utils/clientPdf';

interface PlanTier {
  id: 'starter' | 'pro' | 'agency';
  audience: string;
  name: string;
  priceUsd: string;
  pricePkr: string;
  cadence: string;
  description: string;
  limits: { label: string; value: string }[];
  highlighted?: boolean;
  ctaLabel: string;
}

const PLAN_TIERS: PlanTier[] = [
  {
    id: 'starter',
    audience: 'For solo beginners testing one skill',
    name: 'Single Track Pass',
    priceUsd: '$19',
    pricePkr: 'Rs. 5,200',
    cadence: 'one-time',
    description:
      'Focused access to any one monetization or freelancing track with full step-by-step checklists and blueprint files.',
    limits: [
      { label: 'Income Tracks', value: '1 Track' },
      { label: 'Guided SOP Steps', value: '6 Steps' },
      { label: 'AI Mentor Access', value: 'Track-Scoped' },
      { label: 'Templates & JSONs', value: 'Included' },
    ],
    ctaLabel: 'Register for Earning',
  },
  {
    id: 'pro',
    audience: 'For serious creators & freelancers',
    name: 'Pro All-Access Earning Pass',
    priceUsd: '$49',
    pricePkr: 'Rs. 13,500',
    cadence: 'per month',
    description:
      'Complete 8-track curriculum across social monetization, n8n AI automation, and Upwork/Fiverr client acquisition with bilingual AI mentoring.',
    limits: [
      { label: 'Income Tracks', value: 'All 8 Tracks' },
      { label: 'Guided SOP Steps', value: '48 Steps' },
      { label: 'AI Mentor Languages', value: 'English + Roman Urdu' },
      { label: 'n8n & Outreach Kits', value: 'Full Library' },
    ],
    highlighted: true,
    ctaLabel: 'Enroll for Earning',
  },
  {
    id: 'agency',
    audience: 'For teams & done-for-you launches',
    name: 'Executive 1-on-1 Launch',
    priceUsd: '$199',
    pricePkr: 'Rs. 55,000',
    cadence: 'one-time package',
    description:
      'Everything in Pro plus personal audit of your YouTube/Meta monetization setup, n8n workflow architecture, or Fiverr/Upwork profile.',
    limits: [
      { label: 'Income Tracks', value: 'All 8 + Custom Skill' },
      { label: '1-on-1 Audit Review', value: '2 Sessions' },
      { label: 'Custom n8n Blueprint', value: '1 Production Build' },
      { label: 'Priority Support', value: 'Direct WhatsApp' },
    ],
    ctaLabel: 'Register 1-on-1 Package',
  },
];

export function PricingSection() {
  const { user, saveEnrollmentCloud } = useCloudSync();
  const { uiLanguage } = useUiLanguage();

  const [enrollments, setEnrollments] = useState<CloudEnrollmentItem[]>(() => {
    try {
      const raw = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) return parsed as CloudEnrollmentItem[];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [preferredTrack, setPreferredTrack] = useState(
    DEPARTMENT_TRACKS[0]?.title ?? 'YouTube Monetization'
  );
  const [paymentMethod, setPaymentMethod] = useState('JazzCash / Easypaisa');
  const [txReference, setTxReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketCopied, setTicketCopied] = useState(false);
  const [submittedRecord, setSubmittedRecord] =
    useState<CloudEnrollmentItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        ENROLLMENTS_STORAGE_KEY,
        JSON.stringify(enrollments)
      );
    } catch {
      // ignore
    }
  }, [enrollments]);

  useEffect(() => {
    const syncEnrollments = () => {
      try {
        const raw = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            setEnrollments(parsed as CloudEnrollmentItem[]);
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('pgl03-enrollments-updated', syncEnrollments);
    window.addEventListener('pgl03-cloud-hydrated', syncEnrollments);
    return () => {
      window.removeEventListener('pgl03-enrollments-updated', syncEnrollments);
      window.removeEventListener('pgl03-cloud-hydrated', syncEnrollments);
    };
  }, []);

  const openModalForPlan = (plan: PlanTier) => {
    setSelectedPlan(plan);
    setSubmitError(null);
    setSubmittedRecord(null);
    if (user?.displayName && !buyerName) {
      setBuyerName(user.displayName);
    }
    if (user?.email && !buyerContact) {
      setBuyerContact(user.email);
    }
  };

  const handleGenerateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !buyerName.trim() || !buyerContact.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          priceUsd: selectedPlan.priceUsd,
          pricePkr: selectedPlan.pricePkr,
          buyerName: buyerName.trim(),
          buyerContact: buyerContact.trim(),
          preferredTrack,
          paymentMethod: txReference.trim()
            ? `${paymentMethod} (Ref: ${txReference.trim()})`
            : paymentMethod,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as CloudEnrollmentItem & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register enrollment.');
      }

      const record: CloudEnrollmentItem = {
        id: data.id || `enr_${Date.now()}`,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        priceUsd: selectedPlan.priceUsd,
        pricePkr: selectedPlan.pricePkr,
        buyerName: buyerName.trim(),
        buyerContact: buyerContact.trim(),
        preferredTrack,
        paymentMethod: txReference.trim()
          ? `${paymentMethod} (${txReference.trim()})`
          : paymentMethod,
        ticketCode: data.ticketCode || `PGL-${Date.now().toString().slice(-6)}`,
        status: 'Submitted',
        createdAtIso: new Date().toISOString(),
      };

      setEnrollments((prev) => [record, ...prev]);
      await saveEnrollmentCloud(record);
      setSubmittedRecord(record);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Could not submit registration right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submittedTicketText = submittedRecord
    ? [
        `#PGL.03 Enrollment Confirmation — Earning Guide by ArYan JAN BaLocH`,
        `Ticket ID: ${submittedRecord.ticketCode}`,
        `Plan: ${submittedRecord.planName} (${submittedRecord.priceUsd} / ${submittedRecord.pricePkr})`,
        `Applicant: ${submittedRecord.buyerName}`,
        `WhatsApp / Email: ${submittedRecord.buyerContact}`,
        `Primary Track: ${submittedRecord.preferredTrack}`,
        `Payment Method: ${submittedRecord.paymentMethod}`,
        `Status: ${submittedRecord.status}`,
      ].join('\n')
    : '';

  const handleCopyTicket = async () => {
    if (!submittedTicketText) return;
    try {
      await navigator.clipboard.writeText(submittedTicketText);
      setTicketCopied(true);
      setTimeout(() => setTicketCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setSubmittedRecord(null);
    setTicketCopied(false);
    setSubmitError(null);
  };

  const latestEnrollment = enrollments[0] ?? null;

  return (
    <section id="plans" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-xs font-semibold text-blue-400">
            Enroll or Register for Earning
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-50 font-display text-balance">
            {uiLanguage === 'roman_urdu'
              ? 'Asal Earning Ke Liye Asaan Membership Plans'
              : 'Simple Plans Built for Real Earning'}
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            {uiLanguage === 'roman_urdu'
              ? 'USD ya PKR mein apni registration confirm karein aur fori PDF receipt hasil karein.'
              : 'Register for earning in USD or PKR with persisted enrollment tickets and instant PDF receipts.'}
          </p>
        </div>

        {latestEnrollment && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-zinc-900 px-3.5 py-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-zinc-100">
                Registered: {latestEnrollment.planName}
              </div>
              <div className="font-mono text-[11px] text-emerald-400">
                Ticket {latestEnrollment.ticketCode}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadEnrollmentReceiptPdf({
                  ticketCode: latestEnrollment.ticketCode,
                  date:
                    latestEnrollment.createdAtIso?.slice(0, 10) ??
                    new Date().toISOString().slice(0, 10),
                  planName: latestEnrollment.planName,
                  priceUsd: latestEnrollment.priceUsd,
                  pricePkr: latestEnrollment.pricePkr,
                  buyerName: latestEnrollment.buyerName,
                  buyerContact: latestEnrollment.buyerContact,
                  preferredTrack: latestEnrollment.preferredTrack,
                  paymentMethod: latestEnrollment.paymentMethod,
                })
              }
              className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <Download className="h-3 w-3" />
              <span>Receipt PDF</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {PLAN_TIERS.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col justify-between rounded-xl border p-6 transition-colors ${
              plan.highlighted
                ? 'border-blue-500/80 bg-zinc-900'
                : 'border-zinc-800 bg-zinc-900/70'
            }`}
          >
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-blue-400">
                  {plan.audience}
                </div>
                <h3 className="text-xl font-bold text-zinc-50 font-display">
                  {plan.name}
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="border-y border-zinc-800 py-4 flex items-baseline justify-between gap-3">
                <div>
                  <span className="text-3xl font-bold text-zinc-50 font-mono tabular-nums">
                    {plan.priceUsd}
                  </span>
                  <span className="ml-1.5 text-xs text-zinc-400">
                    {plan.cadence}
                  </span>
                </div>
                <div className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                  {plan.pricePkr}
                </div>
              </div>

              <dl className="space-y-2.5 text-xs">
                {plan.limits.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <dt className="text-zinc-400">{row.label}</dt>
                    <dd className="font-mono font-medium text-zinc-100 tabular-nums">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => openModalForPlan(plan)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'border border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800'
                }`}
              >
                <span>{plan.ctaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enrollment & Checkout Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enroll-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <div className="text-xs font-medium text-blue-400">
                  #PGL.03 Register for Earning Checkout
                </div>
                <h3
                  id="enroll-modal-title"
                  className="text-lg font-bold text-zinc-50 font-display mt-0.5"
                >
                  {selectedPlan.name} ({selectedPlan.priceUsd} /{' '}
                  {selectedPlan.pricePkr})
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close enrollment modal"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!submittedRecord ? (
              <form onSubmit={handleGenerateOrder} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="buyer-name"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    Full Name
                  </label>
                  <input
                    id="buyer-name"
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="buyer-contact"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    WhatsApp Number or Email
                  </label>
                  <input
                    id="buyer-contact"
                    type="text"
                    required
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder="+92 3XX XXXXXXX or email@example.com"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="preferred-track"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Primary Focus Track
                    </label>
                    <select
                      id="preferred-track"
                      value={preferredTrack}
                      onChange={(e) => setPreferredTrack(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                    >
                      {DEPARTMENT_TRACKS.map((t) => (
                        <option key={t.id} value={t.title}>
                          {t.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="payment-method"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Payment Method
                    </label>
                    <select
                      id="payment-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="JazzCash / Easypaisa">
                        JazzCash / Easypaisa
                      </option>
                      <option value="Local Bank Transfer (IBFT)">
                        Local Bank Transfer (IBFT)
                      </option>
                      <option value="Payoneer / Wise (USD)">
                        Payoneer / Wise (USD)
                      </option>
                      <option value="Visa / Mastercard">
                        Visa / Mastercard
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="tx-ref"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    Payment Reference / Transaction ID (Optional)
                  </label>
                  <input
                    id="tx-ref"
                    type="text"
                    value={txReference}
                    onChange={(e) => setTxReference(e.target.value)}
                    placeholder="e.g. Trx ID if already transferred"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {submitError && (
                  <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    <span>Complete Registration</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-emerald-300 leading-relaxed">
                  Registration saved with Ticket ID{' '}
                  <strong className="font-mono">{submittedRecord.ticketCode}</strong>
                  {user ? ' and synced to your cloud profile.' : '.'}
                </p>

                <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs font-mono text-zinc-200 leading-relaxed">
                  {submittedTicketText}
                </pre>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadEnrollmentReceiptPdf({
                        ticketCode: submittedRecord.ticketCode,
                        date:
                          submittedRecord.createdAtIso?.slice(0, 10) ??
                          new Date().toISOString().slice(0, 10),
                        planName: submittedRecord.planName,
                        priceUsd: submittedRecord.priceUsd,
                        pricePkr: submittedRecord.pricePkr,
                        buyerName: submittedRecord.buyerName,
                        buyerContact: submittedRecord.buyerContact,
                        preferredTrack: submittedRecord.preferredTrack,
                        paymentMethod: submittedRecord.paymentMethod,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Receipt PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyTicket}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                  >
                    {ticketCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied Summary</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
