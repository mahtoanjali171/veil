import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/shield/AppShell";
import { ActionBadge, riskTone } from "@/components/shield/tokens";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_POLICIES, ENTITY_META, TYPE_TO_POLICY } from "@/lib/detection";
import { useStore, type HistoryItem } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History | Veil" },
      {
        name: "description",
        content:
          "Audit trail of every scan run through Veil: entities detected, risk score, actions taken and status.",
      },
      { property: "og:title", content: "History | Veil" },
      { property: "og:description", content: "A transparent audit trail of privacy decisions." },
    ],
  }),
  component: HistoryPage,
});

const FILTERS = ["All", "Protected", "Blocked", "Low Risk", "High Risk"] as const;

function iso(ts: number) {
  return new Date(ts).toISOString();
}

function fmt(ts: number, todayTs: number) {
  const d = new Date(ts);
  const today = new Date(todayTs);
  const y = new Date(todayTs);
  y.setDate(today.getDate() - 1);
  const t = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  if (d.toDateString() === today.toDateString()) return `Today, ${t}`;
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${t}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${t}`;
}

function StatusBadge({ status }: { status: HistoryItem["status"] }) {
  const cls =
    status === "BLOCKED"
      ? "bg-danger/15 text-danger"
      : status === "PROTECTED"
        ? "bg-safe/15 text-safe"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider",
        cls,
      )}
    >
      {status}
    </span>
  );
}

function HistoryPage() {
  const history = useStore((s) => s.history);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<HistoryItem | null>(null);
  const [todayTs, setTodayTs] = useState<number>(() =>
    typeof Date === "undefined" ? 0 : Date.now(),
  );
  useEffect(() => {
    const id = window.setInterval(() => setTodayTs(Date.now()), 60_000);
    setTodayTs(Date.now());
    return () => window.clearInterval(id);
  }, []);

  const rows = useMemo(
    () =>
      history.filter((h) => {
        if (q && !`${h.preview} ${h.id}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (filter === "Protected") return h.status === "PROTECTED";
        if (filter === "Blocked") return h.status === "BLOCKED";
        if (filter === "Low Risk") return h.score <= 25;
        if (filter === "High Risk") return h.score > 50;
        return true;
      }),
    [history, filter, q],
  );

  return (
    <AppShell
      title="History"
      subtitle="Every scan you've run, what it found, and what the firewall did about it."
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter scans">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                filter === f
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search scans…"
            className="pl-9"
            aria-label="Search scans"
          />
        </div>
      </div>

      <div className="panel overflow-hidden">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <h3 className="mt-4 font-semibold">No scans yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When you run a scan from the Scanner page, it will appear here with the entities
              found, risk score and the action Veil took.
            </p>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["Timestamp", "Input Preview", "Entities", "Risk Score", "Action", "Status"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr
                    key={h.id}
                    tabIndex={0}
                    onClick={() => setSel(h)}
                    onKeyDown={(e) => e.key === "Enter" && setSel(h)}
                    className="cursor-pointer border-t border-border/60 transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      <time dateTime={iso(h.timestamp)}>{fmt(h.timestamp, todayTs)}</time>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-mono text-xs">"{h.preview}"</td>
                    <td className="px-4 py-3">
                      {h.entityCount} {h.entityCount === 1 ? "entity" : "entities"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 font-mono font-semibold tabular-nums",
                        riskTone(h.score).text,
                      )}
                    >
                      {h.score}/100
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={h.action} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={h.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-border md:hidden">
              {rows.map((h) => (
                <li key={h.id}>
                  <button onClick={() => setSel(h)} className="w-full p-4 text-left">
                    <div className="flex items-center justify-between">
                      <time dateTime={iso(h.timestamp)} className="text-xs text-muted-foreground">
                        {fmt(h.timestamp, todayTs)}
                      </time>
                      <StatusBadge status={h.status} />
                    </div>
                    <p className="mt-2 truncate font-mono text-xs">"{h.preview}"</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className={cn("font-mono font-semibold", riskTone(h.score).text)}>
                        {h.score}/100
                      </span>
                      <span className="text-muted-foreground">{h.entityCount} entities</span>
                      <ActionBadge action={h.action} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {rows.length === 0 && history.length > 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No scans match this filter.
              </p>
            )}
          </>
        )}
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-lg">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{sel.id}</DialogTitle>
                <DialogDescription>
                  <time dateTime={iso(sel.timestamp)}>{fmt(sel.timestamp, todayTs)}</time>
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Risk Score</dt>
                  <dd className={cn("font-mono text-lg font-semibold", riskTone(sel.score).text)}>
                    {sel.score}/100
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={sel.status} />
                  </dd>
                </div>
              </dl>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Detected entities & applied policies
                </p>
                {sel.types.length === 0 ? (
                  <p className="text-sm">None</p>
                ) : (
                  <ul className="space-y-1.5">
                    {sel.types.map((t, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>{ENTITY_META[t].label}</span>
                        <ActionBadge action={DEFAULT_POLICIES[TYPE_TO_POLICY[t]]} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <ul className="space-y-1 rounded-lg border border-border bg-background/50 p-3 font-mono text-xs">
                <li>
                  Original:{" "}
                  <span className="text-warning">
                    {sel.entityCount ? "Sensitive data detected" : "No sensitive data"}
                  </span>
                </li>
                <li>
                  Output:{" "}
                  <span className="text-primary">
                    {sel.status === "BLOCKED" ? "Request blocked" : "Safe version generated"}
                  </span>
                </li>
                <li>
                  LLM side: <span className="text-safe">Original prompt NOT transmitted</span>
                </li>
              </ul>
              <p className="flex items-center gap-2 text-sm font-medium text-safe">
                <ShieldCheck className="size-4" aria-hidden /> Privacy boundary enforced.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
