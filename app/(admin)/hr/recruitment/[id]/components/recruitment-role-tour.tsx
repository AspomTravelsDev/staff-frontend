"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const RECRUITMENT_ROLE_TOUR_STORAGE_KEY = "aspom_has_seen_recruitment_role_tour_v1";

const RECRUITMENT_ROLE_TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-role-header",
    popover: {
      title: "Role Workspace & Command Banner",
      description:
        "Welcome to the dedicated candidate workspace. Use this area to see the role status, upload candidates and open the role actions menu.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-role-instructions",
    popover: {
      title: "Custom AI Screening Prompts",
      description:
        "Tailor how Gemini AI screens applicants for this specific job. Set custom instructions, mandatory certifications, preferred tools, or specific experience levels to ensure candidates are evaluated precisely.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-upload-cv",
    popover: {
      title: "Upload Resumes & Batch AI Screening",
      description:
        "Upload single or multiple applicant resumes (PDF/Word). The AI instantly parses text, extracts candidate contact details, calculates an overall fit score (0-100%), and summarizes key strengths & weaknesses.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-pipeline-stages",
    popover: {
      title: "Recruitment Pipeline Stages",
      description:
        "Filter and monitor candidates across every stage of your hiring pipeline: Reviewing, Shortlisted, Interviewing, Offered, Accepted / Hired, and Rejected.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-candidate-search",
    popover: {
      title: "Search & Smart Sorting",
      description:
        "Quickly find candidates by name, email, extracted skills, or resume summary. Sort applicants dynamically by highest AI score, newest date added, or alphabetical order.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#tour-candidate-table",
    popover: {
      title: "Ranked Candidate Pipeline",
      description:
        "Review candidates ordered by AI fit score with matched skill badges and years of experience. Click a candidate's name or 'Evaluation' to inspect their full AI assessment breakdown.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#tour-candidate-stage-selector",
    popover: {
      title: "Advance Candidate Stage",
      description:
        "Move applicants through the pipeline with this dropdown. When a candidate reaches Interviewing, their Applicant Assessment becomes available from Actions.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#tour-send-offer",
    popover: {
      title: "Automated Offer Letter & Onboarding Bridge",
      description:
        "When ready to extend an offer, click 'Send Offer' to configure salary terms with bidirectional Gross/Net calculators and statutory tax exemption settings. The system automatically creates their Onboarding Application, generates official Offer Letter & NDA PDFs, and emails the complete onboarding package to the candidate!",
      side: "top",
      align: "end",
    },
  },
];

export function runRecruitmentRoleTour() {
  if (typeof window === "undefined") return;

  const activeSteps = RECRUITMENT_ROLE_TOUR_STEPS.filter((step) => {
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
        localStorage.setItem(RECRUITMENT_ROLE_TOUR_STORAGE_KEY, "true");
      } catch {
        // Ignore localStorage errors
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

export function RecruitmentRoleTour() {
  const triggerAutoTour = useCallback(() => {
    try {
      const hasSeen = localStorage.getItem(RECRUITMENT_ROLE_TOUR_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          runRecruitmentRoleTour();
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

export function RecruitmentRoleTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runRecruitmentRoleTour}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed"
      title="Take an interactive tour of the Candidate Pipeline Workspace"
    >
      <HelpCircle className="h-3.5 w-3.5 text-green-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
