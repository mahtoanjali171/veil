import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  ShieldOff,
  ScanSearch,
  Gauge,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { Logo } from "@/components/shield/AppShell";
import { ArchitectureDiagram, FirewallTimeline } from "@/components/shield/Diagrams";
import { Footer, PrivacyByDesign } from "@/components/shield/Marketing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Veil | Privacy Firewall for LLMs",
      },
      {
        name: "description",
        content:
          "Veil detects PII, credentials and confidential data before they reach an LLM. Paste a prompt or drop a document, apply your policy, send only the safe version.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Veil | Privacy Firewall for LLMs" },
      {
        property: "og:description",
        content:
          "Detect names, cards, keys, patient records and contracts in any prompt or document. Score the risk, apply your policy, forward only the sanitized output.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/about" className="px-3 py-2 text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link to="/documents" className="px-3 py-2 text-muted-foreground hover:text-foreground">
              Documents
            </Link>
            <Link to="/dashboard" className="px-3 py-2 text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link
              to="/scanner"
              className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              <ScanSearch className="size-4" aria-hidden /> Try Scanner
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 font-mono text-[11px] font-medium tracking-wider text-primary">
            <ShieldCheck className="size-3.5" aria-hidden /> PRIVACY FIREWALL
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Keep sensitive data <span className="text-primary">out</span> of your LLM calls.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Paste a prompt, support ticket or contract. Veil detects names, emails, cards, keys,
            patient IDs and internal labels, scores the risk, applies your policy and forwards only
            the sanitized version.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/scanner"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ScanSearch className="size-4" aria-hidden /> Scan text
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/documents"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <FileText className="size-4" aria-hidden /> Upload documents
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
            <div className="panel p-5">
              <ScanSearch className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">Detection</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Covers 16 entity types — names, emails, cards, keys, patient IDs, internal
                confidentiality markers and more.
              </p>
            </div>
            <div className="panel p-5">
              <Gauge className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">Risk scoring</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Weighted score across 6 categories, plus category spread bumping mixed exposures.
              </p>
            </div>
            <div className="panel p-5">
              <SlidersHorizontal className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">Your policy</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Allow, warn, mask, redact, anonymize, tokenize, review or block — per data type.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-16 space-y-16">
          <section aria-labelledby="how">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 id="how" className="text-2xl font-semibold sm:text-3xl">
                  How the firewall works
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Seven stages from raw input to safe LLM output.
                </p>
              </div>
              <Link
                to="/about"
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex sm:items-center sm:gap-1"
              >
                Learn more <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <div className="panel p-6 sm:p-8">
              <FirewallTimeline />
            </div>
          </section>

          <section aria-labelledby="arch">
            <div className="mb-6">
              <h2 id="arch" className="text-2xl font-semibold sm:text-3xl">
                Architecture at a glance
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                One boundary between your users and every model they talk to.
              </p>
            </div>
            <ArchitectureDiagram />
          </section>

          <PrivacyByDesign />

          <section className="panel grid-bg p-8 text-center sm:p-12">
            <ShieldOff className="mx-auto size-8 text-danger" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
              Zero trust. Every prompt. Every model.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Nothing gets a pass. If it looks sensitive, Veil decides before the model ever sees
              it.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/policies"
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Configure policies
              </Link>
              <Link
                to="/scanner"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ScanSearch className="size-4" aria-hidden /> Start scanning
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
