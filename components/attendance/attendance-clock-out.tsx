import type { ClockInRecord } from "@/lib/api/clock-in";
import { Badge } from "@/components/ui/badge";
import { formatLagosDate, formatLagosDateForInput, formatLagosTime } from "@/lib/utils/attendance";

export function AttendanceClockOut({ record }: { record: ClockInRecord }) {
  if (!record.clock_out_at) return <span>—</span>;
  const overnight = formatLagosDateForInput(record.clock_in_at) !== formatLagosDateForInput(record.clock_out_at);
  return <div className="flex flex-col items-start gap-1">
    <span>{formatLagosTime(record.clock_out_at)}</span>
    {overnight && <span className="text-xs text-muted-foreground">{formatLagosDate(record.clock_out_at)}</span>}
    {record.is_late_clock_out && <Badge variant="outline" className="w-fit border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-800 dark:text-amber-300">After 8 PM</Badge>}
  </div>;
}
