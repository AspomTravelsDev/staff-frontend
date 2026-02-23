/**
 * CRM types and constants — no "use server" directive.
 * Safe to import from both server and client components.
 * Status values match the backend API (snake_case).
 */

export type CRMStatus = "potential" | "follow_up" | "negotiation" | "paid" | "inactive";

export const CRM_STATUS_OPTIONS: { label: string; value: CRMStatus }[] = [
    { label: "Potential", value: "potential" },
    { label: "Follow-up", value: "follow_up" },
    { label: "Negotiation", value: "negotiation" },
    { label: "Paid", value: "paid" },
    { label: "Inactive", value: "inactive" },
];

export const CRM_SERVICE_OPTIONS = [
    "Visa Application",
    "Travel Package",
    "Birth Services",
    "School Services",
    "Corporate Travel",
    "Consultation",
    "Premium Services",
    "Other",
] as const;

export const CRM_SOURCE_OPTIONS = [
    "Walk-in",
    "Referral",
    "Instagram",
    "Facebook",
    "WhatsApp",
    "Google Search",
    "Partner Referral",
    "Other",
] as const;

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface Client {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string | null;
    status: CRMStatus;
    service: string;
    source: string;
    notes: string | null;
    assignedTo: string | null;
    assignedToName?: string | null;
    lastContact: string;
    createdAt: string;
    createdBy: string;
}

export interface CreateClientRequest {
    name: string;
    contactPerson: string;
    email: string;
    phone?: string;
    status: CRMStatus;
    service: string;
    source: string;
    notes?: string;
    assignedTo?: string;
}

export interface UpdateClientRequest {
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    status?: CRMStatus;
    service?: string;
    source?: string;
    notes?: string;
    assignedTo?: string;
    lastContact?: string;
}

export interface CRMStats {
    totalPaid: number;
    newPotentials: number;
    activeDeals: number;
    conversionRate: string;
}

export interface CRMFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: CRMStatus;
    myClients?: boolean;
    assignedTo?: string;
}
