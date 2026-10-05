import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  ScanSearch,
  Download,
  Trash2,
  Eye,
  File,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/shield/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { riskTone } from "@/components/shield/tokens";
import { scanText } from "@/lib/detection";
import {
  MAX_UPLOAD_BYTES,
  addDocument,
  addHistory,
  deleteDocument,
  updateDocumentScan,
  useStore,
  type VeilDocument,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents | Veil" },
      {
        name: "description",
        content:
          "Upload documents into Veil, keep a library of what you've ingested, scan each one on demand, and download the sanitized output.",
      },
      { property: "og:title", content: "Documents | Veil" },
      { property: "og:description", content: "Your document library inside Veil." },
    ],
  }),
  component: DocumentsPage,
});

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

function formatAgo(ts: number, now: number) {
  const diff = Math.max(0, now - ts);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const date = new Date(ts);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}

function Uploader({ onDone }: { onDone: () => void }) {
  const policies = useStore((s) => s.policies);
  const settings = useStore((s) => s.settings);
  const [dragOver, setDragOver] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ingest = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(
        `${file.name} is too large (${formatSize(file.size)}). Max is ${formatSize(MAX_UPLOAD_BYTES)}.`,
      );
      return;
    }
    const ext = extOf(file.name);
    setIngesting(true);
    setProgress(10);
    try {
      let content: string | undefined;
      let contentTruncated = false;
      if (TEXT_EXTS.has(ext)) {
        setProgress(50);
        const raw = await readAsText(file);
        if (raw.length > 500_000) {
          content = raw.slice(0, 500_000);
          contentTruncated = true;
        } else {
          content = raw;
        }
      }
      setProgress(85);
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
      setProgress(100);
      toast.success(`${file.name} added.`, {
        description: !content
          ? "Text extraction is not supported for this format yet."
          : contentTruncated
            ? "Text loaded (truncated to 500k chars)."
            : "Text loaded. You can scan it now.",
      });
      // Auto-scan documents with readable content — useful when it's a bulk drop.
      if (content && content.trim()) {
        const r = scanText(content, policies, {
          strictMode: settings.strictMode,
          blockCritical: settings.blockCritical,
          enabledCategories: settings.categories,
        });
        const actions = r.entities.map((e) => e.action);
        const historyId = `SCN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
        addHistory({
          id: historyId,
          timestamp: Date.now(),
          preview: (content.slice(0, 64) || file.name) + (content.length > 64 ? "…" : ""),
          entityCount: r.entities.length,
          types: r.entities.map((e) => e.type),
          score: r.score,
          action: actions.includes("block") ? "block" : (actions[0] ?? "none"),
          status: r.blocked ? "BLOCKED" : r.entities.length ? "PROTECTED" : "CLEAN",
          source: "document",
          documentId: doc.id,
        });
        updateDocumentScan(doc.id, {
          lastScanId: historyId,
          entityCount: r.entities.length,
          score: r.score,
          preview: content.slice(0, 120),
        });
      }
    } catch {
      toast.error(`Couldn't read ${file.name}.`);
    } finally {
      setTimeout(() => {
        setIngesting(false);
        setProgress(0);
        onDone();
      }, 250);
    }
  };

  const onPick = (files: FileList | null) => {
    if (!files || !files.length) return;
    Array.from(files).forEach((f, i) => setTimeout(() => ingest(f), i * 120));
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer?.files?.length) return;
    Array.from(e.dataTransfer.files).forEach((f, i) => setTimeout(() => ingest(f), i * 120));
  };

  return (
    <section
      className={cn(
        "panel overflow-hidden border transition-colors",
        dragOver ? "border-primary/60 bg-primary/5" : "border-border",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-b border-dashed px-5 py-10 text-center transition-colors sm:px-8",
          dragOver ? "bg-primary/5" : "bg-muted/20",
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
          <Upload className="size-5 text-primary" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium">Drop files here, or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ACCEPTED_EXTS.join(", ")} · max {formatSize(MAX_UPLOAD_BYTES)} each
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
            aria-label="Choose files"
          />
          <Button onClick={() => inputRef.current?.click()} disabled={ingesting} className="gap-2">
            {ingesting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Ingesting…
              </>
            ) : (
              <>
                <FileText className="size-4" aria-hidden /> Choose files
              </>
            )}
          </Button>
        </div>
        {ingesting && (
          <div className="w-full max-w-xs space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="font-mono text-[11px] text-muted-foreground">Uploading to library…</p>
          </div>
        )}
      </div>
    </section>
  );
}

