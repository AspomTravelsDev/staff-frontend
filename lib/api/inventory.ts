"use server";

import { PaginatedResponse } from "./types";
import { api } from "./client";

// ============================================================================
// Types
// ============================================================================

export type InventoryStatus = "Storage" | "Assigned" | "Repairs";
export type InventoryConditionRating = "Excellent" | "Good" | "Fair" | "Poor" | "Broken";

export interface TechnicianDetails {
    name: string;
    phone: string;
    address: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: "Laptop" | "Phone" | "Gadget" | "Other";
    serialNumber: string;
    status: InventoryStatus;
    conditionRating: InventoryConditionRating;
    conditionDetails?: string;
    assignedTo?: string;            // Only present if status is "Assigned"
    technicianDetails?: TechnicianDetails; // Only present if status is "Repairs"
    createdAt?: string;
    updatedAt?: string;
    history?: InventoryHistory[];
    openAssignment?: InventoryAssignment | null;
}

export interface InventoryHistory {
    id: string;
    inventoryItemId: string;
    status: InventoryStatus;
    conditionRating: InventoryConditionRating;
    conditionDetails?: string;
    notes?: string;
    assignedTo?: string;
    assignedToName?: string;
    technicianDetails?: TechnicianDetails;
    changedBy: string;
    changerName?: string;
    createdAt: string;
}

export interface InventoryStats {
    totalDevices: number;
    inStorage: number;
    assigned: number;
    inRepairs: number;
}

export interface InventoryFilters {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: InventoryStatus;
    conditionRating?: InventoryConditionRating;
}

export type InventoryItemPayload = Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "history" | "openAssignment"> & { notes?: string };

export type InventoryAssignmentStatus =
    | "pending_staff"
    | "pending_officer"
    | "pending_compliance"
    | "completed"
    | "cancelled";

export type InventoryAssignmentDecision = "approved" | "rejected";

export interface InventoryAssignmentUser {
    id: string;
    name: string;
    role?: string;
    department?: string;
}

export interface InventoryAssignment {
    id: string;
    inventoryItemId: string;
    status: InventoryAssignmentStatus;
    initiateNotes?: string;
    staffConditionRating?: InventoryConditionRating;
    staffConditionDetails?: string;
    staffNotes?: string;
    staffDecision?: InventoryAssignmentDecision;
    staffDecidedAt?: string;
    officerNotes?: string;
    officerDecision?: InventoryAssignmentDecision;
    officerDecidedAt?: string;
    complianceNotes?: string;
    complianceDecision?: InventoryAssignmentDecision;
    complianceDecidedAt?: string;
    createdAt: string;
    updatedAt: string;
    inventoryItem?: InventoryItem;
    assignee?: InventoryAssignmentUser;
    initiator?: InventoryAssignmentUser;
    officer?: InventoryAssignmentUser;
    complianceOfficer?: InventoryAssignmentUser;
}


// ============================================================================
// API Functions
// ============================================================================

