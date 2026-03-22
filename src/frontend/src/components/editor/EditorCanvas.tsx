import { cn } from "@/lib/utils";
import { ImageIcon, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CropRect } from "./types";

interface Props {
  imageDataUrl: string | null;
  filterString: string;
  isCropActive: boolean;
  cropRect: CropRect | null;
  onCropChange: (rect: CropRect) => void;
  onImageLoad: (w: number, h: number) => void;
  onUpload: (file: File) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

type DragHandle =
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "t"
  | "b"
  | "l"
  | "r"
  | "move"
  | null;

export default function EditorCanvas({
  imageDataUrl,
  filterString,
  isCropActive,
  cropRect,
  onCropChange,
  onImageLoad,
  onUpload,
  canvasRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragHandle = useRef<DragHandle>(null);
  const dragStart = useRef<{ x: number; y: number; rect: CropRect } | null>(
    null,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDataUrl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      onImageLoad(img.naturalWidth, img.naturalHeight);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, canvasRef, onImageLoad]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) onUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const getHandleAt = (
    ex: number,
    ey: number,
    rect: CropRect,
    containerW: number,
    containerH: number,
  ): DragHandle => {
    const scaleX = containerW / (canvasRef.current?.width || containerW);
    const scaleY = containerH / (canvasRef.current?.height || containerH);
    const rx = rect.x * scaleX;
    const ry = rect.y * scaleY;
    const rw = rect.w * scaleX;
    const rh = rect.h * scaleY;
    const TOL = 14;
    const inX = ex >= rx - TOL && ex <= rx + rw + TOL;
    const inY = ey >= ry - TOL && ey <= ry + rh + TOL;
    const nearL = Math.abs(ex - rx) < TOL;
    const nearR = Math.abs(ex - (rx + rw)) < TOL;
    const nearT = Math.abs(ey - ry) < TOL;
    const nearB = Math.abs(ey - (ry + rh)) < TOL;
    if (nearL && nearT) return "tl";
    if (nearR && nearT) return "tr";
    if (nearL && nearB) return "bl";
    if (nearR && nearB) return "br";
    if (nearT && inX) return "t";
    if (nearB && inX) return "b";
    if (nearL && inY) return "l";
    if (nearR && inY) return "r";
    if (ex > rx && ex < rx + rw && ey > ry && ey < ry + rh) return "move";
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropActive || !cropRect || !containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const ex = e.clientX - bounds.left;
    const ey = e.clientY - bounds.top;
    const handle = getHandleAt(ex, ey, cropRect, bounds.width, bounds.height);
    if (handle) {
      dragHandle.current = handle;
      dragStart.current = { x: ex, y: ey, rect: { ...cropRect } };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      !dragHandle.current ||
      !dragStart.current ||
      !containerRef.current ||
      !canvasRef.current
    )
      return;
    const bounds = containerRef.current.getBoundingClientRect();
    const ex = e.clientX - bounds.left;
    const ey = e.clientY - bounds.top;
    const dx =
      (ex - dragStart.current.x) * (canvasRef.current.width / bounds.width);
    const dy =
      (ey - dragStart.current.y) * (canvasRef.current.height / bounds.height);
    const orig = dragStart.current.rect;
    let { x, y, w, h } = orig;
    const imgW = canvasRef.current.width;
    const imgH = canvasRef.current.height;
    const handle = dragHandle.current;
    if (handle === "move") {
      x = Math.max(0, Math.min(imgW - w, orig.x + dx));
      y = Math.max(0, Math.min(imgH - h, orig.y + dy));
    } else {
      if (handle === "tl" || handle === "l" || handle === "bl") {
        const newX = Math.max(0, Math.min(orig.x + orig.w - 20, orig.x + dx));
        w = orig.w - (newX - orig.x);
        x = newX;
      }
      if (handle === "tr" || handle === "r" || handle === "br") {
        w = Math.max(20, Math.min(imgW - orig.x, orig.w + dx));
      }
      if (handle === "tl" || handle === "t" || handle === "tr") {
        const newY = Math.max(0, Math.min(orig.y + orig.h - 20, orig.y + dy));
        h = orig.h - (newY - orig.y);
        y = newY;
      }
      if (handle === "bl" || handle === "b" || handle === "br") {
        h = Math.max(20, Math.min(imgH - orig.y, orig.h + dy));
      }
    }
    onCropChange({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
    });
  };

  const handleMouseUp = () => {
    dragHandle.current = null;
    dragStart.current = null;
  };

  const getCropStyle = (): React.CSSProperties | null => {
    if (!cropRect || !containerRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const scaleX = container.clientWidth / canvas.width;
    const scaleY = container.clientHeight / canvas.height;
    return {
      left: cropRect.x * scaleX,
      top: cropRect.y * scaleY,
      width: cropRect.w * scaleX,
      height: cropRect.h * scaleY,
    };
  };

  const cropStyle = imageDataUrl && isCropActive ? getCropStyle() : null;

  return (
    <div
      ref={containerRef}
      data-ocid="canvas.canvas_target"
      className={cn(
        "editor-card flex-1 flex items-center justify-center relative overflow-hidden min-h-0",
        isDraggingFile && "ring-2 ring-primary",
      )}
      style={{ minHeight: 360 }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleFileDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {imageDataUrl ? (
        <>
          <canvas
            ref={canvasRef as React.RefObject<HTMLCanvasElement>}
            className="max-w-full max-h-full object-contain"
            style={{ filter: filterString, display: "block" }}
          />
          {isCropActive && cropStyle && (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "rgba(0,0,0,0.5)" }}
              />
              <div
                className="absolute border-2 border-white grid-thirds"
                style={{
                  ...cropStyle,
                  background: "transparent",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                  cursor: "move",
                }}
              >
                {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                  <div
                    key={pos}
                    className="crop-handle"
                    style={{
                      top: pos.includes("t") ? -6 : undefined,
                      bottom: pos.includes("b") ? -6 : undefined,
                      left: pos.includes("l") ? -6 : undefined,
                      right: pos.includes("r") ? -6 : undefined,
                      cursor:
                        pos === "tl" || pos === "br"
                          ? "nwse-resize"
                          : "nesw-resize",
                    }}
                  />
                ))}
                {(["t", "b", "l", "r"] as const).map((pos) => (
                  <div
                    key={pos}
                    className="crop-handle"
                    style={{
                      top:
                        pos === "t"
                          ? -6
                          : pos === "b"
                            ? undefined
                            : "calc(50% - 6px)",
                      bottom: pos === "b" ? -6 : undefined,
                      left:
                        pos === "l"
                          ? -6
                          : pos === "r"
                            ? undefined
                            : "calc(50% - 6px)",
                      right: pos === "r" ? -6 : undefined,
                      cursor:
                        pos === "t" || pos === "b" ? "ns-resize" : "ew-resize",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <label
          data-ocid="canvas.upload_button"
          className="flex flex-col items-center justify-center gap-4 cursor-pointer group select-none"
          htmlFor="image-upload"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: "oklch(0.21 0.018 243)",
              border: "2px dashed oklch(0.35 0.022 243)",
            }}
          >
            <ImageIcon className="w-8 h-8 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground mb-1">
              Drop image here
            </p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
            style={{
              background: "oklch(0.57 0.200 255 / 0.15)",
              color: "oklch(0.57 0.200 255)",
              border: "1px solid oklch(0.57 0.200 255 / 0.3)",
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            Choose Image
          </div>
        </label>
      )}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileInput}
      />
    </div>
  );
}
