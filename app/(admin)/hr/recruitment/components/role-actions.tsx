"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MoreHorizontal, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteRecruitmentRole, updateRecruitmentRole } from "@/lib/api/recruitment";
import type { RecruitmentRole } from "@/lib/types/recruitment";

interface RoleActionsProps {
  role: RecruitmentRole;
  redirectOnDelete?: boolean;
  disabled?: boolean;
  additionalItems?: ReactNode;
}

export function RoleActions({
  role,
  redirectOnDelete = false,
  disabled = false,
  additionalItems,
}: RoleActionsProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<"close" | "delete" | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const performAction = async (action: "close" | "delete" | "reopen") => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const result = action === "delete"
        ? await deleteRecruitmentRole(role.id)
        : await updateRecruitmentRole(role.id, { status: action === "close" ? "closed" : "active" });
      if (!result.success) {
        toast.error(result.error || "Could not update this recruitment role.");
        return;
      }
      setConfirmation(null);
      toast.success(action === "delete" ? "Recruitment role deleted." : action === "close" ? "Recruitment role closed." : "Recruitment role reopened.");
      if (action === "delete" && redirectOnDelete) router.replace("/hr/recruitment");
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not update this recruitment role.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled || isWorking} aria-label={`Actions for ${role.title}`}>
            {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            <span className="sr-only">Role actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {additionalItems}
          {additionalItems && <DropdownMenuSeparator />}
          {role.status === "closed" ? (
            <DropdownMenuItem onSelect={() => void performAction("reopen")}>
              <PlayCircle /> Reopen role
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setConfirmation("close")}>
              <CheckCircle2 /> Close role
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmation("delete")}>
            <Trash2 /> Delete role
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open && !isWorking) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation === "delete" ? "Delete recruitment role?" : "Close recruitment role?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation === "delete" ? (
                <>Permanently delete <strong>{role.title}</strong>, all its candidates, their evaluations, and uploaded CVs. Linked staff requests and onboarding applications will remain. This cannot be undone.</>
              ) : (
                <>Close <strong>{role.title}</strong> to new CV uploads. Candidates, CVs, and evaluations will remain available. You can reopen the role later.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmation === "delete" ? "destructive" : "default"}
              disabled={disabled || isWorking}
              onClick={(event) => {
                event.preventDefault();
                if (confirmation) void performAction(confirmation);
              }}
            >
              {isWorking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmation === "delete" ? "Delete role" : "Close role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
