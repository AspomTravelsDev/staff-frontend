import { getMyLeaveStats, getMyLeaveRequests, MyLeaveStats } from "@/lib/api/leave";

export type LeaveStat = MyLeaveStats;

export type LeaveEntry = {
    id: string;
    type: string;
    days: number;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    attachmentUrl?: string;
    handoverNoteUrl?: string;
    rejectionReason?: string;
    approvedByName?: string;
    approvedAt?: string;
};

export async function getLeaveStats(userId: string | number): Promise<LeaveStat> {
    const stats = await getMyLeaveStats();
    return stats;
}

export async function getLeaveEntries(userId: string | number): Promise<LeaveEntry[]> {
    const list = await getMyLeaveRequests();
    return list.map(req => ({
        id: req.id,
        type: req.type,
        days: req.days,
        startDate: req.startDate,
        endDate: req.endDate,
        reason: req.reason,
        status: req.status,
        attachmentUrl: req.attachmentUrl,
        handoverNoteUrl: req.handoverNoteUrl,
        rejectionReason: req.rejectionReason,
        approvedByName: req.approvedByName,
        approvedAt: req.approvedAt,
    }));
}
