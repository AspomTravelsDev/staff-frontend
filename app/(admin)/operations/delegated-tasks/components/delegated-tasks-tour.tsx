"use client";

import { TaskFlowGuide, TaskFlowGuideButton } from "@/components/tour/task-flow-guide";

export function DelegatedTasksTour() { return <TaskFlowGuide kind="operations" />; }
export function DelegatedTasksTourButton() { return <TaskFlowGuideButton kind="operations" />; }
