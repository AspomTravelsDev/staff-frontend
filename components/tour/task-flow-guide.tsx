"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const guides: Record<"staff" | "operations", { key: string; steps: DriveStep[] }> = {
  staff: { key: "aspom_task_tracker_guide_v5", steps: [
    { element: "#tour-task-tracker-header", popover: { title: "Plan all your deadlines here", description: "My tasks brings your personal tasks and tasks others assigned to you into one list. Use this screen to plan your work." } },
    { element: "#tour-view-switcher", popover: { title: "Choose the tasks you want to see", description: "My tasks shows work you need to do. Tasks I assigned shows work you gave to colleagues, so you can follow their progress and review their work." } },
    { element: "#tour-task-stats", popover: { title: "Your deadlines at a glance", description: "See active work, deadlines within 48 hours, overdue tasks and completed work. Click a card to filter the table. The counts follow your selected ownership view." } },
    { element: "#tour-add-task-btn", popover: { title: "Create or assign work", description: "Choose yourself for a personal task, or a colleague for an assigned deliverable. Describe the expected result, deadline and priority. Personal tasks can repeat. Email and push reminders follow the displayed deadline milestones." } },
    { element: "#tour-task-filters", popover: { title: "Find the work you need", description: "Active tasks open by default. Switch to Review, Completed or All, and search by task or colleague. Open Filters for priority, overdue, due soon and cancelled tasks." } },
    { element: "#tour-task-list", popover: { title: "Details in one place, actions in another", description: "Click a task name to read its details, comments, updates and history in the side sheet. Open Actions on its table row to begin work, submit work, add an update, edit or review a submission. You only see actions available to you." } },
    { popover: { title: "Need more time?", description: "Open Actions on the task’s table row and choose Request more time. Give a reason and a later deadline. The existing deadline stays in effect until the person who assigned the task approves it. They can approve or decline from the same Actions popover." } },
    { popover: { title: "Review, feedback and history", description: "Assigners can accept submissions or request changes. Staff can then revise and resubmit. Comments are shared with the two participants. History keeps original deadlines, deadline changes, submissions and decisions. Timeliness uses the submission time and its deadline, so later review does not count against staff." } },
    { popover: { title: "Stay up to date", description: "New comments and task changes appear in the notification bell and Task Tracker counter, even if device push notifications are off. Click a task update in the bell to open its details. Reading the task clears its loaded updates; active tasks and work awaiting review still keep their own counters." } },
  ] },
  operations: { key: "aspom_delegated_tasks_guide_v1", steps: [
    { element: "#tour-delegated-header", popover: { title: "Company deliverables overview", description: "Follow delegated work across the company. Personal tasks stay in each staff member’s own tracker." } },
    { element: "#tour-delegated-assign", popover: { title: "Assign a clear deliverable", description: "Choose a colleague and explain the required outcome, priority and deadline. You become the assigner responsible for reviewing the submitted result." } },
    { element: "#tour-delegated-stats", popover: { title: "Focus on deadlines and review", description: "Active includes overdue work. Awaiting Review shows submitted work waiting for its assigner. Click a card to filter the list." } },
    { element: "#tour-delegated-filters", popover: { title: "Find the right work", description: "Filter by status, priority, the assignee’s department or either participant’s name. Clear filters to return to the full list. Refresh retrieves the latest company data." } },
    { element: "#tour-delegated-list", popover: { title: "Inspect assignment details and submissions", description: "Rows show the assignment date, receiving department and status. Expand a row or choose Detailed view to see both participants and departments, the exact assignment time, submitted notes, work links, feedback and History. Acceptance and change requests are available only when you are that task’s assigner. Operations oversight does not grant ownership of other colleagues’ tasks." } },
    { popover: { title: "Nudge and resolve blockers", description: "Nudge sends an active task’s assignee a reminder. The person who assigned the task decides extension requests under Tasks I assigned. Comments remain between the task’s participants. Use history to understand deadline changes and review decisions." } },
  ] },
};

export function runTaskFlowGuide(kind: keyof typeof guides) {
  const guide = guides[kind];
  const steps = guide.steps.filter(step => !step.element || typeof step.element !== "string" || document.querySelector(step.element));
  return driver({ steps, showProgress: true, animate: true, popoverClass: "aspom-tour-popover",
    nextBtnText: "Next", prevBtnText: "Back", doneBtnText: "Got it",
    onDestroyed: () => { try { localStorage.setItem(guide.key, "true"); } catch { /* Storage may be unavailable. */ } },
  });
}

export function TaskFlowGuide({ kind }: { kind: keyof typeof guides }) {
  useEffect(() => {
    let tour: ReturnType<typeof driver> | undefined;
    try { if (localStorage.getItem(guides[kind].key)) return; } catch { return; }
    const timer = setTimeout(() => { tour = runTaskFlowGuide(kind); tour.drive(); }, 800);
    return () => { clearTimeout(timer); tour?.destroy(); };
  }, [kind]);
  return null;
}

export function TaskFlowGuideButton({ kind }: { kind: keyof typeof guides }) {
  return <Button variant="outline" size="sm" onClick={() => runTaskFlowGuide(kind).drive()} className="gap-1.5 text-xs"><HelpCircle className="h-3.5 w-3.5" /> Quick Guide</Button>;
}
