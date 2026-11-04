"use server";

import { runAction } from "./run-action";
import { ExpectedActionError, type ActionResult } from "./action-result";

import { PaginatedResponse } from "./types";
import { api, type ApiResponse } from "./client";

// ============================================================================
// Types
// ============================================================================

export type InventoryStatus = "Storage" | "Assigned" | "Repairs";
export type InventoryConditionRating = "Excellent" | "Good" | "Fair" | "Poor" | "Broken";

export type GadgetChecklist = {
    screen: string;
    charger: string;
    buttons: string;
    battery: string;
    ports: string;
    cameraMic: string;
    overall: string;
};

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
    assetTag?: string;
    assetType?: "Laptop" | "Laptop charger" | "Phone" | "Phone charger" | "SIM card" | "Other";
    parentAssetId?: string;
    status: InventoryStatus;
    conditionRating: InventoryConditionRating;
    conditionDetails?: string;
    defaultChecklist?: GadgetChecklist;
    assignedTo?: string;            // Only present if status is "Assigned"
    technicianDetails?: TechnicianDetails; // Only present if status is "Repairs"
    createdAt?: string;
    updatedAt?: string;
    history?: InventoryHistory[];
    openAssignment?: InventoryAssignment | null;
    currentAssignment?: InventoryAssignment | null;
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
    | "return_pending_staff"
    | "return_pending_inspection"
    | "return_pending_compliance"
    | "completed"
    | "cleared"
    | "cancelled";

export type InventoryAssignmentType = "assignment" | "single_return" | "full_clearance";

export type InventoryAssignmentDecision = "approved" | "rejected";

export interface InventoryAssignmentUser {
    id: string;
    name: string;
    role?: string;
    department?: string;
    phone?: string | null;
    mobile_phone?: string | null;
}

