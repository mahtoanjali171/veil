import { useMemo, useState, useRef } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ScanSearch,
  Eraser,
  Copy,
  Send,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Pencil,
  ListChecks,
  SlidersHorizontal,
  Upload,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ENTITY_META, scanText, type ScanResult } from "@/lib/detection";
import {
  addDocument,
  addHistory,
  MAX_UPLOAD_BYTES,
  updateDocumentScan,
  useStore,
  type VeilDocument,
} from "@/lib/store";
import { RiskScore } from "./RiskScore";
import { ActionBadge, CATEGORY_CLASS, ENTITY_ICON, SeverityBadge, riskTone } from "./tokens";
import { cn } from "@/lib/utils";

const PLACEHOLDER = `Paste the text you want to check before sending it to an LLM.

Examples of what works well: a support ticket you want summarized, a draft email, meeting notes with customer names, a config snippet, a paragraph from a patient chart, or an internal document excerpt.

You can also drop a document above instead of pasting here.`;

const TEXT_EXTS = new Set([".txt", ".md", ".csv", ".json"]);
const ACCEPTED_EXTS = [".txt", ".md", ".csv", ".json", ".docx", ".pdf"];
const ACCEPT_ATTR = ACCEPTED_EXTS.join(",");

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}

export function Scanner() {
  const policies = useStore((s) => s.policies);
  const settings = useStore((s) => s.settings);
  const router = useRouter();

  const [text, setText] = useState("");
  const [scanned, setScanned] = useState<string | null>(null);
  const [scannedFromDoc, setScannedFromDoc] = useState<VeilDocument | null>(null);
  const [scanning, setScanning] = useState(false);

  const [dragOver, setDragOver] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestProgress, setIngestProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const result: ScanResult | null = useMemo(() => {
    if (scanned === null) return null;
    return scanText(scanned, policies, {
      strictMode: settings.strictMode,
      blockCritical: settings.blockCritical,
      enabledCategories: settings.categories,
    });
  }, [scanned, policies, settings]);

  const analyze = (input = text, doc: VeilDocument | null = null) => {
    if (!input.trim()) {
      toast.error("Nothing to analyze. Paste some text or drop a document first.");
      return;
    }
    if (!settings.firewall) {
      toast.warning("Firewall is off in Settings — nothing will be stopped.");
    }
    setScanning(true);
    setTimeout(() => {
      const r = scanText(input, policies, {
        strictMode: settings.strictMode,
        blockCritical: settings.blockCritical,
        enabledCategories: settings.categories,
      });
      setScanned(input);
      setScannedFromDoc(doc);
      setScanning(false);
      const actions = r.entities.map((e) => e.action);
      const historyId = `SCN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
      const item: Parameters<typeof addHistory>[0] = {
        id: historyId,
        timestamp: Date.now(),
        preview: input.slice(0, 64) + (input.length > 64 ? "…" : ""),
        entityCount: r.entities.length,
        types: r.entities.map((e) => e.type),
        score: r.score,
        action: actions.includes("block") ? "block" : (actions[0] ?? "none"),
        status: r.blocked ? "BLOCKED" : r.entities.length ? "PROTECTED" : "CLEAN",
      };
      if (doc) {
        item.source = "document";
        item.documentId = doc.id;
      } else {
        item.source = "text";
      }
      addHistory(item);
      if (doc) {
        updateDocumentScan(doc.id, {
          lastScanId: historyId,
          entityCount: r.entities.length,
          score: r.score,
          preview: input.slice(0, 120),
        });
      }
      setTimeout(
        () =>
          document
            .getElementById("scan-results")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    }, 550);
  };

  const ingestFile = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(
        `${file.name} is too large (${formatSize(file.size)}). Max is ${formatSize(MAX_UPLOAD_BYTES)}.`,
      );
      return;
    }
    const ext = extOf(file.name);
    setIngesting(true);
    setIngestProgress(12);
    try {
      let content: string | undefined;
      let contentTruncated = false;
      if (TEXT_EXTS.has(ext)) {
        setIngestProgress(45);
        const raw = await readAsText(file);
        if (raw.length > 500_000) {
          content = raw.slice(0, 500_000);
          contentTruncated = true;
        } else {
          content = raw;
        }
      }
      setIngestProgress(80);
      const doc: VeilDocument = {
        id: `DOC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
        name: file.name,
        size: file.size,
        uploadedAt: Date.now(),
        mimeType: file.type || "application/octet-stream",
      };
      if (content !== undefined) doc.content = content;
      if (contentTruncated) doc.contentTruncated = true;
      if (content) doc.preview = content.slice(0, 120);
      addDocument(doc);
      setIngestProgress(100);

      if (content && content.trim()) {
        setText(content);
        toast.success(`${file.name} ingested. Text loaded to scanner.`, {
          description: contentTruncated
            ? "File was truncated to the first 500k characters."
            : undefined,
        });
      } else {
        toast.success(`${file.name} added to your documents.`, {
          description: TEXT_EXTS.has(ext)
            ? "File was empty."
            : "This format does not yet support automatic text extraction — paste the text above to scan it.",
        });
      }
    } catch (e) {
      toast.error(`Couldn't read ${file.name}.`);
    } finally {
      setTimeout(() => {
        setIngesting(false);
        setIngestProgress(0);
      }, 250);
    }
  };

  const onPick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const f of Array.from(files)) ingestFile(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer?.files?.length) return;
    for (const f of Array.from(e.dataTransfer.files)) ingestFile(f);
  };

  return (
    <div className="space-y-6">
      <section
        className={cn(
          "panel overflow-hidden border transition-colors",
          dragOver ? "border-primary/60 bg-primary/5" : "border-border",
        )}
        aria-labelledby="drop-title"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div
          className={cn(
            "border-b border-dashed px-5 py-5 sm:px-6 transition-colors",
            dragOver ? "bg-primary/5" : "bg-muted/20",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p id="drop-title" className="inline-flex items-center gap-2 text-sm font-medium">
                <Upload className="size-4 text-primary" aria-hidden /> Drop a document here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ACCEPTED_EXTS.join(", ")} · up to {formatSize(MAX_UPLOAD_BYTES)} each
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => onPick(e.target.files)}
                aria-label="Choose documents to upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
                disabled={ingesting}
              >
                {ingesting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Reading…
                  </>
                ) : (
                  <>
                    <FileText className="size-4" aria-hidden /> Choose files
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.navigate({ to: "/documents" })}
                className="gap-2 text-muted-foreground"
              >
                <FileText className="size-4" aria-hidden /> Library
              </Button>
            </div>
          </div>
          {ingesting && (
            <div className="mt-4 space-y-1">
              <Progress value={ingestProgress} className="h-1.5" />
              <p className="font-mono text-[11px] text-muted-foreground">Ingesting file…</p>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="scanner-title" className="text-xl font-semibold">
                Privacy Scanner
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste text or drop a document. Veil checks it against your policy before it reaches
                your LLM.
              </p>
            </div>
          </div>
          <label htmlFor="prompt-input" className="sr-only">
            Text to analyze
          </label>
          <Textarea
            id="prompt-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            className="mt-4 min-h-48 resize-y border-border bg-background/60 font-mono text-sm leading-relaxed"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={() => analyze()} disabled={scanning} className="gap-2">
              {scanning ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Analyzing…
                </>
              ) : (
                <>
                  <ScanSearch className="size-4" aria-hidden /> Analyze
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText("");
                setScanned(null);
                setScannedFromDoc(null);
              }}
              className="gap-2 text-muted-foreground"
            >
              <Eraser className="size-4" aria-hidden /> Clear
            </Button>
            {scannedFromDoc && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                <FileText className="size-3" aria-hidden />
                From {scannedFromDoc.name}
                <button
                  onClick={() => setScannedFromDoc(null)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss document context"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            <span className="ml-auto font-mono text-xs text-muted-foreground" aria-live="polite">
              {text.length} chars
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Detection runs locally in your browser. Nothing is uploaded until you explicitly forward
            the protected output.
          </p>
        </div>
      </section>

      {result && scanned !== null && (
        <div
          id="scan-results"
          className="scroll-mt-24 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="panel p-5 sm:p-6" aria-labelledby="orig-title">
              <div className="flex items-center justify-between">
                <h2 id="orig-title" className="font-semibold">
                  Original Input
                </h2>
                <span className="font-mono text-xs text-danger">LOCAL · NOT SENT</span>
              </div>
              <HighlightedText text={scanned} result={result} />
            </section>

            {result.blocked ? (
              <BlockedPanel
                reason={result.blockReason!}
                onEdit={() => document.getElementById("prompt-input")?.focus()}
              />
            ) : (
              <section className="panel border-safe/30 p-5 sm:p-6" aria-labelledby="safe-title">
                <div className="flex items-center justify-between">
                  <h2 id="safe-title" className="font-semibold">
                    Protected Output
                  </h2>
                  <span className="font-mono text-xs text-safe">SANITIZED</span>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-safe/30 bg-safe/10 p-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-safe" aria-hidden />
                  <div>
                    <p className="font-mono text-sm font-semibold tracking-wide text-safe">
                      SAFE FOR LLM
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sensitive information was masked, redacted or replaced according to your
                      policies.
                    </p>
                  </div>
                </div>
                <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-background/60 p-4 font-mono text-sm leading-relaxed">
                  {renderSafe(scanned, result)}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      navigator.clipboard?.writeText(result.safeText);
                      toast.success("Protected output copied");
                    }}
                  >
                    <Copy className="size-4" aria-hidden /> Copy Safe Output
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      toast.success("Protected output sent to LLM", {
                        description: "The original input never left this firewall.",
                      })
                    }
                  >
                    <Send className="size-4" aria-hidden /> Send to LLM
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => analyze(scanned, scannedFromDoc)}
                  >
                    <RefreshCw className="size-4" aria-hidden /> Re-scan
                  </Button>
                </div>
                <p className="mt-3 text-sm text-safe">
                  ✓ Original sensitive data is NOT part of the output.
                </p>
              </section>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
            <RiskScore score={result.score} factors={result.factors} />
            <DetectionList result={result} />
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightedText({ text, result }: { text: string; result: ScanResult }) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const e of result.entities) {
    parts.push(text.slice(cursor, e.start));
    const meta = ENTITY_META[e.type];
    const c = CATEGORY_CLASS[meta.category];
    parts.push(
      <mark
        key={e.id}
        title={meta.label}
        className={cn("rounded px-1 text-foreground ring-1", c.mark)}
      >
        {e.value}
        <span className={cn("ml-1 align-middle font-mono text-[10px] font-semibold", c.text)}>
          {e.type.replace(/_/g, " ")}
        </span>
      </mark>,
    );
    cursor = e.end;
  }
  parts.push(text.slice(cursor));
  return (
    <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-background/60 p-4 font-mono text-sm leading-loose">
      {parts}
    </pre>
  );
}

function renderSafe(text: string, result: ScanResult) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const e of result.entities) {
    parts.push(text.slice(cursor, e.start));
    const changed = e.replacement !== e.value;
    parts.push(
      <span
        key={e.id}
        className={cn(
          changed && "rounded bg-primary/15 px-1 text-primary",
          e.action === "block" && "bg-danger/15 text-danger",
        )}
      >
        {e.replacement}
      </span>,
    );
    cursor = e.end;
  }
  parts.push(text.slice(cursor));
  return parts;
}

