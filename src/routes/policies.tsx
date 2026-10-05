import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Save, User, CreditCard, KeyRound, HeartPulse, Building2 } from "lucide-react";
import { AppShell } from "@/components/shield/AppShell";
import { FirewallTimeline } from "@/components/shield/Diagrams";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POLICY_ACTIONS, type PolicyAction, type PolicyKey, type Policies } from "@/lib/detection";
import { setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Policies | Veil" },
      {
        name: "description",
        content:
          "Set how Veil handles each type of sensitive information — names, emails, cards, keys, health data and internal documents.",
      },
      { property: "og:title", content: "Policies | Veil" },
      {
        property: "og:description",
        content: "Control exactly how Veil handles each category of sensitive information.",
      },
    ],
  }),
  component: PoliciesPage,
});

const GROUPS: { title: string; icon: typeof User; items: { key: PolicyKey; label: string }[] }[] = [
  {
    title: "Personal Information",
    icon: User,
    items: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
      { key: "dob", label: "Date of birth" },
      { key: "govId", label: "Government ID" },
    ],
  },
  {
    title: "Financial Information",
    icon: CreditCard,
    items: [
      { key: "creditCard", label: "Credit Card" },
      { key: "bankAccount", label: "Bank Account" },
      { key: "customerId", label: "Customer ID" },
    ],
  },
  {
    title: "Credentials",
    icon: KeyRound,
    items: [
      { key: "apiKey", label: "API Keys" },
      { key: "password", label: "Passwords" },
      { key: "token", label: "Authentication Tokens" },
    ],
  },
  {
    title: "Health Information",
    icon: HeartPulse,
    items: [
      { key: "medical", label: "Medical Records" },
      { key: "patientId", label: "Patient IDs" },
    ],
  },
  {
    title: "Organization Data",
    icon: Building2,
    items: [
      { key: "confidential", label: "Confidential Documents" },
      { key: "internal", label: "Internal Information" },
    ],
  },
];

function PoliciesPage() {
  const saved = useStore((s) => s.policies);
  const [draft, setDraft] = useState<Policies | null>(null);
  const p = draft ?? saved;
  const set = (k: PolicyKey, v: PolicyAction) => setDraft({ ...p, [k]: v });

  return (
    <AppShell
      title="Policies"
      subtitle="Tell Veil exactly how to handle each kind of sensitive information."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setState((s) => ({ ...s, policies: p }));
            setDraft(null);
            toast.success("Policies saved", { description: "New scans will use these rules." });
          }}
        >
          <Save className="size-4" aria-hidden /> Save Policies
        </Button>
      }
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map(({ title, icon: Icon, items }) => (
          <section key={title} className="panel p-5" aria-labelledby={`g-${title}`}>
            <h2 id={`g-${title}`} className="flex items-center gap-2 font-semibold">
              <Icon className="size-4 text-primary" aria-hidden /> {title}
            </h2>
            <ul className="mt-4 space-y-3">
              {items.map(({ key, label }) => (
                <li key={key} className="flex items-center justify-between gap-3">
                  <label id={`l-${key}`} className="text-sm">
                    {label}
                  </label>
                  <Select value={p[key]} onValueChange={(v) => set(key, v as PolicyAction)}>
                    <SelectTrigger className="w-36 capitalize" aria-labelledby={`l-${key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLICY_ACTIONS.map((a) => (
                        <SelectItem key={a} value={a} className="capitalize">
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="panel mt-8 p-6" aria-labelledby="how-title">
        <h2 id="how-title" className="mb-6 text-lg font-semibold">
          How the Privacy Firewall Works
        </h2>
        <FirewallTimeline />
      </section>
    </AppShell>
  );
}
