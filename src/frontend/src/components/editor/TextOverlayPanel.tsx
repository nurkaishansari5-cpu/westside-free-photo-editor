import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Bold, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { TextOverlay } from "./types";

interface Props {
  overlays: TextOverlay[];
  onAdd: (overlay: TextOverlay) => void;
  onRemove: (id: string) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const FONT_FAMILIES = [
  { value: "sans-serif", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
];

export default function TextOverlayPanel({ overlays, onAdd, onRemove }: Props) {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [bold, setBold] = useState(false);

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd({
      id: generateId(),
      text: text.trim(),
      x: 50,
      y: 50,
      fontSize,
      color,
      fontFamily,
      bold,
    });
    setText("");
  };

  return (
    <div className="editor-card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Text Overlay</h2>
      </div>
      <div className="p-3 flex flex-col gap-3">
        {/* Text input */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Text</Label>
          <Input
            data-ocid="text.input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text..."
            className="h-8 text-xs bg-background border-border"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>

        {/* Font Family */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Font</Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger
              data-ocid="text.select"
              className="h-8 text-xs bg-background border-border"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Size</Label>
            <span className="text-xs text-foreground font-medium">
              {fontSize}px
            </span>
          </div>
          <Slider
            data-ocid="text.toggle"
            min={12}
            max={120}
            step={1}
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            className="h-4"
          />
        </div>

        {/* Color + Bold row */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5"
              />
              <span className="text-xs text-muted-foreground font-mono">
                {color}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Weight</Label>
            <Toggle
              data-ocid="text.toggle"
              pressed={bold}
              onPressedChange={setBold}
              size="sm"
              className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Bold className="w-3.5 h-3.5" />
            </Toggle>
          </div>
        </div>

        {/* Add button */}
        <Button
          data-ocid="text.primary_button"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          onClick={handleAdd}
          disabled={!text.trim()}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Text
        </Button>

        {/* Overlay list */}
        {overlays.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <Label className="text-xs text-muted-foreground">
              Added Overlays
            </Label>
            <div className="flex flex-col gap-1">
              {overlays.map((overlay, i) => (
                <div
                  key={overlay.id}
                  data-ocid={`text.item.${i + 1}`}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md"
                  style={{ background: "oklch(0.21 0.018 243)" }}
                >
                  <span
                    className="text-xs truncate max-w-[130px]"
                    style={{
                      color: overlay.color,
                      fontFamily: overlay.fontFamily,
                      fontWeight: overlay.bold ? "bold" : "normal",
                    }}
                  >
                    {overlay.text}
                  </span>
                  <button
                    type="button"
                    data-ocid={`text.delete_button.${i + 1}`}
                    onClick={() => onRemove(overlay.id)}
                    className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {overlays.length === 0 && (
          <p
            data-ocid="text.empty_state"
            className="text-[10px] text-muted-foreground/60 text-center py-2"
          >
            No text overlays yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}
