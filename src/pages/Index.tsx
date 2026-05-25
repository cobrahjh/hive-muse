import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, Check, Loader2, Download, X, ChevronLeft, ChevronRight, History, Trash2, Bug, HelpCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePainterSocket, type WsMessage } from "@/hooks/usePainterSocket";

const GALLERY_BASE = "https://draw.kinghive.games";

interface GalleryImage {
  filename: string;
  url: string;
  externalUrl: string;
}

interface PainterStatus {
  mesh: boolean;
  version?: string;
  drawing: { id: string; prompt: string } | null;
  queue: { id: string; prompt: string; requester: string }[];
  overlayClients: number;
}

async function fetchGallery(): Promise<string[]> {
  const r = await fetch("/gallery/list");
  return r.json();
}

async function submitDraw(prompt: string): Promise<{ queued: boolean; queue_depth: number; error?: string }> {
  const r = await fetch("/draw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, requester: "web" }),
  });
  return r.json();
}

async function fetchStatus(): Promise<PainterStatus> {
  const r = await fetch("/status");
  return r.json();
}

async function deleteImage(filename: string): Promise<boolean> {
  const r = await fetch(`/gallery/${filename}`, { method: "DELETE" });
  return r.ok;
}

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<PainterStatus | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("hivepainter-history") || "[]");
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isGeneratingRef = useRef(false);
  const generatingSinceRef = useRef<number | null>(null);

  const saveHistory = (items: string[]) => {
    setHistory(items);
    localStorage.setItem("hivepainter-history", JSON.stringify(items));
  };

  const loadGallery = useCallback(async () => {
    try {
      const files = await fetchGallery();
      setImages(files.map(f => ({
        filename: f,
        url: `/gallery/${f}`,
        externalUrl: `${GALLERY_BASE}/gallery/${f}`,
      })));
    } catch {}
  }, []);

  const stopProgress = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  // Single entry point: mark generating
  const beginGenerating = useCallback((prompt: string) => {
    isGeneratingRef.current = true;
    generatingSinceRef.current = Date.now();
    setIsGenerating(true);
    setGeneratingPrompt(prompt);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        const increment = prev < 50 ? Math.random() * 6 + 1 : Math.random() * 3 + 0.5;
        return Math.min(prev + increment, 90);
      });
    }, 300);
  }, []);

  // Single entry point: clear generating
  const resetGenerating = useCallback(() => {
    isGeneratingRef.current = false;
    generatingSinceRef.current = null;
    stopProgress();
    setIsGenerating(false);
    setGeneratingPrompt("");
    setProgress(0);
  }, [stopProgress]);

  // WebSocket message handler
  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type === "connected") {
      const drawing = msg.drawing;
      if (!drawing && isGeneratingRef.current) {
        resetGenerating();
      } else if (drawing && !isGeneratingRef.current) {
        beginGenerating(drawing.prompt);
      }
    } else if (msg.type === "generating") {
      beginGenerating(msg.prompt);
    } else if (msg.type === "draw") {
      stopProgress();
      setProgress(100);
      setTimeout(() => resetGenerating(), 800);
      toast.success("Drawing complete!");
      setTimeout(loadGallery, 1500);
    } else if (msg.type === "error") {
      resetGenerating();
      toast.error(msg.reason || "Drawing failed");
    } else if (msg.type === "abort") {
      resetGenerating();
      toast.info("Drawing aborted");
    }
  }, [beginGenerating, stopProgress, resetGenerating, loadGallery]);

  usePainterSocket(handleWsMessage);

  // Load gallery on mount
  useEffect(() => { loadGallery(); }, [loadGallery]);

  // Poll status every 3s — server is authoritative
  useEffect(() => {
    const poll = async () => {
      let s: PainterStatus | null = null;
      try {
        s = await fetchStatus();
        setStatus(prev => {
          if (prev && prev.mesh === s!.mesh && prev.overlayClients === s!.overlayClients
              && !!prev.drawing === !!s!.drawing && prev.queue.length === s!.queue.length) return prev;
          return s;
        });
      } catch {}
      const serverDrawing = s ? !!s.drawing : false;
      if (serverDrawing && !isGeneratingRef.current) {
        beginGenerating(s!.drawing!.prompt);
      } else if (!serverDrawing && isGeneratingRef.current) {
        resetGenerating();
        loadGallery();
      } else if (isGeneratingRef.current && generatingSinceRef.current
          && Date.now() - generatingSinceRef.current > 180_000) {
        resetGenerating();
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDraw = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    const trimmed = prompt.trim();
    saveHistory([trimmed, ...history.filter(h => h !== trimmed)].slice(0, 20));

    try {
      const result = await submitDraw(trimmed);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const pos = result.queue_depth;
      toast.success(pos <= 1 ? `Drawing "${trimmed}" now!` : `Queued at position ${pos}`);
      setPrompt("");
    } catch (e: any) {
      toast.error("Request failed: " + e.message);
    }
  }, [prompt, isGenerating, history]);

  const handleCopy = (index: number) => {
    navigator.clipboard.writeText(images[index].externalUrl);
    setCopiedIndex(index);
    toast.success("Link copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDelete = async (index: number) => {
    const img = images[index];
    if (!confirm(`Delete ${img.filename}?`)) return;
    const ok = await deleteImage(img.filename);
    if (ok) {
      setImages(prev => prev.filter((_, i) => i !== index));
      if (lightboxIndex === index) setLightboxIndex(null);
      toast.success("Deleted");
    } else {
      toast.error("Delete failed");
    }
  };

  const [reportState, setReportState] = useState<"idle" | "waiting" | "resolved">("idle");
  const reportPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReportTimers = useCallback(() => {
    if (reportPollRef.current) { clearInterval(reportPollRef.current); reportPollRef.current = null; }
    if (reportTimeoutRef.current) { clearTimeout(reportTimeoutRef.current); reportTimeoutRef.current = null; }
  }, []);

  // Clean up report timers on unmount
  useEffect(() => () => clearReportTimers(), [clearReportTimers]);

  const handleReportIssue = useCallback(async () => {
    const description = isGenerating
      ? `Page is broken during generation of "${generatingPrompt}"`
      : prompt
        ? `Page is broken while drawing "${prompt}"`
        : "Page is broken — user reported via UI button";
    try {
      const r = await fetch("/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const { reportTs } = await r.json();
      setReportState("waiting");
      toast.success("Report sent — waiting for Claude...");

      clearReportTimers();
      reportPollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/report-status?since=${reportTs}`);
          const data = await res.json();
          if (data.resolved) {
            clearReportTimers();
            setReportState("resolved");
            toast.success(`Claude: ${data.message?.slice(0, 150) || "Issue resolved!"}`, { duration: 10000 });
            setTimeout(() => setReportState("idle"), 15000);
          }
        } catch {}
      }, 10000);

      reportTimeoutRef.current = setTimeout(() => {
        clearReportTimers();
        setReportState(prev => prev === "waiting" ? "idle" : prev);
      }, 300000);
    } catch {
      setReportState("idle");
      toast.error("Could not send report");
    }
  }, [prompt, isGenerating, generatingPrompt, clearReportTimers]);

  const queueDepth = status ? status.queue.length + (status.drawing ? 1 : 0) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-6 md:px-10 pb-16 space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between pt-5">
          <div>
            <h1 className="text-2xl font-bold tracking-wider flex items-center gap-2">
              <span className="text-primary">HIVE</span>
              <span className="text-foreground">PAINTER</span>
              <button
                onClick={() => setShowHelp(true)}
                className="w-5 h-5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center"
                title="Help"
              >
                <HelpCircle size={12} />
              </button>
            </h1>
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-0.5">
              AI Art Generator
            </p>
          </div>
          {status && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${status.mesh ? "bg-green-500" : "bg-red-500"}`} />
              <span>{status.mesh ? "Mesh" : "Offline"}</span>
              {status.version && <span>v{status.version}</span>}
            </div>
          )}
        </header>
        {/* Request Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-widest uppercase text-primary">
                Request a Drawing
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-secondary">
                  {isGenerating ? (
                    <Loader2 size={20} className="text-primary animate-spin" />
                  ) : (
                    <span className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_3px_hsl(36_100%_50%/0.5)] animate-pulse-glow" />
                  )}
                  <span className="text-base font-semibold text-foreground tracking-wide">
                    {isGenerating ? "Generating..." : "Ready"}
                  </span>
                  <Badge variant="secondary" className="text-xs ml-1">
                    Queue: {queueDepth}
                  </Badge>
                </div>
                <span className="hidden sm:block w-px h-5 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reportState === "idle" ? handleReportIssue : undefined}
                  aria-disabled={reportState !== "idle"}
                  aria-label={
                    reportState === "waiting" ? "Claude is investigating the reported issue"
                    : reportState === "resolved" ? "Issue resolved by Claude"
                    : "Report a page issue to Claude"
                  }
                  className={`text-xs gap-1.5 transition-all ${
                    reportState === "waiting"
                      ? "text-orange-400 animate-pulse"
                      : reportState === "resolved"
                        ? "text-green-400"
                        : "text-muted-foreground hover:text-destructive"
                  } ${reportState !== "idle" ? "pointer-events-none" : ""}`}
                >
                  {reportState === "waiting" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : reportState === "resolved" ? (
                    <Check size={14} />
                  ) : (
                    <Bug size={14} />
                  )}
                  <span aria-live="polite">
                    {reportState === "waiting" ? "Investigating..." : reportState === "resolved" ? "Resolved" : "Report Issue"}
                  </span>
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="describe what you want drawn..."
                className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                disabled={isGenerating}
                onKeyDown={(e) => e.key === "Enter" && handleDraw()}
              />
              <Button
                onClick={handleDraw}
                disabled={isGenerating || !prompt.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold tracking-wider px-6 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : "DRAW"}
              </Button>
            </div>

            {isGenerating && (
              <div className="space-y-1.5">
                <Progress value={progress} className="h-1.5 bg-secondary" />
                <p className="text-[10px] text-muted-foreground tracking-wider">
                  {progress >= 100 ? "Complete!" : `${Math.round(progress)}% — painting your vision...`}
                </p>
                {generatingPrompt && (
                  <p className="text-xs text-muted-foreground italic truncate">
                    "{generatingPrompt}"
                  </p>
                )}
              </div>
            )}

            {/* Prompt History */}
            {history.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <History size={14} />
                  <span>History ({history.length})</span>
                </button>

                {showHistory && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {history.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-secondary/50 group"
                      >
                        <button
                          onClick={() => { setPrompt(item); setShowHistory(false); }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate text-left flex-1"
                          disabled={isGenerating}
                        >
                          {item}
                        </button>
                        <button
                          onClick={() => saveHistory(history.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-foreground">
              Gallery
            </h2>
            <Badge variant="secondary" className="bg-secondary text-muted-foreground text-xs">
              {images.length}
            </Badge>
          </div>

          {images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drawings yet. Submit a prompt to get started!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <Card
                  key={img.filename}
                  className="bg-card border-border overflow-hidden group hover:border-primary/40 transition-colors"
                >
                  <div
                    className="aspect-square overflow-hidden cursor-pointer"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <button
                      onClick={() => handleCopy(i)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      {copiedIndex === i ? (
                        <Check size={14} className="text-primary" />
                      ) : (
                        <Copy size={14} />
                      )}
                      {copiedIndex === i ? "copied!" : "copy link"}
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={24} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
            }}
            className="absolute left-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={28} />
          </button>

          <div className="max-w-3xl max-h-[80vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].filename}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            <div className="flex items-center justify-center gap-4 mt-4">
              <a
                href={images[lightboxIndex].url}
                download={images[lightboxIndex].filename}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
              >
                <Download size={16} />
                Download
              </a>
              <button
                onClick={() => handleCopy(lightboxIndex)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                {copiedIndex === lightboxIndex ? <Check size={16} /> : <Copy size={16} />}
                {copiedIndex === lightboxIndex ? "Copied!" : "Copy Link"}
              </button>
              <span className="text-xs text-muted-foreground">
                {lightboxIndex + 1} / {images.length}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex + 1) % images.length);
            }}
            className="absolute right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              <span className="text-primary">HIVE</span>PAINTER
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p className="text-foreground font-medium">AI-powered art generator for the stream.</p>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest pt-1">How it works</p>
              <p>Type a prompt, hit Draw, and watch the AI create your image live on stream with a drawing animation.</p>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest pt-1">Twitch</p>
              <p>Use <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">!draw &lt;prompt&gt;</code> in chat to request a drawing. Queue shows how many are waiting.</p>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest pt-1">Gallery</p>
              <p>All generated images are saved below. Click to view full-size, copy link to share, or download.</p>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest pt-1">Report Issue</p>
              <p>If something breaks, click the bug icon next to Ready. Claude will automatically investigate and fix it.</p>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest pt-1">Tips</p>
              <p>Be descriptive — "a red dragon flying over a castle at sunset" works better than "dragon".</p>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 text-sm"
              onClick={() => setShowHelp(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
