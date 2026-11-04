import type { AppraisalStats } from "@/lib/types/performance-appraisal";

export function AppraisalStatsCards({ stats }: { stats: AppraisalStats }) {
  return <dl className="flex flex-wrap gap-x-8 gap-y-4 border-y py-4 text-sm">
    <div><dt className="text-muted-foreground">Assigned</dt><dd className="mt-1 font-semibold tabular-nums">{stats.total_appraisals}</dd></div>
    <div><dt className="text-muted-foreground">Awaiting my submission</dt><dd className="mt-1 font-semibold tabular-nums">{stats.pending_self_appraisal}</dd></div>
    <div><dt className="text-muted-foreground">Completed</dt><dd className="mt-1 font-semibold tabular-nums">{stats.completed_appraisals}</dd></div>
    <div><dt className="text-muted-foreground">Average final score</dt><dd className="mt-1 font-semibold tabular-nums">{stats.average_rating === null ? "No completed scores" : `${stats.average_rating.toFixed(2)} / 5`}</dd></div>
  </dl>;
}
