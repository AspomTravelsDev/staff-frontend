"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitAnonymousComment } from "@/lib/api/anonymous-comments";

interface AnonymousCommentDialogProps {
  trigger: React.ReactNode;
}

export function AnonymousCommentDialog({ trigger }: AnonymousCommentDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length < 5) {
      toast.error("Comment must be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAnonymousComment(content);
      toast.success("Feedback submitted anonymously!");
      setContent("");
      setOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit comment";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            <DialogTitle>Submit Anonymous Feedback</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Your comment is completely anonymous. Neither your name nor department is recorded in the system. Please share your suggestions or feedback honestly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your feedback, concern, or suggestion here..."
              rows={6}
              maxLength={2000}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min. 5 characters</span>
              <span>{content.length}/2000</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || content.length < 5}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
