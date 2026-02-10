"use server";

import { PaginatedResponse } from "./types";
import { shouldMock } from "./client";

// ============================================================================
// Types
// ============================================================================

export type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    stock: number;
    price: string;
    status: InventoryStatus;
    minStock: number;
}

export interface InventoryStats {
    totalItems: number;
    lowStock: number;
    totalValue: string;
    outOfStock: number;
}

export interface InventoryFilters {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: InventoryStatus;
}

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
    if (shouldMock("useMockInventory")) {
        const inventory = await getMockInventory();
        let filtered = [...inventory];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (i) =>
                    i.name.toLowerCase().includes(search) ||
                    i.sku.toLowerCase().includes(search) ||
                    i.category.toLowerCase().includes(search)
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

    return { items: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
}

export async function getInventoryStats(): Promise<InventoryStats> {
    if (shouldMock("useMockInventory")) {
        const inventory = await getMockInventory();

        const totalItems = inventory.reduce((acc, item) => acc + item.stock, 0);
        const lowStock = inventory.filter(i => i.status === "Low Stock").length;
        const outOfStock = inventory.filter(i => i.status === "Out of Stock").length;

        // Calculate total value
        const totalValue = inventory.reduce((acc, item) => {
            const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
            return acc + (price * item.stock);
        }, 0);

        return {
            totalItems,
            lowStock,
            outOfStock,
            totalValue: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalValue)
        }
    }

    return {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: "₦0.00"
    }
}
