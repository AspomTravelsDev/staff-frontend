"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const DASHBOARD_TOUR_STORAGE_KEY = "aspom_has_seen_dashboard_tour_v1";

const DASHBOARD_TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-dashboard-header",
    popover: {
      title: "Welcome to ASPOM Portal",
      description:
        "Your centralized staff command center! Access daily attendance, tasks, leave requests, corporate updates, and live currency rates all in one place.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-clock-widget",
    popover: {
      title: "Header Time Clock & Location",
      description:
        "Your official clock is pinned to the header on every page. Clock in when arriving (before 9:05 AM for on-time arrival). Make sure device GPS is active to verify authorized office location.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-attendance-card",
    popover: {
      title: "Monthly Attendance & Punctuality",
      description:
        "Track your working days, on-time arrivals, and late days. Interactive colored dots indicate daily check-in status and proxy flag monitoring at a glance.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-leave-card",
    popover: {
      title: "Leave Days Remaining",
      description:
        "Check your available vacation balance. Confirmed employees receive 20 annual days. Click 'Request Leave' anytime to apply for time off.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#tour-awards-card",
    popover: {
      title: "My Awards & Recognition",
      description:
        "Track recognitions and awards received for exemplary work, milestone achievements, and staff of the month nominations.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#tour-exchange-rates",
    popover: {
      title: "Live FX Exchange Rates",
      description:
        "Official company bank exchange rates (USD, GBP, EUR) updated daily for ticketing, visa applications, and billing calculations.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-dashboard-quicklinks",
    popover: {
      title: "Quick Action Shortcuts",
      description:
        "Fast 1-click links to Request Leave, submit Late Requests, Submit Daily To-Dos, browse IT Information Desk guides, report IT issues, or submit confidential comments.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-dashboard-tasks",
    popover: {
      title: "Upcoming Deadlines & Tasks",
      description:
        "Stay on top of deliverables! View upcoming deadlines, overdue items, and complete tasks with 1-click right from your dashboard.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-dashboard-updates",
    popover: {
      title: "Company Announcements & Memos",
      description:
        "Stay informed with official company broadcasts, policy memos, and management updates published by HR.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-dashboard-celebrations",
    popover: {
      title: "Celebrations & Employee Spotlight",
      description:
        "Celebrate your colleagues! Highlights Staff of the Month winners, today's staff birthdays, and company work anniversaries.",
      side: "top",
      align: "end",
    },
  },
];

export function runDashboardTour() {
  if (typeof window === "undefined") return;

  const activeSteps = DASHBOARD_TOUR_STEPS.filter((step) => {
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
        localStorage.setItem(DASHBOARD_TOUR_STORAGE_KEY, "true");
      } catch {
        // Ignore localStorage errors
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

export function DashboardTour() {
  const triggerAutoTour = useCallback(() => {
    try {
      const hasSeen = localStorage.getItem(DASHBOARD_TOUR_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          runDashboardTour();
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

export function DashboardTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runDashboardTour}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed"
      title="Take an interactive tour of the ASPOM Staff Portal"
    >
      <HelpCircle className="h-3.5 w-3.5 text-green-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