function DocRowBadges({ doc }: { doc: VeilDocument }) {
  if (typeof doc.score !== "number") {
    return (
      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
        Not scanned
      </Badge>
    );
  }
  const t = riskTone(doc.score);
  return (
    <span className={cn("font-mono text-xs font-semibold tabular-nums", t.text)}>
      {doc.score}/100
    </span>
  );
}

function DocumentsPage() {
  const router = useRouter();
  const policies = useStore((s) => s.policies);
  const settings = useStore((s) => s.settings);
  const documents = useStore((s) => s.documents);

  const [q, setQ] = useState("");
  const [now, setNow] = useState(() => (typeof Date === "undefined" ? 0 : Date.now()));
  const [viewDoc, setViewDoc] = useState<VeilDocument | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);

  const rows = useMemo(
    () => documents.filter((d) => (q ? d.name.toLowerCase().includes(q.toLowerCase()) : true)),
    [documents, q],
  );

  const scanDoc = async (doc: VeilDocument) => {
    if (!doc.content) {
      toast.warning(
        "This document has no readable text yet. Paste the text into the Scanner to analyze it.",
        {
          description: "Binary formats like docx/pdf need manual text input right now.",
        },
      );
      return;
    }
    setScanningId(doc.id);
    setTimeout(() => {
      const r = scanText(doc.content!, policies, {
        strictMode: settings.strictMode,
        blockCritical: settings.blockCritical,
        enabledCategories: settings.categories,
      });
      const actions = r.entities.map((e) => e.action);
      const historyId = `SCN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
      addHistory({
        id: historyId,
        timestamp: Date.now(),
        preview: (doc.content!.slice(0, 64) || doc.name) + (doc.content!.length > 64 ? "…" : ""),
        entityCount: r.entities.length,
        types: r.entities.map((e) => e.type),
        score: r.score,
        action: actions.includes("block") ? "block" : (actions[0] ?? "none"),
        status: r.blocked ? "BLOCKED" : r.entities.length ? "PROTECTED" : "CLEAN",
        source: "document",
        documentId: doc.id,
      });
      updateDocumentScan(doc.id, {
        lastScanId: historyId,
        entityCount: r.entities.length,
        score: r.score,
        preview: doc.content!.slice(0, 120),
      });
      setScanningId(null);
      toast.success(`${doc.name} scanned`, {
        description:
          r.entities.length === 0
            ? "Nothing sensitive found."
            : `Found ${r.entities.length} sensitive items.`,
      });
      setNow(Date.now());
    }, 500);
  };

  const downloadSafe = (doc: VeilDocument) => {
    if (!doc.content) {
      toast.error("No readable content available for this document.");
      return;
    }
    if (typeof doc.score !== "number") {
      scanDoc(doc);
      toast.info("Scanning first, then the safe version will be ready.");
      return;
    }
    const r = scanText(doc.content, policies, {
      strictMode: settings.strictMode,
      blockCritical: settings.blockCritical,
      enabledCategories: settings.categories,
    });
    const blob = new Blob([r.safeText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = doc.name.replace(/\.[^.]+$/, "");
    a.href = url;
    a.download = `${base}.safe.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`${base}.safe.txt downloaded`);
  };

  const removeDoc = (doc: VeilDocument) => {
    deleteDocument(doc.id);
    if (viewDoc?.id === doc.id) setViewDoc(null);
    toast.success(`${doc.name} removed from library`);
  };

  return (
    <AppShell
      title="Documents"
      subtitle="Keep the documents you scan in one place. Scan on demand, download the safe version, remove when you're done."
    >
      <div className="mb-6">
        <Uploader onDone={() => setNow(Date.now())} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </Badge>
          {documents.some((d) => typeof d.score === "number") && (
            <Badge variant="outline">
              {documents.filter((d) => typeof d.score === "number" && d.score! > 0).length} scanned
            </Badge>
          )}
        </div>
        <div className="relative sm:w-64">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search documents…"
            className="pl-9"
            aria-label="Search documents"
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <File className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <h3 className="mt-5 text-lg font-semibold">Your library is empty</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Drop a document above to start. Veil keeps it in this browser only — nothing is uploaded
            to a server.
          </p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Entities</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-border/60 last:border-0 hover:bg-secondary/30"
                >
                  <td className="max-w-md truncate px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate font-medium">{d.name}</span>
                      {d.contentTruncated && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          TRUNCATED
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatSize(d.size)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatAgo(d.uploadedAt, now)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {typeof d.entityCount === "number"
                      ? `${d.entityCount} ${d.entityCount === 1 ? "item" : "items"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <DocRowBadges doc={d} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="View document"
                        onClick={() => setViewDoc(d)}
                        disabled={!d.content}
                      >
                        <Eye className="size-4" aria-hidden />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Scan document"
                        onClick={() => scanDoc(d)}
                        disabled={scanningId === d.id}
                      >
                        {scanningId === d.id ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <ScanSearch className="size-4" aria-hidden />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Download safe version"
                        onClick={() => downloadSafe(d)}
                      >
                        <Download className="size-4" aria-hidden />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete document"
                        onClick={() => removeDoc(d)}
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-border md:hidden">
            {rows.map((d) => (
              <li key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" aria-hidden />
                      <p className="truncate font-medium">{d.name}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatSize(d.size)}</span>
                      <span aria-hidden>·</span>
                      <span>{formatAgo(d.uploadedAt, now)}</span>
                      {d.contentTruncated && (
                        <>
                          <span aria-hidden>·</span>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            TRUNC
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <DocRowBadges doc={d} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {typeof d.entityCount === "number"
                      ? `${d.entityCount} entities`
                      : "Not scanned"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="View document"
                      onClick={() => setViewDoc(d)}
                      disabled={!d.content}
                    >
                      <Eye className="size-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Scan document"
                      onClick={() => scanDoc(d)}
                      disabled={scanningId === d.id}
                    >
                      {scanningId === d.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <ScanSearch className="size-4" aria-hidden />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Download safe version"
                      onClick={() => downloadSafe(d)}
                    >
                      <Download className="size-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete document"
                      onClick={() => removeDoc(d)}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {rows.length === 0 && documents.length > 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No documents match "{q}".
            </p>
          )}
        </div>
      )}

      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-2xl">
          {viewDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="truncate pr-2">{viewDoc.name}</DialogTitle>
                  <button
                    onClick={() => setViewDoc(null)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Close document preview"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <DialogDescription>
                  {formatSize(viewDoc.size)} · added {formatAgo(viewDoc.uploadedAt, now)}
                  {viewDoc.entityCount !== undefined && (
                    <> · {viewDoc.entityCount} entities detected</>
                  )}
                </DialogDescription>
              </DialogHeader>
              {viewDoc.content ? (
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background/60 p-4 font-mono text-xs leading-relaxed">
                  {viewDoc.content}
                </pre>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                  No readable text stored for this format yet. Head to the Scanner and paste the
                  content in to analyze it.
                </div>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewDoc.content) {
                      router.navigate({ to: "/scanner" });
                      setTimeout(() => {
                        const ta = document.getElementById(
                          "prompt-input",
                        ) as HTMLTextAreaElement | null;
                        if (ta) ta.focus();
                      }, 200);
                    }
                  }}
                  disabled={!viewDoc.content}
                  className="gap-2"
                >
                  <ScanSearch className="size-4" aria-hidden /> Open in Scanner
                </Button>
                <Button onClick={() => downloadSafe(viewDoc)} className="gap-2">
                  <Download className="size-4" aria-hidden /> Download safe version
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
