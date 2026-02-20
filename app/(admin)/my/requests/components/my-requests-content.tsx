"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCards } from "@/app/(admin)/admin/requests/components/stats-cards";
import { MyRequestsTable } from "./my-requests-table";
import { RequestDialog } from "./request-dialog";
import type { RequestItem } from "@/lib/api/requests";

interface MyRequestsContentProps {
  requests: RequestItem[];
}

export function MyRequestsContent({ requests = [] }: MyRequestsContentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestItem | null>(
    null,
  );

  const computedStats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      in_progress: requests.filter((r) => r.status === "in_progress").length,
      completed: requests.filter((r) =>
        ["completed", "approved", "rejected"].includes(r.status),
      ).length,
    }),
    [requests],
  );

  const handleCreate = () => {
    setEditingRequest(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (request: RequestItem) => {
    setEditingRequest(request);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Requests</h1>
          <p className="text-muted-foreground">
            Submit and track your administrative requests.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={computedStats} />

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Showing {requests.length} requests</CardDescription>
        </CardHeader>
        <CardContent>
          <MyRequestsTable requests={requests} onEdit={handleEdit} />
        </CardContent>
      </Card>

      <RequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        request={editingRequest}
      />
    </div>
  );
}