export interface InventoryAssignment {
    id: string;
    inventoryItemId: string;
    type?: InventoryAssignmentType;
    clearanceBatchId?: string;
    issueBatchId?: string;
    assetSnapshot?: InventoryItem;
    status: InventoryAssignmentStatus;
    initiateNotes?: string;
    staffConditionRating?: InventoryConditionRating;
    staffConditionDetails?: string;
    staffNotes?: string;
    staffDecision?: InventoryAssignmentDecision;
    staffDecidedAt?: string;
    returnConditionRating?: InventoryConditionRating | "Broken" | "Lost";
    returnConditionDetails?: string;
    damageAssessmentFee?: number;
    officerNotes?: string;
    officerDecision?: InventoryAssignmentDecision;
    officerDecidedAt?: string;
    complianceNotes?: string;
    complianceDecision?: InventoryAssignmentDecision;
    complianceDecidedAt?: string;
    adminChecklist?: GadgetChecklist;
    staffChecklist?: GadgetChecklist;
    returnChecklist?: GadgetChecklist;
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
): Promise<ActionResult<PaginatedResponse<InventoryItem>>> {
    return runAction(async (): Promise<PaginatedResponse<InventoryItem>> => {

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
                throw new ExpectedActionError(response.error?.error || "Failed to fetch inventory", response.error.code);
            }

            return {
                items: response.data.items.map((item: any) => ({
                    id: item.id.toString(),
                    name: item.name,
                    category: item.category,
                    serialNumber: item.serial_number ?? "",
                assetTag: item.asset_tag,
                assetType: item.asset_type,
                parentAssetId: item.parent_asset_id?.toString(),
                    status: item.status,
                    conditionRating: item.condition_rating,
                    conditionDetails: item.condition_details,
                    defaultChecklist: item.default_checklist,
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
            throw error;
        }
    }, "getInventory");
}

export async function getInventoryStats(
    filters: InventoryFilters = {}
): Promise<ActionResult<InventoryStats>> {
    return runAction(async (): Promise<InventoryStats> => {


        try {
            const queryParams = new URLSearchParams();
            if (filters.category) queryParams.set("category", filters.category);
            if (filters.status) queryParams.set("status", filters.status);
            if (filters.conditionRating) queryParams.set("condition_rating", filters.conditionRating);

            const response = await api.get<any>(`/api/admin/inventory/stats?${queryParams.toString()}`);

            if (!response.success) {
                throw new ExpectedActionError(response.error?.error || "Failed to fetch stats", response.error.code);
            }

            return {
                totalDevices: response.data.totalDevices || 0,
                inStorage: response.data.inStorage || 0,
                assigned: response.data.assigned || 0,
                inRepairs: response.data.inRepairs || 0,
            };
        } catch (error) {
            console.error("Error fetching inventory stats:", error);
            throw error;
        }
    }, "getInventoryStats");
}

export async function createInventoryItem(payload: InventoryItemPayload): Promise<ActionResult<InventoryItem>> {
    return runAction(async (): Promise<InventoryItem> => {
        try {
            const response = await api.post<any>("/api/admin/inventory", {
                name: payload.name,
                category: payload.category,
                serial_number: payload.serialNumber === undefined ? undefined : payload.serialNumber.trim() || null,
                asset_type: payload.assetType,
                parent_asset_id: payload.parentAssetId === undefined ? undefined : payload.parentAssetId || null,
                status: payload.status,
                condition_rating: payload.conditionRating,
                condition_details: payload.conditionDetails,
                default_checklist: payload.defaultChecklist,
                notes: payload.notes,
                assigned_to: payload.assignedTo,
                technician_details: payload.technicianDetails,
            });

            if (!response.success) {
                throw new ExpectedActionError(response.error?.error || "Failed to create inventory item", response.error.code);
            }

            const item = response.data;
            return {
                id: item.id.toString(),
                name: item.name,
                category: item.category,
                serialNumber: item.serial_number ?? "",
                assetTag: item.asset_tag,
                assetType: item.asset_type,
                parentAssetId: item.parent_asset_id?.toString(),
                status: item.status,
                conditionRating: item.condition_rating,
                conditionDetails: item.condition_details,
                defaultChecklist: item.default_checklist,
                assignedTo: item.assigned_to,
                technicianDetails: item.technician_details,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            };
        } catch (error) {
            console.error("Error creating inventory item", error);
            throw error;
        }
    }, "createInventoryItem");
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItemPayload>): Promise<ActionResult<InventoryItem>> {
    return runAction(async (): Promise<InventoryItem> => {

        try {
            const response = await api.patch<any>(`/api/admin/inventory/${id}`, {
                name: payload.name,
                category: payload.category,
                serial_number: payload.serialNumber === undefined ? undefined : payload.serialNumber.trim() || null,
                asset_type: payload.assetType,
                parent_asset_id: payload.parentAssetId === undefined ? undefined : payload.parentAssetId || null,
                status: payload.status,
                condition_rating: payload.conditionRating,
                condition_details: payload.conditionDetails,
                default_checklist: payload.defaultChecklist,
                notes: payload.notes,
                assigned_to: payload.assignedTo,
                technician_details: payload.technicianDetails,
            });

            if (!response.success) {
                throw new ExpectedActionError(response.error?.error || "Failed to update inventory item", response.error.code);
            }

            const item = response.data;
            return {
                id: item.id.toString(),
                name: item.name,
                category: item.category,
                serialNumber: item.serial_number ?? "",
                assetTag: item.asset_tag,
                assetType: item.asset_type,
                parentAssetId: item.parent_asset_id?.toString(),
                status: item.status,
                conditionRating: item.condition_rating,
                conditionDetails: item.condition_details,
                defaultChecklist: item.default_checklist,
                assignedTo: item.assigned_to,
                technicianDetails: item.technician_details,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            };
        } catch (error) {
            console.error(`Error updating inventory item ${id}`, error);
            throw error;
        }
    }, "updateInventoryItem");
}

export async function deleteInventoryItem(id: string): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {

        try {
            const response = await api.delete<any>(`/api/admin/inventory/${id}`);

            if (!response.success) {
                throw new ExpectedActionError(response.error?.error || "Failed to delete inventory item", response.error.code);
            }
        } catch (error) {
            console.error(`Error deleting inventory item ${id}`, error);
            throw error;
        }
    }, "deleteInventoryItem");
}

export async function getInventoryHistory(id: string): Promise<ActionResult<PaginatedResponse<InventoryHistory>>> {
    return runAction(async (): Promise<PaginatedResponse<InventoryHistory>> => {
        try {
            const response = await api.get<any>(`/api/admin/inventory/${id}/history`);
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to fetch history", response.error.code);

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
            throw error;
        }
    }, "getInventoryHistory");
}

