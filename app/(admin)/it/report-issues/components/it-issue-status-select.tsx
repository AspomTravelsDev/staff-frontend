"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateItIssue } from "@/lib/api/it-issues";
import type { ItIssueStatus } from "@/lib/api/it-issues";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function ItIssueStatusSelect({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: ItIssueStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(status: string) {
    if (status === currentStatus) return;
    try {
      setLoading(true);
      const result = await updateItIssue(id, {
        status: status as ItIssueStatus,
      });
      if (!result.success) throw new Error(result.error.error);
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className="flex items-center gap-2 justify-end min-w-[140px]"
      onClick={(e) => e.stopPropagation()}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
      <Select
        defaultValue={currentStatus}
        onValueChange={handleChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
