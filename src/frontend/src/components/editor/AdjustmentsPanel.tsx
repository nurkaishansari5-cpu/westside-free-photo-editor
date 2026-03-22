import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Check, RotateCcw } from "lucide-react";
import { type Adjustments, DEFAULT_ADJUSTMENTS } from "./types";

interface Props {
  adjustments: Adjustments;
  onChange: (adj: Adjustments) => void;
  onReset: () => void;
  onApply: () => void;
}

const SLIDERS: { key: keyof Adjustments; label: string }[] = [
  { key: "brightness", label: "Brightness" },
  { key: "contrast", label: "Contrast" },
  { key: "saturation", label: "Saturation" },
  { key: "highlights", label: "Highlights" },
  { key: "shadows", label: "Shadows" },
  { key: "details", label: "Details" },
];

export default function AdjustmentsPanel({
  adjustments,
  onChange,
  onReset,
  onApply,
}: Props) {
  const handleSlider = (key: keyof Adjustments, val: number[]) => {
    onChange({ ...adjustments, [key]: val[0] });
  };

  return (
    <div
      className="editor-card flex flex-col gap-0 overflow-hidden"
      style={{ minWidth: 220 }}
    >
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Adjustments</h2>
      </div>
      <div className="flex flex-col gap-4 p-4 flex-1">
        {SLIDERS.map(({ key, label }) => {
          const val = adjustments[key];
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{
                    color:
                      val !== 0
                        ? "oklch(0.57 0.200 255)"
                        : "oklch(0.68 0.018 243)",
                  }}
                >
                  {val > 0 ? `+${val}` : val}
                </span>
              </div>
              <Slider
                data-ocid={`adj.${key}.input`}
                min={-100}
                max={100}
                step={1}
                value={[val]}
                onValueChange={(v) => handleSlider(key, v)}
                className="[&>[role=slider]]:bg-foreground [&>[role=slider]]:border-0 [&>[role=slider]]:shadow-md"
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 p-4 border-t border-border">
        <Button
          data-ocid="adj.reset.button"
          variant="outline"
          size="sm"
          className="flex-1 text-xs gap-1.5 border-border bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
        <Button
          data-ocid="adj.apply.button"
          size="sm"
          className="flex-1 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={onApply}
        >
          <Check className="w-3 h-3" />
          Apply
        </Button>
      </div>
    </div>
  );
}
