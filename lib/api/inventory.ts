"use server";

import { PaginatedResponse } from "./types";
import { shouldMock, api } from "./client";

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
}

export type InventoryItemPayload = Omit<InventoryItem, "id" | "createdAt" | "updatedAt"> & { notes?: string };

// ============================================================================
// Mock Data Loader
// ============================================================================

const getMockInventory = async (): Promise<InventoryItem[]> => {
    if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/inventory.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock inventory data:", error);
            return [];
        }
    }
    return [];
};

// ============================================================================
// API Functions
// ============================================================================

export async function getInventory(
    filters: InventoryFilters = {}
): Promise<PaginatedResponse<InventoryItem>> {
    const isMock = shouldMock("useMockInventory");

    if (isMock) {
        const inventory = await getMockInventory();
        let filtered = [...inventory];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (i) =>
                    i.name.toLowerCase().includes(search) ||
                    i.serialNumber.toLowerCase().includes(search) ||
                    (i.assignedTo && i.assignedTo.toLowerCase().includes(search)) ||
                    (i.technicianDetails && i.technicianDetails.name.toLowerCase().includes(search))
            );
        }

        if (filters.status) {
            filtered = filtered.filter(i => i.status === filters.status);
        }

        if (filters.category) {
            filtered = filtered.filter(i => i.category === filters.category);
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const total = filtered.length;

        // Sort by name default
        filtered.sort((a, b) => a.name.localeCompare(b.name));

        return {
            items: filtered.slice((page - 1) * limit, page * limit),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    try {
        const queryParams = new URLSearchParams();
        if (filters.page) queryParams.set("page", filters.page.toString());
        if (filters.limit) queryParams.set("limit", filters.limit.toString());
        if (filters.search) queryParams.set("search", filters.search);
        if (filters.category) queryParams.set("category", filters.category);
        if (filters.status) queryParams.set("status", filters.status);

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

export async function getInventoryStats(): Promise<InventoryStats> {
    const isMock = shouldMock("useMockInventory");

    if (isMock) {
        const inventory = await getMockInventory();

        return {
            totalDevices: inventory.length,
            inStorage: inventory.filter(i => i.status === "Storage").length,
            assigned: inventory.filter(i => i.status === "Assigned").length,
            inRepairs: inventory.filter(i => i.status === "Repairs").length
        };
    }

    try {
        const response = await api.get<any>("/api/admin/inventory/stats");

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
    const isMock = shouldMock("useMockInventory");
    if (isMock) {
        throw new Error("Cannot create items in mock mode. Please connect to a live backend.");
    }

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
    const isMock = shouldMock("useMockInventory");
    if (isMock) {
        throw new Error("Cannot update items in mock mode. Please connect to a live backend.");
    }

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
    const isMock = shouldMock("useMockInventory");
    if (isMock) {
        throw new Error("Cannot delete items in mock mode. Please connect to a live backend.");
    }

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
