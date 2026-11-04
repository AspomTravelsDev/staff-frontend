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
import { Search, X, SlidersHorizontal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/utils/export";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
    <div className="space-y-3">
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Search assets by model, serial number, or staff"
          placeholder="Search by model, serial, or staff..."
          className="pl-9"
          value={localSearch || ""}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
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

        <Popover>
          <PopoverTrigger asChild><Button variant="outline" className="h-9"><SlidersHorizontal className="mr-2 h-4 w-4" />More filters{(category !== "all" || condition !== "all") && ` (${Number(category !== "all") + Number(condition !== "all")})`}</Button></PopoverTrigger>
          <PopoverContent align="end" className="space-y-3 p-4">
            <div className="space-y-2"><p className="font-medium">Category</p>
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

            </div><div className="space-y-2"><p className="font-medium">Condition</p>
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

            </div>
          </PopoverContent>
        </Popover>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9"><Download className="mr-2 h-4 w-4" />Export</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={!items.length} onClick={() => exportToCSV(items, exportColumns, `Inventory_Export_${format(new Date(), "yyyy-MM-dd")}`)}>Export current results (CSV)</DropdownMenuItem>
            {onExportStaffFormClick && <DropdownMenuItem onClick={onExportStaffFormClick}>Staff equipment forms</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>{items.length} matching loaded assets</span>
      {category !== "all" && <Button variant="secondary" size="sm" onClick={() => onCategoryChange("all")} aria-label={`Remove category filter: ${category}`}>{category}<X className="ml-1 h-3 w-3" /></Button>}
      {condition !== "all" && <Button variant="secondary" size="sm" onClick={() => onConditionChange("all")} aria-label={`Remove condition filter: ${condition}`}>{condition}<X className="ml-1 h-3 w-3" /></Button>}
    </div>
    </div>
  );
}

