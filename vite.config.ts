import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SPABootstrap — writes dist/client/index.html after every build so
 * static hosts (Vercel, Netlify, Pages) can serve the SSR-rendered shell
 * directly without a running Node SSR server.
 *
 * Flow:
 *   1. SSR success path: import dist/server/server.js, call fetch("/")
 *      with a synthetic Request and persist the HTML response.  This
 *      gives us the full pre-rendered document that TanStack's client
 *      entry can hydrate directly.
 *   2. Fallback path (SSR import/render failed or was skipped):
 *      build a well-formed static HTML shell with:
 *        • <html lang="en" class="dark"> matching RootShell exactly
 *        • all <head> meta tags, fonts, stylesheet links, favicon
 *        • entry-module script + polyfill modulepreload (discovered from
 *          the freshly-built dist/client/assets/)
 *        • window.__VEGILATE_SSR__ = false — checked by src/client.ts
 *          so the client boot uses `createRoot` instead of `hydrateRoot`
 *          (no SSR content means hydrate would mismatch and fail).
 */
const SPABootstrap = {
  name: "veil-spa-bootstrap",
  async closeBundle() {
    const outClient = path.resolve(__dirname, "dist", "client");
    const serverBundle = path.resolve(__dirname, "dist", "server", "server.js");

    if (!fs.existsSync(outClient)) {
      console.log("[veil-spa-bootstrap] dist/client missing — skipping index.html emit");
      return;
    }

    let html: string | undefined;
    let mode: "ssr" | "fallback" = "fallback";

    if (fs.existsSync(serverBundle)) {
      let handler:
        | {
            fetch?: (req: Request, env?: unknown, ctx?: unknown) => Promise<Response> | Response;
          }
        | undefined;
      try {
        const url = pathToFileURL(serverBundle).href + "?t=" + Date.now();
        const mod = await import(url);
        handler = (mod.default ?? mod) as typeof handler;
        console.log("[veil-spa-bootstrap] SSR server bundle imported OK");
      } catch (e) {
        console.warn("[veil-spa-bootstrap] SSR server import FAILED — will use fallback shell", e);
      }

      if (handler && typeof handler.fetch === "function") {
        try {
          const startUrl = "https://local.build/";
          let req = new Request(startUrl, {
            headers: {
              Accept: "text/html",
              "User-Agent": "veil-spa-bootstrap/1.0",
            },
          });
          let jumps = 0;
          while (jumps < 8) {
            const res = await handler.fetch(req, {}, {});
            if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
              const next = new URL(res.headers.get("location")!, startUrl).href;
              console.log(`[veil-spa-bootstrap] SSR redirect ${res.status} → ${next}`);
              req = new Request(next, { headers: { Accept: "text/html" } });
              jumps += 1;
              continue;
            }
            const body = await res.text();
            const head = body.trim().slice(0, 30).toLowerCase();
            if (res.ok && (head.startsWith("<!doctype") || head.startsWith("<!doctype "))) {
              html = body;
              mode = "ssr";
              console.log(
                `[veil-spa-bootstrap] SSR render OK (${res.status}, ${body.length.toLocaleString()} bytes)`,
              );
            } else {
              console.warn(
                `[veil-spa-bootstrap] SSR render non-HTML response status=${res.status} head=${JSON.stringify(
                  head,
                )} — will use fallback shell`,
              );
            }
            break;
          }
        } catch (e) {
          console.warn("[veil-spa-bootstrap] SSR render THREW — will use fallback shell", e);
        }
      }
    } else {
      console.warn("[veil-spa-bootstrap] dist/server/server.js missing — using fallback shell");
    }

    if (!html) {
      const assetsDir = path.join(outClient, "assets");
      let entry: string | undefined;
      let styles: string | undefined;
      let polyfills: string | undefined;
      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir);
        entry = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
        styles = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
        polyfills = files.find((f) => f.startsWith("es2015-") && f.endsWith(".js"));
        console.log(
          `[veil-spa-bootstrap] fallback shell: entry=${entry ?? "MISSING"} styles=${styles ?? "MISSING"} polyfills=${polyfills ?? "MISSING"}`,
        );
      } else {
        console.warn(
          "[veil-spa-bootstrap] dist/client/assets/ missing — entry/style references will be omitted",
        );
      }

      html = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0b0f19" />
    <meta name="color-scheme" content="dark" />
    <title>Veil | Privacy Firewall for LLMs</title>
    <meta
      name="description"
      content="Veil detects PII, credentials and confidential data before they reach an LLM. Paste a prompt or drop a document, apply your policy, send only the safe version."
    />
    <meta property="og:site_name" content="Veil" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Veil | Privacy Firewall for LLMs" />
    <meta
      property="og:description"
      content="Detect names, cards, keys, patient records and contracts in any prompt or document. Score the risk, apply your policy, forward only the sanitized output."
    />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
    />
    <script>
      // Tells src/client.ts to use createRoot() instead of hydrateRoot().
      // Must run BEFORE the entry module evaluates.
      window.__VEGILATE_SSR__ = false;
    </script>${
      styles
        ? `
    <link rel="stylesheet" crossorigin href="/assets/${styles}" />`
        : ""
    }${
      polyfills
        ? `
    <link rel="modulepreload" crossorigin href="/assets/${polyfills}" />`
        : ""
    }${
      entry
        ? `
    <script type="module" crossorigin src="/assets/${entry}"></script>`
        : ""
    }
  </head>
  <body></body>
</html>
`;
    }

    const outFile = path.join(outClient, "index.html");
    fs.writeFileSync(outFile, html, "utf8");
    console.log(
      `[veil-spa-bootstrap] wrote index.html via ${mode} shell (${Buffer.byteLength(
        html,
        "utf8",
      ).toLocaleString()} bytes) → ${outFile}`,
    );
  },
};

function pathToFileURL(p: string): URL {
  let absolute = path.resolve(p);
  if (path.sep === "\\") absolute = "/" + absolute.split(path.sep).join("/");
  return new URL("file://" + absolute);
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    SPABootstrap,
  ],
});
