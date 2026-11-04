import { cn } from "@/lib/utils";

export type AttendanceStatus = "on-time" | "late" | "late-permitted" | "half-day" | "work-from-home" | "leave" | "flagged" | "absent" | "placeholder";

interface AttendanceStatusBlocksProps {
  statuses: AttendanceStatus[];
  maxBlocks?: number;
  showLegend?: boolean;
  size?: "default" | "large";
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
  size = "default",
}: AttendanceStatusBlocksProps) {
  const displayStatuses = [...statuses];

  if (maxBlocks !== undefined) {
    while (displayStatuses.length < maxBlocks) {
      displayStatuses.push("placeholder");
    }
    // Only show up to maxBlocks if specified
    const limitedStatuses = displayStatuses.slice(0, maxBlocks);
    return renderBlocks(limitedStatuses, showLegend, size);
  }

  // Otherwise, show exactly the statuses provided
  return renderBlocks(displayStatuses, showLegend, size);
}

function renderBlocks(statuses: AttendanceStatus[], showLegend?: boolean, size: "default" | "large" = "default") {
  const blockSize = size === "large" ? "h-5 w-5 sm:h-6 sm:w-6" : "h-3 w-3";
  const blockGap = size === "large" ? "gap-2" : "gap-1";
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
      case "half-day":
        return "bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-500";
      case "work-from-home":
        return "bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 dark:hover:bg-sky-500";
      case "leave":
        return "bg-violet-500 dark:bg-violet-600 hover:bg-violet-600 dark:hover:bg-violet-500";
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
      case "half-day":
        return "Half day (clocked out before 4 PM)";
      case "work-from-home":
        return "Approved work from home";
      case "leave":
        return "Approved leave";
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
      <div className={cn("flex flex-wrap", blockGap)}>
        {statuses.map((status, index) => (
          <div
            key={index}
            className={cn(
              blockSize,
              "rounded-sm transition-all cursor-default",
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
          {statuses.includes("half-day") && <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-amber-500" /><span>Half day</span></div>}
          {statuses.includes("work-from-home") && <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-sky-500" /><span>Work from home</span></div>}
          {statuses.includes("leave") && <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-violet-500" /><span>Leave</span></div>}
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
