"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const TOUR_STORAGE_KEY = "aspom_has_seen_tasks_tour_v1";

const TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-tasks-header",
    popover: {
      title: "Daily Tasks & Reports",
      description:
        "Welcome! Use this workspace daily to plan your morning to-do list, track progress, and submit your end-of-day report before clocking out.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-tasks-stats",
    popover: {
      title: "Real-Time Progress",
      description:
        "Monitor your daily workload at a glance: total tasks, completed items, and ongoing tasks are tracked in real-time.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-add-task",
    popover: {
      title: "Add Morning Tasks",
      description:
        "Click here in the morning to list what you plan to accomplish today. Clear descriptions help supervisors understand your daily priorities.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#tour-tasks-container",
    popover: {
      title: "Track & Complete Tasks",
      description:
        "Check the box as you finish each task throughout the day. You can also edit text or delete items whenever needed.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-save-actions",
    popover: {
      title: "Autosave & Manual Sync",
      description:
        "Your task changes autosave in the background as you type. You can also click 'Save Changes' at any time to immediately push updates.",
      side: "top",
      align: "end",
    },
  },
  {
    element: "#tour-submit-report",
    popover: {
      title: "Submit End-of-Day Report",
      description:
        "Before closing for the day, submit your final report. Note: Submitting locks your tasks for the day and finalizes your submission for supervisors.",
      side: "top",
      align: "end",
    },
  },
  {
    element: "#tour-task-history",
    popover: {
      title: "Task History & Reports",
      description:
        "Review past daily logs, filter by custom date ranges, inspect individual tasks, and export your records to Excel or CSV.",
      side: "top",
      align: "start",
    },
  },
];

export function runTasksTour() {
  if (typeof window === "undefined") return;

  // Filter steps to only those elements currently present in the DOM
  const activeSteps = TOUR_STEPS.filter((step) => {
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
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
      } catch {
        // Ignore localStorage errors (e.g. private browsing)
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

export function TasksTour() {
  const triggerAutoTour = useCallback(() => {
    try {
      const hasSeen = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!hasSeen) {
        // Allow DOM to settle before auto-launching
        const timer = setTimeout(() => {
          runTasksTour();
        }, 800);
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

export function TasksTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runTasksTour}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed"
      title="Take an interactive tour of Daily Tasks & Reports"
    >
      <HelpCircle className="h-3.5 w-3.5 text-green-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
