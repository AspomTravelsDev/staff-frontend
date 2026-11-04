export type Severity = "low" | "medium" | "high" | "critical";
export type ComplianceStatus = "open" | "closed";
export type CorrectionFilter = "pending" | "overdue" | "completed";
export interface CorrectionPlan {
    correction_notes: string;
    correction_due_date: string;
    correction_reminder_days: number;
}

export interface ComplianceDecisionOptions {
    formal_review_confirmed?: boolean;
    client_error_level?: number | null;
    prior_coaching_id?: string | null;
    related_incident_id?: string | null;
    separate_breach_reason?: string;
}

export interface CompliancePolicyContext {
    policy_version: string;
    effective_date: string;
    existing_points: number;
    projected_points: number;
    counts_in_current_window?: boolean;
    recommended_step: number;
    recommended_action: string | null;
    previous_action_step: number;
    review_reentered_threshold: boolean;
    formal_review_required: boolean;
    termination_review_required: boolean;
    month_incident_number: number;
    suggested_deduction_days: number | null;
    steps: SanctionStep[];
    client_error_levels: { level: number; label: string; action: string }[];
    prior_incidents: { id: string; type: string; date: string; feedback: string | null }[];
}

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
    comments_count?: number;
    evidence_documents?: { id: string; original_name: string; file_size: number; created_at: string }[];
    policy_context?: CompliancePolicyContext;
    policy_version?: string | null;
    recorded_step?: number | null;
    recommendation_snapshot?: Partial<CompliancePolicyContext> & { decided_at?: string } | null;
    client_error_level?: number | null;
    prior_coaching_id?: string | null;
    related_incident_id?: string | null;
    separate_breach_reason?: string | null;
    correction_notes?: string | null;
    correction_due_date?: string | null;
    correction_reminder_days?: number;
    correction_status?: "pending" | "due_soon" | "overdue" | "completed" | null;
    correction_completed_at?: string | null;
    correction_completion_notes?: string | null;
    id: string;
    user_id: string;
    type: string;
    evidence?: string | null;
    decision_notes?: string | null;
    verified_at?: string | null;
    verified_by_id?: string | null;
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
    isManager?: boolean;
    awaitingEvidence?: number;
    staffReplies?: number;
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
    previous_action_step?: number;
    review_reentered_threshold?: boolean;
    user_id: string;
    name: string;
    department?: string | null;
    role: string;
    issues_count: number;
    raw_points?: number;
    pending_count?: number;
    confirmed_count?: number;
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
    isHistorical?: boolean;
    today?: string;
    client_error_levels?: CompliancePolicyContext["client_error_levels"];
    policy_version?: string;
    effective_date?: string;
    review_step?: { step: number; label: string };
    windowStart: string;
    windowEnd: string;
    periodLabel: string;
    steps: SanctionStep[];
    breakdown_rules?: PolicyBreakdownRule[];
    items: SanctionGridItem[];
}

