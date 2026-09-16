"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  UserCheck,
  Building,
} from "lucide-react";
import { 
  provisionCorporateEmailAction,
  checkCpanelEmailAction 
} from "../../actions";
import {
  getRolesForSelect,
  ROLE_TO_DEPARTMENT_FALLBACK,
  type UserRole,
} from "@/types/user-types";

interface ProvisionEmailDialogProps {
  applicationId: string;
  applicantName: string | null;
  applicantEmail: string;
  positionTitle: string;
  corporateEmail?: string | null;
  corporateEmailProvisionedAt?: string | null;
  formData?: Record<string, unknown> | null;
  compact?: boolean;
}

function generateRandomPassword(length = 14): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const nums = "23456789";
  const syms = "!@#$%*";
  const chars = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    nums[Math.floor(Math.random() * nums.length)],
    syms[Math.floor(Math.random() * syms.length)],
  ];
  const all = upper + lower + nums + syms;
  for (let i = 4; i < length; i++) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }
  return chars.sort(() => Math.random() - 0.5).join("");
}

function guessRoleFromPosition(position: string): UserRole {
  const pos = position.toLowerCase();
  if (pos.includes("super") || pos.includes("managing partner")) return "mp";
  if (pos.includes("director") || pos.includes("executive")) return "md";
  if (pos.includes("it") || pos.includes("developer") || pos.includes("tech"))
    return "it";
  if (
    pos.includes("account") ||
    pos.includes("finance") ||
    pos.includes("audit")
  )
    return "account";
  if (pos.includes("visa") || pos.includes("travel")) return "visa";
  if (pos.includes("hr") || pos.includes("human resources")) return "hr";
  if (
    pos.includes("social") ||
    pos.includes("media") ||
    pos.includes("content")
  )
    return "social-media";
  if (pos.includes("compliance") || pos.includes("legal")) return "compliance";
  if (pos.includes("birth") || pos.includes("maternity"))
    return "birth-services";
  if (pos.includes("holiday") || pos.includes("tour")) return "holidays";
  if (pos.includes("ticket") || pos.includes("booking") || pos.includes("flight"))
    return "ticket";
  if (pos.includes("assistant") || pos.includes("office"))
    return "office-assistant";
  return "admin";
}

