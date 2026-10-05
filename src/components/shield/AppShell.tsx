import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Bell,
  History,
  LayoutDashboard,
  Menu,
  ScanSearch,
  Settings,
  SlidersHorizontal,
  Info,
  X,
  FileText,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scanner", label: "Scanner", icon: ScanSearch },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/policies", label: "Policies", icon: SlidersHorizontal },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About", icon: Info },
] as const;

function VeilMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M4 7.5 L12 4 L20 7.5 V9.5 C20 13.5 16.4 17 12 18 C7.6 17 4 13.5 4 9.5 V7.5 Z"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M4 9.5 C4 13.5 7.6 17 12 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 9.5 C20 13.5 16.4 17 12 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 9.5 C7.5 12 9.5 14.1 12 14.7 C14.5 14.1 16.5 12 16.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 4 V18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="Veil home">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
        <VeilMark className="size-4.5 text-primary" />
      </span>
      <span className="font-display text-[15px] font-semibold tracking-tight">Veil</span>
    </Link>
  );
}

export function FirewallPill() {
  const on = useStore((s) => s.settings.firewall);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-medium tracking-wider",
        on ? "border-safe/30 text-safe" : "border-danger/30 text-danger",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", on ? "pulse-dot bg-safe" : "bg-danger")}
        aria-hidden
      />
      FIREWALL: {on ? "ACTIVE" : "OFF"}
    </span>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          activeProps={{
            className:
              "bg-sidebar-accent text-foreground ring-1 ring-primary/25 [&>svg]:text-primary",
          }}
        >
          <Icon className="size-4" aria-hidden /> {label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const on = useStore((s) => s.settings.firewall);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-sidebar-border bg-background/40 p-3">
        <p className="text-xs text-muted-foreground">Firewall Status</p>
        <p
          className={cn(
            "mt-1 flex items-center gap-2 font-mono text-sm font-semibold",
            on ? "text-safe" : "text-danger",
          )}
        >
          <span
            className={cn("size-2 rounded-full", on ? "pulse-dot bg-safe" : "bg-danger")}
            aria-hidden
          />{" "}
          {on ? "ACTIVE" : "DISABLED"}
        </p>
      </div>
      <div className="flex items-center gap-3 px-1">
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary font-mono text-xs">
          WS
        </span>
        <div className="min-w-0 text-xs">
          <p className="truncate font-medium">Workspace owner</p>
          <p className="text-muted-foreground">Local session</p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col justify-between border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="space-y-8">
          <Logo className="px-1 pt-1" />
          <NavLinks />
        </div>
        <SidebarFooter />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col justify-between border-r border-sidebar-border bg-sidebar p-4 animate-in slide-in-from-left duration-200">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-2 hover:bg-sidebar-accent"
                >
                  <X className="size-5" />
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <SidebarFooter />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="glass sticky top-0 z-20 flex h-14 items-center gap-3 border-x-0 border-t-0 px-4 sm:px-6">
          <button
            className="rounded-md p-2 hover:bg-secondary lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <span className="font-display text-sm font-semibold lg:hidden">Veil</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex">
              <FirewallPill />
            </span>
            <button
              className="relative rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Notifications, 2 unread"
            >
              <Bell className="size-4.5" />
              <span
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary"
                aria-hidden
              />
            </button>
            <Link
              to="/settings"
              className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="size-4.5" />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
