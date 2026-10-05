# Implementation Tasks: Veil Production Privacy Firewall

Each task maps to one or more Acceptance Criteria in `spec.md`. A task is `completed` only when every task-local Test Requirement (TR) passes self-verification and evidence is recorded.

---

## Task 1: Brand rename (PrivacyShield → Veil) + new logo

**Scope:** All files containing user-facing "PrivacyShield" strings; [AppShell.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/AppShell.tsx) (Logo + sidebar brand); all routes' head meta tags; [__root.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/__root.tsx) (default title); [Marketing.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Marketing.tsx) (Footer); [store.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/lib/store.ts) (storage key); [Diagrams.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Diagrams.tsx) (architecture diagram label).

**Dependencies:** None.

**Priority:** High.

### Test Requirements

TR1 (rule, covers AC2+AC7) — In [AppShell.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/AppShell.tsx), `Logo()` renders a new inline SVG mark (a stylized layered "V" / veil shape — NOT `ShieldCheck`) inside a rounded square, and the wordmark is "Veil". Evidence: visual inspection of the rendered Logo function source.
TR2 (rule, covers AC1+AC12) — All `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">` values across [index.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/index.tsx), [scanner.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/scanner.tsx), [dashboard.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/dashboard.tsx), [history.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/history.tsx), [policies.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/policies.tsx), [settings.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/settings.tsx), [about.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/about.tsx), and [__root.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/__root.tsx) contain "Veil" and do NOT contain "PrivacyShield" or "Privacy Shield".
TR3 (rule, covers AC1) — Storage key in [store.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/lib/store.ts) changes from `privacyshield-state-v1` to `veil-state-v1` with a one-time migration block that (a) reads the old key if present, (b) drops any items whose `id.startsWith("SCN-1")` pattern from seed, (c) writes to the new key.
TR4 (rule, covers AC1+AC12) — Sidebar footer's initials card text does NOT say "Demo workspace" or "Security Admin" (see Task 2 TR5 for replacement; this TR just blocks the demo strings).
TR5 (rule, covers AC1) — Architecture diagram's header pill in [Diagrams.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Diagrams.tsx) reads "VEIL FIREWALL" instead of "PRIVACYSHIELD FIREWALL".

---

## Task 2: Remove demo / fake / seed data + real Dashboard stats

**Scope:** [store.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/lib/store.ts) (seed history array → []); [dashboard.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/dashboard.tsx) (4 stat cards compute from store); [detection.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/lib/detection.ts) (delete `DEMO_PROMPT`, `BLOCKED_DEMO` exports); [Scanner.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Scanner.tsx) (remove demo loaders + prototype pill/paragraph); [AppShell.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/AppShell.tsx) (sidebar footer user card copy); [Marketing.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Marketing.tsx) (footer hackathon line); [about.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/about.tsx) (hackathon + prototype lines).

**Dependencies:** None (can run in parallel with Task 1 on non-overlapping files; overlap in Scanner.tsx → do Task 1 first then this one).

**Priority:** High.

### Test Requirements

TR6 (rule, covers AC10) — `DEFAULT_STATE.history === []` in [store.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/lib/store.ts). The `SEED` array either does not exist or is not referenced from `DEFAULT_STATE`.
TR7 (rule, covers AC8) — In [dashboard.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/dashboard.tsx) the 4 stat cards use pure reductions over store arrays (no literal constant `1248`, `327`, `2841`, no `- 5`, `- 12` offset arithmetic).
TR8 (rule, covers AC6) — [Scanner.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Scanner.tsx) exports no `DEMO_PROMPT` / `BLOCKED_DEMO` imports; no `<Button>` with labels "Try Demo" or "Blocked example" or calls to `loadDemo()`.
TR9 (rule, covers AC2) — "Prototype Detection Engine" pill and `FlaskConical` badge and the explanatory paragraph below Scanner buttons are removed from [Scanner.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Scanner.tsx).
TR10 (rule, covers AC2+AC4 TR slot) — Sidebar footer card in [AppShell.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/AppShell.tsx) reads as "Local session" / "Workspace" (not "Security Admin" / "Demo workspace"). Suggested: initials "WS", label "Workspace owner", subtitle "Local session".
TR11 (rule, covers AC2) — Footer in [Marketing.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Marketing.tsx) does NOT contain "BitShift Hackathon 2.0". Replace with an authentic, understated product line (e.g., "© Veil — data never leaves this device").
TR12 (rule, covers AC2) — [about.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/about.tsx) has no paragraph containing "prototype detection engine in the browser" or "BitShift Hackathon". Copy is rewritten to describe Veil as a shipping privacy boundary (see Task 5 TR19).

---

## Task 3: Documents state + scan pipeline in the store

**Scope:** [store.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/lib/store.ts) — add `documents` slice, action helpers; extend `HistoryItem` if needed; add `addDocument`, `updateDocumentScan`, `deleteDocument` helpers.

**Dependencies:** None (foundation for Tasks 4 and 5).

**Priority:** High.

### Test Requirements

