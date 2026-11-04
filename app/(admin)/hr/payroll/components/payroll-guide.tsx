"use client";

import { useEffect, useRef, useState } from "react";
import type { Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const STEPS = [
  { target: "period", title: "Choose a payroll period", description: "Select the month you want to review. HR can create the next period when it is available." },
  { target: "summary", title: "Review the totals", description: "Full Staff and FHON totals show the whole payroll period. Searching the staff table does not change these totals." },
  { target: "workflow", title: "Follow the approval pipeline", description: "The highlighted stage shows where payroll stands. Available approval actions depend on your roles and the stage. Log & comments sits beside these actions." },
  { target: "comments", title: "Read history and discuss changes", description: "Open Log & comments to read approval history, comments and revision notes. Use Add comment beside it to write a note and choose HR, Accounts, Compliance, MP or MD to notify. Comments keep the current stage and editing permissions." },
  { target: "documents", title: "Check supporting documents", description: "Expand Supporting documents to view attendance, sanctions and to-do/report files, or download earlier versions. Upload controls appear when your roles and the current stage permit them." },
  { target: "search", title: "Find a staff member", description: "Search by name, staff ID, department or email. The matching count appears beside the field. Clear the search to show everyone again." },
  { target: "staff", title: "Review individual payroll entries", description: "Open a staff row or card to inspect the calculation. HR can adjust entries while payroll is in draft. Select all applies to the visible rows; changing the search clears selections." },
  { target: "export", title: "Export payroll", description: "Open Export for the available files. PDF exports use selected staff when you have a selection. The Full Staff and FHON CSV options export their entire group, regardless of the search." },
  { target: "actions", title: "Refresh and manage payroll", description: "Refresh payroll to fetch the latest data. HR also sees the management actions available for this period. You can replay this Quick Guide whenever you need it." },
] as const;

export function payrollGuideSteps(resolve: (selector: string) => Element | undefined): DriveStep[] {
  return STEPS.flatMap(step => {
    const element = resolve(`[data-payroll-tour="${step.target}"]`);
    return element ? [{ element, popover: { title: step.title, description: step.description } }] : [];
  });
}

export function PayrollGuide({ disabled = false }: { disabled?: boolean }) {
  const tour = useRef<Driver | null>(null);
  const mounted = useRef(true);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; tour.current?.destroy(); };
  }, []);

  async function start() {
    setLoading(true);
    try {
      const { driver } = await import("driver.js");
      if (!mounted.current) return;
      const steps = payrollGuideSteps(selector => Array.from(document.querySelectorAll(selector))
        .find(element => element.getClientRects().length > 0));
      if (!steps.length) return;
      tour.current?.destroy();
      tour.current = driver({ steps, showProgress: true, popoverClass: "aspom-tour-popover",
        nextBtnText: "Next", prevBtnText: "Back", doneBtnText: "Done",
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        disableActiveInteraction: true,
      });
      tour.current.drive();
    } catch { toast.error("Unable to open the guide. Please try again."); }
    finally { if (mounted.current) setLoading(false); }
  }

  return <Button type="button" variant="outline" className="h-9 gap-1.5" disabled={disabled || loading} onClick={() => void start()}><HelpCircle className="size-4" />{loading ? "Opening guide…" : "Quick Guide"}</Button>;
}
