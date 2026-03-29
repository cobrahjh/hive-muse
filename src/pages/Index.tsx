import { useState, useEffect, useCallback } from "react";
import { Settings, Copy, Check, Loader2, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDraw = useCallback(() => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setProgress(0);
  }, [prompt, isGenerating]);

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
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <Loader2 size={14} className="text-primary animate-spin" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse-glow" />
                )}
                <span className="text-xs text-muted-foreground">
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

      {/* Settings Panel Overlay */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        />
      )}

      {/* Settings Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
          settingsOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-primary">
            Settings
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto h-[calc(100%-65px)]">
          {/* Model */}
          <div className="space-y-2">
            <Label className="text-xs tracking-wider uppercase text-muted-foreground">Model</Label>
            <Select defaultValue="standard">
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border" />

          {/* Image Size */}
          <div className="space-y-2">
            <Label className="text-xs tracking-wider uppercase text-muted-foreground">Size</Label>
            <Select defaultValue="1024">
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512">512 × 512</SelectItem>
                <SelectItem value="1024">1024 × 1024</SelectItem>
                <SelectItem value="1920">1920 × 1080</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border" />

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs tracking-wider uppercase text-muted-foreground">Steps</Label>
              <span className="text-xs text-muted-foreground">30</span>
            </div>
            <Slider defaultValue={[30]} max={50} min={10} step={5} className="w-full" />
          </div>

          <Separator className="bg-border" />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Auto-save to gallery</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">HD upscale</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Notifications</Label>
              <Switch defaultChecked />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Version info */}
          <div className="pt-2">
            <p className="text-[10px] text-muted-foreground tracking-wider">HIVEPAINTER v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
