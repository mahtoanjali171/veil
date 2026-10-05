import {
  User,
  Mail,
  Phone,
  MapPin,
  Cake,
  CreditCard,
  Landmark,
  KeyRound,
  Lock,
  Fingerprint,
  IdCard,
  HeartPulse,
  Stethoscope,
  Hash,
  FileLock2,
  type LucideIcon,
} from "lucide-react";
import type { Category, EntityType, PolicyAction, Severity } from "@/lib/detection";
import { cn } from "@/lib/utils";

export const ENTITY_ICON: Record<EntityType, LucideIcon> = {
  PERSON: User,
  EMAIL: Mail,
  PHONE: Phone,
  ADDRESS: MapPin,
  DOB: Cake,
  CREDIT_CARD: CreditCard,
  BANK_ACCOUNT: Landmark,
  API_KEY: KeyRound,
  PASSWORD: Lock,
  TOKEN: Fingerprint,
  GOV_ID: IdCard,
  MEDICAL: HeartPulse,
  PATIENT_ID: Stethoscope,
  CUSTOMER_ID: Hash,
  CONFIDENTIAL: FileLock2,
};

export const CATEGORY_CLASS: Record<Category, { mark: string; text: string; chip: string }> = {
  identity: {
    mark: "bg-ent-identity/15 ring-ent-identity/50",
    text: "text-ent-identity",
    chip: "bg-ent-identity/15 text-ent-identity",
  },
  contact: {
    mark: "bg-ent-contact/15 ring-ent-contact/50",
    text: "text-ent-contact",
    chip: "bg-ent-contact/15 text-ent-contact",
  },
  financial: {
    mark: "bg-ent-financial/15 ring-ent-financial/50",
    text: "text-ent-financial",
    chip: "bg-ent-financial/15 text-ent-financial",
  },
  credential: {
    mark: "bg-ent-credential/15 ring-ent-credential/50",
    text: "text-ent-credential",
    chip: "bg-ent-credential/15 text-ent-credential",
  },
  health: {
    mark: "bg-ent-health/15 ring-ent-health/50",
    text: "text-ent-health",
    chip: "bg-ent-health/15 text-ent-health",
  },
  org: {
    mark: "bg-ent-org/15 ring-ent-org/50",
    text: "text-ent-org",
    chip: "bg-ent-org/15 text-ent-org",
  },
};

const SEV: Record<Severity, string> = {
  low: "bg-safe/15 text-safe",
  medium: "bg-warning/15 text-warning",
  high: "bg-ent-financial/15 text-ent-financial",
  critical: "bg-danger/15 text-danger",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        SEV[severity],
      )}
    >
      {severity}
    </span>
  );
}

const ACTION_LABEL: Record<PolicyAction, string> = {
  allow: "Allowed",
  warn: "Warned",
  mask: "Masked",
  redact: "Redacted",
  anonymize: "Anonymized",
  tokenize: "Tokenized",
  block: "Blocked",
  review: "Review",
};

export function ActionBadge({ action }: { action: PolicyAction | "none" }) {
  const cls =
    action === "block"
      ? "border-danger/40 text-danger"
      : action === "allow" || action === "warn" || action === "review"
        ? "border-warning/40 text-warning"
        : action === "none"
          ? "border-border text-muted-foreground"
          : "border-primary/40 text-primary";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        cls,
      )}
    >
      {action === "none" ? "None" : ACTION_LABEL[action]}
    </span>
  );
}

export function riskTone(score: number) {
  if (score <= 25) return { text: "text-safe", stroke: "stroke-safe", bg: "bg-safe" };
  if (score <= 50) return { text: "text-warning", stroke: "stroke-warning", bg: "bg-warning" };
  if (score <= 75)
    return { text: "text-ent-financial", stroke: "stroke-ent-financial", bg: "bg-ent-financial" };
  return { text: "text-danger", stroke: "stroke-danger", bg: "bg-danger" };
}
