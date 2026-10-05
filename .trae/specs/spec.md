# Specification: Veil — Production Privacy Firewall

## Problem

The current codebase ships as a **prototype** named **PrivacyShield AI**. It contains:

- Hard-coded demo scan history and fake dashboard counters.
- Pre-filled demo prompts and "Try Demo" buttons that fill sample PII.
- Prototype language ("Prototype Detection Engine", "Built for BitShift Hackathon 2.0", "swap in AI-grade detector later").
- A name and logo that the user wants changed to **Veil**.
- No document upload or document management — only a single paste-in textarea scanner.

The product needs to feel like a real, shipping SaaS privacy tool with a believable brand, clean empty states, real document intake, and a document library.

## Users

- **Security / compliance admins** configuring policies and reviewing audit history.
- **Individual contributors** pasting prompts or dropping documents before sending to an LLM.
- **Engineering teams** embedding this firewall in workflows.

## Goals

1. Rename the product **PrivacyShield AI → Veil** everywhere (UI, meta, URLs, storage key, footer, code references that surface to the user).
2. Replace the current shield-checkmark logo with a **Veil** identity (unique SVG mark + wordmark "Veil").
3. **Remove all demo / fake / seed data**:
   - No SEED history array; history starts empty.
   - No hard-coded `1248 + extra`, `327 + threats`, `2841 + entities` counters on the dashboard; compute from real history + document counts.
   - Remove `DEMO_PROMPT`, `BLOCKED_DEMO`, and the "Try Demo" / "Blocked example" one-click demo loader buttons.
   - Remove "Demo workspace" user banner and "Security Admin" placeholder card data that says "Demo".
4. **Add document support** to the existing Scanner page:
   - File input (click + drag-and-drop area) that accepts `.txt`, `.md`, `.csv`, `.json`, `.docx`, `.pdf` extensions.
   - Read and extract text content natively where possible (`.txt`, `.md`, `.csv`, `.json` read directly; `.docx`/`.pdf` attempt basic text extraction via available client APIs or surface a clear "document ingested" state with text preview).
   - After a document is loaded, insert its text into the existing scanner flow so the same detection/scoring/sanitization pipeline runs.
   - Persist documents to local storage (or in-memory state backed by the store) so they appear in a library.
5. **Add a Documents page** (new route `/documents`) that lists uploaded documents with:
   - Document name, size, uploaded-at timestamp, last scan result (if scanned), detected-entity count, risk-score badge, per-row actions (scan, view, download sanitized, delete).
   - Empty state when the library is empty (no fake seed documents).
   - Upload widget at the top consistent with the Scanner page uploader.
6. **Remove "prototype" / hackathon / temporary language** from all public-facing copy and replace with product-grade wording that does not read as AI-generated template copy. Specifically:
   - Replace "Prototype Detection Engine" pill and paragraph with production language.
   - Remove "Built for BitShift Hackathon 2.0" footer line and About-page callout.
   - Rewrite marketing copy, taglines, and feature descriptions to be more concise, specific, and human-authored feeling (avoid generic stack-of-benefits bullet-point patterns that feel templated).
7. **Keep existing page and UI structure intact**:
   - Same routes except the _addition_ of `/documents`.
   - Same component layout hierarchy (header, sidebar, panel structure, tables, chips, modals).
   - Same design system, Tailwind tokens, colors, radii — only swap the logo mark and brand name.

## Non-Goals

- No backend, no real LLM API integration, no user auth / multi-tenancy (remains single-user local-first).
- No new design system tokens or full visual rebrand (keep existing dark theme, radii, panel utility).
- No rewrite of the detection engine itself; keep the regex/heuristic detector but stop advertising it as a prototype.
- No new chart types or dashboard layout change (just make the existing 4 stat cards compute real values).
- No mobile-app-only or desktop-app-only features; it remains a web app.

## Functional Requirements

FR1. Every visible brand reference must say **Veil** (including but not limited to: logo wordmark, browser titles, meta description/OG tags, footer, sidebar header, pill labels, error messages, empty states).
FR2. The logo must render a unique SVG mark (a stylized "V" / layered-veil shape) inside a rounded square, paired with the word **Veil** next to it. The shield-and-check icon must be removed from the logo (it may remain as a semantic icon inside other UI where it means "safe/protected").
FR3. History initial state is an empty array. First-time visitors see a clear empty state with no pre-populated scans.
FR4. Dashboard stat cards compute values from:

- **Total Scans** = `history.length`
- **Threats Detected** = count of history items where `entityCount > 0`
- **Data Protected** = sum of `entityCount` across all history + documents scanned
- **Firewall Status** = `settings.firewall ? "ACTIVE" : "OFF"` (unchanged)
  FR5. Scanner supports both (a) pasting plain text and (b) uploading one or more documents. Uploaded documents become available in the Documents library.
  FR6. The Documents page (`/documents`) is reachable via the sidebar and header nav. The route `/documents` renders the AppShell with a documents list.
  FR7. Every file added via upload receives a stable ID, name, size, `uploadedAt` timestamp, optional `lastScanId`, `entityCount`, `score`. Documents can be deleted.
  FR8. All "Try Demo", "Blocked example", `DEMO_PROMPT`, `BLOCKED_DEMO` references are deleted. Scanner shows a single clear CTA: paste or drop a file.
  FR9. Sidebar footer shows a generic user profile card that does not say "Demo workspace". Example: initials + "Workspace" / "Local session".
  FR10. About page describes Veil as a shipping product and removes all hackathon, prototype, and "replace detection later" copy.
  FR11. Local storage key is migrated to a Veil-specific key so users don't see stale PrivacyShield demo data; a one-time migration reads the old key if present, drops seed entries, and writes to the new key.

