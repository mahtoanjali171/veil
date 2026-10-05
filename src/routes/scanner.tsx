import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shield/AppShell";
import { Scanner } from "@/components/shield/Scanner";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner | Veil" },
      {
        name: "description",
        content:
          "Paste text or drop a document. Veil detects PII and credentials, scores the risk, and produces a safe, redacted version for your LLM.",
      },
      { property: "og:title", content: "Scanner | Veil" },
      {
        property: "og:description",
        content: "Detect, score and sanitize text and documents before they reach an LLM.",
      },
    ],
  }),
  component: () => (
    <AppShell
      title="Scanner"
      subtitle="Paste text or drop a document. Only the protected output leaves the firewall."
    >
      <Scanner />
    </AppShell>
  ),
});
