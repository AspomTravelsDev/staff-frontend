"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import type { RecruitmentRole, RoleStatus } from "@/lib/types/recruitment";
import { updateRecruitmentRole } from "@/lib/api/recruitment";
import { UploadCvDialog } from "./upload-cv-dialog";
import { EditInstructionsDialog } from "./edit-instructions-dialog";
import { runRecruitmentRoleTour } from "./recruitment-role-tour";
import { RoleActions } from "../../components/role-actions";
import { toast } from "sonner";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface RoleHeaderProps {
  role: RecruitmentRole;
  stats?: {
    total: number;
    reviewing: number;
    shortlisted: number;
    interviewing: number;
    offered: number;
    accepted: number;
    rejected: number;
  };
}

export function RoleHeader({ role, stats }: RoleHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentStatus = role.status;

  const acceptedCount = stats?.accepted ?? role.accepted_count ?? 0;
  const isFilled = acceptedCount >= role.openings_count;

  const handleStatusChange = async (newStatus: RoleStatus) => {
    if (newStatus === currentStatus) return;

    startTransition(async () => {
      try {
        const res = await updateRecruitmentRole(role.id, { status: newStatus });
        if (!res.success) {
          toast.error(res.error || "Failed to update campaign status.");
          return;
        }
        toast.success(
          newStatus === "closed"
            ? "Campaign marked as closed."
            : newStatus === "paused"
            ? "Campaign paused."
            : "Campaign resumed and is now active."
        );
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update campaign status.");
      }
    });
  };

  const getStatusBadge = (status: RoleStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
            Active Campaign
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border-amber-500/30">
            Paused
          </Badge>
        );
      case "closed":
        return isFilled ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40">
            Closed • Filled
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top back navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1 text-muted-foreground pl-0 hover:pl-1 transition-all"
        >
          <Link href="/hr/recruitment">
            <ArrowLeft className="h-4 w-4" />
            Back to Recruitment Hub
          </Link>
        </Button>
      </div>

      {/* Main Title Banner */}
      <div id="tour-role-header" className="border-b pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{role.title}</h1>
              {getStatusBadge(currentStatus)}
              <Badge variant="outline" className="capitalize text-xs">
                {role.employment_type}
              </Badge>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 [&_button]:min-h-10 [&_button]:text-sm">
            <div id="tour-upload-cv">
              <UploadCvDialog roleId={role.id} roleTitle={role.title} disabled={currentStatus === "closed"} screeningOnUpload={!role.pipeline_config} />
            </div>
            <RoleActions
              role={role}
              redirectOnDelete
              disabled={isPending}
              additionalItems={
                <>
                  <DropdownMenuItem onSelect={runRecruitmentRoleTour}>
                    <span id="tour-role-guide">Quick Guide</span>
                  </DropdownMenuItem>
                  <EditInstructionsDialog
                    role={role}
                    trigger={
                      <DropdownMenuItem
                        id="tour-role-instructions"
                        onSelect={(event) => event.preventDefault()}
                      >
                        Edit Criteria & Instructions
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem asChild>
                    <Link href={`/hr/recruitment/${role.id}/assessment-setup`}>
                      View interview questions
                    </Link>
                  </DropdownMenuItem>
                </>
              }
            />
          </div>
        </div>
      </div>

      {/* Campaign Closed Banner */}
      {currentStatus === "closed" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="font-semibold text-sm text-emerald-950 dark:text-emerald-200">
                {isFilled
                  ? "Recruitment Campaign Completed & Closed"
                  : "Recruitment Campaign Closed"}
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                {isFilled
                  ? `All ${role.openings_count} target opening${
                      role.openings_count > 1 ? "s have" : " has"
                    } been filled and onboarded. The requisition is complete.`
                  : "This role is currently marked as closed. You can reopen it at any time if more candidates are required."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs shrink-0 border-emerald-500/40 hover:bg-emerald-500/20"
            disabled={isPending}
            onClick={() => handleStatusChange("active")}
          >
            <PlayCircle className="h-3.5 w-3.5 mr-1" />
            Reopen Campaign
          </Button>
        </div>
      )}

      {/* Campaign Paused Banner */}
      {currentStatus === "paused" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <PauseCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="font-semibold text-sm text-amber-950 dark:text-amber-200">
                Campaign is Currently Paused
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                Recruitment activity is on hold. Resume the campaign when you are ready to continue screening and interviewing.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs shrink-0 border-amber-500/40 hover:bg-amber-500/20"
            disabled={isPending}
            onClick={() => handleStatusChange("active")}
          >
            <PlayCircle className="h-3.5 w-3.5 mr-1" />
            Resume Campaign
          </Button>
        </div>
      )}

    </div>
  );
}
