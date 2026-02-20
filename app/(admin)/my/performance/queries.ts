import { getAppraisalHistory, getAppraisalStats } from "@/lib/api/performance-appraisal";
import type { PerformanceAppraisal, AppraisalStats } from "@/lib/api/performance-appraisal";

export async function getPerformanceData(): Promise<{
    appraisals: PerformanceAppraisal[];
    stats: AppraisalStats;
}> {
    const [appraisals, stats] = await Promise.all([
        getAppraisalHistory(),
        getAppraisalStats(),
    ]);

    return { appraisals, stats };
}
