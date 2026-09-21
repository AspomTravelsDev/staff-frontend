"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const TOUR_STORAGE_KEY = "aspom_has_seen_task_tracker_tour_v1";

const TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-task-tracker-header",
    popover: {
      title: "Task Tracker & Deadlines",
      description:
        "Welcome to your personal task tracker! Log key action items, set custom deadlines, and receive automated email and push reminders before due dates arrive.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-add-task-btn",
    popover: {
      title: "Add New Task",
      description:
        "Click here to record a new task with its deadline (e.g. 'Upload client docs to cloud'), select a priority, and choose how many hours in advance to be reminded.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-task-stats",
    popover: {
      title: "Deadline Health & Stats",
      description:
        "Quick glance cards showing your pending tasks, upcoming deadlines (within 48 hours), overdue alerts, and completed tasks. Click any card to filter!",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-task-filters",
    popover: {
      title: "Tabs & Search Filters",
      description:
        "Switch between All, Pending, Due Soon, Overdue, and Completed tasks. You can also filter by priority level or search tasks by keyword.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-task-list",
    popover: {
      title: "Interactive Task Cards",
      description:
        "Check the box on any task to instantly mark it completed. Use the three-dot menu to edit details, adjust reminder timings, or remove items.",
      side: "top",
      align: "start",
    },
  },
];

export function runTaskTrackerTour() {
  if (typeof window === "undefined") return;

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
        // Ignore localStorage errors
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

export function TaskTrackerTour() {
  const triggerAutoTour = useCallback(() => {
    try {
      const hasSeen = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          runTaskTrackerTour();
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

export function TaskTrackerTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runTaskTrackerTour}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed"
      title="Take an interactive tour of Task Tracker & Deadlines"
    >
      <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
