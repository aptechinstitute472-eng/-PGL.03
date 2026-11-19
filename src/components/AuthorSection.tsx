import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  User,
} from 'lucide-react';
import { useUiLanguage } from '../context/LanguageContext';

export const AUTHOR_PORTRAIT_SRC =
  '/assets/aistudio/file_00000000f6448208b0d20732265cc8ca_79f14510.png';
export const AUTHOR_NAME = 'Author - #Aryan Jan Baloch';
export const AUTHOR_GMAIL = 'balocharyanjan@gmail.com';
export const AUTHOR_FACEBOOK_NAME = 'Aryan Jan baloch';
export const AUTHOR_FACEBOOK_URL =
  'https://www.facebook.com/search/top?q=Aryan%20Jan%20baloch';

export function AuthorSection() {
  const { uiLanguage } = useUiLanguage();
  const [imgFailed, setImgFailed] = useState(false);
  const [copiedField, setCopiedField] = useState<'gmail' | 'facebook' | null>(
    null
  );

  const isRomanUrdu = uiLanguage === 'roman_urdu';

  const handleCopy = async (value: string, field: 'gmail' | 'facebook') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <section
      id="author"
      aria-labelledby="author-section-heading"
      className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
    >
      {/* Subtle Architectural Background Wall */}
      {!imgFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <img
            src={AUTHOR_PORTRAIT_SRC}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-[50%_18%] opacity-15 blur-xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/90 to-zinc-900/92" />
        </div>
      )}

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 items-stretch">
        {/* Left Column: Crisp Framed Author Portrait */}
        <div className="lg:col-span-4 relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 min-h-[300px] lg:min-h-[340px]">
          {!imgFailed ? (
            <img
              src={AUTHOR_PORTRAIT_SRC}
              alt={AUTHOR_NAME}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover object-[50%_12%]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-zinc-950 text-zinc-300">
              <User className="h-10 w-10 text-blue-400 mb-2" />
              <div className="text-sm font-semibold text-zinc-100">
                {AUTHOR_NAME}
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent p-4">
            <div className="text-xs font-medium text-blue-400">
              {isRomanUrdu ? 'Founder · #PGL.03' : 'Founder · #PGL.03 Platform'}
            </div>
            <div className="text-sm font-bold text-zinc-50 font-display mt-0.5">
              {AUTHOR_NAME}
            </div>
          </div>
        </div>

        {/* Right Column: Bio & Innovation Project Contact Channels */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-blue-400">
              {isRomanUrdu
                ? 'Creator Profile aur Naye Projects ke Liye Raabta'
                : 'Author Profile · Innovation & New Project Collaborations'}
            </div>

            <h2
              id="author-section-heading"
              className="text-2xl sm:text-3xl font-bold text-zinc-50 font-display text-balance"
            >
              {AUTHOR_NAME}
            </h2>

            <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
              {isRomanUrdu
                ? 'Digital skills, n8n AI automation systems, aur social media monetization playbooks ke creator. Naye innovation ideas, custom automation workflows, ya partnership projects ke liye barah-e-raast Gmail ya Facebook par raabta karein.'
                : 'Creator of the #PGL.03 Earning Guide spanning social monetization, freelancing retainers, and n8n AI workflows. Reach out directly for innovation initiatives, custom automation builds, or new project collaborations.'}
            </p>
          </div>

          {/* Clean Hairline Contact Grid (Zero nested card clutter) */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950/85">
            {/* Gmail for Innovation & New Projects */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>
                  {isRomanUrdu
                    ? 'Gmail (Innovation & New Projects)'
                    : 'Gmail for Innovation & New Projects'}
                </span>
              </div>

              <div className="font-mono text-sm font-medium text-zinc-100 break-all">
                {AUTHOR_GMAIL}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`mailto:${AUTHOR_GMAIL}?subject=${encodeURIComponent(
                    'New Innovation Project Inquiry - #PGL.03'
                  )}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{isRomanUrdu ? 'Email Bhejein' : 'Send Email'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => void handleCopy(AUTHOR_GMAIL, 'gmail')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedField === 'gmail' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Gmail</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Facebook Profile */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <User className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>
                  {isRomanUrdu ? 'Facebook Profile' : 'Facebook Profile'}
                </span>
              </div>

              <div className="text-sm font-semibold text-zinc-100">
                {AUTHOR_FACEBOOK_NAME}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={AUTHOR_FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                  <span>
                    {isRomanUrdu ? 'Facebook Kholein' : 'Open Facebook'}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() =>
                    void handleCopy(AUTHOR_FACEBOOK_NAME, 'facebook')
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedField === 'facebook' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Name</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