export interface ComplianceFilters {
    correction?: CorrectionFilter;
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

export interface ComplianceMonthlyReview {
    month: string;
    items: {
        key: string; user_id: string; name: string; department: string | null; type: string;
        incidents: number; occurrence_points: number; pending_corrections: number; completed_corrections: number; next_review: string;
        history: { id: string; date: string; outcome: string | null; feedback: string | null; correction: string | null; deadline: string | null; correction_status: string | null; completion_notes: string | null; decision_date: string | null; staff_viewed_at?: string | null; communication_dates: string[] }[];
    }[];
}

export const OFFICIAL_POLICY_CATEGORIES = [
    { type: "Client information / processing error", points: 0, label: "Client information / processing error (classify during review)", unitText: "Review the client-error level before counting" },
    { type: "Missed clock-in", points: 0.5, label: "Missed clock-in (0.5 occurrence)", unitText: "0.5 occurrence per verified miss" },
    { type: "Missed clock-out", points: 0.5, label: "Missed clock-out (0.5 occurrence)", unitText: "0.5 occurrence per verified miss" },
    { type: "Missed clock-in and clock-out", points: 1, label: "Missed clock-in and clock-out (1 occurrence)", unitText: "Two half occurrences for the same day" },
    { type: "Missed Daily To-do List", points: 0.5, label: "Missed Daily To-do List (0.5 occurrence)", unitText: "0.5 occurrence; monthly deduction from third miss onward" },
    { type: "Missed End-of-Day Report", points: 0.5, label: "Missed End-of-Day Report (0.5 occurrence)", unitText: "0.5 occurrence; monthly deduction from third miss onward" },
    { type: "Absence", points: 1.0, label: "Absence (1 occurrence)", unitText: "1 Occurrence" },
    { type: "Customer Complaint", points: 1.0, label: "Customer Complaint (1 occurrence)", unitText: "1 Occurrence" },
    { type: "Tardies", points: 0.5, label: "Tardies (0.5 occurrence - 2 Tardies = 1)", unitText: "0.5 Occurrences (2 = 1 occurrence)" },
    { type: "Missed Daily To-do-List/Report", points: 0.5, label: "Missed Daily To-do-List/Report (0.5 occurrence - 2 = 1)", unitText: "0.5 Occurrences (2 = 1 occurrence)" },
    { type: "Not Meeting Deadlines", points: 1.0, label: "Not Meeting Deadlines (1 occurrence)", unitText: "1 Occurrence" },
    { type: "Default in Company Policy/SOP", points: 1.0, label: "Default in Company Policy/SOP (1 occurrence)", unitText: "1 Occurrence" },
    { type: "Insubordination", points: 1.0, label: "Insubordination (formal review required)", unitText: "Deliberate insubordination: consider Step 5 or higher following review" },
    { type: "Other", points: 1.0, label: "Other Policy Issue", unitText: "1 Occurrence" },
    { type: "Early departure without permission", points: 1, label: "Early departure without permission", unitText: "1 occurrence(s) per incident" },
    { type: "Failure to clock in/out", points: 0.5, label: "Failure to clock in/out", unitText: "0.5 occurrence(s) per incident" },
    { type: "Extended or unapproved breaks", points: 0.5, label: "Extended or unapproved breaks", unitText: "0.5 occurrence(s) per incident" },
    { type: "Absence from required meetings", points: 0.5, label: "Absence from required meetings", unitText: "0.5 occurrence(s) per incident" },
    { type: "Poor work quality / negligence", points: 1, label: "Poor work quality / negligence", unitText: "1 occurrence(s) per incident" },
    { type: "Delayed response to clients or management", points: 0.5, label: "Delayed response to clients or management", unitText: "0.5 occurrence(s) per incident" },
    { type: "Misuse of company time or resources", points: 0.5, label: "Misuse of company time or resources", unitText: "0.5 occurrence(s) per incident" },
    { type: "Dress code or conduct violation", points: 0.5, label: "Dress code or conduct violation", unitText: "0.5 occurrence(s) per incident" },
    { type: "Failure to report incidents", points: 1, label: "Failure to report incidents", unitText: "1 occurrence(s) per incident" },
    { type: "Negligence causing financial loss", points: 1, label: "Negligence causing financial loss", unitText: "1 occurrence(s) per incident" },
    { type: "Missing prayer time", points: 0.5, label: "Missing prayer time", unitText: "0.5 occurrence(s) per incident" },
    { type: "Recurring client complaint", points: 1, label: "Recurring client complaint", unitText: "1 occurrence(s) per incident" },
    { type: "Missed message", points: 0.5, label: "Missed message", unitText: "0.5 occurrence(s) per incident" },
    { type: "Late response to message", points: 0.5, label: "Late response to message", unitText: "0.5 occurrence(s) per incident" },
    { type: "Not acknowledging message", points: 0.5, label: "Not acknowledging message", unitText: "0.5 occurrence(s) per incident" },
    { type: "Missed mail", points: 0.5, label: "Missed mail", unitText: "0.5 occurrence(s) per incident" },
    { type: "Not taking correction", points: 1, label: "Not taking correction", unitText: "1 occurrence(s) per incident" },
    { type: "Errors during client application review", points: 0, label: "Errors during client application review", unitText: "0 occurrence(s) per incident" },
    { type: "Cloud default", points: 0.5, label: "Cloud default", unitText: "0.5 occurrence(s) per incident" },
    { type: "Spreadsheet default", points: 0.5, label: "Spreadsheet default", unitText: "0.5 occurrence(s) per incident" },
] as const;
