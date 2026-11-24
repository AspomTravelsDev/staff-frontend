import { Badge } from "@/components/ui/badge";
import type { ClockInRecord } from "@/lib/api/clock-in";
import { formatLagosTime } from "@/lib/utils/attendance";

function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function formatBreakTooltip(record: ClockInRecord): string | undefined {
  if (!record.breaks || record.breaks.length === 0) return undefined;

  return record.breaks
    .map((b, idx) => {
      const start = formatLagosTime(b.started_at);
      const end = b.ended_at ? formatLagosTime(b.ended_at) : "Unclosed";
      const dur =
        b.duration_minutes !== null && b.duration_minutes !== undefined
          ? ` (${b.duration_minutes}m)`
          : "";
      return `Break ${idx + 1}: ${start} - ${end}${dur}`;
    })
    .join("\n");
}

export function AttendanceDuration({ record }: { record: ClockInRecord }) {
  const displayMinutes =
    record.net_work_minutes !== undefined && record.net_work_minutes !== null
      ? record.net_work_minutes
      : record.duration_minutes;

  const completedBreaks = record.completed_break_minutes ?? 0;
  const breakTooltip = formatBreakTooltip(record);

  return (
    <div className="flex flex-col items-start gap-1" title={breakTooltip}>
      <span className="font-medium tabular-nums">
        {displayMinutes !== null && displayMinutes !== undefined
          ? formatMinutes(displayMinutes)
          : "—"}
      </span>

      {completedBreaks > 0 && (
        <span className="text-[11px] text-muted-foreground tabular-nums">
          Break: {formatMinutes(completedBreaks)}
        </span>
      )}

      {record.is_on_break && (
        <Badge
          variant="outline"
          className="h-5 border-amber-300 bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          On Break
        </Badge>
      )}

      {record.has_unclosed_break && (
        <Badge
          variant="outline"
          title="Staff may have forgotten to clock back in from break"
          className="h-5 border-amber-400 bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-800 dark:border-amber-700 dark:text-amber-300"
        >
          Unclosed Break
        </Badge>
      )}

      {record.is_break_over_limit && (
        <Badge
          variant="outline"
          title={`Total daily break: ${formatMinutes(record.total_break_minutes ?? completedBreaks)} (60m allowance)`}
          className="h-5 border-rose-300 bg-rose-500/10 px-1.5 text-[10px] font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-300"
        >
          Break &gt; 60m
        </Badge>
      )}
    </div>
  );
}
