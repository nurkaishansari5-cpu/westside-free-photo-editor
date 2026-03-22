import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  imageDataUrl: string | null;
  onImageChange: (url: string) => void;
  onHistoryAdd: (label: string) => void;
}

interface SliderConfig {
  key: keyof RestoreSettings;
  label: string;
  description: string;
}

interface RestoreSettings {
  denoise: number;
  contrast: number;
  color: number;
  sharpness: number;
  scratches: number;
}

const DEFAULT_SETTINGS: RestoreSettings = {
  denoise: 0,
  contrast: 0,
  color: 0,
  sharpness: 0,
  scratches: 0,
};

const AUTO_SETTINGS: RestoreSettings = {
  denoise: 40,
  contrast: 60,
  color: 55,
  sharpness: 45,
  scratches: 50,
};

const SLIDERS: SliderConfig[] = [
  { key: "denoise", label: "Denoise", description: "Reduce noise & grain" },
  {
    key: "contrast",
    label: "Enhance Contrast",
    description: "Stretch histogram",
  },
  { key: "color", label: "Restore Color", description: "Boost faded colors" },
  { key: "sharpness", label: "Sharpness", description: "Sharpen details" },
  {
    key: "scratches",
    label: "Remove Scratches",
    description: "Fix bright spots",
  },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function applyBoxBlur(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number,
) {
  const tmp = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = clamp(x + kx, 0, w - 1);
          const ny = clamp(y + ky, 0, h - 1);
          const idx = (ny * w + nx) * 4;
          r += tmp[idx];
          g += tmp[idx + 1];
          b += tmp[idx + 2];
          count++;
        }
      }
      const i = (y * w + x) * 4;
      data[i] = r / count;
      data[i + 1] = g / count;
      data[i + 2] = b / count;
    }
  }
}

