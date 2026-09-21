export type Severity = "low" | "medium" | "high" | "critical";
export type ComplianceStatus = "open" | "closed";

export interface ComplianceComment {
    id: string;
    occurrence_id: string;
    user_id: string;
    comment: string;
    created_at: string;
    user?: {
        id: string;
        name: string;
        image_url?: string;
    };
}

export interface ComplianceIssue {
    id: string;
    user_id: string;
    type: string;
    points?: number;
    severity: Severity;
    status: ComplianceStatus;
    outcome: string | null;
    description: string;
    occurrence_date: string;
    date?: string; // Mapped for backward compatibility
    created_at: string;
    user_name?: string; // Mapped for UI
    user_department?: string; // Mapped for UI
    user?: {
        id: string;
        name: string;
        department?: string;
    };
    creator?: {
        id: string;
        name: string;
    };
    comments?: ComplianceComment[];
    latest_comment?: ComplianceComment | null;
    deduction_days?: number;
    has_new_replies?: boolean;
}

export interface ComplianceStats {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    totalDeductions: number;
    topOffender: {
        name: string;
        count: number;
    } | null;
    topDepartment: {
        name: string;
        count: number;
    } | null;
}

export interface SanctionStep {
    step: number;
    threshold: number;
    label: string;
}

export interface SanctionOccurrenceMarker {
    id: string;
    type: string;
    points?: number;
    outcome?: string | null;
    occurrence_date: string;
}

export interface SanctionGridItem {
    user_id: string;
    name: string;
    department?: string | null;
    role: string;
    issues_count: number;
    raw_points?: number;
    has_insubordination?: boolean;
    current_step: number;
    occurrence_markers: SanctionOccurrenceMarker[];
}

export interface PolicyBreakdownRule {
    type: string;
    occurrences: number;
    rule: string;
}

export interface SanctionGridResponse {
    windowStart: string;
    windowEnd: string;
    periodLabel: string;
    steps: SanctionStep[];
    breakdown_rules?: PolicyBreakdownRule[];
    items: SanctionGridItem[];
}

export interface ComplianceFilters {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    severity?: Severity;
    status?: ComplianceStatus;
    user_id?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
}

export const OFFICIAL_POLICY_CATEGORIES = [
    { type: "Absence", points: 1.0, label: "Absence (1 occurrence)", unitText: "1 Occurrence" },
    { type: "Customer Complaint", points: 1.0, label: "Customer Complaint (1 occurrence)", unitText: "1 Occurrence" },
    { type: "Tardies", points: 0.5, label: "Tardies (0.5 occurrence - 2 Tardies = 1)", unitText: "0.5 Occurrences (2 = 1 occurrence)" },
    { type: "Missed Daily To-do-List/Report", points: 0.5, label: "Missed Daily To-do-List/Report (0.5 occurrence - 2 = 1)", unitText: "0.5 Occurrences (2 = 1 occurrence)" },
    { type: "Not Meeting Deadlines", points: 1.0, label: "Not Meeting Deadlines (1 occurrence)", unitText: "1 Occurrence" },
    { type: "Default in Company Policy/SOP", points: 1.0, label: "Default in Company Policy/SOP (1 occurrence)", unitText: "1 Occurrence" },
    { type: "Insubordination", points: 1.0, label: "Insubordination (Jumps to Step 4: Suspension)", unitText: "Jumps to Step 4" },
    { type: "Other", points: 1.0, label: "Other Policy Issue", unitText: "1 Occurrence" },
] as const;