export async function logInventoryInspection(id: string, payload: { conditionRating: InventoryConditionRating, conditionDetails?: string, notes?: string }): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        try {
            const response = await api.post<any>(`/api/admin/inventory/${id}/inspect`, {
                condition_rating: payload.conditionRating,
                condition_details: payload.conditionDetails,
                notes: payload.notes,
            });
            if (!response.success) {
                throw new ExpectedActionError(response.error?.error || "Failed to log inspection", response.error.code);
            }
        } catch (error) {
            console.error("Error logging inspection", error);
            throw error;
        }
    }, "logInventoryInspection");
}

export async function getMyInventory(): Promise<ActionResult<InventoryItem[]>> {
    return runAction(async (): Promise<InventoryItem[]> => {
        try {
            const response = await api.get<any>("/api/my-inventory");
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to fetch personal inventory", response.error.code);

            return response.data.map((item: any) => ({
                id: item.id.toString(),
                name: item.name,
                category: item.category,
                serialNumber: item.serial_number ?? "",
                assetTag: item.asset_tag,
                assetType: item.asset_type,
                parentAssetId: item.parent_asset_id?.toString(),
                status: item.status,
                conditionRating: item.condition_rating,
                conditionDetails: item.condition_details,
                defaultChecklist: item.default_checklist,
                assignedTo: item.assigned_to,
                technicianDetails: item.technician_details,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                openAssignment: mapOpenAssignment(item.open_assignment),
            }));
        } catch (error) {
            console.error("Error fetching my inventory", error);
            throw error;
        }
    }, "getMyInventory");
}

export async function updateMyInventory(id: string, payload: { status?: InventoryStatus, conditionRating?: InventoryConditionRating, conditionDetails?: string, notes: string }): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        try {
            const response = await api.patch<any>(`/api/my-inventory/${id}`, {
                status: payload.status,
                condition_rating: payload.conditionRating,
                condition_details: payload.conditionDetails,
                notes: payload.notes,
            });
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to update asset status", response.error.code);
        } catch (error) {
            console.error("Error updating my inventory", error);
            throw error;
        }
    }, "updateMyInventory");
}