export async function getInventory(
    filters: InventoryFilters = {}
): Promise<PaginatedResponse<InventoryItem>> {

    try {
        const queryParams = new URLSearchParams();
        if (filters.page) queryParams.set("page", filters.page.toString());
        if (filters.limit) queryParams.set("limit", filters.limit.toString());
        if (filters.search) queryParams.set("search", filters.search);
        if (filters.category) queryParams.set("category", filters.category);
        if (filters.status) queryParams.set("status", filters.status);
        if (filters.conditionRating) queryParams.set("condition_rating", filters.conditionRating);

        const response = await api.get<any>(`/api/admin/inventory?${queryParams.toString()}`);

        if (!response.success) {
            throw new Error(response.error?.error || "Failed to fetch inventory");
        }

        return {
            items: response.data.items.map((item: any) => ({
                id: item.id.toString(),
                name: item.name,
                category: item.category,
                serialNumber: item.serial_number,
                status: item.status,
                conditionRating: item.condition_rating,
                conditionDetails: item.condition_details,
                assignedTo: item.assigned_to,
                technicianDetails: item.technician_details,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                openAssignment: mapOpenAssignment(item.open_assignment),
                history: item.history?.map((h: any) => ({
                    id: h.id.toString(),
                    inventoryItemId: h.inventory_item_id.toString(),
                    status: h.status,
                    conditionRating: h.condition_rating,
                    conditionDetails: h.condition_details,
                    notes: h.notes,
                    assignedTo: h.assigned_to,
                    assignedToName: h.assigned_to_user?.name,
                    technicianDetails: h.technician_details,
                    changedBy: h.changed_by,
                    changerName: h.changer?.name,
                    createdAt: h.created_at,
                })) || [],
            })),
            pagination: response.data.pagination,
        };
    } catch (error) {
        console.error("Error fetching live inventory", error);
        return { items: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
    }
}

export async function getInventoryStats(
    filters: InventoryFilters = {}
): Promise<InventoryStats> {


    try {
        const queryParams = new URLSearchParams();
        if (filters.category) queryParams.set("category", filters.category);
        if (filters.status) queryParams.set("status", filters.status);
        if (filters.conditionRating) queryParams.set("condition_rating", filters.conditionRating);

        const response = await api.get<any>(`/api/admin/inventory/stats?${queryParams.toString()}`);

        if (!response.success) {
            throw new Error(response.error?.error || "Failed to fetch stats");
        }

        return {
            totalDevices: response.data.totalDevices || 0,
            inStorage: response.data.inStorage || 0,
            assigned: response.data.assigned || 0,
            inRepairs: response.data.inRepairs || 0,
        };
    } catch (error) {
        console.error("Error fetching inventory stats:", error);
        return {
            totalDevices: 0,
            inStorage: 0,
            assigned: 0,
            inRepairs: 0
        };
    }
}

export async function createInventoryItem(payload: InventoryItemPayload): Promise<InventoryItem> {
    try {
        const response = await api.post<any>("/api/admin/inventory", {
            name: payload.name,
            category: payload.category,
            serial_number: payload.serialNumber,
            status: payload.status,
            condition_rating: payload.conditionRating,
            condition_details: payload.conditionDetails,
            notes: payload.notes,
            assigned_to: payload.assignedTo,
            technician_details: payload.technicianDetails,
        });

        if (!response.success) {
            throw new Error(response.error?.error || "Failed to create inventory item");
        }

        const item = response.data;
        return {
            id: item.id.toString(),
            name: item.name,
            category: item.category,
            serialNumber: item.serial_number,
            status: item.status,
            conditionRating: item.condition_rating,
            conditionDetails: item.condition_details,
            assignedTo: item.assigned_to,
            technicianDetails: item.technician_details,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        };
    } catch (error) {
        console.error("Error creating inventory item", error);
        throw error;
    }
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItemPayload>): Promise<InventoryItem> {

    try {
        const response = await api.patch<any>(`/api/admin/inventory/${id}`, {
            name: payload.name,
            category: payload.category,
            serial_number: payload.serialNumber,
            status: payload.status,
            condition_rating: payload.conditionRating,
            condition_details: payload.conditionDetails,
            notes: payload.notes,
            assigned_to: payload.assignedTo,
            technician_details: payload.technicianDetails,
        });

        if (!response.success) {
            throw new Error(response.error?.error || "Failed to update inventory item");
        }

        const item = response.data;
        return {
            id: item.id.toString(),
            name: item.name,
            category: item.category,
            serialNumber: item.serial_number,
            status: item.status,
            conditionRating: item.condition_rating,
            conditionDetails: item.condition_details,
            assignedTo: item.assigned_to,
            technicianDetails: item.technician_details,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
        };
    } catch (error) {
        console.error(`Error updating inventory item ${id}`, error);
        throw error;
    }
}

export async function deleteInventoryItem(id: string): Promise<void> {

    try {
        const response = await api.delete<any>(`/api/admin/inventory/${id}`);

        if (!response.success) {
            throw new Error(response.error?.error || "Failed to delete inventory item");
        }
    } catch (error) {
        console.error(`Error deleting inventory item ${id}`, error);
        throw error;
    }
}

export async function getInventoryHistory(id: string): Promise<PaginatedResponse<InventoryHistory>> {
    try {
        const response = await api.get<any>(`/api/admin/inventory/${id}/history`);
        if (!response.success) throw new Error("Failed to fetch history");

        return {
            items: response.data.data.map((h: any) => ({
                id: h.id.toString(),
                inventoryItemId: h.inventory_item_id.toString(),
                status: h.status,
                conditionRating: h.condition_rating,
                conditionDetails: h.condition_details,
                notes: h.notes,
                assignedTo: h.assigned_to,
                assignedToName: h.assigned_to_user?.name,
                technicianDetails: h.technician_details,
                changedBy: h.changed_by,
                changerName: h.changer?.name,
                createdAt: h.created_at,
            })),
            pagination: {
                page: response.data.current_page,
                limit: response.data.per_page,
                total: response.data.total,
                total_pages: response.data.last_page,
            }
        };
    } catch (error) {
        console.error("Error fetching inventory history", error);
        return { items: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
    }
}

export async function logInventoryInspection(id: string, payload: { conditionRating: InventoryConditionRating, conditionDetails?: string, notes?: string }): Promise<void> {
    try {
        const response = await api.post<any>(`/api/admin/inventory/${id}/inspect`, {
            condition_rating: payload.conditionRating,
            condition_details: payload.conditionDetails,
            notes: payload.notes,
        });
        if (!response.success) {
            throw new Error(response.error?.error || "Failed to log inspection");
        }
    } catch (error) {
        console.error("Error logging inspection", error);
        throw error;
    }
}

export async function getMyInventory(): Promise<InventoryItem[]> {
    try {
        const response = await api.get<any>("/api/my-inventory");
        if (!response.success) throw new Error("Failed to fetch personal inventory");

        return response.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            category: item.category,
            serialNumber: item.serial_number,
            status: item.status,
            conditionRating: item.condition_rating,
            conditionDetails: item.condition_details,
            assignedTo: item.assigned_to,
            technicianDetails: item.technician_details,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            openAssignment: mapOpenAssignment(item.open_assignment),
        }));
    } catch (error) {
        console.error("Error fetching my inventory", error);
        return [];
    }
}

