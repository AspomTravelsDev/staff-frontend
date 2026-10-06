"use client";

import { TaskFlowGuide, TaskFlowGuideButton, runTaskFlowGuide } from "@/components/tour/task-flow-guide";

export function runTaskTrackerTour() { runTaskFlowGuide("staff").drive(); }
export function TaskTrackerTour() { return <TaskFlowGuide kind="staff" />; }
export function TaskTrackerTourButton() { return <TaskFlowGuideButton kind="staff" />; }
