"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteRecruitmentCandidate } from "@/lib/api/recruitment";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";

interface DeleteCandidateDialogProps {
  candidate: RecruitmentCandidate;
  roleId: string;
  onDeleted?: () => void;
  triggerClassName?: string;
}

export function DeleteCandidateDialog({
  candidate,
  roleId,
  onDeleted,
  triggerClassName,
}: DeleteCandidateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteRecruitmentCandidate(candidate.id, roleId);
      if (!result.success) {
        toast.error(result.error || "Could not delete this candidate.");
        return;
      }
      setOpen(false);
      toast.success("Recruitment candidate deleted.");
      onDeleted?.();
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete this candidate.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) setOpen(nextOpen);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant={triggerClassName ? "ghost" : "outline"}
          size="sm"
          className={
            triggerClassName ??
            "h-8 gap-1 text-xs text-destructive hover:text-destructive"
          }
          disabled={isDeleting}
          aria-label={`Delete candidate ${candidate.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete candidate?</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete <strong>{candidate.name}</strong> from this
            recruitment role, including their uploaded CV, evaluations,
            interview rubric, and notes. This cannot be undone.
            {candidate.onboarding_application_id &&
              " Their linked onboarding application will remain available."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete candidate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
