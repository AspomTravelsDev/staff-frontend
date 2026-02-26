"use client";

import { useState } from "react";
import {
  Trash2,
  Megaphone,
  Newspaper,
  Clock,
  CheckCircle,
  XCircle,
  CalendarClock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnnouncementItem } from "@/lib/api/announcements";
import { deleteAnnouncementAction } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { EditAnnouncementDialog } from "./edit-announcement-dialog";

interface AnnouncementCardProps {
  announcement: AnnouncementItem;
  onDeleted: (id: string) => void;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    variant: "secondary" as const,
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    variant: "secondary" as const,
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    variant: "secondary" as const,
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  },
};

const TYPE_CONFIG = {
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
  newsletter: {
    label: "Newsletter",
    icon: Newspaper,
    className:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

/** Strip HTML tags to get a plain text excerpt */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function AnnouncementCard({
  announcement,
  onDeleted,
}: AnnouncementCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const status = STATUS_CONFIG[announcement.status];
  const type = TYPE_CONFIG[announcement.type];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    setIsDeleting(true);
    try {
      const result = await deleteAnnouncementAction(announcement.id);
      if (!result.success) {
        toast.error(result.error || "Failed to delete");
        return;
      }
      toast.success("Submission deleted");
      onDeleted(announcement.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const excerpt = stripHtml(announcement.content);
  const formattedDate = format(
    new Date(announcement.created_at),
    "dd MMM yyyy",
  );
  const scheduledDate = announcement.publish_at
    ? format(new Date(announcement.publish_at), "dd MMM yyyy, HH:mm")
    : null;

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={type.className}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {type.label}
            </Badge>
            <Badge variant="outline" className={status.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formattedDate}
          </span>
        </div>
        <CardTitle className="text-base mt-2 leading-snug line-clamp-2">
          {announcement.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {excerpt || "No content preview available."}
        </p>
      </CardContent>

      <CardFooter className="pt-0 border-t">
        <div className="flex items-center justify-between w-full pt-3 flex-wrap gap-2">
          {scheduledDate && announcement.status === "pending" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Scheduled: {scheduledDate}
            </span>
          )}
          {announcement.status === "rejected" && (
            <div className="flex flex-col gap-1 w-full text-xs text-destructive mb-2">
              <span className="font-semibold">
                This submission was rejected.
              </span>
              {announcement.rejection_reason && (
                <span className="text-muted-foreground p-2 bg-destructive/5 rounded-md border border-destructive/10">
                  <strong className="text-destructive mr-1">Reason:</strong>
                  {announcement.rejection_reason}
                </span>
              )}
            </div>
          )}

          {announcement.status === "pending" ||
          announcement.status === "rejected" ? (
            <div className="flex gap-2 ml-auto">
              {announcement.status === "rejected" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit & Resubmit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <span />
          )}
        </div>
      </CardFooter>
      <EditAnnouncementDialog
        announcement={announcement}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </Card>
  );
}
