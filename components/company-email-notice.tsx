"use client";

import { Mail } from "lucide-react";
import { toast } from "sonner";
import type { EmailRestriction } from "@/types/user-types";

export function CompanyEmailNotice({ restoring = false }: { restoring?: boolean }) {
  return <div className="rounded-lg border bg-muted/50 p-3 text-xs">
    <p className="flex items-center gap-2 font-semibold"><Mail className="size-4" />Company email {restoring ? "restoration" : "restriction"}</p>
    <p className="mt-1 leading-relaxed text-muted-foreground">{restoring ? "Reactivating staff also requests restoration of their company email login and sending. If restoration fails, the employee list will show the result and a retry option." : "Confirming inactive immediately requests a restriction on this staff member's company email login and sending. Incoming mail will continue, and the mailbox and existing messages will be preserved. If restriction fails, the employee list will show the result and a retry option."}</p>
  </div>;
}

export function notifyEmailRestriction(result?: EmailRestriction | null) {
  if (!result) return;
  if (result.status === "restricted" || result.status === "restored") toast.success(result.message);
  else if (result.status === "skipped") toast.info(result.message, { duration: 10000 });
  else toast.warning(result.message, { duration: 15000 });
}