## Non-Functional Requirements

NFR1. Page structure remains identical so that existing routes (`/`, `/about`, `/dashboard`, `/scanner`, `/policies`, `/history`, `/settings`, plus new `/documents`) map 1:1 to the same layouts.
NFR2. Build succeeds with zero type errors, no lint errors (warnings are acceptable if pre-existing).
NFR3. Text copy is written in natural English without generic stack-of-feelings phrasing. Prefer short, concrete sentences over marketing puffery.
NFR4. Document upload does **not** break when files larger than 2 MB are provided; surface a size hint and truncate gracefully with a message.
NFR5. Empty states on History and Documents must be informative but honest — no fake sample rows.

## Constraints & Dependencies

- Client-side only: uses existing TanStack Start + React + localStorage.
- Re-uses existing shadcn/ui components (`button`, `input`, `card`, `table`, `dialog`, `badge`, `progress`, `scroll-area`, `sonner` toasts).
- Re-uses `scanText()` pipeline from [detection.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/lib/detection.ts).
- For text extraction from `.docx`/`.pdf` client-side without adding heavy deps: graceful fall-back to showing "text unavailable for this format; paste the content above" and still record the document metadata.

## Assumptions

- "Make it look not AI generated" is interpreted as: remove template-y / generic / overly symmetrical benefit grids, reduce the number of identical-shaped panels in a row where possible, add slightly more idiosyncratic copy, small realistic imperfections like varied sentence lengths, a couple of honest disclaimers rather than perfect claims, and an empty-state that genuinely looks like a first-run experience.
- Logo is an inline SVG (no image file dependency needed).

## Open Questions

None at this time; the scope above is self-contained and client-side feasible.

---

## Acceptance Criteria

### Rule ACs

AC1 (rule) — `grep -r -i "privacyshield"` over `src/` returns no UI-visible matches (matches inside comments-only don't count; matches in meta titles, copy, labels, aria do).
AC2 (rule) — `grep -r -i "prototype\|hackathon\|BitShift\|DEMO_PROMPT\|BLOCKED_DEMO\|Demo workspace\|Security Admin\|demo"` over `src/` returns no UI-visible matches after the change (excluding words that legitimately appear inside detection logic like variable names that never render).
AC3 (rule) — Running the app on a fresh browser profile (localStorage cleared) shows:

- 0 items in History, with an empty state.
- 0 items in Documents, with an empty state.
- 4 Dashboard stats all = 0 or ACTIVE/OFF computed from real state (no `1248`, `327`, `2841` numbers).
  AC4 (rule) — Route `/documents` exists, renders inside AppShell, and is listed in sidebar + landing nav.
  AC5 (rule) — Scanner page has a file drop zone that accepts at minimum `.txt`, `.md`, `.csv`, `.json`. Dropping a `.txt` file containing PII populates the textarea and scanning produces a result.
  AC6 (rule) — Scanner page no longer renders buttons labeled "Try Demo" or "Blocked example".
  AC7 (rule) — Logo component no longer uses `ShieldCheck` as its primary mark; a distinct new SVG mark is rendered and the wordmark is "Veil".
  AC8 (rule) — All 4 dashboard stat cards derive their numbers from `useStore` selectors that reduce over real arrays; no constant-offset arithmetic such as `1248 + extra`.
  AC9 (rule) — TypeScript `tsc --noEmit` exits 0; `npm run build` exits 0; `npm run test` exits 0; `npm run lint` exits with 0 errors.
  AC10 (rule) — `history` store initializer is an empty array; SEED constant is deleted or not referenced by default state.

### Rubric ACs

AC11 (rubric) — **Authenticity of copy / "not AI generated" feel** (0-4, pass ≥ 3).

- 0: Identical generic template marketing copy.
- 1: Minor edits, still reads like AI fluff.
- 2: Noticeably changed but still very formulaic (equal-length cards, mirroring claims).
- 3: Copy is shorter, more concrete. Some sentences are messy/honest, feature descriptions are specific, tone is grounded. Empty states read like a person wrote them.
- 4: Fully idiosyncratic voice; disclaimers, asides, and realistic warts present.
  AC12 (rubric) — **Brand consistency of "Veil" rename** (0-2, pass ≥ 2).
- 0: Missed surface in UI copy or meta.
- 1: All visible text renamed but logo mark is generic.
- 2: Every user-facing string (titles, meta, footer, nav, buttons, pills, empty states) says Veil; the SVG mark is distinct and pairs with the wordmark cleanly.
  AC13 (rubric) — **Fidelity to existing UI/page structure** (0-2, pass ≥ 2).
- 0: New pages break established panel/nav/grid patterns.
- 1: Mostly preserved but one page deviates noticeably.
- 2: Every page keeps original grid, shell, header, sidebar, and panel styling; Documents page fits the pattern seamlessly.
