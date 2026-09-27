"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  SlidersHorizontal,
  Briefcase,
  Users,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import type { RecruitmentRole, RoleStatus } from "@/lib/types/recruitment";
import { updateRecruitmentRole } from "@/lib/api/recruitment";
import { UploadCvDialog } from "./upload-cv-dialog";
import { EditInstructionsDialog } from "./edit-instructions-dialog";
import { RecruitmentRoleTourButton } from "./recruitment-role-tour";
import { toast } from "sonner";

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
  const [currentStatus, setCurrentStatus] = useState<RoleStatus>(role.status);

  const acceptedCount = stats?.accepted ?? role.accepted_count ?? 0;
  const isFilled = acceptedCount >= role.openings_count;

  const handleStatusChange = async (newStatus: RoleStatus) => {
    if (newStatus === currentStatus) return;
    setCurrentStatus(newStatus);

    startTransition(async () => {
      try {
        const res = await updateRecruitmentRole(role.id, { status: newStatus });
        if (!res.success) {
          setCurrentStatus(role.status);
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
      } catch (err: any) {
        setCurrentStatus(role.status);
        toast.error(err?.message || "Failed to update campaign status.");
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
      <div id="tour-role-header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">{role.title}</h1>
            {getStatusBadge(currentStatus)}
            <Badge variant="outline" className="capitalize text-xs">
              {role.employment_type}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Briefcase className="h-4 w-4 text-primary" />
              {role.department} Department
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {role.openings_count} Opening{role.openings_count > 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span
              className={`flex items-center gap-1.5 font-medium ${
                isFilled ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
              }`}
            >
              <UserCheck className="h-4 w-4 text-emerald-600" />
              {acceptedCount} of {role.openings_count} Hired
            </span>
            {role.hr_request && (
              <>
                <span>•</span>
                <span className="text-xs">
                  From Staff Request #{role.hr_request.id.slice(0, 8)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons and Quick Status Control */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <RecruitmentRoleTourButton />

          {/* Quick Status Select */}
          <div className="flex items-center gap-1.5 bg-card border rounded-md px-2 py-1">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <Select
              value={currentStatus}
              onValueChange={(val: any) => handleStatusChange(val as RoleStatus)}
              disabled={isPending}
            >
              <SelectTrigger className="h-7 w-[110px] text-xs border-0 shadow-none focus:ring-0 px-2 py-0">
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-xs">
                  Active
                </SelectItem>
                <SelectItem value="paused" className="text-xs">
                  Paused
                </SelectItem>
                <SelectItem value="closed" className="text-xs">
                  Closed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div id="tour-role-instructions">
            <EditInstructionsDialog role={role} />
          </div>
          <div id="tour-upload-cv">
            <UploadCvDialog roleId={role.id} roleTitle={role.title} />
          </div>
        </div>
      </div>

      {/* Campaign Closed Banner */}
      {currentStatus === "closed" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

      {/* Screening Instructions Banner (if set) */}
      {role.custom_instructions && (
        <div className="rounded-lg border bg-muted/30 p-3.5 flex items-start gap-3">
          <SlidersHorizontal className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold text-foreground">Active Screening Instructions:</div>
            <p className="text-muted-foreground leading-relaxed">
              {role.custom_instructions}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
