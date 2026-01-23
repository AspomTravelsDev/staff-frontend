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
}

// TODO: Replace with Supabase queries
export async function getLeaveStats(userId: string): Promise<LeaveStat> {
    // Mock data
    return {
        totalLeaveDaysLeft: 12,
        casualLeaveDays: 8,
        emergencyLeaveTaken: 2,
        totalDaysAbsent: 3,
    }
}

export async function getLeaveEntries(userId: string): Promise<LeaveEntry[]> {
    // Mock data
    return [
        {
            id: '1',
            type: 'Casual',
            days: 2,
            startDate: '2026-01-10',
            endDate: '2026-01-11',
            reason: 'Family event',
            status: 'Approved',
        },
        {
            id: '2',
            type: 'Emergency',
            days: 1,
            startDate: '2026-01-15',
            endDate: '2026-01-15',
            reason: 'Medical',
            status: 'Pending',
        },
    ]
}
