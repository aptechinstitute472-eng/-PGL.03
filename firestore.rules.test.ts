import { readFileSync } from 'node:fs';

// Dirty Dozen payload definitions for Firestore Rules verification
export const DIRTY_DOZEN_CASES = [
  { name: 'Unauthenticated read', path: '/users/uid1/workspace/state', op: 'get', auth: null },
  { name: 'Unverified email write', path: '/users/uid1/ledgerEntries/e1', op: 'create', auth: { uid: 'uid1', email_verified: false } },
  { name: 'Cross-user withdrawal write', path: '/users/uid1/withdrawals/w1', op: 'create', auth: { uid: 'uid2', email_verified: true } },
  { name: 'UID spoofing in payload', path: '/users/uid1/ledgerEntries/e1', op: 'create', payload: { uid: 'uid2' } },
  { name: 'Shadow field injection', path: '/users/uid1/workspace/state', op: 'create', payload: { isAdmin: true } },
  { name: 'ID poisoning > 128 chars', path: `/users/uid1/ledgerEntries/${'a'.repeat(129)}`, op: 'create' },
  { name: 'Oversized journal reflection', path: '/users/uid1/journalEntries/j1', op: 'create', payload: { reflection: 'x'.repeat(1001) } },
  { name: 'Unbounded tags array (>8)', path: '/users/uid1/journalEntries/j1', op: 'create', payload: { tags: Array.from({ length: 12 }, (_, i) => `tag${i}`) } },
  { name: 'Client timestamp spoofing', path: '/users/uid1/ledgerEntries/e1', op: 'create', payload: { createdAt: '2020-01-01T00:00:00Z' } },
  { name: 'Negative amountUsd poisoning', path: '/users/uid1/ledgerEntries/e1', op: 'create', payload: { amountUsd: -50 } },
  { name: 'Cross-user enrollment list', path: '/users/uid1/enrollments', op: 'list', auth: { uid: 'uid2', email_verified: true } },
  { name: 'Mutating cleared withdrawal', path: '/users/uid1/withdrawals/w1', op: 'update', existingStatus: 'Cleared' },
];

export function verifyRulesStructure(rulesPath = 'firestore.rules') {
  const content = readFileSync(rulesPath, 'utf8');
  return (
    content.includes("rules_version = '2';") &&
    content.includes('allow read, write: if false;') &&
    content.includes('request.auth.token.email_verified == true') &&
    content.includes('isValidWorkspaceState') &&
    content.includes('isValidLedgerEntry') &&
    content.includes('isValidWithdrawal') &&
    content.includes('isValidJournalEntry') &&
    content.includes('isValidEnrollment')
  );
}
