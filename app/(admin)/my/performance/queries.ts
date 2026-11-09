import { getAppraisalAvailability, getAppraisalHistory, getAppraisalStats } from "@/lib/api/performance-appraisal";
import type { AppraisalSummary, AppraisalStats, AppraisalAvailability } from "@/lib/api/performance-appraisal";

export async function getPerformanceData(): Promise<{
    appraisals: AppraisalSummary[];
    stats: AppraisalStats;
    availability: AppraisalAvailability;
}> {
    const [appraisals, stats, availability] = await Promise.all([
        getAppraisalHistory(),
        getAppraisalStats(),
        getAppraisalAvailability(),
    ]);

    return { appraisals, stats, availability };
}
