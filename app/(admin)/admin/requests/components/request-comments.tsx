"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/providers/user-provider";
import { userHasAnyRole } from "@/types/user-types";
import { getRequest, addRequestComment } from "@/lib/api/requests";
import type { RequestItem, RequestComment } from "@/lib/api/requests";
import { format } from "date-fns";

export function RequestComments({
  requestId,
  initialStatus,
}: {
  requestId: string;
  initialStatus?: string;
}) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [details, setDetails] = useState<RequestItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getRequest(requestId);
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
  }, [requestId]);

  const currentStatus = (details?.status ?? initialStatus) as string;

  async function postComment(close = false) {
    if (!commentText.trim()) return;
    if (
      ["completed", "approved", "rejected", "cancelled"].includes(currentStatus)
    ) {
      toast.error("Cannot comment on closed request");
      return;
    }
    setLoading(true);
    try {
      const payload: { comment: string; close?: boolean; resolution_note?: string } = { comment: commentText };
      if (close) {
        payload.close = true;
        payload.resolution_note = commentText;
      }

      const result = await addRequestComment(requestId, payload);
      if (!result.success) throw new Error(result.error.error);
      toast.success("Comment posted");
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const refreshed = await getRequest(requestId);
      if (refreshed.success) setDetails(refreshed.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading comments...
          </div>
        )}

        {!loading && (!details?.comments || details.comments.length === 0) && (
          <div className="text-sm text-muted-foreground">No comments yet.</div>
        )}

        {!loading &&
          details?.comments?.map((c: RequestComment) => (
            <div key={c.id} className="rounded-md p-3 bg-muted/40">
              <div className="flex items-center justify-between">
                <div className="font-medium">{c.user?.name || "Unknown"}</div>
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
          disabled={["completed", "approved", "rejected", "cancelled"].includes(
            currentStatus,
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={() => postComment(false)}
            disabled={
              loading ||
              !commentText.trim() ||
              ["completed", "approved", "rejected", "cancelled"].includes(
                currentStatus,
              )
            }
          >
            Post comment
          </Button>
          {userHasAnyRole(user, [
            "it",
            "super",
            "mp",
            "md",
            "compliance",
            "admin",
            "office-operations",
          ]) &&
            !["completed", "approved", "rejected", "cancelled"].includes(
              currentStatus,
            ) && (
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
  );
}
