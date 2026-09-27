"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const TOUR_STORAGE_KEY = "aspom_has_seen_task_tracker_tour_v2";

const TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-task-tracker-header",
    popover: {
      title: "Task Tracker & Deadlines Hub",
      description:
        "Welcome to ASPOM's centralized Task Tracker! Designed for accountability and timely delivery, this hub lets you manage personal commitments, assign and track deliverables across colleagues, set automated reminders, and prevent missed deadlines.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-view-switcher",
    popover: {
      title: "Dual Workspaces: Personal vs Delegated",
      description:
        "Switch effortlessly between two focused views:<ul><li><strong>My Deliverables:</strong> Tasks where you are the responsible owner.</li><li><strong>Delegated to Colleagues:</strong> Tasks you have assigned to team members across departments.</li></ul>The badges display the live number of active items in each workspace.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-view-my-deliverables",
    popover: {
      title: "My Deliverables Workspace",
      description:
        "Your personal accountability board:<ul><li>Review self-assigned action items and deliverables delegated to you by supervisors or peers.</li><li>Monitor countdown badges and dynamic timeline progress bars.</li><li>Submit deadline extension requests with explanations if blockers arise.</li><li>Check off completed items to log verified on-time records.</li></ul>",
      side: "bottom",
      align: "start",
    },
    onHighlightStarted: (_element, _step, { driver }) => {
      const myDeliverablesBtn = document.querySelector("#tour-view-my-deliverables") as HTMLButtonElement | null;
      if (myDeliverablesBtn && myDeliverablesBtn.getAttribute("data-active") !== "true") {
        myDeliverablesBtn.click();
        setTimeout(() => driver.refresh(), 120);
      }
    },
  },
  {
    element: "#tour-view-delegated",
    popover: {
      title: "Delegated to Colleagues Tab",
      description:
        "Assign and monitor cross-department deliverables with full transparency:<ul><li><strong>Cross-Team Delegation:</strong> Assign action items directly to any staff member in the company.</li><li><strong>Real-Time Accountability:</strong> See who is working on what, their remaining time, and whether they are approaching deadlines.</li><li><strong>Extension Governance:</strong> When a colleague requests extra time, a review prompt appears directly on their card to <strong>Approve</strong> or <strong>Decline</strong> with feedback.</li><li><strong>Automated Alerts:</strong> Assigned colleagues receive automated push and email notifications.</li></ul><em>We have switched to this tab so you can preview the live delegated workspace!</em>",
      side: "bottom",
      align: "start",
    },
    onHighlightStarted: (_element, _step, { driver }) => {
      const delegatedBtn = document.querySelector("#tour-view-delegated") as HTMLButtonElement | null;
      if (delegatedBtn && delegatedBtn.getAttribute("data-active") !== "true") {
        delegatedBtn.click();
        setTimeout(() => driver.refresh(), 120);
      }
    },
  },
  {
    element: "#tour-add-task-btn",
    popover: {
      title: "Add & Delegate Deliverables",
      description:
        "Click here to record a deliverable or assign work to a colleague:<ul><li><strong>Assignee:</strong> Assign to yourself or select any colleague across company departments.</li><li><strong>Title & Description:</strong> Clearly describe deliverables, scope, and instructions.</li><li><strong>Deadline & Priority:</strong> Set specific due date and time, and assign priority (Urgent, High, Medium, Low).</li><li><strong>Automated Reminders:</strong> Configure lead-time alerts (1h, 12h, 24h, 48h) delivered via Web Push and Email.</li></ul>",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-task-stats",
    popover: {
      title: "Deadline Health & Metrics",
      description:
        "Real-time overview of current deliverable velocity:<ul><li><strong>Active Tasks:</strong> Total deliverables currently in progress.</li><li><strong>Due in 48h:</strong> Amber alerts for deliverables with approaching deadlines.</li><li><strong>Overdue:</strong> Rose warning cards for overdue items needing immediate action.</li><li><strong>Completed:</strong> Finished deliverables with recorded timestamps.</li></ul><em>Click any stat card to quickly filter your task list!</em>",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-task-filters",
    popover: {
      title: "Status Tabs, Priority & Live Search",
      description:
        "Easily filter and find any deliverable:<ul><li><strong>Status Tabs:</strong> Switch among All, Pending, Due Soon, Overdue, and Completed.</li><li><strong>Priority Selector:</strong> Filter deliverables by Urgent, High, Medium, or Low priority.</li><li><strong>Search Bar:</strong> Search instantly by deliverable title, notes, or colleague name.</li></ul>",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-task-list",
    popover: {
      title: "Interactive Deliverable Cards & Timelines",
      description:
        "Cards provide rich real-time context:<ul><li><strong>Check to Complete:</strong> Instantly record completion and verify whether it was on-time.</li><li><strong>Visual Timeline:</strong> Progress bar displaying % of elapsed time from creation to deadline.</li><li><strong>Colleague Badges:</strong> Clear indicators displaying the assigner or assigned teammate with avatar and department.</li><li><strong>Action Menu (•••):</strong> Edit task details, adjust reminder alert thresholds, or delete items.</li></ul>",
      side: "top",
      align: "start",
    },
  },
];

export function runTaskTrackerTour() {
  if (typeof window === "undefined") return;

  const delegatedBtn = document.querySelector("#tour-view-delegated") as HTMLButtonElement | null;
  const initialView = delegatedBtn?.getAttribute("data-active") === "true" ? "assigned_by_me" : "assigned_to_me";

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
    doneBtnText: "Got it! ✓",
    steps: activeSteps,
    onDestroyStarted: () => {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
      } catch {
        // Ignore localStorage errors
      }

      // Restore initial tab if user started on My Deliverables
      if (initialView === "assigned_to_me") {
        const myDeliverablesBtn = document.querySelector("#tour-view-my-deliverables") as HTMLButtonElement | null;
        if (myDeliverablesBtn && myDeliverablesBtn.getAttribute("data-active") !== "true") {
          myDeliverablesBtn.click();
        }
      } else {
        const delBtn = document.querySelector("#tour-view-delegated") as HTMLButtonElement | null;
        if (delBtn && delBtn.getAttribute("data-active") !== "true") {
          delBtn.click();
        }
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
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed cursor-pointer"
      title="Take an interactive tour of Task Tracker & Deadlines"
    >
      <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