export async function updateMyInventory(id: string, payload: { status?: InventoryStatus, conditionRating?: InventoryConditionRating, conditionDetails?: string, notes: string }): Promise<void> {
    try {
        const response = await api.patch<any>(`/api/my-inventory/${id}`, {
            status: payload.status,
            condition_rating: payload.conditionRating,
            condition_details: payload.conditionDetails,
            notes: payload.notes,
        });
        if (!response.success) throw new Error("Failed to update asset status");
    } catch (error) {
        console.error("Error updating my inventory", error);
        throw error;
    }
}

export async function getMyInventoryHistory(
    id: string,
    params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<InventoryHistory>> {
    try {
        const query = new URLSearchParams();
        if (params?.page) query.append("page", params.page.toString());
        if (params?.limit) query.append("limit", params.limit.toString());

        const response = await api.get<any>(`/api/my-inventory/${id}/history?${query}`);

        if (!response.success) {
            throw new Error(response.error?.error || "Failed to fetch inventory history");
        }

        return {
            items: response.data.data.map((h: any) => ({
                id: h.id.toString(),
                inventoryItemId: h.inventory_item_id.toString(),
                status: h.status,
                conditionRating: h.condition_rating,
                conditionDetails: h.condition_details,
                notes: h.notes,
                assignedTo: h.assigned_to,
                assignedToName: h.assigned_to_user?.name,
                technicianDetails: h.technician_details,
                changedBy: h.changed_by,
                changerName: h.changer?.name,
                createdAt: h.created_at,
            })),
            pagination: {
                page: response.data.current_page,
                limit: response.data.per_page,
                total: response.data.total,
                total_pages: response.data.last_page,
            }
        };
    } catch (error) {
        console.error("Error fetching my inventory history", error);
        return { items: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
    }
}

// ============================================================================
// Assignment acknowledgement mappers & API
// ============================================================================

function mapAssignment(a: any): InventoryAssignment {
    return {
        id: a.id.toString(),
        inventoryItemId: a.inventory_item_id?.toString(),
        status: a.status,
        initiateNotes: a.initiate_notes ?? undefined,
        staffConditionRating: a.staff_condition_rating ?? undefined,
        staffConditionDetails: a.staff_condition_details ?? undefined,
        staffNotes: a.staff_notes ?? undefined,
        staffDecision: a.staff_decision ?? undefined,
        staffDecidedAt: a.staff_decided_at ?? undefined,
        officerNotes: a.officer_notes ?? undefined,
        officerDecision: a.officer_decision ?? undefined,
        officerDecidedAt: a.officer_decided_at ?? undefined,
        complianceNotes: a.compliance_notes ?? undefined,
        complianceDecision: a.compliance_decision ?? undefined,
        complianceDecidedAt: a.compliance_decided_at ?? undefined,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        inventoryItem: a.inventory_item
            ? {
                  id: a.inventory_item.id.toString(),
                  name: a.inventory_item.name,
                  category: a.inventory_item.category,
                  serialNumber: a.inventory_item.serial_number,
                  status: a.inventory_item.status,
                  conditionRating: a.inventory_item.condition_rating,
                  conditionDetails: a.inventory_item.condition_details,
                  assignedTo: a.inventory_item.assigned_to,
              }
            : undefined,
        assignee: a.assignee
            ? { id: a.assignee.id, name: a.assignee.name, role: a.assignee.role, department: a.assignee.department }
            : undefined,
        initiator: a.initiator
            ? { id: a.initiator.id, name: a.initiator.name }
            : undefined,
        officer: a.officer
            ? { id: a.officer.id, name: a.officer.name }
            : undefined,
        complianceOfficer: a.compliance_officer
            ? { id: a.compliance_officer.id, name: a.compliance_officer.name }
            : undefined,
    };
}

function mapOpenAssignment(a: any): InventoryAssignment | null {
    if (!a) return null;
    return mapAssignment(a);
}

export async function getMyInventoryAssignments(pendingOnly = false): Promise<InventoryAssignment[]> {
    try {
        const query = pendingOnly ? "?pending_only=1" : "";
        const response = await api.get<any>(`/api/my-inventory/assignments${query}`);
        if (!response.success) throw new Error("Failed to fetch assignments");
        return (response.data.data || []).map(mapAssignment);
    } catch (error) {
        console.error("Error fetching my inventory assignments", error);
        return [];
    }
}

export async function submitInventoryAssignmentDecision(
    id: string,
    payload: {
        decision: InventoryAssignmentDecision;
        conditionRating?: InventoryConditionRating;
        conditionDetails?: string;
        notes: string;
    }
): Promise<InventoryAssignment> {
    const response = await api.patch<any>(`/api/my-inventory/assignments/${id}/decision`, {
        decision: payload.decision,
        condition_rating: payload.conditionRating,
        condition_details: payload.conditionDetails,
        notes: payload.notes,
    });
    if (!response.success) {
        throw new Error((response.error as any)?.message || response.error?.error || "Failed to submit decision");
    }
    return mapAssignment(response.data.data);
}

export async function initiateInventoryAssignment(
    itemId: string,
    payload: { assigneeId: string; notes?: string }
): Promise<InventoryAssignment> {
    const response = await api.post<any>(`/api/admin/inventory/${itemId}/assignments`, {
        assignee_id: payload.assigneeId,
        notes: payload.notes,
    });
    if (!response.success) {
        throw new Error((response.error as any)?.message || response.error?.error || "Failed to initiate assignment");
    }
    return mapAssignment(response.data.data);
}

export async function getInventoryOfficerQueue(): Promise<InventoryAssignment[]> {
    try {
        const response = await api.get<any>("/api/admin/inventory/assignments/officer-queue");
        if (!response.success) throw new Error("Failed to fetch officer queue");
        return (response.data.data || []).map(mapAssignment);
    } catch (error) {
        console.error("Error fetching officer queue", error);
        return [];
    }
}

export async function getInventoryComplianceQueue(): Promise<InventoryAssignment[]> {
    try {
        const response = await api.get<any>("/api/admin/inventory/assignments/compliance-queue");
        if (!response.success) throw new Error("Failed to fetch compliance queue");
        return (response.data.data || []).map(mapAssignment);
    } catch (error) {
        console.error("Error fetching compliance queue", error);
        return [];
    }
}

export async function submitInventoryOfficerDecision(
    id: string,
    payload: { decision: InventoryAssignmentDecision; notes?: string }
): Promise<InventoryAssignment> {
    const response = await api.patch<any>(`/api/admin/inventory/assignments/${id}/officer-decision`, {
        decision: payload.decision,
        notes: payload.notes,
    });
    if (!response.success) {
        throw new Error((response.error as any)?.message || response.error?.error || "Failed to submit officer decision");
    }
    return mapAssignment(response.data.data);
}

export async function submitInventoryComplianceDecision(
    id: string,
    payload: { decision: InventoryAssignmentDecision; notes?: string }
): Promise<InventoryAssignment> {
    const response = await api.patch<any>(`/api/admin/inventory/assignments/${id}/compliance-decision`, {
        decision: payload.decision,
        notes: payload.notes,
    });
    if (!response.success) {
        throw new Error((response.error as any)?.message || response.error?.error || "Failed to submit compliance decision");
    }
    return mapAssignment(response.data.data);
}

export async function getInventoryItemAssignments(itemId: string): Promise<InventoryAssignment[]> {
    try {
        const response = await api.get<any>(`/api/admin/inventory/${itemId}/assignments`);
        if (!response.success) throw new Error("Failed to fetch item assignments");
        return (response.data.data || []).map(mapAssignment);
    } catch (error) {
        console.error("Error fetching item assignments", error);
        return [];
    }
}