TR13 (rule, covers FR7) — `State` interface in [store.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/lib/store.ts) includes `documents: VeilDocument[]` where `VeilDocument` has `{ id, name, size (bytes), uploadedAt (ms), mimeType, content?, lastScanId?, entityCount?, score? }`.
TR14 (rule, covers FR7) — `addDocument()`, `updateDocumentScan(id, patch)`, `deleteDocument(id)` helpers exist and call `setState()` correctly.
TR15 (rule, covers AC3) — `DEFAULT_STATE.documents === []`.

---

## Task 4: Scanner page document upload (drag & drop + file picker)

**Scope:** [Scanner.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Scanner.tsx) — add a drop-zone/file-picker above or beside the existing textarea; handle file read for `.txt`, `.md`, `.csv`, `.json` as text; graceful handling for `.docx`/`.pdf` (ingest metadata + show message); call `addDocument()` + auto-fill textarea + optional auto-scan.

**Dependencies:** Task 3 (documents state).

**Priority:** High.

### Test Requirements

TR16 (rule, covers AC5) — [Scanner.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Scanner.tsx) renders an `<input type="file" accept=".txt,.md,.csv,.json,.docx,.pdf">` plus a visible drop-area (any `dragenter`/`dragover`/`drop` handler registered on the zone).
TR17 (rule, covers FR5+FR7) — Dropping a `.txt` file with PII content: (a) `addDocument()` writes to store; (b) textarea value equals file content; (c) scanning calls the same `scanText()` path; (d) toast fires.
TR18 (rule, covers NFR4) — A file > 2 MB is rejected with a toast message and NOT added to the document library. 2 MB threshold is configurable in one place.

---

## Task 5: Add `/documents` route and Documents page list UI

**Scope:** New file [documents.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/documents.tsx); register in sidebar NAV inside [AppShell.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/AppShell.tsx) and landing nav in [index.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/index.tsx). Reuse `AppShell` layout, table/card/list components from History for consistency.

**Dependencies:** Task 3.

**Priority:** High.

### Test Requirements

TR19 (rule, covers AC4) — Route `/documents` exists via new file and TanStack Router's file routing. Head meta says "Documents | Veil".
TR20 (rule, covers AC4) — Sidebar `NAV` in [AppShell.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/AppShell.tsx) includes `/documents` (label "Documents", icon `FileText` from lucide-react).
TR21 (rule, covers FR6) — Documents page renders: header title "Documents", subtitle, uploader widget at top, then a responsive table/card list mirroring History's table layout.
TR22 (rule, covers FR7) — Each row shows: filename, size (humanized), uploaded date (relative like "Today, 14:22"), entity count (if scanned), risk badge (if scanned), and row actions (Scan / View details / Download sanitized / Delete).
TR23 (rule, covers AC3) — When documents list is empty, an informative empty state is rendered (no fake rows).
TR24 (rule, covers FR7) — "Delete" removes the row via `deleteDocument()` and fires a toast.

---

## Task 6: Authenticity pass on marketing copy + about + landing

**Scope:** [index.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/index.tsx) landing hero copy, 3-card feature row, footer tagline; [Marketing.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/components/shield/Marketing.tsx) PrivacyByDesign cards; [about.tsx](file:///c:/Users/HP/Documents/trae_projects/privshield/src/routes/about.tsx) narrative; scanner subtitles/placeholders; policies subtitles; settings subtitles.

**Dependencies:** None (soft overlap with Task 1 strings — task 1 handles the rename, this task rewrites tone/structure).

**Priority:** High.

### Test Requirements

TR25 (rubric, covers AC11 — authenticity score) — After edits, score ≥ 3.
Evidence: Landing hero ≤ 2 short value-prop sentences (not 3 stacked marketing claims); feature row descriptions name concrete actions ("Detects names, emails, cards, keys, patient IDs, contracts — 16 types") instead of generic "AI-grade detection"; one honest disclaimer appears on the landing or About page noting that detection runs locally in the browser on submitted content.
TR26 (rule, covers AC11 — "not AI generated" feel structural check) — Landing page 3 feature cards have deliberately different lengths/visual weight (not pixel-symmetric identical heights). E.g., one card's description is 1 line, another 2 lines.
TR27 (rule, covers AC2 prototype language) — `index.tsx` feature cards no longer say "swap in an AI-grade detector later" or "Regex + heuristics prototype".
TR28 (rule, covers FR8) — Scanner `PLACEHOLDER` no longer includes sample PII email/phone ("john.doe@example.com", "+91 9876543210", "PT-92831"). Write a neutral, realistic placeholder WITHOUT example PII values.

---

## Task 7: Verification (typecheck / lint / build / tests)

**Scope:** After Tasks 1–6 merge, run `tsc --noEmit`, `npm run lint`, `npm run build`, `npm run test`, and `GetDiagnostics`; fix resulting issues.

**Dependencies:** Tasks 1–6.

**Priority:** High.

### Test Requirements

TR29 (rule, covers AC9) — `npx tsc --noEmit` exit code 0.
TR30 (rule, covers AC9) — `npm run lint` reports 0 errors (warnings allowed).
TR31 (rule, covers AC9) — `npm run build` completes without hard errors.
TR32 (rule, covers AC9) — `npm run test` reports 1/1 tests passed.
TR33 (rule, covers AC9) — VS Code diagnostics via `GetDiagnostics` return 0 errors.
