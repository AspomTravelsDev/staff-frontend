"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  ShieldCheck,
  Filter,
  UserCheck,
  AlertCircle,
  RotateCcw,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { OnboardingApplication } from "@/lib/types/hr";
import { ProvisionEmailDialog } from "@/app/(admin)/hr/applications/[id]/components/provision-email-dialog";
import { resendPortalInviteAction } from "@/app/(admin)/hr/applications/actions";

interface ItOnboardingClientProps {
  applications: OnboardingApplication[];
}

export function ItOnboardingClient({ applications }: ItOnboardingClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "awaiting_portal" | "portal_active">("all");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = applications.length;
    const provisioned = applications.filter((a) => Boolean(a.corporate_email)).length;
    const pending = total - provisioned;
    
    // Portal invite tracking
    const portalActive = applications.filter(
      (a) => a.portal_status?.status === "accepted"
    ).length;
    const awaitingPortal = applications.filter(
      (a) => a.portal_status?.status === "pending" || a.portal_status?.status === "expired"
    ).length;

    return { total, provisioned, pending, portalActive, awaitingPortal };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Filter tab logic
      if (statusFilter === "pending" && app.corporate_email) return false;
      if (statusFilter === "awaiting_portal") {
        const s = app.portal_status?.status;
        if (s !== "pending" && s !== "expired") return false;
      }
      if (statusFilter === "portal_active") {
        if (app.portal_status?.status !== "accepted") return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const name = (app.applicant_name || "").toLowerCase();
      const personalEmail = (app.applicant_email || "").toLowerCase();
      const corporateEmail = (app.corporate_email || "").toLowerCase();
      const position = (app.position_title || "").toLowerCase();
      const refId = (app.application_id || "").toLowerCase();

      return (
        name.includes(term) ||
        personalEmail.includes(term) ||
        corporateEmail.includes(term) ||
        position.includes(term) ||
        refId.includes(term)
      );
    });
  }, [applications, searchTerm, statusFilter]);

  const handleResendPortalInvite = async (appId: string, email: string) => {
    setResendingId(appId);
    try {
      const result = await resendPortalInviteAction(appId, {
        send_portal_invite: true,
        send_credentials_email: true,
      });
      toast.success(result.message || `Onboarding emails resent successfully`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend onboarding emails";
      toast.error(msg);
    } finally {
      setResendingId(null);
    }
  };

  const getApplicationStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs">Completed</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground text-xs">Invited</Badge>;
    }
  };

  const renderPortalStatus = (app: OnboardingApplication) => {
    const portalStatus = app.portal_status;
    const status = portalStatus?.status || (app.corporate_email ? "not_invited" : "not_provisioned");

    switch (status) {
      case "accepted":
        return (
          <div className="space-y-0.5">
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px] font-medium inline-flex items-center">
              <CheckCircle2 className="h-3 w-3" />
              <span>Portal Active</span>
            </Badge>
            <div className="text-[11px] text-muted-foreground">
              {portalStatus?.activated_at
                ? `Joined ${new Date(portalStatus.activated_at).toLocaleDateString()}`
                : "Account created"}
            </div>
          </div>
        );

      case "pending":
        return (
          <div className="space-y-0.5">
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 gap-1 text-[11px] font-medium inline-flex items-center border border-amber-300/40"
            >
              <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span>Invite Sent</span>
            </Badge>
            <div className="text-[11px] text-muted-foreground">
              Awaiting password setup
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="space-y-0.5">
            <Badge variant="destructive" className="gap-1 text-[11px] font-medium inline-flex items-center">
              <AlertCircle className="h-3 w-3" />
              <span>Invite Expired</span>
            </Badge>
            <div className="text-[11px] text-muted-foreground">
              Link expired
            </div>
          </div>
        );

      case "not_invited":
        return (
          <div className="text-xs text-muted-foreground">
            <span className="text-[11px] text-muted-foreground italic">Email ready, invite not queued</span>
          </div>
        );

      default:
        return (
          <span className="text-[11px] text-muted-foreground">
            Awaiting email setup
          </span>
        );
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Staff Provisioning & Portal Access</h1>
              <p className="text-sm text-muted-foreground">
                Automated cPanel mailbox provisioning and real-time Staff Portal invitation tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Onboarding */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Onboarding
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Candidates across all stages</p>
          </CardContent>
        </Card>

        {/* Pending Email Setup */}
        <Card className={stats.pending > 0 ? "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400">
              Pending Email
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {stats.pending}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Need corporate email mailbox</p>
          </CardContent>
        </Card>

        {/* Awaiting Portal Setup */}
        <Card className={stats.awaitingPortal > 0 ? "border-blue-500/30 bg-blue-50/10 dark:bg-blue-950/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400">
              Awaiting Portal Setup
            </CardTitle>
            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats.awaitingPortal}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Invite sent, pending activation</p>
          </CardContent>
        </Card>

        {/* Portal Active */}
        <Card className="border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Portal Activated
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {stats.portalActive}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Accepted invite & logged in</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="w-full min-w-0 overflow-hidden border">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff name, email, position, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg self-start md:self-auto">
              <Button
                variant={statusFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="text-xs h-8 px-3"
              >
                All ({stats.total})
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <Clock className="h-3 w-3" />
                <span>Pending Email ({stats.pending})</span>
              </Button>
              <Button
                variant={statusFilter === "awaiting_portal" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("awaiting_portal")}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <Mail className="h-3 w-3" />
                <span>Awaiting Setup ({stats.awaitingPortal})</span>
              </Button>
              <Button
                variant={statusFilter === "portal_active" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("portal_active")}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Portal Active ({stats.portalActive})</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[170px]">Staff Member</TableHead>
                  <TableHead className="min-w-[140px]">Personal Email</TableHead>
                  <TableHead className="min-w-[170px]">Corporate Work Email</TableHead>
                  <TableHead className="min-w-[130px]">Portal Account</TableHead>
                  <TableHead className="min-w-[110px]">Onboarding Form</TableHead>
                  <TableHead className="text-right min-w-[170px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Filter className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-medium text-sm">No onboarding records found</p>
                        <p className="text-xs text-muted-foreground">
                          {searchTerm ? "Try adjusting your search criteria." : "No candidates currently match this filter."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => {
                    const isAccepted = app.portal_status?.status === "accepted";
                    const canResendInvite =
                      Boolean(app.corporate_email) &&
                      !isAccepted &&
                      (app.portal_status?.status === "pending" || app.portal_status?.status === "expired" || app.portal_status?.status === "not_invited");

                    return (
                      <TableRow key={app.id} className="hover:bg-muted/30">
                        {/* Candidate Name & Position */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium text-foreground leading-tight">
                              {app.applicant_name || "Applicant (Name Pending)"}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                              <span>{app.position_title}</span>
                              <span>&bull;</span>
                              <span className="font-mono text-[11px]">{app.application_id}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Personal Email */}
                        <TableCell>
                          <div
                            className="font-mono text-xs text-muted-foreground truncate max-w-[180px]"
                            title={app.applicant_email}
                          >
                            {app.applicant_email}
                          </div>
                        </TableCell>

                        {/* Corporate Work Email Status */}
                        <TableCell>
                          {app.corporate_email ? (
                            <div className="space-y-0.5">
                              <Badge
                                variant="outline"
                                className="font-mono text-xs border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 gap-1 inline-flex items-center max-w-[210px]"
                              >
                                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate" title={app.corporate_email}>{app.corporate_email}</span>
                              </Badge>
                              {app.corporate_email_provisioned_at && (
                                <div className="text-[11px] text-muted-foreground">
                                  Provisioned on {new Date(app.corporate_email_provisioned_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-medium text-xs gap-1 inline-flex items-center"
                            >
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>Pending Setup</span>
                            </Badge>
                          )}
                        </TableCell>

                        {/* Portal Account Status (Tracking Accepted / Pending) */}
                        <TableCell>
                          {renderPortalStatus(app)}
                        </TableCell>

                        {/* Onboarding Stage */}
                        <TableCell>
                          {getApplicationStatusBadge(app.status)}
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            {/* Resend Onboarding Emails Button if pending/expired/not_invited */}
                            {canResendInvite && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={resendingId === app.id}
                                onClick={() => handleResendPortalInvite(app.id, app.corporate_email!)}
                                className="h-8 px-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1 shrink-0"
                                title="Ping cPanel & resend portal invite + credentials guide to personal email"
                              >
                                {resendingId === app.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Send className="h-3.5 w-3.5" />
                                )}
                                <span>Resend</span>
                              </Button>
                            )}

                            {/* Provision / Manage Email Dialog */}
                            <ProvisionEmailDialog
                              applicationId={app.id}
                              applicantName={app.applicant_name}
                              applicantEmail={app.applicant_email}
                              positionTitle={app.position_title}
                              corporateEmail={app.corporate_email}
                              corporateEmailProvisionedAt={app.corporate_email_provisioned_at}
                              formData={app.form_data}
                              compact={true}
                            />

                            {/* View Full HR Application */}
                            <Link href={`/hr/applications/${app.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                                title="View HR Application"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
