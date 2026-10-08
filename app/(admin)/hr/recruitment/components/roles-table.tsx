"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Users, CheckCircle2 } from "lucide-react";
import type { RecruitmentRole } from "@/lib/types/recruitment";
import { RoleActions } from "./role-actions";

interface RolesTableProps {
  roles: RecruitmentRole[];
}

export function RolesTable({ roles }: RolesTableProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const counts = useMemo(() => {
    return {
      all: roles.length,
      active: roles.filter((r) => r.status === "active").length,
      closed: roles.filter((r) => r.status === "closed").length,
      paused: roles.filter((r) => r.status === "paused").length,
    };
  }, [roles]);

  const filteredRoles = useMemo(() => {
    if (activeTab === "all") return roles;
    return roles.filter((r) => r.status === activeTab);
  }, [roles, activeTab]);

  if (!roles?.length) {
    return (
      <div className="text-center py-16 border rounded-lg bg-card/50 text-muted-foreground">
        <Users className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
        <p className="text-base font-medium">No recruitment roles yet.</p>
        <p className="text-sm mt-1">Create your first role or connect one from an approved staff request.</p>
      </div>
    );
  }

  const getStatusBadge = (role: RecruitmentRole) => {
    const isFilled = (role.accepted_count ?? 0) >= role.openings_count;

    switch (role.status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
            Active
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
        return <Badge variant="outline">{role.status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full sm:w-[420px]">
          <TabsTrigger value="all" className="text-xs">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs">
            Active ({counts.active})
          </TabsTrigger>
          <TabsTrigger value="closed" className="text-xs">
            Closed ({counts.closed})
          </TabsTrigger>
          <TabsTrigger value="paused" className="text-xs">
            Paused ({counts.paused})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Openings & Hires</TableHead>
              <TableHead className="text-center">Candidates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                  No recruitment campaigns found in this tab.
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => {
                const acceptedCount = role.accepted_count ?? 0;
                const isFilled = acceptedCount >= role.openings_count;

                return (
                  <TableRow key={role.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          href={`/hr/recruitment/${role.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors hover:underline flex items-center gap-1.5"
                        >
                          {role.title}
                        </Link>
                        {role.hr_request && (
                          <p className="text-xs text-muted-foreground">
                            Linked to Staff Request #{role.hr_request.id.slice(0, 8)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-sm">
                      {role.department}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className="capitalize text-xs font-normal">
                        {role.employment_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`text-xs font-semibold ${
                            isFilled
                              ? "text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                              : "text-foreground"
                          }`}
                        >
                          {isFilled && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {acceptedCount} of {role.openings_count}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isFilled ? "Positions Filled" : "Openings"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        <Users className="h-3 w-3" />
                        {role.total_candidates ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(role)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(role.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="default" className="gap-1">
                          <Link href={`/hr/recruitment/${role.id}`}>
                            Manage
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <RoleActions role={role} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
