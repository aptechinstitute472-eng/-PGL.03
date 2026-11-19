import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { OperationType, handleFirestoreError } from '../utils/firestoreErrors';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export const WITHDRAWALS_STORAGE_KEY = 'pgl03_withdrawals_v1';
export const ENROLLMENTS_STORAGE_KEY = 'pgl03_enrollments_v1';
const CHECKLIST_KEY = 'aryan_ai_completed_checklists_v1';
const WEEKLY_KEY = 'pgl03_weekly_milestones_v1';
const LEDGER_KEY = 'pgl03_earnings_ledger_v1';
const JOURNAL_KEY = 'pgl03_success_journal_v1';
const UI_LANG_KEY = 'pgl03_ui_language_v1';

export interface CloudLedgerItem {
  id: string;
  trackId: string;
  cadence: 'daily' | 'weekly';
  weekIndex: number;
  date: string;
  taskTitle: string;
  source: string;
  amountUsd: number;
}

export interface CloudWithdrawalItem {
  id: string;
  method:
    | 'Payoneer'
    | 'Wise'
    | 'Local Bank (IBFT)'
    | 'JazzCash / Easypaisa'
    | 'Upwork / Fiverr Direct';
  platformSource: string;
  grossUsd: number;
  feeUsd: number;
  fxRate: number;
  netPkr: number;
  status: 'Pending' | 'Cleared';
  date: string;
  referenceNote: string;
}

export interface CloudJournalItem {
  id: string;
  trackId: string;
  date: string;
  reflection: string;
  tags: string[];
}

export interface CloudEnrollmentItem {
  id: string;
  planId: 'starter' | 'pro' | 'agency';
  planName: string;
  priceUsd: string;
  pricePkr: string;
  buyerName: string;
  buyerContact: string;
  preferredTrack: string;
  paymentMethod: string;
  ticketCode: string;
  status: 'Submitted' | 'Confirmed';
  createdAtIso?: string;
}

interface CloudSyncContextValue {
  user: User | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncWorkspaceToCloud: (payload: {
    selectedTrackId: string;
    languageMode: 'english' | 'roman_urdu' | 'bilingual';
    uiLanguage: 'en' | 'roman_urdu';
    completedChecklistIds: string[];
    completedWeeklyTaskIds: string[];
  }) => Promise<void>;
  saveLedgerEntryCloud: (entry: CloudLedgerItem) => Promise<void>;
  deleteLedgerEntryCloud: (entryId: string) => Promise<void>;
  saveWithdrawalCloud: (item: CloudWithdrawalItem) => Promise<void>;
  markWithdrawalClearedCloud: (withdrawalId: string) => Promise<void>;
  deleteWithdrawalCloud: (withdrawalId: string) => Promise<void>;
  saveJournalEntryCloud: (entry: CloudJournalItem) => Promise<void>;
  deleteJournalEntryCloud: (journalId: string) => Promise<void>;
  saveEnrollmentCloud: (record: CloudEnrollmentItem) => Promise<void>;
  triggerFullSync: () => Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

function readJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const isHydratingRef = useRef(false);

