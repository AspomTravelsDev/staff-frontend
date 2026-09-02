"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableExportButton } from "@/components/ui/table-export-button";
import { InventoryItem } from "@/lib/api/inventory";
import { Employee } from "@/lib/api/employees";
import { format } from "date-fns";

interface InventoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  condition: string;
  onConditionChange: (value: string) => void;
  onClear: () => void;
  items?: InventoryItem[];
  employees?: Employee[];
  onExportStaffFormClick?: () => void;
}

export function InventoryFilters({
  search = "",
  onSearchChange,
  category = "all",
  onCategoryChange,
  status = "all",
  onStatusChange,
  condition = "all",
  onConditionChange,
  onClear,
  items = [],
  employees = [],
  onExportStaffFormClick,
}: InventoryFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Handle debounced search
  useEffect(() => {
    if (!onSearchChange) return;

    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, search]);

  const hasFilters =
    search || category !== "all" || status !== "all" || condition !== "all";

  const exportColumns = [
    { header: "Device Model", key: (item: InventoryItem) => item.name },
    { header: "Serial Number", key: (item: InventoryItem) => item.serialNumber },
    { header: "Category", key: (item: InventoryItem) => item.category },
    {
      header: "Condition",
      key: (item: InventoryItem) => item.conditionRating,
    },
    { header: "Status", key: (item: InventoryItem) => item.status },
    {
      header: "Assigned To",
      key: (item: InventoryItem) => {
        if (item.status !== "Assigned" || !item.assignedTo) return "-";
        const emp = employees.find((e) => e.id === item.assignedTo);
        return emp ? `${emp.firstName} ${emp.lastName}` : item.assignedTo;
      },
    },
    {
      header: "Technician Name",
      key: (item: InventoryItem) =>
        item.status === "Repairs" && item.technicianDetails
          ? item.technicianDetails.name
          : "-",
    },
    {
      header: "Technician Phone",
      key: (item: InventoryItem) =>
        item.status === "Repairs" && item.technicianDetails
          ? item.technicianDetails.phone
          : "-",
    },
    {
      header: "Technician Address",
      key: (item: InventoryItem) =>
        item.status === "Repairs" && item.technicianDetails
          ? item.technicianDetails.address
          : "-",
    },
  ];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by model, serial, or staff..."
          className="pl-9"
          value={localSearch || ""}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Laptop">Laptop</SelectItem>
            <SelectItem value="Phone">Phone</SelectItem>
            <SelectItem value="Gadget">Gadget</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Storage">Storage</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="Repairs">Repairs</SelectItem>
          </SelectContent>
        </Select>

        <Select value={condition} onValueChange={onConditionChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="Excellent">Excellent</SelectItem>
            <SelectItem value="Good">Good</SelectItem>
            <SelectItem value="Fair">Fair</SelectItem>
            <SelectItem value="Poor">Poor</SelectItem>
            <SelectItem value="Broken">Broken</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            onClick={onClear}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        {onExportStaffFormClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportStaffFormClick}
            className="h-9 gap-1.5"
          >
            <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>Download Asset Form</span>
          </Button>
        )}

        {items.length > 0 && (
          <TableExportButton
            data={items}
            columns={exportColumns}
            filename={`Inventory_Export_${format(new Date(), "yyyy-MM-dd")}`}
          />
        )}
      </div>
    </div>
  );
}

