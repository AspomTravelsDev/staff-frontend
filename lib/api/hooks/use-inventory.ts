"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getInventory,
    getInventoryStats,
    type InventoryFilters,
} from "../inventory";

// ============================================================================
// Query Hooks
// ============================================================================

export function useInventory(filters: InventoryFilters = {}) {
    return useQuery({
        queryKey: queryKeys.inventory.list(filters),
        queryFn: () => getInventory(filters),
    });
}

export function useInventoryStats() {
    return useQuery({
        queryKey: queryKeys.inventory.stats(),
        queryFn: () => getInventoryStats(),
    });
}
