"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHrRequestStatus } from "@/lib/api/hr-requests";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function StaffRequestActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(status: string) {
    if (status === currentStatus) return;

    try {
      setLoading(true);
      await updateHrRequestStatus(id, status as any);
      toast.success("Status Updated", {
        description: `Request has been marked as ${status}.`,
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
    <div className="flex items-center gap-2 justify-end min-w-[140px]">
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
          <SelectItem value="in review">In Review</SelectItem>
          <SelectItem value="interviewing">Interviewing</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
