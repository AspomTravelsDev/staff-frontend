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
import { StatsCard } from "@/components/stats-card";
import {
  AlertTriangle,
  Clock,
  Inbox,
  MessageSquare,
  MoreHorizontal,
  UserX,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  requester: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  assignedTo: string;
  status: "Open" | "In Progress" | "Resolved";
}

export default function IssueTrackerAdminPage() {
  const stats = {
    openInfo: 0,
    critical: 0,
    avgResponse: "0m",
    unassigned: 0,
  };

  const tickets: Ticket[] = [];

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
        <StatsCard
          title="Unassigned Tickets"
          icon={UserX}
          value={stats.unassigned}
          description="Tickets needing attention"
          iconClassName="text-orange-600"
        />

        <StatsCard
          title="Critical Issues"
          icon={AlertTriangle}
          value={stats.critical}
          description="High priority tickets"
          iconClassName="text-destructive"
        />

        <StatsCard
          title="Avg Response Time"
          icon={Clock}
          value={stats.avgResponse}
          description="Performance metric"
          iconClassName="text-blue-600"
        />

        <StatsCard
          title="Open Tickets"
          icon={Inbox}
          value={stats.openInfo}
          description="Total active tickets"
          iconClassName="text-muted-foreground"
        />
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