export async function getMyInventoryHistory(
    id: string,
    params?: { page?: number; limit?: number }
): Promise<ActionResult<PaginatedResponse<InventoryHistory>>> {
    return runAction(async (): Promise<PaginatedResponse<InventoryHistory>> => {
        try {
            const query = new URLSearchParams();
            if (params?.page) query.append("page", params.page.toString());
            if (params?.limit) query.append("limit", params.limit.toString());

            const response = await api.get<any>(`/api/my-inventory/${id}/history?${query}`);

            if (!response.success) {
                throw new ExpectedActionError(response.error?.error || "Failed to fetch inventory history", response.error.code);
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
            throw error;
        }
    }, "getMyInventoryHistory");
}

// ============================================================================
// Assignment acknowledgement mappers & API
// ============================================================================

function mapAssignment(a: any): InventoryAssignment {
    return {
        id: a.id.toString(),
        inventoryItemId: a.inventory_item_id?.toString(),
        type: a.type ?? "assignment",
        clearanceBatchId: a.clearance_batch_id ?? undefined,
        issueBatchId: a.issue_batch_id ?? undefined,
        assetSnapshot: a.asset_snapshot ? {
            id: String(a.asset_snapshot.id), name: a.asset_snapshot.name,
            category: a.asset_snapshot.category, serialNumber: a.asset_snapshot.serial_number ?? "",
            assetType: a.asset_snapshot.asset_type, assetTag: a.asset_snapshot.asset_tag,
            parentAssetId: a.asset_snapshot.parent_asset_id?.toString(),
            conditionRating: a.asset_snapshot.condition_rating, conditionDetails: a.asset_snapshot.condition_details,
            status: "Storage",
        } : undefined,
        status: a.status,
        initiateNotes: a.initiate_notes ?? undefined,
        staffConditionRating: a.staff_condition_rating ?? undefined,
        staffConditionDetails: a.staff_condition_details ?? undefined,
        staffNotes: a.staff_notes ?? undefined,
        staffDecision: a.staff_decision ?? undefined,
        staffDecidedAt: a.staff_decided_at ?? undefined,
        returnConditionRating: a.return_condition_rating ?? undefined,
        returnConditionDetails: a.return_condition_details ?? undefined,
        damageAssessmentFee: a.damage_assessment_fee ? parseFloat(a.damage_assessment_fee) : 0,
        officerNotes: a.officer_notes ?? undefined,
        officerDecision: a.officer_decision ?? undefined,
        officerDecidedAt: a.officer_decided_at ?? undefined,
        complianceNotes: a.compliance_notes ?? undefined,
        complianceDecision: a.compliance_decision ?? undefined,
        complianceDecidedAt: a.compliance_decided_at ?? undefined,
        adminChecklist: a.admin_checklist ?? a.checklist ?? undefined,
        staffChecklist: a.staff_checklist ?? undefined,
        returnChecklist: a.return_checklist ?? undefined,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        inventoryItem: a.inventory_item
            ? {
                  id: a.inventory_item.id.toString(),
                  name: a.inventory_item.name,
                  category: a.inventory_item.category,
                  serialNumber: a.inventory_item.serial_number ?? "",
                  assetTag: a.inventory_item.asset_tag,
                  assetType: a.inventory_item.asset_type,
                  parentAssetId: a.inventory_item.parent_asset_id?.toString(),
                  status: a.inventory_item.status,
                  conditionRating: a.inventory_item.condition_rating,
                  conditionDetails: a.inventory_item.condition_details,
                  defaultChecklist: a.inventory_item.default_checklist ?? undefined,
                  assignedTo: a.inventory_item.assigned_to,
              }
            : undefined,
        assignee: a.assignee
            ? {
                  id: a.assignee.id,
                  name: a.assignee.name,
                  role: a.assignee.role,
                  department: a.assignee.department,
                  phone: a.assignee.phone ?? null,
                  mobile_phone: a.assignee.mobile_phone ?? null,
              }
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

export async function getMyInventoryAssignments(pendingOnly = false): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async (): Promise<InventoryAssignment[]> => {
        try {
            const query = pendingOnly ? "?pending_only=1" : "";
            const response = await api.get<any>(`/api/my-inventory/assignments${query}`);
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to fetch assignments", response.error.code);
            return (response.data.data || []).map(mapAssignment);
        } catch (error) {
            console.error("Error fetching my inventory assignments", error);
            throw error;
        }
    }, "getMyInventoryAssignments");
}

export async function submitInventoryAssignmentDecision(
    id: string,
    payload: {
        decision: InventoryAssignmentDecision;
        conditionRating?: InventoryConditionRating;
        conditionDetails?: string;
        notes?: string;
        staffChecklist?: GadgetChecklist;
    }
): Promise<ActionResult<InventoryAssignment>> {
    return runAction(async (): Promise<InventoryAssignment> => {
        const response = await api.patch<any>(`/api/my-inventory/assignments/${id}/decision`, {
            decision: payload.decision,
            condition_rating: payload.conditionRating,
            condition_details: payload.conditionDetails,
            notes: payload.notes,
            staff_checklist: payload.staffChecklist,
        });
        if (!response.success) {
            throw new ExpectedActionError((response.error as any)?.message || response.error?.error || "Failed to submit decision", response.error.code);
        }
        return mapAssignment(response.data.data);
    }, "submitInventoryAssignmentDecision");
}

export async function initiateInventoryAssignment(
    itemId: string,
    payload: { assigneeId: string; notes?: string; adminChecklist?: GadgetChecklist }
): Promise<ActionResult<InventoryAssignment>> {
    return runAction(async (): Promise<InventoryAssignment> => {
        const response = await api.post<any>(`/api/admin/inventory/${itemId}/assignments`, {
            assignee_id: payload.assigneeId,
            notes: payload.notes,
            admin_checklist: payload.adminChecklist,
        });
        if (!response.success) {
            throw new ExpectedActionError((response.error as any)?.message || response.error?.error || "Failed to initiate assignment", response.error.code);
        }
        return mapAssignment(response.data.data);
    }, "initiateInventoryAssignment");
}

export async function getInventoryOfficerQueue(includeWaiting = false): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async (): Promise<InventoryAssignment[]> => {
        try {
            const response = await api.get<any>(`/api/admin/inventory/assignments/officer-queue${includeWaiting ? "?include_waiting=1" : ""}`);
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to fetch officer queue", response.error.code);
            return (response.data.data || []).map(mapAssignment);
        } catch (error) {
            console.error("Error fetching officer queue", error);
            throw error;
        }
    }, "getInventoryOfficerQueue");
}

