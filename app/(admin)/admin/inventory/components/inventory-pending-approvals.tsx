"use client";

import { useState } from "react";
import { InventoryAssignment } from "@/lib/api/inventory";
import { AssignmentQueueTable } from "./assignment-queue-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, UserCheck, Clock } from "lucide-react";

interface InventoryPendingApprovalsProps {
  userRole?: string;
  userRoles?: string[];
  officerAssignments: InventoryAssignment[];
  complianceAssignments: InventoryAssignment[];
}

export function InventoryPendingApprovals({
  userRole,
  userRoles,
  officerAssignments,
  complianceAssignments,
}: InventoryPendingApprovalsProps) {
  const activeRoles =
    userRoles && userRoles.length > 0
      ? userRoles
      : userRole
        ? [userRole]
        : [];

  const isSuper = ["super", "mp", "md"].some((r) => activeRoles.includes(r));
  const isOfficer = isSuper || ["admin", "it"].some((r) => activeRoles.includes(r));
  const isCompliance = isSuper || ["compliance", "office-operations"].some((r) => activeRoles.includes(r));
  const canFilterMultiple = isSuper || (isOfficer && isCompliance);

  const [activeQueueFilter, setActiveQueueFilter] = useState<
    "all" | "officer" | "compliance"
  >(canFilterMultiple ? "all" : isCompliance ? "compliance" : "officer");

  const totalOfficer = officerAssignments.length;
  const totalCompliance = complianceAssignments.length;
  const totalPending = isSuper || (isOfficer && isCompliance)
    ? totalOfficer + totalCompliance
    : isCompliance
      ? totalCompliance
      : totalOfficer;

  return (
    <div className="space-y-6">
      {/* Role Summary Banner */}
      <div className="grid gap-4 md:grid-cols-3">
        {isOfficer && (
          <Card className={`transition-all ${activeQueueFilter === "officer" ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Officer Review Queue</CardTitle>
              <UserCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOfficer}</div>
              <p className="text-xs text-muted-foreground">Staff acknowledged & awaiting IT/Admin review</p>
            </CardContent>
          </Card>
        )}

        {isCompliance && (
          <Card className={`transition-all ${activeQueueFilter === "compliance" ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Audit Queue</CardTitle>
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompliance}</div>
              <p className="text-xs text-muted-foreground">Officer approved & awaiting final compliance audit</p>
            </CardContent>
          </Card>
        )}

        {canFilterMultiple && (
          <Card className={`transition-all ${activeQueueFilter === "all" ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPending}</div>
              <p className="text-xs text-muted-foreground">All open assignment review requests</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sub-toggle Filter for Super Admins / Multi-role Users */}
      {canFilterMultiple && (
        <div className="flex items-center gap-2 border-b pb-3">
          <button
            type="button"
            onClick={() => setActiveQueueFilter("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeQueueFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All Pending Queue
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {totalPending}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueFilter("officer")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeQueueFilter === "officer"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Officer Review Only
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {totalOfficer}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueFilter("compliance")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeQueueFilter === "compliance"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Compliance Review Only
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {totalCompliance}
            </Badge>
          </button>
        </div>
      )}

      {/* Render Tables Based on Role and Selected Filter */}
      {isOfficer && (activeQueueFilter === "all" || activeQueueFilter === "officer") && (
        <div className="space-y-3">
          {canFilterMultiple && activeQueueFilter === "all" && (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-orange-600" />
                Officer Review Queue ({totalOfficer})
              </h3>
            </div>
          )}
          <AssignmentQueueTable assignments={officerAssignments} mode="officer" />
        </div>
      )}

      {isCompliance && (activeQueueFilter === "all" || activeQueueFilter === "compliance") && (
        <div className="space-y-3 pt-4">
          {canFilterMultiple && activeQueueFilter === "all" && (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Compliance Audit Queue ({totalCompliance})
              </h3>
            </div>
          )}
          <AssignmentQueueTable assignments={complianceAssignments} mode="compliance" />
        </div>
      )}
    </div>
  );
}
