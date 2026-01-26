import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function ServiceDeskAdminPage() {
  // Mock Stats for Managers
  const stats = {
    pending: 12,
    approvedToday: 5,
    rejected: 2,
    totalProcessing: 18,
  };

  // Mock Request Data (Incoming Requests)
  const requests = [
    {
      id: "REQ-001",
      requester: "John Doe",
      department: "Sales",
      item: "MacBook Pro M3",
      date: "2024-01-23",
      status: "Pending",
    },
    {
      id: "REQ-002",
      requester: "Sarah Smith",
      department: "Marketing",
      item: "Adobe Creative Cloud",
      date: "2024-01-23",
      status: "Approved",
    },
    {
      id: "REQ-003",
      requester: "Mike Jones",
      department: "Visa",
      item: 'Monitor 27"',
      date: "2024-01-22",
      status: "Rejected",
    },
    {
      id: "REQ-004",
      requester: "Emily Chen",
      department: "Accounts",
      item: "Ergonomic Chair",
      date: "2024-01-22",
      status: "Pending",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gadget Requests</h1>
          <p className="text-muted-foreground">
            Manage hardware and software allocation
          </p>
        </div>
        <Button variant="outline">Export Report</Button>
      </div>

      {/* Admin Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approvedToday}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProcessing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.requester}</TableCell>
                  <TableCell>{req.department}</TableCell>
                  <TableCell>{req.item}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {req.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        req.status === "Approved"
                          ? "default"
                          : req.status === "Rejected"
                          ? "destructive"
                          : "secondary"
                      }
                      className={
                        req.status === "Approved"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" title="Approve">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Reject">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
