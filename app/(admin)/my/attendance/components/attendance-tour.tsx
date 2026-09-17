"use client";

import { useEffect, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "../../tasks/components/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const ATTENDANCE_TOUR_STORAGE_KEY = "aspom_has_seen_attendance_tour_v2";

const ATTENDANCE_TOUR_STEPS: DriveStep[] = [
  {
    element: "#tour-attendance-header",
    popover: {
      title: "My Attendance Dashboard",
      description:
        "Welcome to your Attendance hub! Monitor your daily presence, arrival punctuality, working hours, and late permission requests.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-clock-widget",
    popover: {
      title: "Site Header: Clock In & Clock Out",
      description:
        "Your official time clock is always located in the top header on every page. Click 'Clock In Now' when you arrive (arrive before 9:05 AM to be recorded as on-time). At the end of your shift, click 'Clock Out' here to complete your workday.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-clock-widget",
    popover: {
      title: "📍 Location & Authorized Sites",
      description:
        "Important: Ensure your device's location (GPS) is turned on and allow browser location permissions when prompted! Clock-ins are geofenced and IP-verified—you must be physically present at an authorized office or designated work premises for your clock-in to be accepted.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-late-request-btn",
    popover: {
      title: "Request Late Permission",
      description:
        "Delayed due to traffic, transit, or an emergency? Click here to submit an official late permission request with your reason for HR review and approval.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-attendance-stats",
    popover: {
      title: "Punctuality & Shift Overview",
      description:
        "Track your lifetime clock-in records: On-time arrivals (< 9:05 AM), excused vs unexcused late days, and your average daily working duration.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-attendance-tabs",
    popover: {
      title: "Attendance Logs & Requests",
      description:
        "Inspect your historical check-in and check-out logs with duration and verification details, or toggle to the 'My Late Requests' tab to check approval statuses.",
      side: "top",
      align: "start",
    },
  },
];

export function runAttendanceTour() {
  if (typeof window === "undefined") return;

  // Filter steps to only those elements currently present in the DOM
  const activeSteps = ATTENDANCE_TOUR_STEPS.filter((step) => {
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
        localStorage.setItem(ATTENDANCE_TOUR_STORAGE_KEY, "true");
      } catch {
        // Ignore localStorage errors (e.g. private browsing)
      }
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

export function AttendanceTour() {
  const triggerAutoTour = useCallback(() => {
    try {
      const hasSeen = localStorage.getItem(ATTENDANCE_TOUR_STORAGE_KEY);
      if (!hasSeen) {
        // Allow DOM and header widget to mount before launching
        const timer = setTimeout(() => {
          runAttendanceTour();
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

export function AttendanceTourButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={runAttendanceTour}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed"
      title="Take an interactive tour of the Attendance page and Clock In / Clock Out"
    >
      <HelpCircle className="h-3.5 w-3.5 text-green-600" />
      <span>Quick Guide</span>
    </Button>
  );
}
