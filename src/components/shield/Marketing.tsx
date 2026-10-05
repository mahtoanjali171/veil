import { Link } from "@tanstack/react-router";
import { Eye, ShieldCheck, ShieldOff, SlidersHorizontal, Lock, ShieldHalf } from "lucide-react";
import { Logo } from "./AppShell";

const PBD = [
  {
    icon: ShieldCheck,
    t: "Before the model sees it",
    d: "Detection runs on-device, before anything reaches an LLM provider.",
  },
  {
    icon: SlidersHorizontal,
    t: "Policy, not guesswork",
    d: "You decide what Veil does with each kind of data.",
  },
  {
    icon: Lock,
    t: "Less data, fewer problems",
    d: "Only the minimum information makes it through the boundary.",
  },
  {
    icon: Eye,
    t: "Auditable decisions",
    d: "Every scan records what was found and exactly what Veil changed.",
  },
  {
    icon: ShieldHalf,
    t: "No input is trusted",
    d: "Every prompt, every document. Exceptions are your call, not ours.",
  },
];

export function PrivacyByDesign() {
  return (
    <section aria-labelledby="pbd">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="pbd" className="text-2xl font-semibold sm:text-3xl">
            Privacy by design
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The boundary is enforced by default, not bolted on afterwards.
          </p>
        </div>
        <ShieldOff className="hidden size-6 text-muted-foreground sm:block" aria-hidden />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PBD.map(({ icon: I, t, d }, idx) => (
          <div key={t} className={cn("panel p-5", idx === 2 && "ring-1 ring-primary/30")}>
            <I className="size-5 text-primary" aria-hidden />
            <h3 className="mt-4 font-semibold">{t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function cn(...cls: (string | false | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export function Footer() {
  const links = [
    { to: "/dashboard", l: "Dashboard" },
    { to: "/scanner", l: "Scanner" },
    { to: "/documents", l: "Documents" },
    { to: "/policies", l: "Policies" },
    { to: "/history", l: "History" },
    { to: "/about", l: "About" },
  ] as const;
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-muted-foreground">
            Keep sensitive data out of your LLM calls.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
        >
          {links.map((k) => (
            <Link key={k.to} to={k.to} className="hover:text-foreground">
              {k.l}
            </Link>
          ))}
        </nav>
        <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> © Veil — data never leaves this device
        </p>
      </div>
    </footer>
  );
}
