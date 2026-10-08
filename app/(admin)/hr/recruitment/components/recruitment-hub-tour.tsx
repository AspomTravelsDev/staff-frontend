"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const RECRUITMENT_HUB_TOUR_STORAGE_KEY = "aspom_has_seen_recruitment_hub_tour_v1";

const RECRUITMENT_HUB_TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-recruitment-header",
    popover: {
      title: "Recruitment & Hiring Hub",
      description:
        "Welcome to ASPOM's centralized recruitment hub! Create hiring campaigns, automatically screen candidate resumes with Gemini AI, run structured rubric assessments, and seamlessly bridge hired talent into onboarding.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-recruitment-stats",
    popover: {
      title: "Pipeline Health & Metrics",
      description:
        "Track active job openings, total applicants screened, candidates currently in interview stages, and newly hired talent transitioning into employee onboarding.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-create-role",
    popover: {
      title: "Create Campaign & Link Staff Requests",
      description:
        "Start a new hiring campaign here. You can link directly to an approved Department Staff Request (auto-populating department, openings, and title) or create a custom role with customized evaluation criteria tags and salary budgets.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-create-rubric",
    popover: {
      title: "Quick Interview Rubric",
      description:
        "Create an interview rubric for an applicant who is not in the portal. Fill in their details, scores, and interview notes, then download the PDF without uploading a CV or creating a recruitment role.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-roles-table",
    popover: {
      title: "Campaigns Directory & Management",
      description:
        "View and manage all recruitment campaigns. Review candidate progress by stage and click 'Open Workspace' on any role to screen CVs, evaluate applicants, and dispatch offer letters.",
      side: "top",
      align: "start",
    },
  },
];

export function runRecruitmentHubTour() {
  if (typeof window === "undefined") return;

  const activeSteps = RECRUITMENT_HUB_TOUR_STEPS.filter((step) => {
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
        localStorage.setItem(RECRUITMENT_HUB_TOUR_STORAGE_KEY, "true");
      } catch {
        // Ignore localStorage errors
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

export function RecruitmentHubTour() {
  const triggerAutoTour = useCallback(() => {
    try {
      const hasSeen = localStorage.getItem(RECRUITMENT_HUB_TOUR_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          runRecruitmentHubTour();
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

export function RecruitmentHubTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runRecruitmentHubTour}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed"
      title="Take an interactive tour of the Recruitment Hub"
    >
      <HelpCircle className="h-3.5 w-3.5 text-green-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
