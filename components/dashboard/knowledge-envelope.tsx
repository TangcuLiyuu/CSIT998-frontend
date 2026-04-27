"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Mail, FileText, X, ExternalLink, BookOpen, ChevronRight, Download, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeEnvelopeProps {
  references: string[];
}

interface DocumentModalProps {
  filename: string;
  onClose: () => void;
  onResolvedFilename?: (name: string) => void;
}

function getShortName(filename: string): string {
  return filename.replace(/\.(docx|pdf)$/i, "").trim();
}

/**
 * Unified document preview component.
 * Fetches /api/documents/preview and renders based on the actual Content-Type
 * returned by the server (which resolves PDF-first regardless of the reference
 * filename's extension).
 *
 * Calls onResolved(actualFilename) once the server responds, so the parent
 * can update download/open links to point to the real file.
 */
function DocumentPreview({
  filename,
  onResolved,
}: {
  filename: string;
  onResolved?: (resolvedName: string) => void;
}) {
  // "pdf" | "docx" | null (null = still loading)
  const [fileType, setFileType] = useState<"pdf" | "docx" | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setHtml(null);
    setPdfUrl(null);
    setFileType(null);

    const previewUrl = `/api/documents/preview?filename=${encodeURIComponent(filename)}`;

    fetch(previewUrl, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load preview");
        }

        // Read the resolved filename from the response header
        const resolvedEncoded = res.headers.get("X-Resolved-Filename");
        const resolvedName = resolvedEncoded
          ? decodeURIComponent(resolvedEncoded)
          : filename;
        console.log(
          `[DocumentPreview] reference="${filename}" → actual="${resolvedName}"`
        );
        onResolved?.(resolvedName);

        const contentType = res.headers.get("Content-Type") || "";
        if (contentType.includes("application/pdf")) {
          // Create an object URL from the blob so the iframe can display it
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setFileType("pdf");
        } else {
          const text = await res.text();
          setHtml(text);
          setFileType("docx");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load preview");
        setLoading(false);
      });

    // Revoke object URL on unmount to avoid memory leaks
    return () => {
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [filename]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading preview…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-8">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">Preview unavailable</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (fileType === "pdf" && pdfUrl) {
    return (
      <iframe
        src={pdfUrl}
        className="w-full h-full block"
        title={filename}
      />
    );
  }

  if (fileType === "docx" && html !== null) {
    return (
      <div
        className="w-full h-full overflow-y-auto px-8 py-6 prose prose-sm max-w-none
          prose-headings:text-foreground prose-p:text-foreground/90
          prose-strong:text-foreground prose-li:text-foreground/90
          prose-table:text-foreground prose-th:text-foreground prose-td:text-foreground/90
          dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <p className="text-muted-foreground text-sm">Unsupported file type</p>
    </div>
  );
}

function DocumentModal({ filename, onClose }: DocumentModalProps) {
  // resolvedFilename is updated once the preview API responds with the actual
  // file on disk (e.g. .pdf instead of .docx). Used for download/open links.
  const [resolvedFilename, setResolvedFilename] = useState<string>(filename);

  // Reset when a new file is opened
  useEffect(() => {
    setResolvedFilename(filename);
  }, [filename]);

  // fileUrl always points to the actual resolved file for download/open
  const fileUrl = `/api/documents?filename=${encodeURIComponent(resolvedFilename)}`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-4xl h-[90vh] flex flex-col rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/50 bg-card/60 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none mb-0.5">
              Knowledge Reference
            </p>
            <h3 className="text-sm font-semibold text-foreground truncate leading-snug">
              {getShortName(resolvedFilename)}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Open in new tab */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {/* Download */}
            <a
              href={fileUrl}
              download={resolvedFilename}
              title="Download"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Download className="h-4 w-4" />
            </a>
            {/* Close */}
            <button
              onClick={onClose}
              title="Close"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content — flex-1 min-h-0 + overflow-hidden so children can fill & scroll */}
        <div className="flex-1 min-h-0 overflow-hidden bg-background">
          <DocumentPreview filename={filename} onResolved={setResolvedFilename} />
        </div>
      </div>
    </div>,
    document.body
  );
}

interface FloatingPanelProps {
  references: string[];
  anchorRect: DOMRect;
  onClose: () => void;
  onDocClick: (ref: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function FloatingPanel({
  references,
  anchorRect,
  onClose,
  onDocClick,
  onMouseEnter,
  onMouseLeave,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const right = window.innerWidth - anchorRect.right;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: anchorRect.bottom + 6,
        right,
        zIndex: 150,
      }}
      className="w-72 rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
        <div className="h-6 w-6 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
          <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Knowledge Retrieved
          </p>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">
            {references.length} document{references.length > 1 ? "s" : ""} referenced
          </p>
        </div>
      </div>

      {/* Document List */}
      <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
        {references.map((ref, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onDocClick(ref)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left",
              "hover:bg-muted/60 active:bg-muted/80 transition-colors group"
            )}
          >
            <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="flex-1 text-xs text-foreground leading-snug line-clamp-2 font-medium">
              {getShortName(ref)}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
        <p className="text-[10px] text-muted-foreground text-center">
          Click a document to preview its content
        </p>
      </div>
    </div>,
    document.body
  );
}

/**
 * KnowledgeEnvelope — envelope badge with hover panel and document modal.
 * Must be placed inside a `relative` parent (the node circle div).
 */
export function KnowledgeEnvelope({ references }: KnowledgeEnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!references || references.length === 0) return null;

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openPanel = () => {
    cancelClose();
    if (badgeRef.current) {
      setAnchorRect(badgeRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setAnchorRect(null);
    }, 200);
  };

  const closePanel = useCallback(() => {
    cancelClose();
    setIsOpen(false);
    setAnchorRect(null);
  }, []);

  const handleDocClick = (ref: string) => {
    closePanel();
    setSelectedDoc(ref);
  };

  return (
    <>
      {/* Badge — absolute positioned at top-right of parent circle */}
      <div
        ref={badgeRef}
        className="absolute -top-1 -right-1 z-40"
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center cursor-pointer shadow-md relative",
            "bg-emerald-500 text-white transition-transform duration-200",
            isOpen ? "scale-125" : "scale-100"
          )}
        >
          <Mail className="h-3 w-3 relative z-10" />
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Floating panel via portal — shares the same open/close timer */}
      {mounted && isOpen && anchorRect && (
        <FloatingPanel
          references={references}
          anchorRect={anchorRect}
          onClose={closePanel}
          onDocClick={handleDocClick}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />
      )}

      {/* Document Modal — rendered via portal so it's always on top */}
      {mounted && selectedDoc && (
        <DocumentModal
          filename={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </>
  );
}
