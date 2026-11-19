"use client";

import { useCallback, useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PerformanceTourId =
  | "my-performance"
  | "self-appraisal"
  | "review-queue"
  | "period-reviews"
  | "review-editor";

const TOUR_STEPS: Record<PerformanceTourId, DriveStep[]> = {
  "my-performance": [
    {
      element: "#tour-my-perf-header",
      popover: {
        title: "Your Performance & Appraisals",
        description:
          "Track open Monthly KPI and Bi-Yearly Appraisal windows, submit your self-assessment, and follow your review progress through to the final result.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-my-perf-available",
      popover: {
        title: "Start an Open Assessment",
        description:
          "When HR opens an Appraisal or Monthly KPI window, click a cycle button here to launch your self-assessment before the deadline.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-my-perf-metrics",
      popover: {
        title: "Performance Snapshot",
        description:
          "See how many assessments are assigned to you, which ones still need your submission, how many are finished, and your overall average score out of 5.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-my-perf-filters",
      popover: {
        title: "Find Any Cycle",
        description:
          "Filter between assessments awaiting your input and completed or in-review cycles, or search by month or department.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "#tour-my-perf-history",
      popover: {
        title: "Stage-by-Stage Tracking & Results",
        description:
          "Follow every stage (Staff → Supervisor → HR / Compliance → Management / MP), check your final average once complete, and click any row to open or view.",
        side: "top",
        align: "start",
      },
    },
  ],
  "self-appraisal": [
    {
      element: "#tour-self-header",
      popover: {
        title: "Self-Assessment Overview",
        description:
          "Shows the appraisal cycle, your department, submission deadline, and whether your assessment is a draft, submitted, or completed.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-self-scale",
      popover: {
        title: "1–5 Scoring Scale",
        description:
          "Rate each criterion from 1 (Unsatisfactory, <50%) to 5 (Exceptional, >90%). Press Enter inside any rating box to jump to the next row.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-self-table",
      popover: {
        title: "Score Each Criterion",
        description:
          "Enter your 1–5 rating for each criterion (and comments where applicable). Your total points and average out of 5 update automatically below.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-self-comments",
      popover: {
        title: "Achievements & Reflections",
        description:
          "Summarize your key job achievements and initiatives achieved during the period before submitting.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-self-actions",
      popover: {
        title: "Save Draft or Submit",
        description:
          "Save a private draft anytime and return later, or click Submit assessment once all fields are complete to send it to your reviewer.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-self-readonly",
      popover: {
        title: "Submitted Ratings & Feedback",
        description:
          "Your self-assessment is locked. Once reviewers complete their stages, their ratings, comments, and your final average appear below.",
        side: "top",
        align: "start",
      },
    },
  ],
  "review-queue": [
    {
      element: "#tour-rq-window",
      popover: {
        title: "Open & Manage Cycles",
        description:
          "HR can open a new Bi-Yearly Appraisal (Jan–Jun or Jul–Dec) or Monthly KPI window and set its submission deadline.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-rq-tabs",
      popover: {
        title: "Switch Between Cycles",
        description:
          "Toggle between Bi-Yearly Appraisals and Monthly KPI Reviews to view periods and pending reviews for each type.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-rq-metrics",
      popover: {
        title: "Queue Overview",
        description:
          "Monitor how many reviews are ready for your action right now, assigned in your queue, submitted overall, or completed.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-rq-filters",
      popover: {
        title: "Search & Filter Periods",
        description:
          "Search by year-month (e.g. 2026-12) or filter by period status (Open, Closed, Draft).",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-rq-table",
      popover: {
        title: "Open a Period to Review",
        description:
          "Click View (or any row) to open the staff submissions for that period. HR can also edit deadlines or close an open window here.",
        side: "top",
        align: "start",
      },
    },
  ],
  "period-reviews": [
    {
      element: "#tour-pr-header",
      popover: {
        title: "Period Details & Status",
        description:
          "Shows the selected cycle, submission deadline, and whether the window is currently open or closed.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-pr-metrics",
      popover: {
        title: "Cycle Progress",
        description:
          "See how many staff reviews are ready for your review now, in your queue, submitted, and completed for this period.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-pr-filters",
      popover: {
        title: "Filter Staff Reviews",
        description:
          "Search by staff name or ID, or filter by workflow status and department to find specific submissions quickly.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-pr-table",
      popover: {
        title: "Stage Progress & Final Average",
        description:
          "Track each staff member's current stage, stage badges, and final average once complete. Click Review or View to open their appraisal.",
        side: "top",
        align: "start",
      },
    },
  ],
  "review-editor": [
    {
      element: "#tour-re-header",
      popover: {
        title: "Review Context & Stage",
        description:
          "Displays the staff member, department, deadline, and the stage you are reviewing (Supervisor, HR, Compliance, or Management / MP).",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-re-averages",
      popover: {
        title: "Stage Averages Side-by-Side",
        description:
          "Compare the Staff average against Supervisor / Compliance and Management averages in real time as you enter your ratings.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-re-table",
      popover: {
        title: "Preceding Scores & Your Ratings",
        description:
          "Earlier scores are read-only for reference. Enter your 1–5 ratings in the highlighted column (press Enter to advance to the next row).",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-re-comments",
      popover: {
        title: "Review Comments & Recommendations",
        description:
          "Read staff and earlier reviewer comments, then fill in your required review feedback below.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-re-actions",
      popover: {
        title: "Save Draft or Submit Review",
        description:
          "Save a private draft anytime, or submit to lock your assessment and advance the appraisal to the next stage (or complete it).",
        side: "top",
        align: "start",
      },
    },
  ],
};

function storageKey(tourId: PerformanceTourId): string {
  return `aspom_has_seen_performance_tour_${tourId}_v1`;
}

export function runPerformanceTour(tourId: PerformanceTourId) {
  if (typeof window === "undefined") return;

  const activeSteps = TOUR_STEPS[tourId].filter((step) => {
    if (typeof step.element !== "string") return true;
    const node = document.querySelector(step.element);
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
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
        localStorage.setItem(storageKey(tourId), "true");
      } catch {
        // Ignore localStorage errors
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

export function PerformanceTour({ tourId }: { tourId: PerformanceTourId }) {
  const triggerAutoTour = useCallback(() => {
    try {
      const hasSeen = localStorage.getItem(storageKey(tourId));
      if (!hasSeen) {
        const timer = setTimeout(() => {
          runPerformanceTour(tourId);
        }, 900);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [tourId]);

  useEffect(() => {
    return triggerAutoTour();
  }, [triggerAutoTour]);

  return null;
}

export function PerformanceTourButton({ tourId }: { tourId: PerformanceTourId }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => runPerformanceTour(tourId)}
      className="flex items-center gap-1.5 border-dashed text-xs text-muted-foreground hover:text-foreground"
      title="Take an interactive tour of this page"
    >
      <HelpCircle className="h-3.5 w-3.5 text-green-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