function BlockedPanel({ reason, onEdit }: { reason: string; onEdit: () => void }) {
  return (
    <section
      className="panel flex flex-col border-danger/30 p-5 sm:p-6"
      aria-labelledby="blocked-title"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-danger/15">
          <ShieldAlert className="size-5 text-danger" aria-hidden />
        </span>
        <div>
          <h2
            id="blocked-title"
            className="font-mono text-lg font-semibold tracking-wider text-danger"
          >
            REQUEST BLOCKED
          </h2>
          <p className="text-sm text-muted-foreground">Critical information detected.</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed">{reason}</p>
      <p className="mt-2 text-sm text-muted-foreground">Nothing was forwarded.</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            document.getElementById("detections")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <ListChecks className="size-4" aria-hidden /> Review detections
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden /> Edit input
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/policies">
            <SlidersHorizontal className="size-4" aria-hidden /> View policies
          </Link>
        </Button>
      </div>
    </section>
  );
}

function DetectionList({ result }: { result: ScanResult }) {
  return (
    <section id="detections" className="panel p-5 sm:p-6" aria-labelledby="det-title">
      <div className="flex items-center justify-between">
        <h2 id="det-title" className="font-semibold">
          Detected Sensitive Data
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {result.entities.length} entities
        </span>
      </div>
      {result.entities.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing matched. The input is safe to send as-is under your current policy.
        </p>
      ) : (
        <>
          <table className="mt-4 hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">Entity</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Risk</th>
                <th className="pb-2 font-medium">Line</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {result.entities.map((e) => {
                const meta = ENTITY_META[e.type];
                const Icon = ENTITY_ICON[e.type];
                return (
                  <tr key={e.id} className="border-b border-border/60 last:border-0">
                    <td className="max-w-56 truncate py-3 pr-3 font-mono text-xs">{e.value}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                          CATEGORY_CLASS[meta.category].chip,
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden /> {e.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <SeverityBadge severity={meta.severity} />
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">Line {e.line}</td>
                    <td className="py-3">
                      <ActionBadge action={e.action} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ul className="mt-4 space-y-3 md:hidden">
            {result.entities.map((e) => {
              const meta = ENTITY_META[e.type];
              const Icon = ENTITY_ICON[e.type];
              return (
                <li key={e.id} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                        CATEGORY_CLASS[meta.category].chip,
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden /> {e.type.replace(/_/g, " ")}
                    </span>
                    <ActionBadge action={e.action} />
                  </div>
                  <p className="mt-2 break-all font-mono text-xs">{e.value}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <SeverityBadge severity={meta.severity} /> Line {e.line}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

void riskTone;