export async function getInventoryComplianceQueue(includeWaiting = false): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async (): Promise<InventoryAssignment[]> => {
        try {
            const response = await api.get<any>(`/api/admin/inventory/assignments/compliance-queue${includeWaiting ? "?include_waiting=1" : ""}`);
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to fetch compliance queue", response.error.code);
            return (response.data.data || []).map(mapAssignment);
        } catch (error) {
            console.error("Error fetching compliance queue", error);
            throw error;
        }
    }, "getInventoryComplianceQueue");
}

export async function submitInventoryOfficerDecision(
    id: string,
    payload: { decision: InventoryAssignmentDecision; notes?: string; checklist?: Record<string, string>; adminChecklist?: GadgetChecklist }
): Promise<ActionResult<InventoryAssignment>> {
    return runAction(async (): Promise<InventoryAssignment> => {
        const response = await api.patch<any>(`/api/admin/inventory/assignments/${id}/officer-decision`, {
            decision: payload.decision,
            notes: payload.notes,
            checklist: payload.checklist,
            admin_checklist: payload.adminChecklist,
        });
        if (!response.success) {
            throw new ExpectedActionError((response.error as any)?.message || response.error?.error || "Failed to submit officer decision", response.error.code);
        }
        return mapAssignment(response.data.data);
    }, "submitInventoryOfficerDecision");
}

export async function submitInventoryComplianceDecision(
    id: string,
    payload: { decision: InventoryAssignmentDecision; notes?: string; sendBackTo?: "staff" | "admin_it" }
): Promise<ActionResult<InventoryAssignment>> {
    return runAction(async (): Promise<InventoryAssignment> => {
        const response = await api.patch<any>(`/api/admin/inventory/assignments/${id}/compliance-decision`, {
            decision: payload.decision,
            notes: payload.notes,
            send_back_to: payload.sendBackTo,
        });
        if (!response.success) {
            throw new ExpectedActionError((response.error as any)?.message || response.error?.error || "Failed to submit compliance decision", response.error.code);
        }
        return mapAssignment(response.data.data);
    }, "submitInventoryComplianceDecision");
}

export async function getInventoryItemAssignments(itemId: string): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async (): Promise<InventoryAssignment[]> => {
        try {
            const response = await api.get<any>(`/api/admin/inventory/${itemId}/assignments`);
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to fetch item assignments", response.error.code);
            return (response.data.data || []).map(mapAssignment);
        } catch (error) {
            console.error("Error fetching item assignments", error);
            throw error;
        }
    }, "getInventoryItemAssignments");
}

export async function initiateSingleReturn(
    itemId: string,
    notes?: string,
    conditionRating?: InventoryConditionRating | "Broken",
    conditionDetails?: string
): Promise<ActionResult<InventoryAssignment>> {
    return runAction(async (): Promise<InventoryAssignment> => {
        const response = await api.post<any>(`/api/my-inventory/assignments/${itemId}/return`, {
            notes,
            condition_rating: conditionRating,
            condition_details: conditionDetails,
        });
        if (!response.success) {
            throw new ExpectedActionError((response.error as any)?.message || response.error?.error || "Failed to initiate device return", response.error.code);
        }
        return mapAssignment(response.data.data);
    }, "initiateSingleReturn");
}

