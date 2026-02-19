"use client";

import { useState } from "react";
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
import { MyRequestsTable } from "./components/my-requests-table";
import { RequestDialog } from "./components/request-dialog";
import { useRequests, useRequestStats } from "@/lib/api/hooks/use-requests";
import type { RequestItem } from "@/lib/api/requests";
import { useCurrentUser } from "@/lib/api/hooks/use-employees";

export default function MyRequestsPage() {
  const { data: user } = useCurrentUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestItem | null>(
    null,
  );

  // Fetch requests for current user
  const { data: requestsData, isLoading: isRequestsLoading } = useRequests({
    requester_id: user?.id,
  });

  // Fetch stats for current user
  const { data: stats } = useRequestStats();
  // Note: getRequestStats needs to support filtering by requester_id in the hook if we want to show only user stats
  // Currently useRequestStats doesn't take arguments in the hook signature we defined, strictly speaking.
  // We updated helper function but check hook.

  const requests = requestsData?.items || [];

  // Calculate stats client-side if the API doesn't support user-specific stats yet via the hook
  // or use the global stats if that's what is returned.
  // For "My Requests", we probably want stats computed from the user's requests.
  const computedStats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) =>
      ["completed", "approved", "rejected"].includes(r.status),
    ).length,
  };

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
          {isRequestsLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : (
            <MyRequestsTable requests={requests} onEdit={handleEdit} />
          )}
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
