import { useState } from 'react';
import { Calculator } from 'lucide-react';

type CalculatorTrack = 'youtube' | 'tiktok_reels' | 'n8n_agency' | 'freelancing';

interface TrackPreset {
  id: CalculatorTrack;
  label: string;
  volumeLabel: string;
  volumeUnit: string;
  minVol: number;
  maxVol: number;
  stepVol: number;
  defaultVol: number;
  rateLabel: string;
  rateUnit: string;
  minRate: number;
  maxRate: number;
  stepRate: number;
  defaultRate: number;
  retainerLabel: string;
  formulaNote: string;
}

const PRESETS: Record<CalculatorTrack, TrackPreset> = {
  youtube: {
    id: 'youtube',
    label: 'YouTube AdSense',
    volumeLabel: 'Monthly Monetized Views',
    volumeUnit: 'K views',
    minVol: 20,
    maxVol: 2000,
    stepVol: 20,
    defaultVol: 250,
    rateLabel: 'Average RPM (per 1,000 views)',
    rateUnit: 'USD',
    minRate: 1,
    maxRate: 20,
    stepRate: 0.5,
    defaultRate: 6.5,
    retainerLabel: 'Affiliate & Sponsor Bonus / mo',
    formulaNote: 'Ad Revenue = (Monthly Views / 1,000) × RPM + Direct Brand Deals',
  },
  tiktok_reels: {
    id: 'tiktok_reels',
    label: 'TikTok & Facebook Reels',
    volumeLabel: 'Qualified Monthly Views',
    volumeUnit: 'K views',
    minVol: 50,
    maxVol: 5000,
    stepVol: 50,
    defaultVol: 600,
    rateLabel: 'Effective RPM (per 1,000 views)',
    rateUnit: 'USD',
    minRate: 0.2,
    maxRate: 3.0,
    stepRate: 0.1,
    defaultRate: 0.8,
    retainerLabel: 'TikTok Shop / Performance Bonus / mo',
    formulaNote: 'Pool Payout = (Qualified 1m+ or In-Stream Views / 1,000) × RPM + Bonuses',
  },
  n8n_agency: {
    id: 'n8n_agency',
    label: 'n8n & AI Automation',
    volumeLabel: 'New Automation Builds / mo',
    volumeUnit: 'clients',
    minVol: 1,
    maxVol: 10,
    stepVol: 1,
    defaultVol: 2,
    rateLabel: 'Average Workflow Setup Fee',
    rateUnit: 'USD',
    minRate: 300,
    maxRate: 3000,
    stepRate: 100,
    defaultRate: 900,
    retainerLabel: 'Active Monthly Care Retainers',
    formulaNote: 'Monthly Revenue = (Builds × Setup Fee) + Active Monthly Retainers',
  },
  freelancing: {
    id: 'freelancing',
    label: 'Fiverr / Upwork / Video',
    volumeLabel: 'Completed Orders or Retainers / mo',
    volumeUnit: 'orders',
    minVol: 1,
    maxVol: 25,
    stepVol: 1,
    defaultVol: 5,
    rateLabel: 'Net Average Order Value',
    rateUnit: 'USD',
    minRate: 50,
    maxRate: 1500,
    stepRate: 25,
    defaultRate: 300,
    retainerLabel: 'Upsells / Recurring Add-ons / mo',
    formulaNote: 'Net Freelance Income = (Orders × Average Ticket) + Monthly Upsells',
  },
};

export function EarningsCalculator() {
  const [track, setTrack] = useState<CalculatorTrack>('n8n_agency');
  const preset = PRESETS[track];

  const [volume, setVolume] = useState<number>(preset.defaultVol);
  const [rate, setRate] = useState<number>(preset.defaultRate);
  const [bonusUsd, setBonusUsd] = useState<number>(400);
  const [pkrRate, setPkrRate] = useState<number>(278);

  const handleSelectTrack = (next: CalculatorTrack) => {
    setTrack(next);
    setVolume(PRESETS[next].defaultVol);
    setRate(PRESETS[next].defaultRate);
  };

  const baseMonthlyUsd = volume * rate;
  const totalMonthlyUsd = Math.round(baseMonthlyUsd + bonusUsd);
  const totalAnnualUsd = totalMonthlyUsd * 12;
  const totalMonthlyPkr = totalMonthlyUsd * pkrRate;

  return (
    <section
      id="calculator"
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Calculator className="h-4 w-4" />
            <span>Interactive Revenue Simulator</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 font-display text-balance">
            Forecast Your Monthly Freelancing &amp; Monetization Revenue
          </h2>
          <p className="text-sm text-zinc-300 tracking-[0.01em]">
            Adjust view volume, client count, and RPM or deal ticket size to model realistic monthly USD and PKR earnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          {(Object.keys(PRESETS) as CalculatorTrack[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectTrack(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                track === key
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {PRESETS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="calc-volume" className="font-semibold text-zinc-200">
                {preset.volumeLabel}
              </label>
              <span className="font-mono font-semibold text-blue-400 tabular-nums">
                {volume.toLocaleString()} {preset.volumeUnit}
              </span>
            </div>
            <input
              id="calc-volume"
              type="range"
              min={preset.minVol}
              max={preset.maxVol}
              step={preset.stepVol}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="calc-rate" className="font-semibold text-zinc-200">
                {preset.rateLabel}
              </label>
              <span className="font-mono font-semibold text-blue-400 tabular-nums">
                ${rate.toLocaleString()} {preset.rateUnit}
              </span>
            </div>
            <input
              id="calc-rate"
              type="range"
              min={preset.minRate}
              max={preset.maxRate}
              step={preset.stepRate}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="calc-bonus" className="font-semibold text-zinc-200">
                  {preset.retainerLabel}
                </label>
                <span className="font-mono font-semibold text-zinc-100 tabular-nums">
                  ${bonusUsd.toLocaleString()}
                </span>
              </div>
              <input
                id="calc-bonus"
                type="range"
                min={0}
                max={3000}
                step={100}
                value={bonusUsd}
                onChange={(e) => setBonusUsd(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="calc-pkr" className="font-semibold text-zinc-200">
                  USD to PKR Rate
                </label>
                <span className="font-mono font-semibold text-zinc-100 tabular-nums">
                  Rs. {pkrRate}
                </span>
              </div>
              <input
                id="calc-pkr"
                type="range"
                min={250}
                max={320}
                step={1}
                value={pkrRate}
                onChange={(e) => setPkrRate(Number(e.target.value))}
                className="w-full accent-zinc-400 cursor-pointer"
              />
            </div>
          </div>

          <p className="text-xs font-mono text-zinc-400 border-t border-zinc-800 pt-3">
            Formula: {preset.formulaNote}
          </p>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-5">
          <div className="space-y-1">
            <div className="text-xs text-zinc-400">
              Projected Monthly Revenue (USD)
            </div>
            <div className="text-4xl font-bold text-zinc-50 font-mono tabular-nums">
              ${totalMonthlyUsd.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
            <div>
              <div className="text-xs text-zinc-400">Monthly PKR</div>
              <div className="text-lg font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
                Rs. {totalMonthlyPkr.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Annual Run Rate</div>
              <div className="text-lg font-semibold text-zinc-100 font-mono tabular-nums mt-0.5">
                ${totalAnnualUsd.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 text-xs text-zinc-400 leading-relaxed">
            Projections reflect realistic execution benchmarks before marketplace commissions.
          </div>
        </div>
      </div>
    </section>
  );
}
