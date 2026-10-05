import { useSyncExternalStore } from "react";
import {
  DEFAULT_POLICIES,
  type Category,
  type EntityType,
  type Policies,
  type PolicyAction,
} from "./detection";

export interface HistoryItem {
  id: string;
  timestamp: number;
  preview: string;
  entityCount: number;
  types: EntityType[];
  score: number;
  action: PolicyAction | "none";
  status: "PROTECTED" | "BLOCKED" | "CLEAN";
  source?: "text" | "document" | undefined;
  documentId?: string | undefined;
}

export interface VeilDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  mimeType: string;
  contentTruncated?: boolean;
  content?: string | undefined;
  lastScanId?: string | undefined;
  entityCount?: number | undefined;
  score?: number | undefined;
  preview?: string | undefined;
}

export interface Settings {
  firewall: boolean;
  strictMode: boolean;
  blockCritical: boolean;
  categories: Record<Category, boolean>;
  retention: "7" | "30" | "90" | "never";
}

interface State {
  policies: Policies;
  settings: Settings;
  history: HistoryItem[];
  documents: VeilDocument[];
}

const DEFAULT_STATE: State = {
  policies: DEFAULT_POLICIES,
  settings: {
    firewall: true,
    strictMode: false,
    blockCritical: true,
    categories: {
      identity: true,
      contact: true,
      financial: true,
      credential: true,
      health: true,
      org: true,
    },
    retention: "30",
  },
  history: [],
  documents: [],
};

const OLD_KEY = "privacyshield-state-v1";
const KEY = "veil-state-v1";
let state: State = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function dropSeedItems(raw: Partial<State>): Partial<State> {
  if (Array.isArray(raw.history)) {
    const seedPattern = /^SCN-1\d{4}$/;
    raw.history = raw.history.filter((h) => !seedPattern.test(String(h?.id ?? "")));
  }
  return raw;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacy = localStorage.getItem(OLD_KEY);
      if (legacy) {
        try {
          const parsed = dropSeedItems(JSON.parse(legacy) as Partial<State>);
          delete (parsed as { documents?: unknown }).documents;
          const migrated: State = {
            ...DEFAULT_STATE,
            ...parsed,
            documents: [],
            history: parsed.history ?? [],
          };
          state = migrated;
          localStorage.setItem(KEY, JSON.stringify(state));
          try {
            localStorage.removeItem(OLD_KEY);
          } catch {
            /* ignore */
          }
          return;
        } catch {
          /* ignore parse error on bad legacy value */
        }
      }
    }
    if (raw) state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export function setState(fn: (s: State) => State) {
  load();
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      load();
      return select(state);
    },
    () => select(DEFAULT_STATE),
  );
}

export function addHistory(item: HistoryItem) {
  setState((s) => ({ ...s, history: [item, ...s.history] }));
}

export function addDocument(doc: VeilDocument) {
  setState((s) => ({ ...s, documents: [doc, ...s.documents] }));
}

export function updateDocumentScan(
  id: string,
  patch: Pick<VeilDocument, "lastScanId" | "entityCount" | "score" | "preview">,
) {
  setState((s) => ({
    ...s,
    documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  }));
}

export function deleteDocument(id: string) {
  setState((s) => ({ ...s, documents: s.documents.filter((d) => d.id !== id) }));
}

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
