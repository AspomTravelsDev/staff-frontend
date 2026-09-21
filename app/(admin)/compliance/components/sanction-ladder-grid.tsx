"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SanctionGridExportButton } from "./sanction-grid-export-button";
import { SanctionBreakdownCard } from "./sanction-breakdown-card";
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
  showBreakdown?: boolean;
}

function toWindowLabel(windowStart: string, windowEnd?: string): string {
  const start = new Date(windowStart);
  const end = windowEnd ? new Date(windowEnd) : new Date();

  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

export function SanctionLadderGrid({
  title = "Sanction Ladder (Current Half-Year)",
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
  showBreakdown = true,
}: SanctionLadderGridProps) {
  const [isGridOpen, setIsGridOpen] = useState(defaultOpen);
  const maxBoxes = 20;

  const getHeatColor = (boxIndex: number, filled: number): string => {
    if (boxIndex > filled) {
      return "hsl(var(--muted))";
    }

    // Interpolate from yellow (50deg) to red (0deg) as boxes approach 20.
    const t = (boxIndex - 1) / (maxBoxes - 1);
    const hue = 50 - 50 * t;

    return `hsl(${hue} 92% 54%)`;
  };

  return (
    <div className="space-y-6">
      <Card id={exportElementId} className="border shadow-sm overflow-hidden transition-all">
        <CardHeader
          className="cursor-pointer select-none py-3.5 px-4 sm:px-6 hover:bg-muted/30 transition-colors"
          onClick={() => setIsGridOpen((prev) => !prev)}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <Badge variant="outline" className="text-xs font-normal">
                  {periodLabel || "Current Half-Year"}
                </Badge>
                {items.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {items.length} {items.length === 1 ? "staff" : "staff"}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {description ||
                  `Occurrences counted in ${periodLabel || "current period"} (${toWindowLabel(windowStart, windowEnd)}).`}
              </CardDescription>
            </div>

            <div
              className="flex items-center gap-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {allowImageExport && isGridOpen ? (
                <SanctionGridExportButton
                  targetId={exportElementId}
                  fileNamePrefix={title.toLowerCase().replace(/\s+/g, "-")}
                />
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsGridOpen((prev) => !prev)}
                aria-label={isGridOpen ? "Collapse Grid" : "Expand Grid"}
              >
                {isGridOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isGridOpen && (
          <CardContent className="space-y-4 border-t pt-4 animate-in fade-in-50 duration-200">
          <div className="overflow-x-auto">
            <div className="min-w-225 space-y-3">
              <div className="grid grid-cols-[260px_minmax(560px,1fr)_160px] gap-2 text-xs font-medium text-muted-foreground">
                <div>Staff</div>
                <div className="rounded border bg-muted/30 px-2 py-1 text-center">
                  20-Occurrence Track ({periodLabel || "Current Half-Year"})
                </div>
                <div className="text-right">Occurrences & Disciplinary Step</div>
              </div>

              <div className="grid grid-cols-[260px_minmax(560px,1fr)_160px] gap-2 text-[11px] text-muted-foreground">
                <div />
                <div className="flex items-center justify-between px-1">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20</span>
                </div>
                <div className="text-right">Action Status</div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
                  No confirmed disciplinary occurrences found in the current calendar period ({periodLabel || "Jan-Jun / Jul-Dec"}).
                </div>
              ) : (
                items.map((item) => {
                  const stepObj = steps.find((s) => s.step === item.current_step);
                  const filledCount = Math.min(Math.round(item.issues_count), maxBoxes);

                  return (
                    <div
                      key={item.user_id}
                      className="grid grid-cols-[260px_minmax(560px,1fr)_160px] items-center gap-2"
                    >
                      <div className="rounded-md border p-2">
                        <p className="text-sm font-medium leading-none">
                          {item.name}
                        </p>
                        {showDepartment && item.department ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.department}
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-md border px-2 py-2">
                        <div className="grid grid-cols-20 gap-1">
                          {Array.from({ length: maxBoxes }, (_, i) => {
                            const boxNumber = i + 1;
                            const isFilled = boxNumber <= filledCount;
                            const marker = isFilled
                              ? item.occurrence_markers[i]
                              : undefined;

                            const square = (
                              <div
                                className={cn(
                                  "h-4 w-4 rounded-[3px] border transition-all",
                                  isFilled ? "border-black/10 shadow-xs" : "border-border",
                                )}
                                style={{
                                  backgroundColor: getHeatColor(
                                    boxNumber,
                                    filledCount,
                                  ),
                                }}
                              />
                            );

                            if (!isFilled) {
                              return (
                                <div key={`${item.user_id}-box-${boxNumber}`}>
                                  {square}
                                </div>
                              );
                            }

                            return (
                              <Tooltip key={`${item.user_id}-box-${boxNumber}`}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="cursor-default focus:outline-none"
                                    aria-label={`Occurrence ${boxNumber} for ${item.name}`}
                                  >
                                    {square}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" sideOffset={8}>
                                  <div className="space-y-1 text-xs">
                                    <p className="font-semibold">
                                      Occurrence #{boxNumber}
                                      {marker?.points !== undefined && (
                                        <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                                          ({marker.points} {marker.points === 1 ? "occurrence" : "occurrences"})
                                        </span>
                                      )}
                                    </p>
                                    <p>{marker?.type ?? "Occurrence"}</p>
                                    {marker?.outcome && (
                                      <p className="text-primary font-medium text-[11px]">
                                        Action: {marker.outcome}
                                      </p>
                                    )}
                                    <p className="opacity-75 text-[10px]">
                                      {marker?.occurrence_date ?? ""}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {item.issues_count}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {item.issues_count === 1 ? "occurrence" : "occurrences"}
                          </span>
                        </p>
                        {item.current_step > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                              Step {item.current_step}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                              {stepObj?.label || ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Good Standing
                          </span>
                        )}
                        {item.has_insubordination && (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1 py-0 h-4 mt-1"
                          >
                            Insubordination (Step 4)
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      )}
      </Card>

      {/* Official Policy Breakdown & Disciplinary Ladder Card */}
      {showBreakdown && <SanctionBreakdownCard steps={steps} />}
    </div>
  );
}
