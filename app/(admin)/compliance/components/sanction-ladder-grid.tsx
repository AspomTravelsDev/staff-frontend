import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
}: SanctionLadderGridProps) {
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
    <Card id={exportElementId}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {description ||
                `Occurrences counted in ${periodLabel || "current period"} (${toWindowLabel(windowStart, windowEnd)}).`}
            </CardDescription>
          </div>
          {allowImageExport ? (
            <SanctionGridExportButton
              targetId={exportElementId}
              fileNamePrefix={title.toLowerCase().replace(/\s+/g, "-")}
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <div className="min-w-225 space-y-3">
            <div className="grid grid-cols-[260px_minmax(560px,1fr)_120px] gap-2 text-xs font-medium text-muted-foreground">
              <div>Staff</div>
              <div className="rounded border bg-muted/30 px-2 py-1 text-center">
                20-Point Occurrence Track ({periodLabel || "Current Half-Year"})
              </div>
              <div className="text-right">Occurrences</div>
            </div>

            <div className="grid grid-cols-[260px_minmax(560px,1fr)_120px] gap-2 text-[11px] text-muted-foreground">
              <div />
              <div className="flex items-center justify-between px-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
              </div>
              <div className="text-right">Step</div>
            </div>

            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No disciplinary occurrences found in the current calendar
                period.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.user_id}
                  className="grid grid-cols-[260px_minmax(560px,1fr)_120px] items-center gap-2"
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
                        const filledCount = Math.min(
                          item.issues_count,
                          maxBoxes,
                        );
                        const isFilled = boxNumber <= filledCount;
                        const marker = isFilled
                          ? item.occurrence_markers[i]
                          : undefined;

                        const square = (
                          <div
                            className={cn(
                              "h-4 w-4 rounded-[3px] border",
                              isFilled ? "border-black/10" : "border-border",
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
                                className="cursor-default"
                                aria-label={`Occurrence ${boxNumber} for ${item.name}`}
                              >
                                {square}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8}>
                              <div className="space-y-0.5">
                                <p className="font-medium">
                                  Occurrence #{boxNumber}
                                </p>
                                <p>{marker?.type ?? "Occurrence"}</p>
                                <p className="opacity-80">
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
                    <p className="text-sm font-semibold">{item.issues_count}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Step {item.current_step + 1}
                    </p>
                  </div>
                </div>
              ))
            )}

            <div className="space-y-2 rounded-md border bg-muted/20 p-3 text-xs">
              <p className="font-medium text-foreground">
                How to read this grid
              </p>
              <p className="text-muted-foreground">
                Only disciplinary occurrences in the active calendar period (
                {periodLabel || "Jan-Jun / Jul-Dec"}) are counted. Items
                resolved as
                <span className="font-medium text-foreground">
                  {" "}
                  Resolved (No Action)
                </span>{" "}
                are excluded.
              </p>
              <p className="text-muted-foreground">
                Gray squares are empty. Filled squares move from yellow to red
                as count gets closer to 20.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {steps.map((step) => (
                  <span
                    key={step.step}
                    className="rounded border bg-background px-2 py-1"
                  >
                    Step {step.step}: {step.threshold}+ ({step.label})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
