"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { LeaveEntry } from "../queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaveDetailsSheet } from "./leave-details-sheet";

interface LeaveTableProps {
  entries: LeaveEntry[];
}

export function LeaveTable({ entries }: LeaveTableProps) {
  const [selectedLeave, setSelectedLeave] = useState<LeaveEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const types = useMemo(() => [...new Set(entries.map((item) => item.type))].sort(), [entries]);
  const filtered = useMemo(() => entries.filter((item) =>
    (status === "all" || item.status.toLowerCase() === status.toLowerCase()) &&
    (type === "all" || item.type === type) &&
    (!search || `${item.type} ${item.reason} ${item.status}`.toLowerCase().includes(search.toLowerCase()))
  ), [entries, search, status, type]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <div className="relative col-span-2 sm:min-w-56 sm:flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input aria-label="Search leave history" placeholder="Search leave history…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 pl-9" />
        </div>
        <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
          <SelectTrigger aria-label="Filter leave history by status" className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{["Pending", "Approved", "Rejected", "Cancelled"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}>
          <SelectTrigger aria-label="Filter leave history by type" className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All leave types</SelectItem>{types.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div id="tour-leave-table" className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="hidden md:table-cell">Reason</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {entries.length === 0 ? "No leave requests found." : "No requests match these filters."}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setSelectedLeave(entry);
                    setOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{entry.type}</TableCell>
                  <TableCell>{entry.days}</TableCell>
                  <TableCell>{entry.startDate}</TableCell>
                  <TableCell>{entry.endDate}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {entry.reason}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(entry.status)}`}>
                      {entry.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
        <span>{filtered.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length}` : "0 results"}</span>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
            <SelectTrigger aria-label="Rows per page" className="h-8 w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 20, 50].map((v) => <SelectItem key={v} value={String(v)}>{v} / page</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="size-8" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4" /></Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="outline" size="icon" className="size-8" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      </div>

      <LeaveDetailsSheet
        leave={selectedLeave}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
