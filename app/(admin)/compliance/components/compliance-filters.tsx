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
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO, isValid } from "date-fns";

interface ComplianceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status?: string;
  onStatusChange: (value: string | null) => void;
  severity?: string;
  onSeverityChange: (value: string | null) => void;
  dateFrom?: string;
  onDateFromChange: (value: string | null) => void;
  dateTo?: string;
  onDateToChange: (value: string | null) => void;
  onClear: () => void;
}

export function ComplianceFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  severity,
  onSeverityChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClear,
}: ComplianceFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Handle debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, search]);

  const parseParamDate = (val: string | undefined) => {
    if (!val) return undefined;
    const d = parseISO(val);
    return isValid(d) ? d : undefined;
  };

  const hasFilters = search || status || severity || dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search by type, staff, or department..."
          className="h-9"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="w-[150px]">
          <Select
            value={status || "all"}
            onValueChange={(v) => onStatusChange(v === "all" ? null : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select
            value={severity || "all"}
            onValueChange={(v) => onSeverityChange(v === "all" ? null : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <DatePicker
            placeholder="From Date"
            value={parseParamDate(dateFrom)}
            onChange={(d) => onDateFromChange(d ? d.toISOString().split("T")[0] : null)}
            className="h-9"
          />
        </div>

        <div className="w-[150px]">
          <DatePicker
            placeholder="To Date"
            value={parseParamDate(dateTo)}
            onChange={(d) => onDateToChange(d ? d.toISOString().split("T")[0] : null)}
            className="h-9"
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            onClick={onClear}
            className="h-9 px-2 lg:px-3 text-red-500 hover:text-red-700"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
