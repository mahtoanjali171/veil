import { AlertTriangle } from "lucide-react";
import { riskLevel } from "@/lib/detection";
import { riskTone } from "./tokens";
import { cn } from "@/lib/utils";

export function RiskScore({ score, factors }: { score: number; factors: string[] }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = riskTone(score);
  const level = riskLevel(score);
  return (
    <section className="panel p-6" aria-labelledby="risk-title">
      <h2
        id="risk-title"
        className="text-sm font-medium uppercase tracking-widest text-muted-foreground"
      >
        Privacy risk
      </h2>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative size-32 shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="size-full -rotate-90"
            role="img"
            aria-label={`Risk score ${score} of 100, ${level}`}
          >
            <circle cx="60" cy="60" r={r} className="fill-none stroke-muted" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={r}
              className={cn(
                "fill-none transition-[stroke-dashoffset] duration-700 ease-out",
                tone.stroke,
              )}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - (score / 100) * c}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("font-display text-4xl font-semibold tabular-nums", tone.text)}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className={cn("font-mono text-lg font-semibold tracking-wider", tone.text)}>
            {level} RISK
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {factors.length === 0 && <li>No sensitive data detected.</li>}
            {factors.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <AlertTriangle className={cn("size-3.5 shrink-0", tone.text)} aria-hidden /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