function rgbToHsl(
  rIn: number,
  gIn: number,
  bIn: number,
): [number, number, number] {
  const r = rIn / 255;
  const g = gIn / 255;
  const b = bIn / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, tIn: number) => {
    let t = tIn;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function processImage(src: string, settings: RestoreSettings): Promise<string> {
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
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Denoise — box blur
      if (settings.denoise > 0) {
        const radius = Math.round((settings.denoise / 100) * 2);
        if (radius > 0) applyBoxBlur(data, w, h, radius);
      }

      // 2. Remove scratches — replace bright isolated pixels
      if (settings.scratches > 0) {
        const threshold = 255 - Math.round((settings.scratches / 100) * 60);
        const tmp = new Uint8ClampedArray(data);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 4;
            const brightness = (tmp[i] + tmp[i + 1] + tmp[i + 2]) / 3;
            if (brightness > threshold) {
              const neighbors = [
                ((y - 1) * w + x) * 4,
                ((y + 1) * w + x) * 4,
                (y * w + x - 1) * 4,
                (y * w + x + 1) * 4,
              ];
              const avgN =
                neighbors.reduce(
                  (s, ni) => s + (tmp[ni] + tmp[ni + 1] + tmp[ni + 2]) / 3,
                  0,
                ) / neighbors.length;
              if (brightness - avgN > 60) {
                data[i] = avgN;
                data[i + 1] = avgN;
                data[i + 2] = avgN;
              }
            }
          }
        }
      }

      // 3. Auto contrast stretch
      if (settings.contrast > 0) {
        const strength = settings.contrast / 100;
        let minV = 255;
        let maxV = 0;
        for (let i = 0; i < data.length; i += 4) {
          const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        }
        const range = maxV - minV;
        if (range > 0) {
          const lo = minV * strength;
          const hi = maxV + (255 - maxV) * strength;
          const span = hi - lo;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = clamp(((data[i] - lo) / span) * 255, 0, 255);
            data[i + 1] = clamp(((data[i + 1] - lo) / span) * 255, 0, 255);
            data[i + 2] = clamp(((data[i + 2] - lo) / span) * 255, 0, 255);
          }
        }
      }

      // 4. Restore color — boost saturation
      if (settings.color > 0) {
        const boost = 1 + (settings.color / 100) * 1.5;
        for (let i = 0; i < data.length; i += 4) {
          const [hVal, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const newS = clamp(s * boost, 0, 1);
          const [nr, ng, nb] = hslToRgb(hVal, newS, l);
          data[i] = nr;
          data[i + 1] = ng;
          data[i + 2] = nb;
        }
      }

      // 5. Sharpening — unsharp mask
      if (settings.sharpness > 0) {
        const amount = settings.sharpness / 100;
        const blurred = new Uint8ClampedArray(data);
        applyBoxBlur(blurred, w, h, 1);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = clamp(
            data[i] + (data[i] - blurred[i]) * amount * 3,
            0,
            255,
          );
          data[i + 1] = clamp(
            data[i + 1] + (data[i + 1] - blurred[i + 1]) * amount * 3,
            0,
            255,
          );
          data[i + 2] = clamp(
            data[i + 2] + (data[i + 2] - blurred[i + 2]) * amount * 3,
            0,
            255,
          );
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export default function OldPhotoRestorePanel({
  imageDataUrl,
  onImageChange,
  onHistoryAdd,
}: Props) {
  const [settings, setSettings] = useState<RestoreSettings>(DEFAULT_SETTINGS);
  const [processing, setProcessing] = useState(false);

  const handleAutoRestore = async () => {
    if (!imageDataUrl) {
      toast.error("Upload an image first");
      return;
    }
    setSettings(AUTO_SETTINGS);
    setProcessing(true);
    try {
      const result = await processImage(imageDataUrl, AUTO_SETTINGS);
      onImageChange(result);
      onHistoryAdd("Auto Restored old photo");
      toast.success("Photo restored!");
    } catch {
      toast.error("Restoration failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!imageDataUrl) {
      toast.error("Upload an image first");
      return;
    }
    setProcessing(true);
    try {
      const result = await processImage(imageDataUrl, settings);
      onImageChange(result);
      onHistoryAdd("Applied photo restoration");
      toast.success("Restoration applied!");
    } catch {
      toast.error("Restoration failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div
      className="rounded-xl border border-border flex flex-col h-full overflow-y-auto"
      style={{ background: "oklch(0.15 0.014 243)" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles
            className="w-4 h-4"
            style={{ color: "oklch(0.78 0.18 55)" }}
          />
          <h3 className="text-sm font-semibold text-foreground">
            Restore Old Photo
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Clean &amp; restore aged or damaged photos
        </p>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Auto Restore */}
        <Button
          data-ocid="restore.auto_restore.button"
          size="sm"
          disabled={processing || !imageDataUrl}
          onClick={handleAutoRestore}
          className="w-full h-9 text-xs font-semibold gap-2"
          style={{
            background: processing
              ? "oklch(0.30 0.05 55)"
              : "linear-gradient(135deg, oklch(0.65 0.18 55), oklch(0.58 0.20 35))",
            color: "white",
          }}
        >
          {processing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" /> Auto Restore
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-px"
            style={{ background: "oklch(0.25 0.014 243)" }}
          />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            or manual
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "oklch(0.25 0.014 243)" }}
          />
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-4">
          {SLIDERS.map(({ key, label, description }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {description}
                  </p>
                </div>
                <span
                  className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded"
                  style={{
                    background: "oklch(0.20 0.018 243)",
                    color:
                      settings[key] > 0
                        ? "oklch(0.78 0.18 55)"
                        : "oklch(0.55 0.014 243)",
                  }}
                >
                  {settings[key]}
                </span>
              </div>
              <input
                data-ocid={`restore.${key}.input`}
                type="range"
                min={0}
                max={100}
                value={settings[key]}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    [key]: Number(e.target.value),
                  }))
                }
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: "oklch(0.65 0.18 55)",
                  background: `linear-gradient(to right, oklch(0.65 0.18 55) ${settings[key]}%, oklch(0.22 0.014 243) ${settings[key]}%)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          <Button
            data-ocid="restore.apply.button"
            size="sm"
            disabled={processing || !imageDataUrl}
            onClick={handleApply}
            className="flex-1 h-8 text-xs"
            style={{
              background: "oklch(0.57 0.200 255)",
              color: "white",
            }}
          >
            {processing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Apply"
            )}
          </Button>
          <Button
            data-ocid="restore.reset.button"
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-8 text-xs gap-1 border-border bg-transparent text-foreground hover:bg-accent"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>

        {/* No image hint */}
        {!imageDataUrl && (
          <p
            data-ocid="restore.empty_state"
            className="text-center text-[11px] text-muted-foreground py-3 px-2 rounded-lg"
            style={{ background: "oklch(0.18 0.014 243)" }}
          >
            Upload a photo to start restoration
          </p>
        )}
      </div>
    </div>
  );
}
