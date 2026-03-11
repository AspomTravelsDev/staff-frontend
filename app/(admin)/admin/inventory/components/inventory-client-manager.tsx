"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InventoryItem } from "@/lib/api/inventory";
import { Employee } from "@/lib/api/employees";
import { InventoryFilters } from "./inventory-filters";
import { InventoryTable } from "./inventory-table";

interface InventoryClientManagerProps {
  initialItems: InventoryItem[];
  employees: Employee[];
  serverFilters: {
    category: string;
    status: string;
    condition: string;
  };
}

export function InventoryClientManager({
  initialItems,
  employees,
  serverFilters,
}: InventoryClientManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState<string>("");

  const handleServerFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // We no longer track search in the URL
    params.delete("search");

    if (value && value !== "all") {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.set("page", "1"); // Reset pagination on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch("");
    router.push(pathname);
  };

  const filteredItems = useMemo(() => {
    if (!search?.trim()) return initialItems;

    const searchTerm = search.toLowerCase().trim();
    return initialItems.filter((item) => {
      // Search covers device model names and serial numbers
      const matchesName = item.name.toLowerCase().includes(searchTerm);
      const matchesSerial = item.serialNumber
        .toLowerCase()
        .includes(searchTerm);

      return matchesName || matchesSerial;
    });
  }, [initialItems, search]);

  return (
    <div className="space-y-4">
      <InventoryFilters
        search={search}
        onSearchChange={setSearch}
        category={serverFilters.category}
        onCategoryChange={(val) => handleServerFilterChange("category", val)}
        status={serverFilters.status}
        onStatusChange={(val) => handleServerFilterChange("status", val)}
        condition={serverFilters.condition}
        onConditionChange={(val) =>
          handleServerFilterChange("condition_rating", val)
        }
        onClear={handleClear}
      />
      <InventoryTable items={filteredItems} employees={employees} />
    </div>
  );
}
