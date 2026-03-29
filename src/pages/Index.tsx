import { useState, useEffect, useCallback } from "react";
import { Settings, Copy, Check, Loader2 } from "lucide-react";
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
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Settings size={20} />
        </button>
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
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse-glow" />
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="describe what you want drawn..."
                className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold tracking-wider px-6">
                DRAW
              </Button>
            </div>
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
                <div className="aspect-square overflow-hidden">
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
    </div>
  );
};

export default Index;
