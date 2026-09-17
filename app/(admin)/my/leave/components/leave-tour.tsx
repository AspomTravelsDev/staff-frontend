"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const LEAVE_TOUR_STORAGE_KEY = "aspom_has_seen_leave_tour_v1";

const LEAVE_TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-leave-header",
    popover: {
      title: "Leave & Absence Portal",
      description:
        "Welcome to your Leave Management hub! Plan your vacations, check available allowances, apply for time off, and track your request history.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-leave-stats",
    popover: {
      title: "Annual Allowances & Balances",
      description:
        "Monitor your leave balances at a glance: Remaining annual days (20 days for confirmed staff), Sick leave days (policy limit: max 3 instances per year), casual days taken, and total days absent.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-request-leave-btn",
    popover: {
      title: "Request Leave",
      description:
        "Click here to submit a time-off application. Choose from 10 leave categories (Annual, Sick, Casual, Exam/Study, Bereavement, Maternity, etc.), pick your start date to auto-calculate resumption, and attach optional handover notes or medical proof.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-leave-history",
    popover: {
      title: "Leave History & Status",
      description:
        "Review all past and ongoing leave requests. Color-coded badges show real-time status: Pending HR Review, Approved, or Rejected.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-leave-table",
    popover: {
      title: "Application Details & Notes",
      description:
        "Click any row in the table to open the detailed drawer where you can view supervisor comments, approved days, and download your uploaded attachments.",
      side: "top",
      align: "start",
    },
  },
];

export function runLeaveTour() {
  if (typeof window === "undefined") return;

  const activeSteps = LEAVE_TOUR_STEPS.filter((step) => {
    if (typeof step.element === "string") {
      return document.querySelector(step.element) !== null;
    }
    return true;
  });

  if (activeSteps.length === 0) return;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(15, 23, 42, 0.6)",
    popoverClass: "aspom-tour-popover",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Finish Tour ✓",
    steps: activeSteps,
    onDestroyStarted: () => {
      try {
        localStorage.setItem(LEAVE_TOUR_STORAGE_KEY, "true");
      } catch {
        // Ignore localStorage errors
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

export function LeaveTour() {
  const triggerAutoTour = useCallback(() => {
    try {
      const hasSeen = localStorage.getItem(LEAVE_TOUR_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          runLeaveTour();
        }, 900);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    return triggerAutoTour();
  }, [triggerAutoTour]);

  return null;
}

export function LeaveTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runLeaveTour}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed"
      title="Take an interactive tour of the Leave Management portal"
    >
      <HelpCircle className="h-3.5 w-3.5 text-green-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
