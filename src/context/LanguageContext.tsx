import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type UiLanguage = 'en' | 'roman_urdu';

export const UI_LANGUAGE_STORAGE_KEY = 'pgl03_ui_language_v1';

interface UiCopy {
  navTracks: string;
  navStudio: string;
  navMilestones: string;
  navLedger: string;
  navPlans: string;
  enrollCta: string;
  heroTitle: string;
  heroSubtitle: string;
  startLearning: string;
  viewPlans: string;
  tracksHeading: string;
  tracksSubheading: string;
  studioHeading: string;
  studioSubheading: string;
  quizHeading: string;
  withdrawalsHeading: string;
  invoicesHeading: string;
  backupBtn: string;
  signInBtn: string;
  signOutBtn: string;
  cloudSyncedLabel: string;
  localOnlyLabel: string;
}

const EN_COPY: UiCopy = {
  navTracks: 'Income Tracks',
  navStudio: 'Studio',
  navMilestones: 'Milestones',
  navLedger: 'Ledger',
  navPlans: 'Plans',
  enrollCta: 'Enroll for Earning',
  heroTitle:
    'Master high-income digital skills, monetization, and AI automation.',
  heroSubtitle:
    'One complete platform covering YouTube, Facebook, Instagram, TikTok, n8n AI workflows, and high-ticket freelancing. Explore verified monetization thresholds, copy-ready blueprints, and live step-by-step AI mentoring in English and Roman Urdu.',
  startLearning: 'Start Learning Now',
  viewPlans: 'View Membership Plans',
  tracksHeading: 'Curriculum & Income Tracks',
  tracksSubheading:
    'Select any track below to review eligibility benchmarks, blueprints, and step-by-step AI guidance.',
  studioHeading: 'Execution Studio & Live AI Mentor',
  studioSubheading:
    'Choose a track on the left, track your checklist in the center, and get step-by-step coaching on the right.',
  quizHeading: 'AI Skill & Income Niche Matcher',
  withdrawalsHeading: 'Payout Withdrawal Tracker',
  invoicesHeading: 'Client Invoice & Proposal PDF Studio',
  backupBtn: 'Backup & Restore',
  signInBtn: 'Sign In & Sync',
  signOutBtn: 'Sign Out',
  cloudSyncedLabel: 'Cloud Synced',
  localOnlyLabel: 'Local Browser Mode',
};

const ROMAN_URDU_COPY: UiCopy = {
  navTracks: 'Earning Tracks',
  navStudio: 'Studio',
  navMilestones: 'Milestones',
  navLedger: 'Ledger',
  navPlans: 'Plans',
  enrollCta: 'Enroll for Earning',
  heroTitle:
    'High-income digital skills, social monetization, aur AI automation seekhein aur kamayein.',
  heroSubtitle:
    'YouTube, Facebook, Instagram, TikTok, n8n AI workflows, aur freelancing ka mukammal practical system. Asal monetization rules, copy-ready blueprints, aur step-by-step AI Mentor ab Roman Urdu aur English dono mein.',
  startLearning: 'Seekhna Shuru Karein',
  viewPlans: 'Earning Plans Dekhein',
  tracksHeading: 'Tamam Earning Tracks & Roadmaps',
  tracksSubheading:
    'Neeche kisi bhi track ko select karein taa ke monetization rules, templates, aur step-by-step roadmap dekh sakein.',
  studioHeading: 'Execution Studio aur Live AI Mentor',
  studioSubheading:
    'Bayein taraf se track chunein, darmiyan mein apna checklist mukammal karein, aur dayein taraf AI Mentor se live madad lein.',
  quizHeading: 'AI Skill aur Niche Matcher Quiz',
  withdrawalsHeading: 'Payoneer, Wise & Bank Withdrawal Tracker',
  invoicesHeading: 'Client Invoice aur Proposal PDF Studio',
  backupBtn: 'Backup / Restore',
  signInBtn: 'Google Sign-In & Sync',
  signOutBtn: 'Sign Out',
  cloudSyncedLabel: 'Cloud Sync Active',
  localOnlyLabel: 'Sirf Browser Mein Save',
};

interface LanguageContextValue {
  uiLanguage: UiLanguage;
  setUiLanguage: (lang: UiLanguage) => void;
  toggleUiLanguage: () => void;
  t: UiCopy;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUiLanguageState] = useState<UiLanguage>(() => {
    try {
      const saved = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
      if (saved === 'roman_urdu' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setUiLanguage = useCallback((lang: UiLanguage) => {
    setUiLanguageState(lang);
    try {
      localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, lang);
      window.dispatchEvent(new Event('pgl03-ui-language-updated'));
    } catch {
      // ignore
    }
  }, []);

  const toggleUiLanguage = useCallback(() => {
    setUiLanguage(uiLanguage === 'en' ? 'roman_urdu' : 'en');
  }, [uiLanguage, setUiLanguage]);

  useEffect(() => {
    const syncLang = () => {
      try {
        const saved = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
        if (saved === 'en' || saved === 'roman_urdu') {
          setUiLanguageState(saved);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', syncLang);
    window.addEventListener('pgl03-cloud-hydrated', syncLang);
    return () => {
      window.removeEventListener('storage', syncLang);
      window.removeEventListener('pgl03-cloud-hydrated', syncLang);
    };
  }, []);

  const t = uiLanguage === 'roman_urdu' ? ROMAN_URDU_COPY : EN_COPY;

  return (
    <LanguageContext.Provider
      value={{ uiLanguage, setUiLanguage, toggleUiLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useUiLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useUiLanguage must be used within LanguageProvider');
  }
  return ctx;
}
