import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Bell,
  ChevronDown,
  Crop,
  Download,
  Eraser,
  FlipHorizontal2,
  Layers,
  Palette,
  Save,
  Scissors,
  Search,
  Sliders,
  Sparkles,
  Type,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import AdjustmentsPanel from "./components/editor/AdjustmentsPanel";
import BackgroundRemovalPanel from "./components/editor/BackgroundRemovalPanel";
import BottomStrip from "./components/editor/BottomStrip";
import EditorCanvas from "./components/editor/EditorCanvas";
import FiltersPanel from "./components/editor/FiltersPanel";
import HistoryPanel from "./components/editor/HistoryPanel";
import OldPhotoRestorePanel from "./components/editor/OldPhotoRestorePanel";
import TextOverlayPanel from "./components/editor/TextOverlayPanel";
import {
  type Adjustments,
  type CropRect,
  DEFAULT_ADJUSTMENTS,
  type FilterName,
  type HistoryEntry,
  type SavedState,
  type TextOverlay,
  type ToolTab,
  computeFilterString,
} from "./components/editor/types";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const TOOL_TABS: {
  id: ToolTab;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: "adjust", label: "Adjust", Icon: Sliders },
  { id: "filter", label: "Filter", Icon: Palette },
  { id: "crop", label: "Crop", Icon: Crop },
  { id: "transform", label: "Transform", Icon: FlipHorizontal2 },
  { id: "text", label: "Text", Icon: Type },
  { id: "background-removal", label: "BG Remove", Icon: Eraser },
  { id: "restore", label: "Restore", Icon: Sparkles },
  { id: "layers", label: "Layers", Icon: Layers },
];

