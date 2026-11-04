import { getAppraisalHistory, getAppraisalStats } from "@/lib/api/performance-appraisal";
import type { AppraisalSummary, AppraisalStats } from "@/lib/api/performance-appraisal";

export async function getPerformanceData(): Promise<{
    appraisals: AppraisalSummary[];
    stats: AppraisalStats;
}> {
    const [appraisals, stats] = await Promise.all([
        getAppraisalHistory(),
        getAppraisalStats(),
    ]);

    return { appraisals, stats };
}