export function ProvisionEmailDialog({
  applicationId,
  applicantName,
  applicantEmail,
  positionTitle,
  corporateEmail,
  corporateEmailProvisionedAt,
  formData,
  compact = false,
}: ProvisionEmailDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cpanelPing, setCpanelPing] = useState<{
    loading: boolean;
    exists?: boolean;
    configured?: boolean;
    tested: boolean;
    error?: string;
  }>({ loading: false, tested: false });

  // Suggest initial email username
  const suggestedUsername = useMemo(() => {
    if (corporateEmail) {
      return corporateEmail.split("@")[0] || "";
    }

    const personal = formData?.personal as Record<string, string> | undefined;
    let first = personal?.firstName || "";
    let last = personal?.lastName || "";

    if (!first && applicantName) {
      const parts = applicantName.trim().split(/\s+/);
      first = parts[0] || "";
      last = parts.length > 1 ? parts[parts.length - 1] : "";
    }

    const cleanFirst = first.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanLast = last.toLowerCase().replace(/[^a-z0-9]/g, "");
    const firstLetterOfLast = cleanLast ? cleanLast.charAt(0) : "a";

    return cleanFirst ? `${cleanFirst}.${firstLetterOfLast}` : "staff.user";
  }, [corporateEmail, formData, applicantName]);

  const initialGuessedRole = useMemo(
    () => guessRoleFromPosition(positionTitle),
    [positionTitle]
  );

  // Map department directly from role instead of reporting_to
  const initialDept = useMemo(() => {
    return (
      ROLE_TO_DEPARTMENT_FALLBACK[initialGuessedRole as UserRole] ||
      "General"
    );
  }, [initialGuessedRole]);

  const initialEffectiveDate = useMemo(() => {
    const terms = formData?.employment_terms as Record<string, string> | undefined;
    if (terms?.effective_date) {
      const parsed = new Date(terms.effective_date);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return undefined;
  }, [formData]);

  // Form State
  const [emailUsername, setEmailUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState(() => generateRandomPassword());
  const [role, setRole] = useState<UserRole>(initialGuessedRole);
  const [department, setDepartment] = useState(initialDept);
  const [dateJoined, setDateJoined] = useState<Date | undefined>(initialEffectiveDate);
  const [staffId, setStaffId] = useState("");
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [sendPortalInvite, setSendPortalInvite] = useState(true);
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);

  const roleOptions = useMemo(() => getRolesForSelect(), []);

  // When role changes, auto-suggest department based on role
  const handleRoleChange = (newRole: string) => {
    setRole(newRole as UserRole);
    const suggestedDept = ROLE_TO_DEPARTMENT_FALLBACK[newRole as UserRole];
    if (suggestedDept) {
      setDepartment(suggestedDept);
    }
  };

  const handlePingCpanel = async () => {
    setCpanelPing({ loading: true, tested: false });
    try {
      const res = await checkCpanelEmailAction(applicationId);
      setCpanelPing({
        loading: false,
        tested: true,
        exists: res.cpanel_check.exists,
        configured: res.cpanel_check.configured,
        error: res.cpanel_check.error,
      });
      if (res.cpanel_check.exists) {
        toast.success(`cPanel Verified: ${res.corporate_email} exists on mail server!`);
      } else if (res.cpanel_check.configured) {
        toast.warning(`cPanel Ping: Mailbox ${res.corporate_email} not found.`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to ping cPanel";
      setCpanelPing({
        loading: false,
        tested: true,
        exists: false,
        error: errorMsg,
      });
      toast.error(errorMsg);
    }
  };

  // Reset form to defaults when opening dialog
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setEmailUsername(suggestedUsername);
      if (!password) {
        setPassword(generateRandomPassword());
      }
      setRole(initialGuessedRole);
      setDepartment(initialDept);
      setDateJoined(initialEffectiveDate);
      setStaffId("");
      setIsSupervisor(false);
    }
    setIsOpen(open);
  };

  const handleRegeneratePassword = () => {
    setPassword(generateRandomPassword());
  };

  const handleSubmit = async () => {
    const cleanUsername = emailUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (!cleanUsername) {
      toast.error("Please enter a valid email username");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await provisionCorporateEmailAction(applicationId, {
        email_username: cleanUsername,
        password,
        send_portal_invite: sendPortalInvite,
        send_credentials_email: sendCredentialsEmail,
        role: role || undefined,
        department: department.trim() || undefined,
        staff_id: staffId.trim() || undefined,
        date_joined: dateJoined ? format(dateJoined, "yyyy-MM-dd") : undefined,
        is_supervisor: isSupervisor,
      });

      if (!result.portal_invite_sent && !result.credentials_email_sent) {
        toast.warning(
          `Corporate email saved (${result.corporate_email}), but invitation and credentials emails could not be delivered.`
        );
      } else if (!result.portal_invite_sent) {
        toast.warning(
          `Corporate email saved (${result.corporate_email}) & credentials sent, but portal activation invite failed to dispatch.`
        );
      } else if (!result.credentials_email_sent) {
        toast.warning(
          `Corporate email saved (${result.corporate_email}) & portal invite sent, but onboarding guide failed to dispatch to personal email.`
        );
      } else {
        toast.success(
          `Corporate email provisioned: ${result.corporate_email}! Welcome guide & portal activation dispatched.`
        );
      }
      setIsOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to provision email";
      toast.error(message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProvisioned = Boolean(corporateEmail);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isProvisioned ? (
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            className={cn(
              "gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 whitespace-nowrap",
              compact ? "h-8 px-2.5 text-xs" : "gap-2"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Manage Email</span>
            {!compact && corporateEmail && (
              <Badge
                variant="secondary"
                className="font-mono text-xs ml-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
              >
                {corporateEmail}
              </Badge>
            )}
          </Button>
        ) : (
          <Button
            variant="default"
            size={compact ? "sm" : "default"}
            className={cn(
              "gap-1.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-sm whitespace-nowrap",
              compact ? "h-8 px-2.5 text-xs" : "gap-2"
            )}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span>Provision Email</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {isProvisioned
                  ? "Update Corporate Email & Portal Access"
                  : "Provision Corporate Email & Portal Access"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Create the cPanel mailbox and configure their Staff Portal account assignment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Candidate Overview Card */}
          <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Staff Member:</span>
              <span className="font-semibold text-foreground">{applicantName || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Offered Position:</span>
              <span className="font-medium text-foreground">{positionTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Personal Email:</span>
              <span className="font-mono font-medium text-foreground">{applicantEmail}</span>
            </div>
            {corporateEmailProvisionedAt && (
              <div className="flex justify-between pt-1 border-t border-dashed">
                <span className="text-muted-foreground">Previously Provisioned:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {new Date(corporateEmailProvisionedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* SECTION 1: Corporate Email & Credentials */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wide">
                  Company Email & Mailbox
                </h3>
              </div>
              {isProvisioned && (
                <button
                  type="button"
                  onClick={handlePingCpanel}
                  disabled={cpanelPing.loading}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium disabled:opacity-50 px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  title="Ping cPanel server to verify if mailbox exists"
                >
                  <RefreshCw className={`h-3 w-3 ${cpanelPing.loading ? "animate-spin" : ""}`} />
                  <span>{cpanelPing.loading ? "Checking..." : "Ping cPanel"}</span>
                </button>
              )}
            </div>

            {cpanelPing.tested && (
              <div className={`text-xs px-2.5 py-1.5 rounded border flex items-center gap-2 ${
                cpanelPing.exists
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                  : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
              }`}>
                {cpanelPing.exists ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                )}
                <span>
                  {cpanelPing.exists
                    ? "cPanel Mailbox Verified: Account confirmed active on mail server."
                    : (cpanelPing.error || "Mailbox not found on cPanel. It will be created when saving.")}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email_username" className="text-xs font-medium">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center">
                <Input
                  id="email_username"
                  value={emailUsername}
                  onChange={(e) => setEmailUsername(e.target.value.toLowerCase())}
                  placeholder="firstname.l"
                  className="rounded-r-none font-mono text-sm h-9"
                />
                <span className="inline-flex items-center px-3 py-1.5 border border-l-0 rounded-r-md bg-muted text-muted-foreground text-xs font-mono select-none h-9">
                  @aspomtravels.com
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Standard format: <code>firstname.lastinitial@aspomtravels.com</code>
              </p>
            </div>

            {/* Temporary Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">
                  Initial Mailbox Password <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </button>
              </div>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono text-sm h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Staff will receive this in their onboarding guide to access Webmail / Outlook.
              </p>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* SECTION 2: Staff Portal Assignment & Roles (Matching Invite Form) */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wide">
                Staff Portal Role & Assignment
              </h3>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* System Role */}
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs font-medium">
                  System Role <span className="text-destructive">*</span>
                </Label>
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role" className="h-9 text-xs">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs font-medium">
                  Department
                </Label>
                <div className="relative">
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. IT, HR, Visa"
                    className="h-9 text-xs"
                  />
                  <Building className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* Date Joined */}
              <div className="space-y-1.5">
                <Label htmlFor="date_joined" className="text-xs font-medium">
                  Date of Joining <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <DatePicker
                  value={dateJoined}
                  onChange={setDateJoined}
                  placeholder="Pick start date"
                  className="h-9 w-full text-xs"
                />
              </div>

              {/* Staff ID */}
              <div className="space-y-1.5">
                <Label htmlFor="staff_id" className="text-xs font-medium">
                  Staff ID <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="staff_id"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. ASPOM-042"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Supervisor Privileges Switch */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="is_supervisor" className="text-xs font-medium cursor-pointer">
                  Supervisor Privileges
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Grant department oversight and approval capabilities upon activation.
                </p>
              </div>
              <Switch
                id="is_supervisor"
                checked={isSupervisor}
                onCheckedChange={setIsSupervisor}
              />
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* SECTION 3: Delivery Options */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wide">
              Delivery & Notifications
            </h3>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="send_portal"
                checked={sendPortalInvite}
                onCheckedChange={(checked) => setSendPortalInvite(Boolean(checked))}
              />
              <div className="grid gap-0.5 leading-none">
                <label
                  htmlFor="send_portal"
                  className="text-xs font-medium cursor-pointer"
                >
                  Send Staff Portal onboarding activation to company email
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Dispatches an activation link to the newly created company inbox to set their portal password.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="send_credentials"
                checked={sendCredentialsEmail}
                onCheckedChange={(checked) => setSendCredentialsEmail(Boolean(checked))}
              />
              <div className="grid gap-0.5 leading-none">
                <label
                  htmlFor="send_credentials"
                  className="text-xs font-medium cursor-pointer"
                >
                  Send IT Onboarding Guide & credentials to personal email
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Delivers PDF setup guide, webmail login instructions, and temporary password to {applicantEmail}.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs h-9 font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Provisioning & Dispatching...</span>
              </>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5" />
                <span>{isProvisioned ? "Re-provision & Resend" : "Provision & Dispatch Invites"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
