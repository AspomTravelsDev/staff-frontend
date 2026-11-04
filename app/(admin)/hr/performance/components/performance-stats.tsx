import type { PerformanceResultStats } from "@/lib/types/performance-result";

export function PerformanceStatsCards({ stats }: { stats: PerformanceResultStats }) {
  return <dl className="flex flex-wrap gap-x-8 gap-y-4 border-y py-4 text-sm"><div><dt className="text-muted-foreground">Completed appraisals</dt><dd className="mt-1 font-semibold tabular-nums">{stats.completed}</dd></div><div><dt className="text-muted-foreground">Average final score</dt><dd className="mt-1 font-semibold tabular-nums">{stats.average_score === null ? "No completed scores" : `${stats.average_score.toFixed(2)} / 5`}</dd></div><div><dt className="text-muted-foreground">Departments represented</dt><dd className="mt-1 font-semibold tabular-nums">{stats.departments}</dd></div></dl>;
}
