import { cn } from "@/lib/utils";
import { FILTER_PRESETS, type FilterName } from "./types";

interface Props {
  imageDataUrl: string | null;
  activeFilter: FilterName;
  onFilterSelect: (name: FilterName) => void;
}

const FILTERS: { name: FilterName; label: string }[] = [
  { name: "none", label: "Original" },
  { name: "vivid", label: "Vivid" },
  { name: "film", label: "Film" },
  { name: "noir", label: "Noir" },
  { name: "sepia", label: "Sepia" },
  { name: "cold", label: "Cold" },
  { name: "sunset", label: "Sunset" },
];

const FILTER_COLORS: Record<FilterName, string> = {
  none: "linear-gradient(135deg, #2a3545 0%, #1e2b38 100%)",
  vivid: "linear-gradient(135deg, #3a6fd8 0%, #d83a6f 100%)",
  film: "linear-gradient(135deg, #8a7a6a 0%, #5a4a3a 100%)",
  noir: "linear-gradient(135deg, #2a2a2a 0%, #555 100%)",
  sepia: "linear-gradient(135deg, #b8956a 0%, #8a6a40 100%)",
  cold: "linear-gradient(135deg, #4a8ab8 0%, #2a5a88 100%)",
  sunset: "linear-gradient(135deg, #d86a2a 0%, #d8382a 100%)",
};

export default function FiltersPanel({
  imageDataUrl,
  activeFilter,
  onFilterSelect,
}: Props) {
  return (
    <div className="editor-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
      </div>
      <div className="p-3 grid grid-cols-3 gap-2">
        {FILTERS.map(({ name, label }) => (
          <button
            type="button"
            key={name}
            data-ocid={`filter.${name}.button`}
            onClick={() => onFilterSelect(name)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg overflow-hidden transition-all duration-150 group",
              activeFilter === name
                ? "ring-2 ring-primary scale-[1.02]"
                : "hover:ring-1 hover:ring-border",
            )}
          >
            <div
              className="w-full aspect-square rounded-md overflow-hidden"
              style={{ minHeight: 52 }}
            >
              {imageDataUrl ? (
                <img
                  src={imageDataUrl}
                  alt={label}
                  className="w-full h-full object-cover"
                  style={{ filter: FILTER_PRESETS[name] || "none" }}
                />
              ) : (
                <div
                  className="w-full h-full rounded-md"
                  style={{ background: FILTER_COLORS[name] }}
                />
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium pb-1",
                activeFilter === name
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