export async function initiateFullClearance(
    assigneeId: string,
    notes?: string
): Promise<ActionResult<ApiResponse<InventoryAssignment[]>>> {
    return runAction(async (): Promise<ApiResponse<InventoryAssignment[]>> => {
        try {
            const response = await api.post<{ data?: unknown[] }>("/api/admin/inventory/clearance/full", {
                assignee_id: assigneeId,
                notes,
            });
            if (!response.success) {
                // Older backends return only the message for this expected outcome.
                const noDevices = response.error.code === "NO_ASSIGNED_DEVICES"
                    || (response.error.code === "HTTP_422" && response.error.error.toLowerCase().includes("no assigned devices"));
                return {
                    success: false,
                    error: {
                        code: noDevices ? "NO_ASSIGNED_DEVICES" : response.error.code,
                        error: response.error.error || "Failed to initiate full clearance",
                    },
                };
            }
            return { success: true, data: (response.data.data || []).map(mapAssignment) };
        } catch (error) {
            console.error("Full clearance error:", error);
            return {
                success: false,
                error: { code: "CLEARANCE_FAILED", error: "Could not start device clearance. Please try again from Inventory." },
            };
        }
    }, "initiateFullClearance");
}

export async function getClearanceOfficerQueue(): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async (): Promise<InventoryAssignment[]> => {
        try {
            const response = await api.get<any>("/api/admin/inventory/clearance/officer-queue");
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to fetch clearance officer queue", response.error.code);
            return (response.data.data || []).map(mapAssignment);
        } catch (error) {
            console.error("Error fetching clearance officer queue", error);
            throw error;
        }
    }, "getClearanceOfficerQueue");
}

export async function inspectClearanceReturn(
    id: string,
    payload: {
        decision: InventoryAssignmentDecision;
        returnConditionRating: string;
        returnConditionDetails?: string;
        damageAssessmentFee?: number;
        notes?: string;
        returnChecklist?: GadgetChecklist;
    }
): Promise<ActionResult<InventoryAssignment>> {
    return runAction(async (): Promise<InventoryAssignment> => {
        const response = await api.patch<any>(`/api/admin/inventory/clearance/${id}/inspect`, {
            decision: payload.decision,
            return_condition_rating: payload.returnConditionRating,
            return_condition_details: payload.returnConditionDetails,
            damage_assessment_fee: payload.damageAssessmentFee ?? 0,
            notes: payload.notes,
            return_checklist: payload.returnChecklist,
        });
        if (!response.success) {
            throw new ExpectedActionError((response.error as any)?.message || response.error?.error || "Failed to submit clearance inspection", response.error.code);
        }
        return mapAssignment(response.data.data);
    }, "inspectClearanceReturn");
}

export async function getClearanceComplianceQueue(): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async (): Promise<InventoryAssignment[]> => {
        try {
            const response = await api.get<any>("/api/admin/inventory/clearance/compliance-queue");
            if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to fetch clearance compliance queue", response.error.code);
            return (response.data.data || []).map(mapAssignment);
        } catch (error) {
            console.error("Error fetching clearance compliance queue", error);
            throw error;
        }
    }, "getClearanceComplianceQueue");
}

export async function approveClearanceCompliance(
    id: string,
    payload: { decision: InventoryAssignmentDecision; sendBackTo?: "staff" | "it"; notes?: string }
): Promise<ActionResult<InventoryAssignment>> {
    return runAction(async (): Promise<InventoryAssignment> => {
        const response = await api.patch<any>(`/api/admin/inventory/clearance/${id}/compliance-decision`, {
            decision: payload.decision,
            send_back_to: payload.sendBackTo,
            notes: payload.notes,
        });
        if (!response.success) {
            throw new ExpectedActionError((response.error as any)?.message || response.error?.error || "Failed to approve clearance compliance", response.error.code);
        }
        return mapAssignment(response.data.data);
    }, "approveClearanceCompliance");
}

export interface ClearanceHandoverItemDeclaration {
    assignmentId: string;
    conditionRating: InventoryConditionRating | "Broken";
    conditionDetails?: string;
    notes?: string;
    staffChecklist: GadgetChecklist;
}

export interface SubmitClearanceHandoverPayload {
    assignmentIds?: string[];
    assignmentId?: string;
    declarations?: ClearanceHandoverItemDeclaration[];
    conditionRating?: InventoryConditionRating | "Broken";
    conditionDetails?: string;
    notes?: string;
    handoverNotes?: string;
}

