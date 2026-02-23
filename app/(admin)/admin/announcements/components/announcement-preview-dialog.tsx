"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { AnnouncementItem } from "@/lib/api/announcements";

interface PreviewDialogProps {
  item: AnnouncementItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export function AnnouncementPreviewDialog({
  item,
  open,
  onOpenChange,
}: PreviewDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="capitalize">
              {item.type === "newsletter" ? "📰 Newsletter" : "📢 Announcement"}
            </Badge>
            <Badge variant="outline" className={STATUS_STYLES[item.status]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>
          <DialogTitle className="text-lg leading-snug">
            {item.title}
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1 text-xs">
            <span>
              By <strong>{item.author_name}</strong>
            </span>
            <span>
              Submitted:{" "}
              {format(new Date(item.created_at), "dd MMM yyyy, HH:mm")}
            </span>
            {item.publish_at && (
              <span>
                Scheduled:{" "}
                {format(new Date(item.publish_at), "dd MMM yyyy, HH:mm")}
              </span>
            )}
            {item.published_at && (
              <span>
                Published:{" "}
                {format(new Date(item.published_at), "dd MMM yyyy, HH:mm")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Render the HTML content from Quill */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-4 bg-muted/30 mt-2"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      </DialogContent>
    </Dialog>
  );
}
