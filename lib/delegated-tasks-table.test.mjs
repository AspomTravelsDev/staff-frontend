import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "./api/action-test-utils.mjs";

function render(tasks) {
  const node = ({ children }) => React.createElement("div", null, children);
  const { load } = actionLoader(() => {}, {
    react: React, "react/jsx-runtime": jsxRuntime,
    "@/lib/utils/readable-date": { formatReadableDate: (value) => value },
    "@/components/ui/table": Object.fromEntries([["Table", "table"], ["TableBody", "tbody"], ["TableCell", "td"], ["TableHead", "th"], ["TableHeader", "thead"], ["TableRow", "tr"]].map(([name, tag]) => [name, ({ children, ...props }) => React.createElement(tag, props, children)])),
    "@/components/ui/button": { Button: node },
    "@/components/ui/popover": { Popover: node, PopoverContent: node, PopoverTrigger: node },
    "@/components/tasks/task-status-badge": { TaskStatusBadge: ({ task }) => React.createElement("span", null, task.status) },
    "@/app/(admin)/my/task-tracker/components/task-workflow-controls": { isActiveTask: (task) => task.status === "pending", TaskWorkflowControls: ({ renderControls }) => renderControls(null) },
    "@/app/(admin)/my/task-tracker/components/task-details-sheet": { TaskDetailsSheet: () => null },
    "@/app/(admin)/my/task-tracker/components/task-deadline-timeline": { TaskDeadlineTimeline: ({ task }) => React.createElement("span", null, `Shared deadline bar: ${task.id}`) },
  });
  return renderToStaticMarkup(React.createElement(load("app/(admin)/operations/delegated-tasks/components/delegated-tasks-table.tsx").DelegatedTasksTable, { tasks, allTasks: tasks, onNudge() {}, onComment() {}, onUpdated() {} }));
}

test("delegated table includes both people, departments, current assignment date and shared deadline component", () => {
  const html = render([{ id: "task-1", title: "Prepare report", priority: "high", status: "pending", assigned_at: "2026-10-20", created_at: "2026-10-01", due_date: "2026-10-21", user: { name: "Current assignee", department: "Operations" }, assigned_by: { name: "Original assigner", department: "Management" } }]);
  for (const text of ["Title", "Assigned by", "Assigned to", "Assigned on", "Status", "Deadline", "Actions", "Current assignee", "Operations", "Original assigner", "Management", "2026-10-20", "Shared deadline bar: task-1", "View details"]) assert.ok(html.includes(text), text);
  assert.ok(!html.includes("2026-10-01"));
});

test("empty results stay inside the seven-column table", () => {
  const html = render([]);
  assert.match(html, /colSpan="7"|colspan="7"/);
  assert.match(html, /No tasks match this view/);
});