const NAV_LINKS = ["Editor", "Projects", "Tutorials", "Community", "Help"];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [adjustments, setAdjustments] =
    useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [activeFilter, setActiveFilter] = useState<FilterName>("none");
  const [activeTool, setActiveTool] = useState<ToolTab>("adjust");
  const [activeNav, setActiveNav] = useState("Editor");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedStates, setSavedStates] = useState<SavedState[]>([]);
  const [activeStateId, setActiveStateId] = useState<string | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  // Track position of dragging overlay
  const draggingOverlay = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const filterString = computeFilterString(adjustments, activeFilter);

  const addHistory = (label: string) => {
    setHistory((prev) => [
      { id: generateId(), label, timestamp: new Date() },
      ...prev,
    ]);
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageDataUrl(url);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setActiveFilter("none");
      setCropRect(null);
      setTextOverlays([]);
      addHistory(`Opened "${file.name}"`);
    };
    reader.readAsDataURL(file);
  };

  const handleImageLoad = (w: number, h: number) => {
    setImageDimensions({ w, h });
    setCropRect({ x: 0, y: 0, w, h });
  };

  const handleReset = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActiveFilter("none");
    addHistory("Reset all adjustments");
    toast.success("Adjustments reset");
  };

  const handleApply = () => {
    const parts: string[] = [];
    for (const [key, val] of Object.entries(adjustments)) {
      if (val !== 0) {
        parts.push(
          `${key.charAt(0).toUpperCase() + key.slice(1)} ${val > 0 ? "+" : ""}${val}`,
        );
      }
    }
    if (parts.length > 0) {
      addHistory(`Applied: ${parts.join(", ")}`);
      toast.success("Adjustments applied");
    } else {
      toast("No changes to apply");
    }
  };

  const handleFilterSelect = (name: FilterName) => {
    setActiveFilter(name);
    if (name !== "none") {
      addHistory(
        `Applied filter: ${name.charAt(0).toUpperCase() + name.slice(1)}`,
      );
    }
  };

  const handleToolTab = (tab: ToolTab) => {
    const functional: ToolTab[] = [
      "adjust",
      "filter",
      "crop",
      "text",
      "background-removal",
      "restore",
    ];
    if (!functional.includes(tab)) {
      toast(`${tab.charAt(0).toUpperCase() + tab.slice(1)} — Coming Soon!`, {
        description: "This tool will be available in the next update.",
      });
      return;
    }
    setActiveTool(tab);
  };

  const handleApplyCrop = () => {
    if (!cropRect || !canvasRef.current || !imageDimensions) return;
    const source = canvasRef.current;
    const tmp = document.createElement("canvas");
    tmp.width = cropRect.w;
    tmp.height = cropRect.h;
    const ctx = tmp.getContext("2d");
    if (!ctx) return;
    ctx.filter = filterString;
    ctx.drawImage(
      source,
      cropRect.x,
      cropRect.y,
      cropRect.w,
      cropRect.h,
      0,
      0,
      cropRect.w,
      cropRect.h,
    );
    const newUrl = tmp.toDataURL("image/png");
    setImageDataUrl(newUrl);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActiveFilter("none");
    addHistory(`Cropped to ${cropRect.w}×${cropRect.h}`);
    setActiveTool("adjust");
    toast.success("Crop applied");
  };

  const drawWithOverlays = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvasW: number,
    canvasH: number,
  ) => {
    ctx.filter = filterString;
    ctx.drawImage(img, 0, 0);
    ctx.filter = "none";
    for (const ov of textOverlays) {
      ctx.font = `${ov.bold ? "bold " : ""}${ov.fontSize}px ${ov.fontFamily}`;
      ctx.fillStyle = ov.color;
      ctx.fillText(ov.text, (ov.x / 100) * canvasW, (ov.y / 100) * canvasH);
    }
  };

  const handleSave = () => {
    if (!imageDataUrl) {
      toast.error("No image to save");
      return;
    }
    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d");
    const img = new Image();
    img.onload = () => {
      tmp.width = img.naturalWidth;
      tmp.height = img.naturalHeight;
      if (!ctx) return;
      drawWithOverlays(ctx, img, tmp.width, tmp.height);
      const snap = tmp.toDataURL("image/jpeg", 0.8);
      const adjParts = Object.entries(adjustments)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`);
      const label =
        activeFilter !== "none"
          ? `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} filter`
          : adjParts.length > 0
            ? adjParts[0]
            : `Version ${savedStates.length + 1}`;
      const id = generateId();
      setSavedStates((prev) => [
        { id, dataUrl: snap, label, timestamp: new Date() },
        ...prev,
      ]);
      setActiveStateId(id);
      addHistory(`Saved: ${label}`);
      toast.success("Saved to strip");
    };
    img.src = imageDataUrl;
  };

  const handleDownload = () => {
    if (!imageDataUrl) {
      toast.error("No image to download");
      return;
    }
    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d");
    const img = new Image();
    img.onload = () => {
      tmp.width = img.naturalWidth;
      tmp.height = img.naturalHeight;
      if (!ctx) return;
      drawWithOverlays(ctx, img, tmp.width, tmp.height);
      const a = document.createElement("a");
      a.href = tmp.toDataURL("image/png");
      a.download = "westside-export.png";
      a.click();
      addHistory("Downloaded as PNG");
      toast.success("Image downloaded!");
    };
    img.src = imageDataUrl;
  };

  const handleRestore = (state: SavedState) => {
    setImageDataUrl(state.dataUrl);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActiveFilter("none");
    setActiveStateId(state.id);
    addHistory(`Restored: ${state.label}`);
    toast.success(`Restored "${state.label}"`);
  };

  // Text overlay drag handlers
  const handleOverlayMouseDown = (
    e: React.MouseEvent,
    id: string,
    currentX: number,
    currentY: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    draggingOverlay.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: currentX,
      origY: currentY,
    };
  };

  const handleWrapperMouseMove = (e: React.MouseEvent) => {
    if (!draggingOverlay.current || !canvasWrapperRef.current) return;
    const bounds = canvasWrapperRef.current.getBoundingClientRect();
    const dx =
      ((e.clientX - draggingOverlay.current.startX) / bounds.width) * 100;
    const dy =
      ((e.clientY - draggingOverlay.current.startY) / bounds.height) * 100;
    const newX = Math.max(0, Math.min(100, draggingOverlay.current.origX + dx));
    const newY = Math.max(0, Math.min(100, draggingOverlay.current.origY + dy));
    const ovId = draggingOverlay.current.id;
    setTextOverlays((prev) =>
      prev.map((ov) => (ov.id === ovId ? { ...ov, x: newX, y: newY } : ov)),
    );
  };

  const handleWrapperMouseUp = () => {
    draggingOverlay.current = null;
  };

  // suppress unused warning
  void imageDimensions;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.10 0.010 243)" }}
    >
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <header
        className="flex items-center gap-4 px-5 h-14 flex-shrink-0 border-b border-border"
        style={{ background: "oklch(0.15 0.014 243)" }}
      >
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.57 0.200 255), oklch(0.50 0.22 280))",
            }}
          >
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-bold text-foreground tracking-tight">
            Westside
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 mx-auto">
          {NAV_LINKS.map((link) => (
            <button
              type="button"
              key={link}
              data-ocid={`nav.${link.toLowerCase()}.link`}
              onClick={() => setActiveNav(link)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                color:
                  activeNav === link
                    ? "oklch(0.92 0.010 243)"
                    : "oklch(0.68 0.018 243)",
                background:
                  activeNav === link ? "oklch(0.21 0.018 243)" : "transparent",
              }}
            >
              {link}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto md:ml-0">
          <button
            type="button"
            data-ocid="header.search.button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-ocid="header.notifications.button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          <div
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg cursor-pointer hover:bg-accent transition-colors"
            style={{ background: "oklch(0.21 0.018 243)" }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "oklch(0.57 0.200 255)" }}
            >
              U
            </div>
            <span className="text-sm text-foreground hidden sm:block">
              User
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      </header>

      {/* Secondary Toolbar */}
      <div
        className="flex items-center gap-1 px-4 h-11 flex-shrink-0 border-b border-border"
        style={{ background: "oklch(0.15 0.014 243)" }}
      >
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {TOOL_TABS.map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              data-ocid={`toolbar.${id}.tab`}
              onClick={() => handleToolTab(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap"
              style={{
                color:
                  activeTool === id
                    ? "oklch(0.92 0.010 243)"
                    : "oklch(0.68 0.018 243)",
                background:
                  activeTool === id
                    ? "oklch(0.57 0.200 255 / 0.15)"
                    : "transparent",
                borderBottom:
                  activeTool === id
                    ? "2px solid oklch(0.57 0.200 255)"
                    : "2px solid transparent",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {activeTool === "crop" && imageDataUrl && (
            <Button
              data-ocid="toolbar.apply_crop.button"
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-border bg-transparent text-foreground hover:bg-accent"
              onClick={handleApplyCrop}
            >
              <Scissors className="w-3 h-3" />
              Apply Crop
            </Button>
          )}
          <Button
            data-ocid="toolbar.save.button"
            size="sm"
            className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleSave}
          >
            <Save className="w-3 h-3" />
            Save
          </Button>
          <Button
            data-ocid="toolbar.download.button"
            size="sm"
            className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleDownload}
          >
            <Download className="w-3 h-3" />
            Download
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col min-h-0 p-3 gap-3">
        <div className="flex gap-3 flex-1 min-h-0">
          {/* Left panel */}
          <AnimatePresence mode="wait">
            {activeTool === "adjust" && (
              <motion.div
                key="adjust"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="flex-shrink-0"
                style={{ width: 232 }}
              >
                <AdjustmentsPanel
                  adjustments={adjustments}
                  onChange={setAdjustments}
                  onReset={handleReset}
                  onApply={handleApply}
                />
              </motion.div>
            )}
            {activeTool === "text" && (
              <motion.div
                key="text"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="flex-shrink-0"
                style={{ width: 232 }}
              >
                <TextOverlayPanel
                  overlays={textOverlays}
                  onAdd={(ov) => {
                    setTextOverlays((prev) => [...prev, ov]);
                    addHistory(`Added text: "${ov.text}"`);
                  }}
                  onRemove={(id) => {
                    setTextOverlays((prev) => prev.filter((o) => o.id !== id));
                    addHistory("Removed text overlay");
                  }}
                />
              </motion.div>
            )}
            {activeTool === "background-removal" && (
              <motion.div
                key="bg-removal"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="flex-shrink-0"
                style={{ width: 232 }}
              >
                <BackgroundRemovalPanel
                  imageDataUrl={imageDataUrl}
                  onImageChange={setImageDataUrl}
                  onHistoryAdd={addHistory}
                />
              </motion.div>
            )}
            {activeTool === "restore" && (
              <motion.div
                key="restore"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="flex-shrink-0"
                style={{ width: 232 }}
              >
                <OldPhotoRestorePanel
                  imageDataUrl={imageDataUrl}
                  onImageChange={setImageDataUrl}
                  onHistoryAdd={addHistory}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas + Text Overlays wrapper */}
          <div
            ref={canvasWrapperRef}
            className="flex-1 relative min-h-0"
            onMouseMove={handleWrapperMouseMove}
            onMouseUp={handleWrapperMouseUp}
            onMouseLeave={handleWrapperMouseUp}
          >
            <EditorCanvas
              imageDataUrl={imageDataUrl}
              filterString={filterString}
              isCropActive={activeTool === "crop"}
              cropRect={cropRect}
              onCropChange={setCropRect}
              onImageLoad={handleImageLoad}
              onUpload={handleUpload}
              canvasRef={canvasRef}
            />
            {/* Draggable text overlays */}
            {imageDataUrl &&
              textOverlays.map((ov) => (
                <div
                  key={ov.id}
                  data-ocid="text.canvas_target"
                  className="absolute select-none cursor-move"
                  style={{
                    left: `${ov.x}%`,
                    top: `${ov.y}%`,
                    fontSize: `${Math.max(10, ov.fontSize * 0.25)}px`,
                    color: ov.color,
                    fontFamily: ov.fontFamily,
                    fontWeight: ov.bold ? "bold" : "normal",
                    textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                    transform: "translate(-50%, -50%)",
                    padding: "2px 4px",
                    border:
                      activeTool === "text"
                        ? "1px dashed rgba(255,255,255,0.5)"
                        : "none",
                    borderRadius: 2,
                    pointerEvents: "auto",
                    whiteSpace: "nowrap",
                    zIndex: 10,
                  }}
                  onMouseDown={(e) =>
                    handleOverlayMouseDown(e, ov.id, ov.x, ov.y)
                  }
                >
                  {ov.text}
                </div>
              ))}
          </div>

          {/* Right panel */}
          <div
            className="flex-shrink-0 flex flex-col gap-3"
            style={{ width: 220 }}
          >
            <AnimatePresence mode="wait">
              {(activeTool === "filter" ||
                activeTool === "adjust" ||
                activeTool === "crop") && (
                <motion.div
                  key="filters"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.18 }}
                >
                  <FiltersPanel
                    imageDataUrl={imageDataUrl}
                    activeFilter={activeFilter}
                    onFilterSelect={handleFilterSelect}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <HistoryPanel entries={history} />
          </div>
        </div>

        {/* Bottom strip */}
        <BottomStrip
          savedStates={savedStates}
          activeStateId={activeStateId}
          onRestore={handleRestore}
        />
      </main>

      {/* Footer */}
      <footer
        className="flex items-center justify-between px-5 h-10 border-t border-border flex-shrink-0"
        style={{ background: "oklch(0.15 0.014 243)" }}
      >
        <p className="text-[11px] text-muted-foreground/60">
          © {new Date().getFullYear()} Westside Free Photo Editor. Built with ♥
          using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            About Us
          </button>
          <button
            type="button"
            className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            Contact Support
          </button>
        </div>
      </footer>
    </div>
  );
}