  const hydrateAndMergeWithCloud = useCallback(async (activeUser: User) => {
    if (isHydratingRef.current) return;
    isHydratingRef.current = true;
    const uid = activeUser.uid;
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      // 1. Workspace state
      const wsPath = `users/${uid}/workspace/state`;
      const wsRef = doc(db, 'users', uid, 'workspace', 'state');
      let wsSnap;
      try {
        wsSnap = await getDoc(wsRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, wsPath);
      }

      const localChecklist = readJsonArray<string>(CHECKLIST_KEY);
      const localWeekly = readJsonArray<string>(WEEKLY_KEY);
      const localUiLang =
        localStorage.getItem(UI_LANG_KEY) === 'roman_urdu'
          ? 'roman_urdu'
          : 'en';

      if (wsSnap.exists()) {
        const data = wsSnap.data() as {
          selectedTrackId?: string;
          languageMode?: 'english' | 'roman_urdu' | 'bilingual';
          uiLanguage?: 'en' | 'roman_urdu';
          completedChecklistIds?: string[];
          completedWeeklyTaskIds?: string[];
        };
        const mergedChecklist = Array.from(
          new Set([
            ...(Array.isArray(data.completedChecklistIds)
              ? data.completedChecklistIds
              : []),
            ...localChecklist,
          ])
        ).slice(0, 250);
        const mergedWeekly = Array.from(
          new Set([
            ...(Array.isArray(data.completedWeeklyTaskIds)
              ? data.completedWeeklyTaskIds
              : []),
            ...localWeekly,
          ])
        ).slice(0, 250);

        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(mergedChecklist));
        localStorage.setItem(WEEKLY_KEY, JSON.stringify(mergedWeekly));
        if (data.uiLanguage === 'en' || data.uiLanguage === 'roman_urdu') {
          localStorage.setItem(UI_LANG_KEY, data.uiLanguage);
        }

        try {
          await setDoc(
            wsRef,
            {
              uid,
              selectedTrackId: (data.selectedTrackId || 'n8n').slice(0, 40),
              languageMode: data.languageMode || 'bilingual',
              uiLanguage: data.uiLanguage || localUiLang,
              completedChecklistIds: mergedChecklist,
              completedWeeklyTaskIds: mergedWeekly,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, wsPath);
        }
      } else {
        try {
          await setDoc(wsRef, {
            uid,
            selectedTrackId: 'n8n',
            languageMode: 'bilingual',
            uiLanguage: localUiLang,
            completedChecklistIds: localChecklist.slice(0, 250),
            completedWeeklyTaskIds: localWeekly.slice(0, 250),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, wsPath);
        }
      }

      // 2. Ledger entries merge
      const ledgerPath = `users/${uid}/ledgerEntries`;
      const ledgerCol = collection(db, 'users', uid, 'ledgerEntries');
      let ledgerSnap;
      try {
        ledgerSnap = await getDocs(query(ledgerCol, where('uid', '==', uid)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, ledgerPath);
      }
      const cloudLedgerMap = new Map<string, CloudLedgerItem>();
      ledgerSnap.forEach((docSnap) => {
        const d = docSnap.data() as Omit<CloudLedgerItem, 'id'>;
        cloudLedgerMap.set(docSnap.id, { id: docSnap.id, ...d });
      });
      const localLedger = readJsonArray<CloudLedgerItem>(LEDGER_KEY);
      for (const item of localLedger) {
        const cleanId = sanitizeId(item.id);
        if (!cloudLedgerMap.has(cleanId) && Number(item.amountUsd) > 0) {
          const docRef = doc(db, 'users', uid, 'ledgerEntries', cleanId);
          try {
            await setDoc(docRef, {
              uid,
              trackId: String(item.trackId || 'n8n').slice(0, 40),
              cadence: item.cadence === 'weekly' ? 'weekly' : 'daily',
              weekIndex: Math.min(3, Math.max(0, Math.floor(item.weekIndex || 0))),
              date: /^\d{4}-\d{2}-\d{2}$/.test(item.date)
                ? item.date
                : new Date().toISOString().slice(0, 10),
              taskTitle: String(item.taskTitle || 'Task').slice(0, 200),
              source: String(item.source || 'Direct').slice(0, 120),
              amountUsd: Math.round(Number(item.amountUsd) * 100) / 100,
              createdAt: serverTimestamp(),
            });
            cloudLedgerMap.set(cleanId, { ...item, id: cleanId });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `${ledgerPath}/${cleanId}`);
          }
        }
      }
      localStorage.setItem(
        LEDGER_KEY,
        JSON.stringify(Array.from(cloudLedgerMap.values()))
      );

      // 3. Withdrawals merge
      const wPath = `users/${uid}/withdrawals`;
      const wCol = collection(db, 'users', uid, 'withdrawals');
      let wSnap;
      try {
        wSnap = await getDocs(query(wCol, where('uid', '==', uid)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, wPath);
      }
      const cloudWMap = new Map<string, CloudWithdrawalItem>();
      wSnap.forEach((docSnap) => {
        const d = docSnap.data() as Omit<CloudWithdrawalItem, 'id'>;
        cloudWMap.set(docSnap.id, { id: docSnap.id, ...d });
      });
      const localW = readJsonArray<CloudWithdrawalItem>(WITHDRAWALS_STORAGE_KEY);
      for (const item of localW) {
        const cleanId = sanitizeId(item.id);
        if (!cloudWMap.has(cleanId) && Number(item.grossUsd) > 0) {
          const docRef = doc(db, 'users', uid, 'withdrawals', cleanId);
          try {
            await setDoc(docRef, {
              uid,
              method: item.method,
              platformSource: String(item.platformSource || 'Direct').slice(0, 120),
              grossUsd: Math.round(Number(item.grossUsd) * 100) / 100,
              feeUsd: Math.max(0, Math.round(Number(item.feeUsd || 0) * 100) / 100),
              fxRate: Math.max(1, Number(item.fxRate || 278)),
              netPkr: Math.max(0, Math.round(Number(item.netPkr || 0))),
              status: item.status === 'Cleared' ? 'Cleared' : 'Pending',
              date: /^\d{4}-\d{2}-\d{2}$/.test(item.date)
                ? item.date
                : new Date().toISOString().slice(0, 10),
              referenceNote: String(item.referenceNote || '').slice(0, 160),
              createdAt: serverTimestamp(),
            });
            cloudWMap.set(cleanId, { ...item, id: cleanId });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `${wPath}/${cleanId}`);
          }
        }
      }
      localStorage.setItem(
        WITHDRAWALS_STORAGE_KEY,
        JSON.stringify(Array.from(cloudWMap.values()))
      );

      // 4. Journal merge
      const jPath = `users/${uid}/journalEntries`;
      const jCol = collection(db, 'users', uid, 'journalEntries');
      let jSnap;
      try {
        jSnap = await getDocs(query(jCol, where('uid', '==', uid)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, jPath);
      }
      const cloudJMap = new Map<string, CloudJournalItem>();
      jSnap.forEach((docSnap) => {
        const d = docSnap.data() as Omit<CloudJournalItem, 'id'>;
        cloudJMap.set(docSnap.id, { id: docSnap.id, ...d });
      });
      const localJ = readJsonArray<CloudJournalItem>(JOURNAL_KEY);
      for (const item of localJ) {
        const cleanId = sanitizeId(item.id);
        if (!cloudJMap.has(cleanId) && item.reflection) {
          const docRef = doc(db, 'users', uid, 'journalEntries', cleanId);
          try {
            await setDoc(docRef, {
              uid,
              trackId: String(item.trackId || 'n8n').slice(0, 40),
              date: /^\d{4}-\d{2}-\d{2}$/.test(item.date)
                ? item.date
                : new Date().toISOString().slice(0, 10),
              reflection: String(item.reflection).slice(0, 1000),
              tags: Array.isArray(item.tags) ? item.tags.slice(0, 8) : [],
              createdAt: serverTimestamp(),
            });
            cloudJMap.set(cleanId, { ...item, id: cleanId });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `${jPath}/${cleanId}`);
          }
        }
      }
      localStorage.setItem(
        JOURNAL_KEY,
        JSON.stringify(Array.from(cloudJMap.values()))
      );

      // 5. Enrollments merge
      const ePath = `users/${uid}/enrollments`;
      const eCol = collection(db, 'users', uid, 'enrollments');
      let eSnap;
      try {
        eSnap = await getDocs(query(eCol, where('uid', '==', uid)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, ePath);
      }
      const cloudEMap = new Map<string, CloudEnrollmentItem>();
      eSnap.forEach((docSnap) => {
        const d = docSnap.data() as Omit<CloudEnrollmentItem, 'id'>;
        cloudEMap.set(docSnap.id, { id: docSnap.id, ...d });
      });
      const localE = readJsonArray<CloudEnrollmentItem>(ENROLLMENTS_STORAGE_KEY);
      for (const item of localE) {
        const cleanId = sanitizeId(item.id);
        if (!cloudEMap.has(cleanId) && item.ticketCode) {
          const docRef = doc(db, 'users', uid, 'enrollments', cleanId);
          try {
            await setDoc(docRef, {
              uid,
              planId: item.planId,
              planName: String(item.planName).slice(0, 80),
              priceUsd: String(item.priceUsd).slice(0, 24),
              pricePkr: String(item.pricePkr).slice(0, 32),
              buyerName: String(item.buyerName).slice(0, 120),
              buyerContact: String(item.buyerContact).slice(0, 120),
              preferredTrack: String(item.preferredTrack).slice(0, 120),
              paymentMethod: String(item.paymentMethod).slice(0, 80),
              ticketCode: String(item.ticketCode).slice(0, 40),
              status: item.status === 'Confirmed' ? 'Confirmed' : 'Submitted',
              createdAt: serverTimestamp(),
            });
            cloudEMap.set(cleanId, { ...item, id: cleanId });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `${ePath}/${cleanId}`);
          }
        }
      }
      localStorage.setItem(
        ENROLLMENTS_STORAGE_KEY,
        JSON.stringify(Array.from(cloudEMap.values()))
      );

      // Notify all dashboard components to reload hydrated data
      window.dispatchEvent(new Event('pgl03-cloud-hydrated'));
      window.dispatchEvent(new Event('pgl03-ledger-updated'));
      window.dispatchEvent(new Event('pgl03-withdrawals-updated'));
      window.dispatchEvent(new Event('pgl03-journal-updated'));
      window.dispatchEvent(new Event('pgl03-enrollments-updated'));

      setSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: unknown) {
      setSyncStatus('error');
      setSyncError(
        err instanceof Error ? err.message : 'Cloud sync encountered an error.'
      );
    } finally {
      isHydratingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser) {
        void hydrateAndMergeWithCloud(nextUser);
      } else {
        setSyncStatus('local');
        setSyncError(null);
      }
    });
    return () => unsubscribe();
  }, [hydrateAndMergeWithCloud]);

  const signInWithGoogle = async () => {
    setSyncError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      setSyncError(
        err instanceof Error ? err.message : 'Google Sign-In was cancelled.'
      );
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setSyncStatus('local');
      setLastSyncedAt(null);
    } catch (err: unknown) {
      setSyncError(
        err instanceof Error ? err.message : 'Unable to sign out right now.'
      );
    }
  };

  const syncWorkspaceToCloud = useCallback(
    async (payload: {
      selectedTrackId: string;
      languageMode: 'english' | 'roman_urdu' | 'bilingual';
      uiLanguage: 'en' | 'roman_urdu';
      completedChecklistIds: string[];
      completedWeeklyTaskIds: string[];
    }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const wsPath = `users/${uid}/workspace/state`;
      setSyncStatus('syncing');
      try {
        await setDoc(
          doc(db, 'users', uid, 'workspace', 'state'),
          {
            uid,
            selectedTrackId: payload.selectedTrackId.slice(0, 40),
            languageMode: payload.languageMode,
            uiLanguage: payload.uiLanguage,
            completedChecklistIds: payload.completedChecklistIds.slice(0, 250),
            completedWeeklyTaskIds: payload.completedWeeklyTaskIds.slice(0, 250),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.WRITE, wsPath);
      }
    },
    []
  );

  const saveLedgerEntryCloud = useCallback(async (entry: CloudLedgerItem) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const cleanId = sanitizeId(entry.id);
    const pathStr = `users/${uid}/ledgerEntries/${cleanId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'ledgerEntries', cleanId), {
        uid,
        trackId: entry.trackId.slice(0, 40),
        cadence: entry.cadence,
        weekIndex: Math.min(3, Math.max(0, Math.floor(entry.weekIndex))),
        date: entry.date,
        taskTitle: entry.taskTitle.slice(0, 200),
        source: entry.source.slice(0, 120),
        amountUsd: Math.round(entry.amountUsd * 100) / 100,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, pathStr);
    }
  }, []);

  const deleteLedgerEntryCloud = useCallback(async (entryId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const cleanId = sanitizeId(entryId);
    const pathStr = `users/${uid}/ledgerEntries/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'ledgerEntries', cleanId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, pathStr);
    }
  }, []);

  const saveWithdrawalCloud = useCallback(async (item: CloudWithdrawalItem) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const cleanId = sanitizeId(item.id);
    const pathStr = `users/${uid}/withdrawals/${cleanId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'withdrawals', cleanId), {
        uid,
        method: item.method,
        platformSource: item.platformSource.slice(0, 120),
        grossUsd: Math.round(item.grossUsd * 100) / 100,
        feeUsd: Math.round(item.feeUsd * 100) / 100,
        fxRate: item.fxRate,
        netPkr: Math.round(item.netPkr),
        status: item.status,
        date: item.date,
        referenceNote: item.referenceNote.slice(0, 160),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, pathStr);
    }
  }, []);

  const markWithdrawalClearedCloud = useCallback(async (withdrawalId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const cleanId = sanitizeId(withdrawalId);
    const pathStr = `users/${uid}/withdrawals/${cleanId}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'withdrawals', cleanId), {
        status: 'Cleared',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, pathStr);
    }
  }, []);

  const deleteWithdrawalCloud = useCallback(async (withdrawalId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const cleanId = sanitizeId(withdrawalId);
    const pathStr = `users/${uid}/withdrawals/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'withdrawals', cleanId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, pathStr);
    }
  }, []);

  const saveJournalEntryCloud = useCallback(async (entry: CloudJournalItem) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const cleanId = sanitizeId(entry.id);
    const pathStr = `users/${uid}/journalEntries/${cleanId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'journalEntries', cleanId), {
        uid,
        trackId: entry.trackId.slice(0, 40),
        date: entry.date,
        reflection: entry.reflection.slice(0, 1000),
        tags: entry.tags.slice(0, 8),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, pathStr);
    }
  }, []);

  const deleteJournalEntryCloud = useCallback(async (journalId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const cleanId = sanitizeId(journalId);
    const pathStr = `users/${uid}/journalEntries/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'journalEntries', cleanId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, pathStr);
    }
  }, []);

  const saveEnrollmentCloud = useCallback(async (record: CloudEnrollmentItem) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const cleanId = sanitizeId(record.id);
    const pathStr = `users/${uid}/enrollments/${cleanId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'enrollments', cleanId), {
        uid,
        planId: record.planId,
        planName: record.planName.slice(0, 80),
        priceUsd: record.priceUsd.slice(0, 24),
        pricePkr: record.pricePkr.slice(0, 32),
        buyerName: record.buyerName.slice(0, 120),
        buyerContact: record.buyerContact.slice(0, 120),
        preferredTrack: record.preferredTrack.slice(0, 120),
        paymentMethod: record.paymentMethod.slice(0, 80),
        ticketCode: record.ticketCode.slice(0, 40),
        status: record.status,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, pathStr);
    }
  }, []);

  const triggerFullSync = useCallback(async () => {
    if (auth.currentUser) {
      await hydrateAndMergeWithCloud(auth.currentUser);
    }
  }, [hydrateAndMergeWithCloud]);

  return (
    <CloudSyncContext.Provider
      value={{
        user,
        authLoading,
        syncStatus,
        syncError,
        lastSyncedAt,
        signInWithGoogle,
        signOutUser,
        syncWorkspaceToCloud,
        saveLedgerEntryCloud,
        deleteLedgerEntryCloud,
        saveWithdrawalCloud,
        markWithdrawalClearedCloud,
        deleteWithdrawalCloud,
        saveJournalEntryCloud,
        deleteJournalEntryCloud,
        saveEnrollmentCloud,
        triggerFullSync,
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) {
    throw new Error('useCloudSync must be used within CloudSyncProvider');
  }
  return ctx;
}
