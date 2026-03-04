"use client";

import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Megaphone, Newspaper, User } from "lucide-react";
import type { AnnouncementItem } from "@/lib/api/announcements";
import { AnnouncementContent } from "@/app/(admin)/my/announcement/components/announcement-content";

interface PreviewSheetProps {
  item: AnnouncementItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50",
  approved:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50",
  rejected:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50",
};

export function AnnouncementPreviewSheet({
  item,
  open,
  onOpenChange,
}: PreviewSheetProps) {
  if (!item) return null;

  const TypeIcon = item.type === "newsletter" ? Newspaper : Megaphone;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[460px] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="px-2.5 py-0.5 capitalize gap-2 text-[10px] font-bold ring-1 ring-inset ring-muted-foreground/10"
            >
              <TypeIcon className="h-3.5 w-3.5 text-primary" />
              {item.type === "newsletter" ? "Newsletter" : "Announcement"}
            </Badge>
            <Badge
              variant="outline"
              className={`${STATUS_STYLES[item.status]} px-2.5 py-0.5 text-[10px] font-bold`}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>

          <div className="space-y-2">
            <SheetTitle className="text-xl font-bold tracking-tight leading-tight [word-break:normal]">
              {item.title}
            </SheetTitle>

            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>
                  By{" "}
                  <strong className="text-foreground">
                    {item.author_name}
                  </strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>
                    Sent:{" "}
                    <strong>
                      {format(new Date(item.created_at), "MMM dd, HH:mm")}
                    </strong>
                  </span>
                </div>
                {item.publish_at && (
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>
                      Sched:{" "}
                      <strong>
                        {format(new Date(item.publish_at), "MMM dd, HH:mm")}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>
        <div className="py-6">
          <div className="p-5">
            <AnnouncementContent
              content={item.content}
              className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
            />
          </div>
          <div className="mt-4 flex flex-col items-center gap-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none">
              — Content Preview —
            </p>
            <p className="text-[9px] text-muted-foreground italic leading-none">
              (Read-Only)
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
