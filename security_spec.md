# Security Specification & Dirty Dozen TDD Payloads

## 1. Data Invariants
1. Every document under `/users/{userId}/...` belongs strictly to `userId` and requires `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
2. Every document must pass its strict `isValid[Entity]()` schema check on both `create` and `update`, enforcing exact `keys().hasAll(...)` and `keys().hasOnly(...)` to block shadow fields.
3. All document IDs (`userId`, `entryId`, `withdrawalId`, `journalId`, `enrollmentId`) must match `^[a-zA-Z0-9_-]+$` and `size() <= 128`.
4. All timestamps (`createdAt`, `updatedAt`) must match `request.time`.
5. Array fields (`completedChecklistIds`, `completedWeeklyTaskIds`, `tags`) are strictly bounded (`<= 250` for progress checklists, `<= 8` for journal tags).
6. Enrollment PII (`buyerName`, `buyerContact`) is strictly owner-isolated under `/users/{userId}/enrollments/{enrollmentId}` with zero public or cross-user read access.

## 2. Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read/write to `/users/uid1/workspace/state` (fails Master Gate).
2. Unverified email user writing `/users/uid1/ledgerEntries/e1` (`email_verified == false`).
3. Cross-user read/write by `uid2` on `/users/uid1/withdrawals/w1` (fails `isOwner(userId)`).
4. Identity spoofing: `uid1` creating `/users/uid1/ledgerEntries/e1` with `uid: "uid2"`.
5. Shadow field injection: `uid1` creating `UserWorkspaceState` with extra field `isAdmin: true`.
6. Invalid document ID poisoning: `entryId` exceeding 128 chars or containing invalid characters.
7. Oversized string DoW attack: `reflection` > 1000 chars in `JournalEntry`.
8. Unbounded array injection: `tags` with 25 entries in `JournalEntry` (limit 8).
9. Timestamp spoofing: `createdAt` set to client date instead of `request.time`.
10. Negative financial poisoning: `amountUsd: -50` or `grossUsd: -100` in `LedgerEntry` / `WithdrawalRecord`.
11. Cross-user list query attempt on `/users/uid1/enrollments` by `uid2`.
12. Terminal state shortcutting / tampering: mutating immutable `createdAt` or `uid` on `update`.
