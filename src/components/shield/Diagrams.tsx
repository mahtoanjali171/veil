import {
  ArrowDown,
  Ban,
  Bot,
  FileText,
  Gauge,
  Layers,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
} from "lucide-react";

const STEPS = [
  "Detect",
  "Classify",
  "Score",
  "Apply Policy",
  "Sanitize",
  "Approve / Block",
  "Send Safe Prompt to LLM",
];

export function FirewallTimeline() {
  return (
    <ol
      className="relative grid gap-4 md:grid-cols-7 md:gap-2"
      aria-label="How the privacy firewall works"
    >
      <div
        aria-hidden
        className="absolute left-4 top-4 bottom-4 w-px bg-border md:left-0 md:right-0 md:top-4 md:bottom-auto md:h-px md:w-auto"
      />
      {STEPS.map((s, i) => (
        <li
          key={s}
          className="relative flex items-center gap-3 md:flex-col md:items-start md:gap-3"
        >
          <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background font-mono text-xs text-primary">
            {i + 1}
          </span>
          <span className="text-sm font-medium">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Node({
  icon: Icon,
  label,
  tone = "default",
}: {
  icon: typeof User;
  label: string;
  tone?: "default" | "primary" | "safe";
}) {
  const cls =
    tone === "primary"
      ? "border-primary/40 bg-primary/10 text-primary"
      : tone === "safe"
        ? "border-safe/40 bg-safe/10 text-safe"
        : "border-border bg-card";
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${cls}`}
    >
      <Icon className="size-4" aria-hidden /> {label}
    </div>
  );
}

const Arrow = () => <ArrowDown className="mx-auto size-4 text-muted-foreground" aria-hidden />;

export function ArchitectureDiagram() {
  return (
    <figure className="panel grid-bg p-6 sm:p-8" aria-label="Veil architecture">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-2">
        <Node icon={User} label="User" />
        <Arrow />
        <Node icon={FileText} label="Prompt / Document" />
        <Arrow />
        <div className="w-full rounded-xl border border-primary/40 bg-primary/5 p-4 glow">
          <p className="mb-3 flex items-center justify-center gap-2 font-mono text-xs font-semibold tracking-widest text-primary">
            <ShieldCheck className="size-4" aria-hidden /> VEIL FIREWALL
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { i: ScanSearch, l: "Detection" },
              { i: Layers, l: "Classification" },
              { i: Gauge, l: "Risk Scoring" },
              { i: SlidersHorizontal, l: "Policy Engine" },
            ].map(({ i: I, l }) => (
              <div
                key={l}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center text-xs"
              >
                <I className="size-4 text-primary" aria-hidden /> {l}
              </div>
            ))}
          </div>
        </div>
        <div className="grid w-full grid-cols-[1fr_auto] items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <Arrow />
            <Node icon={Sparkles} label="Sanitization" />
            <Arrow />
            <Node icon={ShieldCheck} label="Safe Prompt" tone="safe" />
            <Arrow />
            <Node icon={Bot} label="LLM" tone="primary" />
          </div>
          <div className="flex flex-col items-center gap-2 pt-2">
            <span className="h-6 w-px bg-danger/50" aria-hidden />
            <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs font-semibold text-danger">
              <Ban className="size-4" aria-hidden /> BLOCK
            </div>
            <p className="max-w-28 text-center text-[11px] text-muted-foreground">
              Critical data terminates here
            </p>
          </div>
        </div>
      </div>
    </figure>
  );
}
