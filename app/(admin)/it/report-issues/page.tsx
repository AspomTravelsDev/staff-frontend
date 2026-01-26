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
import { MessageSquare, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function IssueTrackerAdminPage() {
  // Mock Stats for IT Support Team
  const stats = {
    openInfo: 8,
    critical: 3,
    avgResponse: "15m",
    unassigned: 4,
  };

  // Mock All Tickets Data
  const tickets = [
    {
      id: "TKT-991",
      subject: "Server downtime on node 4",
      requester: "SysAdmin",
      priority: "Critical",
      status: "Open",
      assignedTo: "Unassigned",
      created: "10 mins ago",
    },
    {
      id: "TKT-990",
      subject: "Email signatures not updating",
      requester: "Clarissa Dalloway",
      priority: "Low",
      status: "In Progress",
      assignedTo: "Mike",
      created: "1 hour ago",
    },
    {
      id: "TKT-989",
      subject: "VPN access for new intern",
      requester: "Peter Walsh",
      priority: "High",
      status: "Open",
      assignedTo: "Unassigned",
      created: "2 hours ago",
    },
    {
      id: "TKT-988",
      subject: "Printer jammed on 3rd floor",
      requester: "Sally Seton",
      priority: "Medium",
      status: "Resolved",
      assignedTo: "John",
      created: "Yesterday",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Issue Tracker</h1>
          <p className="text-muted-foreground">
            Monitor and resolve incoming support tickets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Team Performance</Button>
          <Button>Assign Tickets</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unassigned Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.unassigned}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.critical}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponse}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openInfo}</div>
          </CardContent>
        </Card>
      </div>

      {/* All Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {t.id}
                  </TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{t.requester}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.priority === "Critical"
                          ? "destructive"
                          : t.priority === "High"
                          ? "default"
                          : "outline"
                      }
                    >
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.assignedTo}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.status === "Open"
                          ? "secondary"
                          : t.status === "Resolved"
                          ? "outline"
                          : "default"
                      }
                    >
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
