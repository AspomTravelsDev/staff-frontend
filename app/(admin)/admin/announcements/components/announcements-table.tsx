"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Eye,
  CalendarClock,
  Megaphone,
  Newspaper,
  Trash2,
  FileQuestion,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnnouncementItem } from "@/lib/api/announcements";
import {
  updateAnnouncementAction,
  deleteAnnouncementAdminAction,
} from "../actions";
import { toast } from "sonner";

interface AnnouncementsTableProps {
  announcements: AnnouncementItem[];
  onPreview: (item: AnnouncementItem) => void;
  onUpdate: (id: string, updated: Partial<AnnouncementItem>) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:
    "bg-green-100  text-green-800  border-green-200  dark:bg-green-900/30  dark:text-green-400",
  rejected:
    "bg-red-100    text-red-800    border-red-200    dark:bg-red-900/30    dark:text-red-400",
};

export function AnnouncementsTable({
  announcements,
  onPreview,
  onUpdate,
}: AnnouncementsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (item: AnnouncementItem) => {
    setLoadingId(item.id);
    const result = await updateAnnouncementAction(item.id, {
      status: "approved",
    });
    setLoadingId(null);
    if (!result.success) {
      toast.error(result.error || "Failed to approve");
      return;
    }
    toast.success("Announcement approved");
    onUpdate(item.id, { status: "approved" });
  };

  const handleReject = async (item: AnnouncementItem) => {
    const reason = window.prompt("Reason for rejection (Optional):");
    if (reason === null) return; // User cancelled the prompt

    setLoadingId(item.id);
    const result = await updateAnnouncementAction(item.id, {
      status: "rejected",
      rejection_reason: reason,
    });
    setLoadingId(null);
    if (!result.success) {
      toast.error(result.error || "Failed to reject");
      return;
    }
    toast.success("Announcement rejected");
    onUpdate(item.id, { status: "rejected", rejection_reason: reason });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement permanently?")) return;
    setLoadingId(id);
    const result = await deleteAnnouncementAdminAction(id);
    setLoadingId(null);
    if (!result.success) {
      toast.error(result.error || "Failed to delete");
      return;
    }
    toast.success("Deleted");
    onUpdate(id, { id: "__deleted__" });
  };

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <FileQuestion className="h-12 w-12 opacity-40" />
        <p className="text-sm">No announcements found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Author</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Scheduled</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {announcements.map((item) => {
          const busy = loadingId === item.id;
          return (
            <TableRow key={item.id}>
              <TableCell>
                <span className="font-medium text-sm">{item.author_name}</span>
              </TableCell>

              <TableCell>
                <Badge variant="outline" className="capitalize gap-1">
                  {item.type === "announcement" ? (
                    <Megaphone className="h-3 w-3" />
                  ) : (
                    <Newspaper className="h-3 w-3" />
                  )}
                  {item.type === "newsletter" ? "Newsletter" : "Announcement"}
                </Badge>
              </TableCell>

              <TableCell className="max-w-[220px]">
                <span className="text-sm font-medium line-clamp-2 leading-snug">
                  {item.title}
                </span>
              </TableCell>

              <TableCell>
                <Badge variant="outline" className={STATUS_STYLES[item.status]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {item.publish_at ? (
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {format(new Date(item.publish_at), "dd MMM yy, HH:mm")}
                  </span>
                ) : (
                  <span className="text-xs italic">Immediate</span>
                )}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                })}
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {/* Preview */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPreview(item)}
                    title="Preview content"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Approve — only for pending */}
                  {item.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={() => handleApprove(item)}
                      disabled={busy}
                      title="Approve"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Reject — only for pending */}
                  {item.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleReject(item)}
                      disabled={busy}
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Delete — always available for admin */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(item.id)}
                    disabled={busy}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
