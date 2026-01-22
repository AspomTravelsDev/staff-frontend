/**
 * Shared API Types
 *
 * Common types used across all API modules.
 */

import type { User } from "@/lib/auth/api";

/**
 * Pagination response from API
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

/**
 * Paginated list response wrapper
 */
export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationMeta;
}

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
}

/**
 * Audit log entry - used across all modules
 */
export interface AuditLogEntry {
    id: string;
    entity_type: string;
    entity_id: string;
    action:
    | "created"
    | "updated"
    | "status_changed"
    | "assigned"
    | "note_added"
    | "document_uploaded"
    | "document_deleted";
    actor_id: string;
    actor_name: string;
    actor_role: User["role"];
    timestamp: string;

    /** Field-level changes for updates */
    changes?: {
        field: string;
        old_value: unknown;
        new_value: unknown;
    }[];

    /** For status change actions */
    previous_status?: string;
    new_status?: string;

    /** Optional note or reason */
    note?: string;
}

/**
 * Activity feed item (for notifications/activity page)
 */
export interface ActivityItem extends AuditLogEntry {
    /** Human-readable description */
    description: string;
    /** Related entity title for display */
    entity_title?: string;
    /** Whether the current user has seen this activity */
    is_read?: boolean;
}

/**
 * Common document attachment structure
 */
export interface DocumentAttachment {
    id: string;
    document_type: string;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    uploaded_by: string;
    uploaded_by_name: string;
    uploaded_at: string;
    verified: boolean;
    verified_by: string | null;
    verified_at: string | null;
}

/**
 * Internal note structure (used across entities)
 */
export interface InternalNote {
    id: string;
    content: string;
    is_internal: boolean;
    created_by: string;
    created_by_name: string;
    created_at: string;
}

/**
 * Server action result pattern
 */
export interface ActionResult<T = void> {
    success: boolean;
    error?: string;
    data?: T;
}
