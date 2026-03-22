import { ScrollArea } from "@/components/ui/scroll-area";
import { Aperture, History } from "lucide-react";
import type { HistoryEntry } from "./types";

interface Props {
  entries: HistoryEntry[];
}

export default function HistoryPanel({ entries }: Props) {
  return (
    <div className="editor-card flex flex-col overflow-hidden flex-1">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <History className="w-3.5 h-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">History</h2>
        {entries.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {entries.length}
          </span>
        )}
      </div>
      <ScrollArea className="flex-1" style={{ maxHeight: 200 }}>
        {entries.length === 0 ? (
          <div
            data-ocid="history.empty_state"
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
          >
            <Aperture className="w-6 h-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground/60">No actions yet</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                data-ocid={`history.item.${i + 1}`}
                className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      i === 0
                        ? "oklch(0.57 0.200 255)"
                        : "oklch(0.35 0.020 243)",
                  }}
                />
                <span className="text-xs text-foreground/80 truncate">
                  {entry.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
