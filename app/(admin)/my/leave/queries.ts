// Leave queries (mock for now, Supabase-ready)
export type LeaveStat = {
    totalLeaveDaysLeft: number
    casualLeaveDays: number
    emergencyLeaveTaken: number
    totalDaysAbsent: number
}

export type LeaveEntry = {
    id: string
    type: string
    days: number
    startDate: string
    endDate: string
    reason: string
    status: string
    rejectionReason?: string
    approvedByName?: string
    approvedAt?: string
}

import { getMyLeaveStats, getMyLeaveRequests } from "@/lib/api/leave";

export async function getLeaveStats(userId: string | number): Promise<LeaveStat> {
    const stats = await getMyLeaveStats();
    return {
        totalLeaveDaysLeft: stats.totalLeaveDaysLeft,
        casualLeaveDays: stats.casualLeaveDays,
        emergencyLeaveTaken: stats.emergencyLeaveTaken,
        totalDaysAbsent: stats.totalDaysAbsent,
    };
}

export async function getLeaveEntries(userId: string | number): Promise<LeaveEntry[]> {
    const list = await getMyLeaveRequests();
    return list.map(req => ({
        id: req.id,
        type: req.type.replace(" Leave", ""),
        days: req.days,
        startDate: req.startDate,
        endDate: req.endDate,
        reason: req.reason,
        status: req.status,
        rejectionReason: req.rejectionReason,
        approvedByName: req.approvedByName,
        approvedAt: req.approvedAt,
    }));
}
