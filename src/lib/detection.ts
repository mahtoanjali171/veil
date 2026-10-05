/**
 * Detection engine — regex + keyword heuristics, runs fully in the browser.
 * The pipeline (scoring, policy application, sanitization) depends only on the
 * Entity shape so the detector can be swapped later without changing the UI.
 */

export type EntityType =
  | "PERSON"
  | "EMAIL"
  | "PHONE"
  | "ADDRESS"
  | "DOB"
  | "CREDIT_CARD"
  | "BANK_ACCOUNT"
  | "API_KEY"
  | "PASSWORD"
  | "TOKEN"
  | "GOV_ID"
  | "MEDICAL"
  | "PATIENT_ID"
  | "CUSTOMER_ID"
  | "CONFIDENTIAL";

export type Category = "identity" | "contact" | "financial" | "credential" | "health" | "org";
export type Severity = "low" | "medium" | "high" | "critical";
export type PolicyAction =
  "allow" | "warn" | "mask" | "redact" | "anonymize" | "tokenize" | "block" | "review";

export const POLICY_ACTIONS: PolicyAction[] = [
  "allow",
  "warn",
  "mask",
  "redact",
  "anonymize",
  "tokenize",
  "block",
  "review",
];

export interface EntityMeta {
  label: string;
  category: Category;
  severity: Severity;
  weight: number;
}

export const ENTITY_META: Record<EntityType, EntityMeta> = {
  PERSON: { label: "Person", category: "identity", severity: "medium", weight: 14 },
  EMAIL: { label: "Email", category: "contact", severity: "medium", weight: 16 },
  PHONE: { label: "Phone", category: "contact", severity: "high", weight: 18 },
  ADDRESS: { label: "Address", category: "contact", severity: "high", weight: 18 },
  DOB: { label: "Date of birth", category: "identity", severity: "medium", weight: 14 },
  CREDIT_CARD: { label: "Credit card", category: "financial", severity: "critical", weight: 38 },
  BANK_ACCOUNT: { label: "Bank account", category: "financial", severity: "critical", weight: 32 },
  API_KEY: { label: "API key", category: "credential", severity: "critical", weight: 45 },
  PASSWORD: { label: "Password", category: "credential", severity: "critical", weight: 45 },
  TOKEN: { label: "Auth token", category: "credential", severity: "critical", weight: 45 },
  GOV_ID: { label: "Government ID", category: "identity", severity: "critical", weight: 30 },
  MEDICAL: { label: "Medical info", category: "health", severity: "high", weight: 24 },
  PATIENT_ID: { label: "Patient ID", category: "health", severity: "high", weight: 20 },
  CUSTOMER_ID: { label: "Customer ID", category: "identity", severity: "low", weight: 10 },
  CONFIDENTIAL: { label: "Confidential", category: "org", severity: "high", weight: 22 },
};

export const CATEGORY_LABEL: Record<Category, string> = {
  identity: "Personal information",
  contact: "Contact information",
  financial: "Financial data",
  credential: "Credentials",
  health: "Medical information",
  org: "Organization data",
};

export type PolicyKey =
  | "name"
  | "email"
  | "phone"
  | "address"
  | "dob"
  | "creditCard"
  | "bankAccount"
  | "apiKey"
  | "password"
  | "token"
  | "govId"
  | "medical"
  | "patientId"
  | "customerId"
  | "confidential"
  | "internal";

export const TYPE_TO_POLICY: Record<EntityType, PolicyKey> = {
  PERSON: "name",
  EMAIL: "email",
  PHONE: "phone",
  ADDRESS: "address",
  DOB: "dob",
  CREDIT_CARD: "creditCard",
  BANK_ACCOUNT: "bankAccount",
  API_KEY: "apiKey",
  PASSWORD: "password",
  TOKEN: "token",
  GOV_ID: "govId",
  MEDICAL: "medical",
  PATIENT_ID: "patientId",
  CUSTOMER_ID: "customerId",
  CONFIDENTIAL: "confidential",
};

export type Policies = Record<PolicyKey, PolicyAction>;

