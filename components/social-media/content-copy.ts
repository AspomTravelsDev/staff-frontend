import type { ContentAssignment } from "@/types/content-collections";

export function spreadsheetCells(assignments: ContentAssignment[]) {
  return [
    ["Staff member", "Theme", "Idea title", "Description"],
    ...assignments.flatMap(assignment => assignment.ideas.map(idea => [assignment.user?.name ?? "", assignment.theme, idea.title, idea.description])),
  ];
}

export function spreadsheetClipboard(rows: string[][]) {
  // Keep user content as text when a spreadsheet might interpret it as a formula.
  const literal = (value: string) => /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  // Tabs separate cells; flatten embedded tabs/newlines so each idea stays in one row.
  return rows.map(row => row.map(value => literal(value).replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
}
