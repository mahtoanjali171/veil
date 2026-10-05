import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { AppShell } from "@/components/shield/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/detection";
import { setState, useStore, type Settings } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Veil" },
      {
        name: "description",
        content:
          "Turn the firewall on or off, choose detection categories, enable strict mode and set data retention.",
      },
      { property: "og:title", content: "Settings | Veil" },
      {
        property: "og:description",
        content: "Configure firewall behaviour, detection scope and retention.",
      },
    ],
  }),
  component: SettingsPage,
});

function Row({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

const CATS: { key: Category; label: string }[] = [
  { key: "identity", label: "PII" },
  { key: "contact", label: "Contact details" },
  { key: "credential", label: "Credentials" },
  { key: "financial", label: "Financial Data" },
  { key: "health", label: "Health Data" },
  { key: "org", label: "Organization Data" },
];

function SettingsPage() {
  const saved = useStore((s) => s.settings);
  const [d, setD] = useState<Settings | null>(null);
  const s = d ?? saved;
  const up = (patch: Partial<Settings>) => setD({ ...s, ...patch });

  return (
    <AppShell
      title="Settings"
      subtitle="Firewall behaviour, detection scope and how long Veil remembers your scans."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setState((st) => ({ ...st, settings: s }));
            setD(null);
            toast.success("Settings saved");
          }}
        >
          <Save className="size-4" aria-hidden /> Save Settings
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5" aria-labelledby="fw">
          <h2 id="fw" className="font-semibold">
            Firewall
          </h2>
          <div className="mt-2 divide-y divide-border">
            <Row
              id="firewall"
              label="Firewall"
              hint="Scan every prompt or document before it reaches an LLM."
              checked={s.firewall}
              onChange={(v) => up({ firewall: v })}
            />
            <Row
              id="strict"
              label="Strict Mode"
              hint="Treat allow/warn as redact — never allow suspect data through."
              checked={s.strictMode}
              onChange={(v) => up({ strictMode: v })}
            />
            <Row
              id="critical"
              label="Block Critical Data"
              hint="Stop requests that contain credentials (keys, passwords, tokens)."
              checked={s.blockCritical}
              onChange={(v) => up({ blockCritical: v })}
            />
          </div>
        </section>
        <section className="panel p-5" aria-labelledby="det">
          <h2 id="det" className="font-semibold">
            Detection
          </h2>
          <div className="mt-2 grid divide-y divide-border sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
            {CATS.map(({ key, label }) => (
              <Row
                key={key}
                id={`cat-${key}`}
                label={label}
                checked={s.categories[key]}
                onChange={(v) => up({ categories: { ...s.categories, [key]: v } })}
              />
            ))}
          </div>
        </section>
        <section className="panel p-5" aria-labelledby="ap">
          <h2 id="ap" className="font-semibold">
            Appearance
          </h2>
          <div className="flex items-center justify-between py-3">
            <span id="theme-l" className="text-sm font-medium">
              Theme
            </span>
            <Select value="dark" disabled>
              <SelectTrigger className="w-40" aria-labelledby="theme-l">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Light theme is coming in a later update.</p>
        </section>
        <section className="panel p-5" aria-labelledby="sec">
          <h2 id="sec" className="font-semibold">
            Security
          </h2>
          <div className="flex items-center justify-between py-3">
            <span id="ret-l" className="text-sm font-medium">
              Auto-delete scan history after
            </span>
            <Select
              value={s.retention}
              onValueChange={(v) => up({ retention: v as Settings["retention"] })}
            >
              <SelectTrigger className="w-40" aria-labelledby="ret-l">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
