import { cn } from "@/lib/utils";

export type AttendanceStatus = "on-time" | "late" | "late-permitted" | "flagged" | "absent" | "placeholder";

interface AttendanceStatusBlocksProps {
  statuses: AttendanceStatus[];
  maxBlocks?: number;
  showLegend?: boolean;
}
 
/**
 * GitHub-style attendance visualization with square blocks
 * - Green: On time
 * - Orange: Late
 * - Indigo: Late (Permitted)
 * - Red: Flagged proxy
 * - Gray: Absent/No data
 */
export function AttendanceStatusBlocks({
  statuses,
  maxBlocks,
  showLegend,
}: AttendanceStatusBlocksProps) {
  const displayStatuses = [...statuses];

  if (maxBlocks !== undefined) {
    while (displayStatuses.length < maxBlocks) {
      displayStatuses.push("placeholder");
    }
    // Only show up to maxBlocks if specified
    const limitedStatuses = displayStatuses.slice(0, maxBlocks);
    return renderBlocks(limitedStatuses, showLegend);
  }

  // Otherwise, show exactly the statuses provided
  return renderBlocks(displayStatuses, showLegend);
}

function renderBlocks(statuses: AttendanceStatus[], showLegend?: boolean) {
  const getBlockStyles = (status: AttendanceStatus) => {
    switch (status) {
      case "on-time":
        return "bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500";
      case "late":
        return "bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-500";
      case "late-permitted":
        return "bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500";
      case "flagged":
        return "bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500";
      case "absent":
      case "placeholder":
        return "bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-200 dark:bg-gray-800";
    }
  };

  const getLabel = (status: AttendanceStatus) => {
    switch (status) {
      case "on-time":
        return "On time";
      case "late":
        return "Late";
      case "late-permitted":
        return "Late (Permitted)";
      case "flagged":
        return "Flagged (Proxy)";
      case "absent":
        return "Absent";
      case "placeholder":
        return "No data";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-2">
      {/* GitHub-style square grid */}
      <div className="flex flex-wrap gap-1">
        {statuses.map((status, index) => (
          <div
            key={index}
            className={cn(
              "h-3 w-3 rounded-sm transition-all cursor-default",
              getBlockStyles(status),
            )}
            title={getLabel(status)}
          />
        ))}
      </div>

      {showLegend && (
        <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground pt-0.5 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-green-500" />
            <span>On time</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-orange-500" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-indigo-500" />
            <span>Late (Permitted)</span>
          </div>
          {statuses.includes("flagged") && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-sm bg-red-500" />
              <span className="font-semibold text-red-600 dark:text-red-400">
                Flagged
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
