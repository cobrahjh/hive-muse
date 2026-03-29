import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Loader2, Download, X, ChevronLeft, ChevronRight, History, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=400&fit=crop",
];

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("hivepainter-history") || "[]");
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);

  const saveHistory = (items: string[]) => {
    setHistory(items);
    localStorage.setItem("hivepainter-history", JSON.stringify(items));
  };

  const handleDraw = useCallback(() => {
    if (!prompt.trim() || isGenerating) return;
    const trimmed = prompt.trim();
    saveHistory([trimmed, ...history.filter(h => h !== trimmed)].slice(0, 20));
    setIsGenerating(true);
    setProgress(0);
  }, [prompt, isGenerating, history]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          toast.success("Drawing complete!");
          return 0;
        }
        // Accelerate near the end for a natural feel
        const increment = prev < 70 ? Math.random() * 8 + 2 : Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleCopy = (index: number) => {
    navigator.clipboard.writeText(MOCK_IMAGES[index]);
    setCopiedIndex(index);
    toast.success("Link copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div>
          <h1 className="text-2xl font-bold tracking-wider">
            <span className="text-primary">HIVE</span>
            <span className="text-foreground">PAINTER</span>
          </h1>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-0.5">
            AI Art Generator
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-10 pb-16 space-y-10">
        {/* Request Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-widest uppercase text-primary">
                Request a Drawing
              </h2>
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-secondary">
                {isGenerating ? (
                  <Loader2 size={20} className="text-primary animate-spin" />
                ) : (
                  <span className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_10px_3px_rgba(74,222,128,0.5)] animate-pulse-glow" />
                )}
                <span className="text-base font-semibold text-foreground tracking-wide">
                  {isGenerating ? "Generating..." : "Ready"}
                </span>
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
                  {Math.round(progress)}% — painting your vision...
                </p>
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
              {MOCK_IMAGES.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_IMAGES.map((src, i) => (
              <Card
                key={i}
                className="bg-card border-border overflow-hidden group hover:border-primary/40 transition-colors"
              >
                <div
                  className="aspect-square overflow-hidden cursor-pointer"
                  onClick={() => setLightboxIndex(i)}
                >
                  <img
                    src={src}
                    alt={`Generated art ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <button
                    onClick={() => handleCopy(i)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {copiedIndex === i ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                    {copiedIndex === i ? "copied!" : "copy link"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={24} />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex - 1 + MOCK_IMAGES.length) % MOCK_IMAGES.length);
            }}
            className="absolute left-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Image */}
          <div className="max-w-3xl max-h-[80vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={MOCK_IMAGES[lightboxIndex].replace("w=400&h=400", "w=1200&h=1200")}
              alt={`Generated art ${lightboxIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            <div className="flex items-center justify-center gap-4 mt-4">
              <a
                href={MOCK_IMAGES[lightboxIndex].replace("w=400&h=400", "w=1200&h=1200")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
              >
                <Download size={16} />
                Download
              </a>
              <span className="text-xs text-muted-foreground">
                {lightboxIndex + 1} / {MOCK_IMAGES.length}
              </span>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex + 1) % MOCK_IMAGES.length);
            }}
            className="absolute right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Index;
