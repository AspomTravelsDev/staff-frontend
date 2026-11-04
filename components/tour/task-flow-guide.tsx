"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "@/components/tour/driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const guides: Record<"staff" | "operations", { key: string; steps: DriveStep[] }> = {
  staff: { key: "aspom_task_tracker_guide_v6", steps: [
    { element: "#tour-task-tracker-header", popover: { title: "Plan all your deadlines here", description: "My tasks brings your personal tasks and tasks others assigned to you into one list. Use this screen to plan your work." } },
    { element: "#tour-view-switcher", popover: { title: "Choose the tasks you want to see", description: "My tasks shows work you need to do. Tasks I assigned shows work you gave to colleagues, so you can follow their progress and review their work." } },
    { element: "#tour-task-stats", popover: { title: "Your deadlines at a glance", description: "See active work, deadlines within 48 hours, overdue tasks and completed work. Click a card to filter the table. The counts follow your selected ownership view." } },
    { element: "#tour-add-task-btn", popover: { title: "Create or assign a task", description: "Choose yourself or a colleague, then add the task details, deadline and priority. For example: Prepare five interview questions for each department. Personal tasks can repeat daily, weekly or monthly; completing one schedules the next." } },
    { element: "#tour-task-filters", popover: { title: "Find the work you need", description: "Active tasks open by default. Switch to Approval, Completed or All, and search by task, colleague or custom status. Open Filters for progress status, priority, overdue, due soon and cancelled tasks." } },
    { element: "#tour-task-list", popover: { title: "Open details or take action", description: "Click a task name to see its details, comments and history. Open Actions to start work, update status, submit work or reassign the task. You only see actions available to you." } },
    { element: "#tour-task-list", popover: { title: "See what needs attention first", description: "Overdue tasks come first, then the nearest deadlines. Priority breaks ties. Fuller bars mean less time left: full red is overdue, almost full red is under 24 hours, amber is one to three days, and shorter green or gray bars mean more time. Read the countdown, such as 7h 58m left." } },
    { popover: { title: "Show where your work stands", description: "Accept task or Start task changes Pending to In progress. Use Update status as work develops. Green means In progress; light red marks Blocked, Waiting on input, On hold or Changes requested. Choose Custom status for a blue label up to 32 characters, such as Drafting or Testing. These statuses keep the task active and reminders continue." } },
    { popover: { title: "Finish or submit your work", description: "Mark personal tasks complete yourself. For assigned work, choose Submit for approval and add a completion note and optional work link. Awaiting approval is purple. The assigner can Approve completion or Request changes. Amber Waiting review is only a progress status; it does not submit your work. Later review does not make an on-time submission late." } },
    { popover: { title: "Need more time?", description: "Choose Extend deadline for a personal task or Request extension for assigned work. Add a later deadline and a reason, such as Waiting for the client's documents. An assigned task keeps its current deadline until the assigner approves the extension." } },
    { popover: { title: "Hand over a task", description: "The current assignee or assigner can choose Reassign task and select a new assignee. An assigner can also take a task back personally. Add a handover note, such as Draft ready; please check the figures. The task returns to Pending, keeps its deadline and history, and turns off repeating. Earlier submissions are kept in history and pending extension requests close." } },
    { popover: { title: "Share updates and follow up", description: "Use Add comment / update on assigned tasks to explain progress or blockers. Assigners can Send nudge by email and portal notification. Task history keeps status changes, deadlines, handovers and review decisions. The original assigner still approves work after a handover while the task remains assigned to a colleague." } },
    { popover: { title: "Check your notifications", description: "Comments and task changes appear in the notification bell, even when device push is off. Open an update to read the task and clear the updates you loaded. Use Quick Guide whenever you want to replay this tour." } },
  ] },
  operations: { key: "aspom_delegated_tasks_guide_v2", steps: [
    { element: "#tour-delegated-header", popover: { title: "Company deliverables overview", description: "Follow delegated work across the company. Personal tasks stay in each staff member’s own tracker." } },
    { element: "#tour-delegated-assign", popover: { title: "Assign a clear deliverable", description: "Choose a colleague and explain the required outcome, priority and deadline. You become the assigner responsible for reviewing the submitted result." } },
    { element: "#tour-delegated-stats", popover: { title: "Focus on deadlines and approval", description: "Active includes overdue work and custom progress statuses such as Waiting review. Awaiting Approval shows work submitted for the assigner to approve completion. Click a card to filter the list." } },
    { popover: { title: "Read the status colours", description: "Green means In progress. Light red marks blockers or Changes requested, blue marks custom statuses, amber means Waiting review, and purple means Awaiting approval. Completed is teal; Pending and Cancelled are gray. Waiting review is a progress status, not a submission for approval." } },
    { element: "#tour-delegated-filters", popover: { title: "Find the right work", description: "Filter by status, priority, the assignee’s department or either participant’s name. Clear filters to return to the full list. Refresh retrieves the latest company data." } },
    { element: "#tour-delegated-list", popover: { title: "Check details and review work", description: "Active tasks are ordered by nearest deadline, with overdue work first and priority breaking ties. Click a row to read the description, submissions, feedback and history. The Actions menu contains nudge and any workflow actions you are permitted to take. Only the task's assigner can Approve completion or Request changes. Operations oversight does not make you the assigner." } },
    { popover: { title: "Follow handovers", description: "The current assignee or assigner can Reassign task. The new assignment starts as Pending with the same deadline. Comments, previous assignees and submissions stay in history. The original assigner still approves work while it remains assigned to a colleague. Reopen completed or cancelled work before reassigning it." } },
    { popover: { title: "Nudge and resolve blockers", description: "Nudge sends an active task’s assignee a reminder. The person who assigned the task decides extension requests under Tasks I assigned. Only task participants can add comments; company oversight can read updates and history. Use history to understand deadline changes and review decisions." } },
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
