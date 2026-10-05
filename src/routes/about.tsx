import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shield/AppShell";
import { ArchitectureDiagram, FirewallTimeline } from "@/components/shield/Diagrams";
import { PrivacyByDesign } from "@/components/shield/Marketing";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | Veil" },
      {
        name: "description",
        content:
          "How Veil works: a client-side privacy firewall that detects, classifies, scores and sanitizes sensitive data before it reaches an LLM.",
      },
      { property: "og:title", content: "About Veil" },
      { property: "og:description", content: "Your privacy boundary for the AI era." },
    ],
  }),
  component: () => (
    <AppShell title="About Veil" subtitle="Your privacy boundary for the AI era.">
      <div className="space-y-10">
        <div className="max-w-3xl space-y-4 leading-relaxed text-muted-foreground">
          <p>
            Teams paste all kinds of things into AI assistants — support tickets, customer notes,
            contracts, incident reports, config files. A lot of that content wasn't meant to leave
            the building.
          </p>
          <p>
            Veil sits between your input and the model. It detects names, emails, phone numbers,
            addresses, card numbers, API keys, passwords, authentication tokens, government IDs,
            medical mentions, patient IDs, customer references and internal confidentiality markers.
            Each match is weighed, the prompt is scored, and your policies decide what gets masked,
            redacted, anonymized, tokenized, reviewed — or blocked entirely. Only the sanitized
            output continues.
          </p>
          <p>
            Detection runs locally in your browser on whatever you submit. Nothing is sent
            off-device unless you explicitly forward the protected output to your LLM provider.
          </p>
        </div>
        <ArchitectureDiagram />
        <section className="panel p-6">
          <h2 className="mb-6 text-lg font-semibold">How the Firewall Works</h2>
          <FirewallTimeline />
        </section>
        <PrivacyByDesign />
        <p className="text-sm text-muted-foreground">
          Built as a client-first product. Your data stays on your device unless you decide
          otherwise.
        </p>
      </div>
    </AppShell>
  ),
});
