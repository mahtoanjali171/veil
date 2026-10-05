import { createFileRoute } from "@tanstack/react-router";
import { Activity, ShieldAlert, Database, ShieldCheck, FileText } from "lucide-react";
import { AppShell } from "@/components/shield/AppShell";
import { Scanner } from "@/components/shield/Scanner";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Veil" },
      {
        name: "description",
        content: "Monitor scans, detected entities and firewall status across your Veil workspace.",
      },
      { property: "og:title", content: "Dashboard | Veil" },
      {
        property: "og:description",
        content: "Monitor sensitive data detections and firewall activity.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const history = useStore((s) => s.history);
  const documents = useStore((s) => s.documents);
  const firewall = useStore((s) => s.settings.firewall);

  const totalScans = history.length;
  const threatsDetected = history.filter((h) => h.entityCount > 0).length;
  const protectedFromHistory = history.reduce((n, h) => n + h.entityCount, 0);
  const protectedFromDocs = documents.reduce((n, d) => n + (d.entityCount ?? 0), 0);
  const entitiesProtected = protectedFromHistory + protectedFromDocs;

  const docsUploaded = documents.length;

  const stats = [
    {
      label: "Total Scans",
      value: totalScans.toLocaleString(),
      icon: Activity,
      tone: "text-primary",
    },
    {
      label: "Threats Detected",
      value: threatsDetected.toLocaleString(),
      icon: ShieldAlert,
      tone: "text-warning",
    },
    {
      label: "Data Protected",
      value: entitiesProtected > 0 ? `${entitiesProtected.toLocaleString()} entities` : "—",
      icon: Database,
      tone: "text-ent-contact",
    },
    {
      label: "Firewall Status",
      value: firewall ? "ACTIVE" : "OFF",
      icon: ShieldCheck,
      tone: firewall ? "text-safe" : "text-danger",
    },
  ];

  const secondary = [
    {
      label: "Documents Ingested",
      value: docsUploaded.toLocaleString(),
      icon: FileText,
      tone: "text-primary",
    },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Monitor firewall activity, detections and the documents you've ingested."
    >
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
              <Icon className={`size-4 ${tone}`} aria-hidden />
            </div>
            <p
              className={`mt-3 font-display text-xl font-semibold tabular-nums sm:text-2xl ${
                label === "Firewall Status" ? tone : ""
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {secondary.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
              <Icon className={`size-4 ${tone}`} aria-hidden />
            </div>
            <p className="mt-3 font-display text-xl font-semibold tabular-nums sm:text-2xl">
              {value}
            </p>
          </div>
        ))}
      </div>

      <Scanner />
    </AppShell>
  );
}
