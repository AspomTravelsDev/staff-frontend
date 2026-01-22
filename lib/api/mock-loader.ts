/**
 * Mock Data Loader
 *
 * Utility to load mock data from JSON files for development.
 * This runs server-side and reads from the data/mock directory.
 */

import { promises as fs } from "fs";
import path from "path";

const MOCK_DATA_DIR = path.join(process.cwd(), "data", "mock");

/**
 * Generic function to load and parse a mock JSON file
 */
async function loadMockFile<T>(filename: string): Promise<T> {
    const filePath = path.join(MOCK_DATA_DIR, filename);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface MockUser {
    id: string;
    email: string;
    password: string;
    name: string;
    role: "super" | "admin" | "it" | "account" | "visa" | "hr" | "media" | "compliance";
}

interface AuthData {
    users: MockUser[];
    tokens: Record<string, string>;
}

// ============================================================================
// Auth Functions
// ============================================================================

let authCache: AuthData | null = null;

export async function getMockAuthData(): Promise<AuthData> {
    if (!authCache) {
        authCache = await loadMockFile<AuthData>("auth.json");
    }
    return authCache;
}

export async function findUserByEmail(email: string): Promise<MockUser | undefined> {
    const data = await getMockAuthData();
    return data.users.find((u) => u.email === email);
}

export async function findUserById(id: string): Promise<MockUser | undefined> {
    const data = await getMockAuthData();
    return data.users.find((u) => u.id === id);
}

export async function findUserByToken(token: string): Promise<MockUser | undefined> {
    const data = await getMockAuthData();
    const userId = Object.entries(data.tokens).find(([, t]) => t === token)?.[0];
    if (!userId) return undefined;
    return data.users.find((u) => u.id === userId);
}

export async function getTokenForUser(userId: string): Promise<string | undefined> {
    const data = await getMockAuthData();
    return data.tokens[userId];
}

// ============================================================================
// Visa Types (imported from main types, but simplified here for mock)
// ============================================================================

import type { VisaApplication, VisaApplicationListItem } from "@/lib/api/visa";
import type { AuditLogEntry, DocumentAttachment, InternalNote } from "@/lib/api/types";

interface VisaData {
    applications: VisaApplication[];
    notes: Record<string, InternalNote[]>;
    documents: Record<string, DocumentAttachment[]>;
    audit_log: Record<string, AuditLogEntry[]>;
    staff: { id: string; name: string; email: string; role: string }[];
}

// ============================================================================
// Visa Functions
// ============================================================================

let visaCache: VisaData | null = null;

export async function getMockVisaData(): Promise<VisaData> {
    if (!visaCache) {
        visaCache = await loadMockFile<VisaData>("visa.json");
    }
    return visaCache;
}

export async function getMockApplications(): Promise<VisaApplication[]> {
    const data = await getMockVisaData();
    return data.applications;
}

export async function getMockApplicationById(
    id: string
): Promise<VisaApplication | undefined> {
    const data = await getMockVisaData();
    return data.applications.find((app) => app.id === id);
}

export async function getMockApplicationNotes(
    applicationId: string
): Promise<InternalNote[]> {
    const data = await getMockVisaData();
    return data.notes[applicationId] || [];
}

export async function getMockApplicationDocuments(
    applicationId: string
): Promise<DocumentAttachment[]> {
    const data = await getMockVisaData();
    return data.documents[applicationId] || [];
}

export async function getMockApplicationAuditLog(
    applicationId: string
): Promise<AuditLogEntry[]> {
    const data = await getMockVisaData();
    return data.audit_log[applicationId] || [];
}

export async function getMockVisaStaff(): Promise<
    { id: string; name: string; email: string }[]
> {
    const data = await getMockVisaData();
    return data.staff;
}

/**
 * Convert full application to list item
 */
export function toListItem(app: VisaApplication): VisaApplicationListItem {
    return {
        id: app.id,
        reference_number: app.reference_number,
        country: app.country,
        applicant_name: app.applicant_name,
        applicant_email: app.applicant_email,
        passport_number: app.passport_number,
        status: app.status,
        priority: app.priority,
        assigned_to_name: app.assigned_to_name,
        payment_status: app.payment_status,
        created_at: app.created_at,
        updated_at: app.updated_at,
        submitted_at: app.submitted_at,
    };
}

// ============================================================================
// Activity Types
// ============================================================================

import type { ActivityItem } from "@/lib/api/types";

interface ActivityData {
    activities: ActivityItem[];
}

// ============================================================================
// Activity Functions
// ============================================================================

let activityCache: ActivityData | null = null;

export async function getMockActivityData(): Promise<ActivityData> {
    if (!activityCache) {
        activityCache = await loadMockFile<ActivityData>("activity.json");
    }
    return activityCache;
}

export async function getMockActivities(): Promise<ActivityItem[]> {
    const data = await getMockActivityData();
    return data.activities;
}

// ============================================================================
// Cache Invalidation (for development hot reload)
// ============================================================================

export function clearMockCache(): void {
    authCache = null;
    visaCache = null;
    activityCache = null;
}
