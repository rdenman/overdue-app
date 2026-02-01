# Cursor Rules

## 0. Source of Truth
- `docs/PROJECT_CHARTER.md` is a hard constraint.
- If there is any conflict between instructions and the charter, the charter wins.
- Do not invent features, roles, screens, or behaviors not described in the charter.

---

## 1. Planning Before Coding
- Never attempt to build the full app in one step.
- When asked to implement a feature:
  1. Propose a phased or step-by-step plan.
  2. List files to create or modify.
  3. Wait for confirmation before writing code.

---

## 2. Scope Control
- Work on **one phase or feature at a time**.
- Do not reference future phases unless explicitly asked.
- Avoid speculative abstractions or “future-proofing”.

---

## 3. Offline-First Rules
- Assume the app may be offline at any time.
- UI updates must be optimistic.
- Firestore is the source of truth.
- Last-write-wins conflict resolution is acceptable.
- Do not block user actions on network availability unless explicitly restricted in the charter.

---

## 4. Firebase Usage
### Auth
- Use Firebase Auth as the only authentication mechanism.
- Auth state must be handled centrally.
- No auth logic inside UI components.

### Firestore
- Prefer flat collections.
- Avoid deeply nested subcollections.
- Use explicit TypeScript models for all documents.
- Prefer `withConverter` for Firestore reads/writes.
- Avoid server-side logic unless necessary.

### Cloud Functions
- Only introduce Cloud Functions if a client-only approach is insufficient.
- Prefer callable functions over HTTP endpoints.

---

## 5. Data Modeling
- Define interfaces and data models **before** implementing logic.
- Document Firestore document shapes when first introduced.
- Do not mutate Firestore data ad-hoc inside components.

---

## 6. Code Style & Quality
- TypeScript everywhere.
- Strong typing; avoid `any`.
- Max ~300 LOC per file.
- Prefer small, composable hooks.
- Prefer editing existing files over creating new ones.
- No unused code, no dead abstractions.
- Use escaped entities in React component text, e.g. `&apos;` rather than `'`.
- All file names should use kebab-case, e.g. `my-file.ts` rather than `myFile.ts` or `MyFile.ts`.
- All colors should be defined in the constants file located at `constants/theme.ts`.
- Always support both light and dark mode colors, using `lib/hooks/use-theme-color.ts` to get color values.

---

## 7. UI & UX
- UI should feel instant.
- Use animations deliberately and sparingly.
- Avoid janky or blocking interactions.
- Favor clarity over cleverness.

---

## 8. Communication Rules
- If instructions are ambiguous:
  - Choose the simplest viable option.
  - Explicitly note the assumption.
- Do not explain basic concepts unless asked.
- Summarize changes after non-trivial edits.

---

## 9. Refactors
- Do not refactor unrelated code while implementing a feature.
- Large refactors require explicit approval.

---

## 10. Failure Modes
- If the current approach conflicts with the charter:
  - Stop and explain the conflict.
- If scope is creeping:
  - Pause and summarize what has changed vs. the original intent.
