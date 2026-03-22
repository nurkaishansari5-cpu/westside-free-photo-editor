import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import type { SavedState } from "./types";

interface Props {
  savedStates: SavedState[];
  activeStateId: string | null;
  onRestore: (state: SavedState) => void;
}

export default function BottomStrip({
  savedStates,
  activeStateId,
  onRestore,
}: Props) {
  if (savedStates.length === 0) {
    return (
      <div
        data-ocid="strip.empty_state"
        className="editor-card px-4 py-3 flex items-center gap-2 text-muted-foreground/50"
      >
        <Clock className="w-4 h-4" />
        <span className="text-xs">Saved versions will appear here</span>
      </div>
    );
  }

  return (
    <div className="editor-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">
          Recent Saves
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          ({savedStates.length})
        </span>
      </div>
      <ScrollArea>
        <div className="flex gap-3 p-3">
          {savedStates.map((state, i) => (
            <button
              type="button"
              key={state.id}
              data-ocid={`strip.item.${i + 1}`}
              onClick={() => onRestore(state)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1.5 group transition-all",
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                  activeStateId === state.id
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground",
                )}
              >
                <img
                  src={state.dataUrl}
                  alt={state.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground max-w-16 truncate">
                {state.label}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
