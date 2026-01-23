import type { LeaveEntry } from "../queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaveTableProps {
  entries: LeaveEntry[];
}

export function LeaveTable({ entries }: LeaveTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{entry.type}</TableCell>
            <TableCell>{entry.days}</TableCell>
            <TableCell>{entry.startDate}</TableCell>
            <TableCell>{entry.endDate}</TableCell>
            <TableCell>{entry.reason}</TableCell>
            <TableCell>{entry.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
