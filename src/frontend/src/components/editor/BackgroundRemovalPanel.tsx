import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Eraser, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";

interface Props {
  imageDataUrl: string | null;
  onImageChange: (newUrl: string) => void;
  onHistoryAdd: (label: string) => void;
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function removeBackground(
  imageDataUrl: string,
  tolerance: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Sample edge pixels to find background color
      const edgeSamples: [number, number, number][] = [];
      for (let x = 0; x < w; x++) {
        const topIdx = (0 * w + x) * 4;
        const botIdx = ((h - 1) * w + x) * 4;
        edgeSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
        edgeSamples.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
      }
      for (let y = 0; y < h; y++) {
        const leftIdx = (y * w + 0) * 4;
        const rightIdx = (y * w + (w - 1)) * 4;
        edgeSamples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
        edgeSamples.push([
          data[rightIdx],
          data[rightIdx + 1],
          data[rightIdx + 2],
        ]);
      }

      // Find most common edge color (quantized to 32-step buckets)
      const colorCount = new Map<
        string,
        { count: number; r: number; g: number; b: number }
      >();
      for (const [r, g, b] of edgeSamples) {
        const key = `${Math.round(r / 32)},${Math.round(g / 32)},${Math.round(b / 32)}`;
        const existing = colorCount.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorCount.set(key, { count: 1, r, g, b });
        }
      }

      let bgColor = { r: 255, g: 255, b: 255 };
      let maxCount = 0;
      for (const entry of colorCount.values()) {
        if (entry.count > maxCount) {
          maxCount = entry.count;
          bgColor = { r: entry.r, g: entry.g, b: entry.b };
        }
      }

      // Flood fill from all 4 corners
      const visited = new Uint8Array(w * h);
      const queue: number[] = [];

      // Add corner pixels to queue
      const corners = [0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1)];
      for (const idx of corners) {
        const pixIdx = idx * 4;
        const pr = data[pixIdx];
        const pg = data[pixIdx + 1];
        const pb = data[pixIdx + 2];
        if (
          !visited[idx] &&
          colorDistance(pr, pg, pb, bgColor.r, bgColor.g, bgColor.b) <=
            tolerance * 2.2
        ) {
          visited[idx] = 1;
          queue.push(idx);
        }
      }

      // BFS flood fill
      let qi = 0;
      while (qi < queue.length) {
        const idx = queue[qi++];
        const x = idx % w;
        const y = Math.floor(idx / w);
        const pixIdx = idx * 4;
        data[pixIdx + 3] = 0; // set alpha to 0

        const neighbors = [
          x > 0 ? idx - 1 : -1,
          x < w - 1 ? idx + 1 : -1,
          y > 0 ? idx - w : -1,
          y < h - 1 ? idx + w : -1,
        ];

        for (const nIdx of neighbors) {
          if (nIdx < 0 || visited[nIdx]) continue;
          const nPixIdx = nIdx * 4;
          const nr = data[nPixIdx];
          const ng = data[nPixIdx + 1];
          const nb = data[nPixIdx + 2];
          if (
            colorDistance(nr, ng, nb, bgColor.r, bgColor.g, bgColor.b) <=
            tolerance * 2.2
          ) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

export default function BackgroundRemovalPanel({
  imageDataUrl,
  onImageChange,
  onHistoryAdd,
}: Props) {
  const [tolerance, setTolerance] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [bgRemoved, setBgRemoved] = useState(false);

  const handleRemove = async () => {
    if (!imageDataUrl) return;
    setIsProcessing(true);
    try {
      const original = imageDataUrl;
      const result = await removeBackground(imageDataUrl, tolerance);
      setOriginalUrl(original);
      onImageChange(result);
      setBgRemoved(true);
      onHistoryAdd("Background removed");
    } catch {
      // silent fail
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = () => {
    if (!originalUrl) return;
    onImageChange(originalUrl);
    setOriginalUrl(null);
    setBgRemoved(false);
    onHistoryAdd("Restored original background");
  };

  return (
    <div className="editor-card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          Background Removal
        </h2>
      </div>
      <div className="p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Tolerance</Label>
            <span className="text-xs text-foreground font-medium">
              {tolerance}
            </span>
          </div>
          <Slider
            min={0}
            max={80}
            step={1}
            value={[tolerance]}
            onValueChange={([v]) => setTolerance(v)}
            className="h-4"
          />
          <p className="text-[10px] text-muted-foreground/70">
            Higher = removes more similar colors
          </p>
        </div>

        <Button
          data-ocid="bg_remove.primary_button"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          onClick={handleRemove}
          disabled={!imageDataUrl || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2
                data-ocid="bg_remove.loading_state"
                className="w-3.5 h-3.5 animate-spin"
              />
              Processing...
            </>
          ) : (
            <>
              <Eraser className="w-3.5 h-3.5" />
              Remove Background
            </>
          )}
        </Button>

        {bgRemoved && (
          <Button
            data-ocid="bg_remove.secondary_button"
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-border bg-transparent text-foreground hover:bg-accent w-full"
            onClick={handleRestore}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Original
          </Button>
        )}

        <div
          className="rounded-lg p-3 text-[10px] text-muted-foreground/70 leading-relaxed"
          style={{ background: "oklch(0.21 0.018 243)" }}
        >
          <p className="font-semibold text-muted-foreground mb-1">
            How it works
          </p>
          <p>
            Detects the background color from image edges, then removes
            connected pixels of similar color using flood-fill. Best results
            with solid or near-solid backgrounds.
          </p>
        </div>
      </div>
    </div>
  );
}
