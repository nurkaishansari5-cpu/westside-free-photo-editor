export interface Adjustments {
  brightness: number; // -100 to 100
  contrast: number;
  saturation: number;
  highlights: number;
  shadows: number;
  details: number;
}

export type FilterName =
  | "none"
  | "vivid"
  | "film"
  | "noir"
  | "sepia"
  | "cold"
  | "sunset";

export type ToolTab =
  | "adjust"
  | "filter"
  | "crop"
  | "transform"
  | "text"
  | "layers"
  | "background-removal"
  | "restore";

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: Date;
}

export interface SavedState {
  id: string;
  dataUrl: string;
  label: string;
  timestamp: Date;
}

export interface CropRect {
  x: number; // pixels from left
  y: number; // pixels from top
  w: number; // width in pixels
  h: number; // height in pixels
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  bold: boolean;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  highlights: 0,
  shadows: 0,
  details: 0,
};

export const FILTER_PRESETS: Record<FilterName, string> = {
  none: "",
  vivid: "saturate(1.6) contrast(1.2)",
  film: "sepia(0.3) contrast(1.15) brightness(0.95)",
  noir: "grayscale(1) contrast(1.4) brightness(0.9)",
  sepia: "sepia(1) brightness(0.95)",
  cold: "hue-rotate(20deg) saturate(1.15) brightness(1.05)",
  sunset: "hue-rotate(-25deg) saturate(1.4) brightness(1.1) sepia(0.15)",
};

export function computeFilterString(
  adj: Adjustments,
  filterName: FilterName,
): string {
  const b = (adj.brightness + 100) / 100;
  const c = (adj.contrast + 100) / 100;
  const s = (adj.saturation + 100) / 100;
  const hl = 1 + adj.highlights * 0.004;
  const sh = 1 - adj.shadows * 0.004;
  const det = 1 + adj.details * 0.005;

  const adjStr = `brightness(${(b * hl * sh).toFixed(3)}) contrast(${(c * det).toFixed(3)}) saturate(${s.toFixed(3)})`;
  const preset = FILTER_PRESETS[filterName];
  return preset ? `${adjStr} ${preset}` : adjStr;
}