export async function submitClearanceHandover(
    payload: SubmitClearanceHandoverPayload
): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async (): Promise<InventoryAssignment[]> => {
        const response = await api.post<any>("/api/my-inventory/clearance/handover", {
            assignment_ids: payload.assignmentIds ? payload.assignmentIds.map((id) => Number(id)) : undefined,
            assignment_id: payload.assignmentId ? Number(payload.assignmentId) : undefined,
            declarations: payload.declarations?.map((d) => ({
                assignment_id: Number(d.assignmentId),
                condition_rating: d.conditionRating,
                condition_details: d.conditionDetails,
                notes: d.notes,
                staff_checklist: d.staffChecklist,
            })),
            condition_rating: payload.conditionRating,
            condition_details: payload.conditionDetails,
            notes: payload.notes,
            handover_notes: payload.handoverNotes,
        });
        if (!response.success) {
            throw new ExpectedActionError((response.error as any)?.message ||
                    response.error?.error ||
                    "Failed to submit clearance handover", response.error.code);
        }
        return (response.data.data || []).map(mapAssignment);
    }, "submitClearanceHandover");
}


export async function issueEquipment(payload: { assigneeId: string; items: { id: string; adminChecklist: GadgetChecklist }[]; notes?: string }): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async () => {
        const response = await api.post<{ data: unknown[] }>("/api/admin/equipment/issue", {
            assignee_id: payload.assigneeId, notes: payload.notes,
            items: payload.items.map((item) => ({ id: item.id, admin_checklist: item.adminChecklist })),
        });
        if (!response.success) throw new ExpectedActionError(response.error.error || "Could not issue equipment", response.error.code);
        return response.data.data.map(mapAssignment);
    }, "issueEquipment");
}

export async function acknowledgeEquipment(payload: { batchId: string; agreedToTerms: boolean; items: { id: string; conditionRating: InventoryConditionRating; conditionDetails: string; staffChecklist: GadgetChecklist }[] }): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async () => {
        const response = await api.post<{ data: unknown[] }>("/api/my-equipment/acknowledge", {
            batch_id: payload.batchId, agreed_to_terms: payload.agreedToTerms,
            items: payload.items.map((item) => ({ id: item.id, condition_rating: item.conditionRating, condition_details: item.conditionDetails, staff_checklist: item.staffChecklist })),
        });
        if (!response.success) throw new ExpectedActionError(response.error.error || "Could not acknowledge equipment", response.error.code);
        return response.data.data.map(mapAssignment);
    }, "acknowledgeEquipment");
}

export async function returnSelectedEquipment(assigneeId: string, itemIds: string[], notes?: string): Promise<ActionResult<InventoryAssignment[]>> {
    return runAction(async () => {
        const response = await api.post<{ data: unknown[] }>("/api/admin/equipment/return", { assignee_id: assigneeId, item_ids: itemIds, notes });
        if (!response.success) throw new ExpectedActionError(response.error.error || "Could not request return", response.error.code);
        return response.data.data.map(mapAssignment);
    }, "returnSelectedEquipment");
}

export async function getEmployeeEquipment(assigneeId: string): Promise<ActionResult<InventoryItem[]>> {
    return runAction(async () => {
        const response = await api.get<{ data: Record<string, unknown>[] }>(`/api/admin/equipment/${encodeURIComponent(assigneeId)}`);
        if (!response.success) throw new ExpectedActionError(response.error.error || "Could not load equipment", response.error.code);
        return response.data.data.map((item) => ({
            id: String(item.id), name: String(item.name), category: item.category as InventoryItem["category"],
            serialNumber: String(item.serial_number ?? ""), assetTag: item.asset_tag as string,
            assetType: item.asset_type as InventoryItem["assetType"], parentAssetId: item.parent_asset_id ? String(item.parent_asset_id) : undefined,
            status: item.status as InventoryStatus, conditionRating: item.condition_rating as InventoryConditionRating,
            conditionDetails: item.condition_details as string, defaultChecklist: item.default_checklist as GadgetChecklist,
            currentAssignment: item.current_issue ? mapAssignment(item.current_issue) : null,
            assignedTo: item.assigned_to as string, openAssignment: item.open_assignment ? mapAssignment(item.open_assignment) : null,
        }));
    }, "getEmployeeEquipment");
}