export const DEFAULT_POLICIES: Policies = {
  name: "anonymize",
  email: "redact",
  phone: "mask",
  address: "redact",
  dob: "redact",
  creditCard: "block",
  bankAccount: "redact",
  apiKey: "block",
  password: "block",
  token: "block",
  govId: "redact",
  medical: "redact",
  patientId: "anonymize",
  customerId: "tokenize",
  confidential: "block",
  internal: "review",
};

export interface Entity {
  id: string;
  type: EntityType;
  value: string;
  start: number;
  end: number;
  line: number;
}

export interface ProcessedEntity extends Entity {
  action: PolicyAction;
  replacement: string;
}

export interface ScanResult {
  entities: ProcessedEntity[];
  safeText: string;
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  blocked: boolean;
  blockReason?: string;
  factors: string[];
}

interface Rule {
  type: EntityType;
  re: RegExp;
  group?: number;
}

// Order = priority when spans overlap.
const RULES: Rule[] = [
  { type: "TOKEN", re: /\beyJ[\w-]+\.[\w-]+\.[\w-]+|\bBearer\s+[\w.~+/-]{12,}/g },
  {
    type: "API_KEY",
    re: /\b(?:sk|pk|rk)[-_](?:live[-_]|test[-_])?[A-Za-z0-9_-]{6,}|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{16,}|\bAIza[0-9A-Za-z_-]{20,}/g,
  },
  {
    type: "PASSWORD",
    re: /(?:password|passwd|pwd|passcode)\s*(?:is|:|=)\s*["']?([^\s"',]+)/gi,
    group: 1,
  },
  { type: "EMAIL", re: /[\w.+-]+@[\w-]+\.[\w.-]*\w/g },
  { type: "CREDIT_CARD", re: /\b(?:\d{4}[ -]?){3}\d{1,4}\b/g },
  { type: "GOV_ID", re: /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s\d{4}\s\d{4}\b|\b[A-Z]{5}\d{4}[A-Z]\b/g },
  {
    type: "BANK_ACCOUNT",
    re: /(?:account|a\/c|acct)(?:\s*(?:number|no\.?|#))?\s*(?:is|:)?\s*(\d{9,18})\b/gi,
    group: 1,
  },
  {
    type: "PHONE",
    re: /(?:\+\d{1,3}[\s-]?)?(?:\b\d{5}[\s-]?\d{5}\b|\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b)/g,
  },
  { type: "PATIENT_ID", re: /\b(?:PT|MRN|PAT)[-#]?\d{4,}\b/g },
  { type: "CUSTOMER_ID", re: /\b(?:CUST|CID|CUS)[-#]?\d{3,}\b/gi },
  {
    type: "DOB",
    re: /(?:born on|DOB|date of birth)\s*(?:is|:)?\s*(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|[A-Z][a-z]+ \d{1,2},? \d{4})/gi,
    group: 1,
  },
  {
    type: "ADDRESS",
    re: /\b\d{1,5},?\s+(?:[A-Z][a-z]+\s){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Boulevard|Blvd|Drive|Dr|Nagar|Marg)\b\.?/g,
  },
  {
    type: "MEDICAL",
    re: /\bdiagnosed with [A-Za-z ]{3,30}?(?=[.,;\n]|$)|\b(?:diabetes|HIV|cancer|asthma|hypertension|depression|chemotherapy|insulin|tuberculosis)\b/gi,
  },
  {
    type: "CONFIDENTIAL",
    re: /\b(?:confidential|internal only|do not distribute|trade secret|under NDA)\b/gi,
  },
  {
    type: "PERSON",
    re: /(?:[Mm]y name is|[Nn]ame is|[Nn]amed|[Cc]ustomer|[Pp]atient|[Cc]lient|[Cc]ontact|[Cc]all|Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g,
    group: 1,
  },
];

function lineOf(text: string, idx: number) {
  let n = 1;
  for (let i = 0; i < idx; i++) if (text[i] === "\n") n++;
  return n;
}

export function detectEntities(text: string): Entity[] {
  const found: Entity[] = [];
  const taken = (s: number, e: number) => found.some((f) => s < f.end && e > f.start);
  for (const rule of RULES) {
    const re = new RegExp(
      rule.re.source,
      rule.re.flags.includes("d") ? rule.re.flags : rule.re.flags + "d",
    );
    for (const m of text.matchAll(re)) {
      const g = rule.group ?? 0;
      const span = (m as RegExpMatchArray & { indices: [number, number][] }).indices?.[g];
      if (!span || !m[g]) continue;
      const [s, e] = span;
      if (
        rule.type === "PERSON" &&
        /^(The|This|That|Please|Thanks|Hi|Hello)$/.test(m[g]!.split(" ")[0]!)
      )
        continue;
      if (taken(s, e)) continue;
      found.push({
        id: `${rule.type}-${s}`,
        type: rule.type,
        value: m[g],
        start: s,
        end: e,
        line: lineOf(text, s),
      });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).slice(0, 6).padStart(6, "0");
}

export function scoreEntities(entities: Entity[]): number {
  if (!entities.length) return 0;
  let safe = 1;
  for (const e of entities) safe *= 1 - ENTITY_META[e.type].weight / 100;
  const cats = new Set(entities.map((e) => ENTITY_META[e.type].category)).size;
  return Math.min(100, Math.round((1 - safe) * 100 + (cats - 1) * 3));
}

export function riskLevel(score: number): ScanResult["level"] {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MODERATE";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

export interface ScanOptions {
  strictMode?: boolean;
  blockCritical?: boolean;
  enabledCategories?: Partial<Record<Category, boolean>>;
}

export function scanText(text: string, policies: Policies, opts: ScanOptions = {}): ScanResult {
  const enabled = opts.enabledCategories;
  const raw = detectEntities(text).filter(
    (e) => !enabled || enabled[ENTITY_META[e.type].category] !== false,
  );
  const anonCounters: Record<string, Map<string, number>> = {};

  const entities: ProcessedEntity[] = raw.map((e) => {
    let action = policies[TYPE_TO_POLICY[e.type]];
    if (opts.strictMode && (action === "allow" || action === "warn")) action = "redact";
    let replacement = e.value;
    switch (action) {
      case "mask": {
        let kept = 0;
        replacement = e.value
          .split("")
          .reverse()
          .map((c) => (/[A-Za-z0-9]/.test(c) ? (kept++ < 4 ? c : "•") : c))
          .reverse()
          .join("");
        break;
      }
      case "redact":
        replacement = `[${e.type}_REDACTED]`;
        break;
      case "anonymize": {
        const map = (anonCounters[e.type] ??= new Map());
        if (!map.has(e.value)) map.set(e.value, map.size + 1);
        replacement = `[${e.type}_${map.get(e.value)}]`;
        break;
      }
      case "tokenize":
        replacement = `[TKN_${hash(e.value)}]`;
        break;
      case "block":
        replacement =
          ENTITY_META[e.type].category === "credential"
            ? "[CREDENTIAL_BLOCKED]"
            : `[${e.type}_BLOCKED]`;
        break;
      case "review":
        replacement = `[REVIEW_REQUIRED]`;
        break;
    }
    return { ...e, action, replacement };
  });

  let safeText = "";
  let cursor = 0;
  for (const e of entities) {
    safeText += text.slice(cursor, e.start) + e.replacement;
    cursor = e.end;
  }
  safeText += text.slice(cursor);

  const blockers = entities.filter(
    (e) =>
      e.action === "block" &&
      (opts.strictMode ||
        (opts.blockCritical !== false && ENTITY_META[e.type].category === "credential")),
  );
  const score = scoreEntities(entities);
  const factors = Array.from(
    new Set(entities.map((e) => `${CATEGORY_LABEL[ENTITY_META[e.type].category]} detected`)),
  );

  const result: ScanResult = {
    entities,
    safeText,
    score,
    level: riskLevel(score),
    blocked: blockers.length > 0,
    factors,
  };
  if (blockers.length) {
    result.blockReason = `${ENTITY_META[blockers[0]!.type].label} detected and your current policy does not allow it to be processed.`;
  }
  return result;
}
