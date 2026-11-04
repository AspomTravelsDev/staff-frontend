"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
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
  correction?: string;
  onCorrectionChange?: (value: string | null) => void;
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
  correction,
  onCorrectionChange,
}: ComplianceFiltersProps) {
  const parseParamDate = (val: string | undefined) => {
    if (!val) return undefined;
    const d = parseISO(val);
    return isValid(d) ? d : undefined;
  };

  const hasFilters = search || status || severity || dateFrom || dateTo || correction;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by type, staff, or department..."
          aria-label="Search compliance queries"
          className="h-9 pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {onCorrectionChange && <div className="w-[180px]"><Select value={correction || "all"} onValueChange={value => onCorrectionChange(value === "all" ? null : value)}><SelectTrigger className="h-9" aria-label="Correction follow-up"><SelectValue placeholder="Corrections" /></SelectTrigger><SelectContent><SelectItem value="all">All corrections</SelectItem><SelectItem value="pending">Pending corrections</SelectItem><SelectItem value="overdue">Overdue corrections</SelectItem><SelectItem value="completed">Completed corrections</SelectItem></SelectContent></Select></div>}
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
