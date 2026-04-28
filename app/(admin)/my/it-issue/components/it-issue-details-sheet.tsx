"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { ItIssue } from "@/lib/api/it-issues";
import { getRoleLabel } from "@/types/user-types";
import { getItIssue, addItIssueComment } from "@/lib/api/it-issues";
import { useUser } from "@/providers/user-provider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function getPriorityVariant(priority: string) {
  switch (priority) {
    case "critical":
      return "destructive";
    case "high":
      return "default";
    default:
      return "outline";
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
      return "outline";
    case "in_progress":
      return "default";
    default:
      return "secondary";
  }
}

export function ItIssueDetailsSheet({
  issue,
  open,
  onOpenChange,
  actions,
}: {
  issue: ItIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useUser();
  const [details, setDetails] = useState<ItIssue | null>(issue);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!issue?.id) return setDetails(null);
      setLoading(true);
      try {
        const res = await getItIssue(issue.id);
        if (res.success && mounted) setDetails(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [issue?.id, open]);

  async function postComment(close = false) {
    if (!issue?.id || !commentText.trim()) return;
    const currentStatus = details?.status ?? issue.status;
    if (currentStatus === "closed") {
      toast.error("Cannot comment on closed issue");
      return;
    }
    setLoading(true);
    try {
      const payload: any = { comment: commentText };
      if (close) {
        payload.close = true;
        payload.resolution_note = commentText;
      }

      const result = await addItIssueComment(issue.id, payload);
      if (!result.success) throw new Error(result.error.error);
      toast.success("Comment posted");
      setCommentText("");
      const refreshed = await getItIssue(issue.id);
      if (refreshed.success) setDetails(refreshed.data);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  if (!issue) return null;

  const currentStatus = details?.status ?? issue.status;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md px-6 py-4">
        <SheetHeader className="mb-6">
          <SheetTitle>IT Ticket Details</SheetTitle>
          <SheetDescription>{issue.subject}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h4>
              <Badge
                variant={getStatusVariant(currentStatus)}
                className="capitalize"
              >
                {currentStatus.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Priority
              </h4>
              <Badge
                variant={getPriorityVariant(issue.priority)}
                className="capitalize"
              >
                {issue.priority}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Category
              </h4>
              <p className="font-medium capitalize">{issue.category}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Date Submitted
              </h4>
              <p className="font-medium">
                {format(new Date(issue.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {issue.submitted_by && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Submitted By
              </h4>
              <p className="font-medium">{issue.submitted_by.name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {getRoleLabel(issue.submitted_by.role)}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Description
            </h4>
            <div className="bg-muted/50 rounded-md p-3 text-sm min-h-25 whitespace-pre-wrap">
              {issue.description}
            </div>
          </div>

          {details?.resolution_note && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Resolution Note
              </h4>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm whitespace-pre-wrap">
                {details.resolution_note}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Comments
            </h4>
            <div className="space-y-3">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading comments...
                </div>
              )}

              {!loading &&
                (!details?.comments || details.comments.length === 0) && (
                  <div className="text-sm text-muted-foreground">
                    No comments yet.
                  </div>
                )}

              {!loading &&
                details?.comments?.map((c) => (
                  <div key={c.id} className="rounded-md p-3 bg-muted/40">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {c.user?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                    <div className="text-sm mt-2 whitespace-pre-wrap">
                      {c.comment}
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-md border p-2 min-h-[100px] text-sm"
                placeholder="Write a comment..."
                disabled={currentStatus === "closed"}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => postComment(false)}
                  disabled={
                    loading || !commentText.trim() || currentStatus === "closed"
                  }
                >
                  Post comment
                </Button>
                {user &&
                  ["it", "super", "compliance"].includes(user.role) &&
                  currentStatus !== "closed" && (
                    <Button
                      variant="destructive"
                      onClick={() => postComment(true)}
                      disabled={loading || !commentText.trim()}
                    >
                      Close & comment
                    </Button>
                  )}
              </div>
            </div>
          </div>

          {actions && <div className="pt-2 border-t">{actions}</div>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
