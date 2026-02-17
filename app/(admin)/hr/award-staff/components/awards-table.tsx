"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Award } from "@/lib/api/awards";

interface AwardsTableProps {
  awards: Award[];
}

export function AwardsTable({ awards }: AwardsTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Award Type</TableHead>
            <TableHead>Date Awarded</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Awarded By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {awards.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No awards found.
              </TableCell>
            </TableRow>
          ) : (
            awards.map((award) => (
              <TableRow key={award.id}>
                <TableCell className="font-medium">
                  {award.user ? award.user.name : "Unknown User"}
                </TableCell>
                <TableCell>{award.user?.department || "N/A"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                  >
                    {award.award_name}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(award.awarded_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell
                  className="max-w-[300px] truncate"
                  title={award.description || ""}
                >
                  {award.description || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {award.awarded_by.name}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
