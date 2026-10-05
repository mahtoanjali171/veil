# Debug Session: ve-ssr-blank-screen

**Session ID:** `veil-vercel-black-screen`
**Status:** [OPEN]
**Opened:** 2026-10-05
**URL under test:** `https://veil-3bu9-git-main-anjali-34ec.vercel.app/`
**Symptom:** Deployed app shows a completely black screen (no UI painted, no React mount visible, theme is dark so body background renders, but `#root` stays empty).

---

## Falsifiable Hypotheses

1. **H1 — Missing / wrong `index.html` on Vercel.** The SPABootstrap plugin wrote an `index.html` referencing hashed asset filenames (e.g. `index-DRAtpBjY.js`) that were generated on my local build, but the Vercel remote rebuild re-rolled new hashes so the deployed HTML references non-existent asset files → 404 on entry JS → no React mount → dark body appears as "black screen".
2. **H2 — TanStack Router SSR-expectant boot.** [start.ts](file:///c:/Users/HP/Documents/trae_projects/privshield/src/start.ts) and/or `@tanstack/react-start` client bootstrap performs `hydrateRoot()` expecting SSR markup to exist, but our static `index.html` has a bare `<div id="root"></div>` with no rendered body. If the runtime throws during hydrate (SSR mismatch) and doesn't fall back to `createRoot`, the app silently dies.
3. **H3 — TanStack file-routing mismatch with static HTML.** Vercel serves `index.html` on `/` because of the rewrite rule, but `/dashboard` etc. also hit `index.html`. If TanStack Router's static-entry adapter checks for `window.__TSR__` or `window.__TANSTACK_START_DATA__` hydration markers that aren't present (since there's no SSR render), the router aborts.
4. **H4 — JS modules load but fail inside #root render.** Assets are correctly fetched (200), but React throws during mount because of e.g. `useSyncExternalStore` in the store failing (it returns `DEFAULT_STATE` on first snapshot but the store's `getSnapshot` reads `window.localStorage` during SSR-hydration phase before `typeof window !== "undefined"` guard passes, causing a ReferenceError in strict ESM).
5. **H5 — Wrong output folder picked.** Despite `vercel.json` declaring `"outputDirectory": "dist/client"`, Vercel might be serving from `dist/` or the project root instead (some older Build Output API behaviors), so assets resolve to `/assets/*` but the directory isn't present → 404s.

---

## Evidence Log

| Timestamp | Step | Source | Finding |
| --------- | ---- | ------ | ------- |
|           |      |        |         |

---

## Conclusion

_(TBD after evidence collected.)_
