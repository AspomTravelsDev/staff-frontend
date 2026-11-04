"use client";

import { useState } from "react";


import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SanctionGridExportButton } from "./sanction-grid-export-button";
import type { SanctionGridItem, SanctionStep } from "@/lib/api/compliance";

interface SanctionLadderGridProps {
  title?: string;
  description?: string;
  items: SanctionGridItem[];
  steps: SanctionStep[];
  windowStart: string;
  windowEnd?: string;
  periodLabel?: string;
  showDepartment?: boolean;
  exportElementId?: string;
  allowImageExport?: boolean;
  defaultOpen?: boolean;
}

function toWindowLabel(windowStart: string, windowEnd?: string): string {
  const start = new Date(windowStart);
  const end = windowEnd ? new Date(windowEnd) : new Date();

  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

export function SanctionLadderGrid({
  title = "Sanction Ladder (Rolling Six Months)",
  description,
  items,
  steps,
  windowStart,
  windowEnd,
  periodLabel,
  showDepartment = true,
  exportElementId = "sanction-grid-export",
  allowImageExport = true,
  defaultOpen = false,
}: SanctionLadderGridProps) {
  const [isGridOpen, setIsGridOpen] = useState(defaultOpen);
  if (!items.length) return null;
  const maxBoxes = Math.max(28, ...steps.map(step => step.threshold));


  return (
    <div className="space-y-6">
      <section id={exportElementId} className="space-y-4">
        <div className="relative rounded-lg border border-border bg-muted/20 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5">
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-pointer rounded-lg bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setIsGridOpen(previous => !previous)}
            aria-labelledby={`${exportElementId}-heading`}
            aria-describedby={`${exportElementId}-description`}
            aria-controls={`${exportElementId}-content`}
            aria-expanded={isGridOpen}
          />
          <div className="flex items-center justify-between gap-4">
            <div className="pointer-events-none relative z-20 min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={`${exportElementId}-heading`} className="text-base font-semibold">{title}</h2>
                <Badge variant="outline" className="text-xs font-normal">{periodLabel || "Rolling six months"}</Badge>
                <Badge variant="secondary" className="text-xs">{items.length} staff</Badge>
              </div>
              <p id={`${exportElementId}-description`} className="text-xs text-muted-foreground">
                {description || `Occurrences counted in ${periodLabel || "current period"} (${toWindowLabel(windowStart, windowEnd)}).`}
              </p>
            </div>
            <div className="pointer-events-none relative z-20 flex shrink-0 items-center gap-3">
              {allowImageExport && isGridOpen && <div className="pointer-events-auto">
                <SanctionGridExportButton targetId={exportElementId} fileNamePrefix={title.toLowerCase().replace(/\s+/g, "-")} />
              </div>}
              {isGridOpen ? <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />}
            </div>
          </div>
        </div>

        {isGridOpen && (
          <div id={`${exportElementId}-content`} className="space-y-4 pt-2 animate-in fade-in-50 duration-200">
          <div className="overflow-x-auto">
            <div className="min-w-[1044px] space-y-1">
              <div className="grid grid-cols-[260px_minmax(560px,1fr)_200px] gap-2 text-xs font-medium text-muted-foreground">
                <div>Staff</div>
                <div className="px-2 text-center">Confirmed occurrences</div>
                <div className="text-right">Total / recommended step</div>
              </div>

              <div className="grid grid-cols-[260px_minmax(560px,1fr)_200px] gap-2 text-[11px] text-muted-foreground">
                <div />
                <div className="grid gap-1 px-2" style={{ gridTemplateColumns: `repeat(${maxBoxes}, minmax(0, 1fr))` }}>
                  {Array.from({ length: maxBoxes }, (_, index) => <span key={index} className="w-4 justify-self-center text-center tabular-nums">{index + 1}</span>)}
                </div>
                <div />
              </div>

              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
                  No confirmed incidents or pending queries found in the rolling six-month window.
                </div>
              ) : (
                items.map((item) => {
                  const stepObj = steps.find((s) => s.step === item.current_step);
                  const filledCount = Math.min(item.issues_count, maxBoxes);

                  return (
                    <div
                      key={item.user_id}
                      className="grid grid-cols-[260px_minmax(560px,1fr)_200px] items-center gap-2 border-b py-2.5 last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                        <span className="truncate text-sm font-medium" title={item.name}>{item.name}</span>
                        {showDepartment && item.department && <><span className="text-muted-foreground" aria-hidden="true">·</span><span className="truncate text-xs text-muted-foreground" title={item.department}>{item.department}</span></>}
                      </div>

                      <div className="px-2 py-2">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxBoxes}, minmax(0, 1fr))` }}>
                          {Array.from({ length: maxBoxes }, (_, i) => {
                            const boxNumber = i + 1;
                            const fraction = Math.max(0, Math.min(1, filledCount - i));
                            return <div key={`${item.user_id}-${boxNumber}`} className="h-4 w-4 justify-self-center overflow-hidden rounded border bg-muted" aria-hidden="true"><div className="h-full bg-amber-500" style={{ width: `${fraction * 100}%` }} /></div>;

                          })}
                        </div>

                      </div>

                      <div className="space-y-1 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold tabular-nums" aria-label={`${item.issues_count} occurrences`}>{item.issues_count}</span>
                          {item.current_step > 0 ? <Badge variant="outline" className="text-[11px] font-medium" aria-label={`Recommended policy step ${item.current_step}`}>Step {item.current_step}</Badge> : <span className="text-xs text-muted-foreground">Below threshold</span>}
                        </div>
                        {item.current_step > 0 && stepObj?.label && <p className="text-[11px] text-muted-foreground">{stepObj.label}</p>}
                        {item.has_insubordination && (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1 py-0 h-4 mt-1"
                          >
                            Insubordination: formal review
                          </Badge>
                        )}
                        {item.review_reentered_threshold && <p className="mt-2 text-xs font-medium">Previously actioned threshold. Review without automatic escalation.</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      </section>

    </div>
  );
}
