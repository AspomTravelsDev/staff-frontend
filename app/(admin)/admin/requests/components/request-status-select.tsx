"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRequest } from "@/lib/api/requests";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { RequestStatus } from "@/lib/api/requests";

export function RequestStatusSelect({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: RequestStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(status: string) {
    if (status === currentStatus) return;

    try {
      setLoading(true);
      await updateRequest(id, { status: status as RequestStatus });
      toast.success("Status Updated", {
        description: `Request has been marked as ${status.replace("_", " ")}.`,
      });
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update request status.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center gap-2 justify-end min-w-[140px]"
      onClick={(e) => e.stopPropagation()}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
      ) : null}
      <Select
        defaultValue={currentStatus}
        onValueChange={handleStatusChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs capitalize">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
