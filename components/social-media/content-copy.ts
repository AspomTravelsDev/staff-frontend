import type { ContentAssignment, OpenContentIdea } from "@/types/content-collections";

export function spreadsheetCells(assignments: ContentAssignment[]) {
  return [
    ["Staff member", "Theme", "Idea title", "Description"],
    ...assignments.flatMap(assignment => assignment.ideas.map(idea => [assignment.user?.name ?? "", assignment.theme, idea.title, idea.description])),
  ];
}

export function openIdeasSpreadsheetCells(ideas: OpenContentIdea[]) {
  return [
    ["Staff member", "Category", "Format", "Idea title", "Description", "Reference link"],
    ...ideas.map(idea => [
      idea.user?.name ?? "",
      idea.category,
      idea.format ?? "",
      idea.title,
      idea.description,
      idea.reference_url ?? "",
    ]),
  ];
}

export function spreadsheetClipboard(rows: string[][]) {
  // Keep user content as text when a spreadsheet might interpret it as a formula.
  const literal = (value: string) => /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  // Tabs separate cells; flatten embedded tabs/newlines so each idea stays in one row.
  return rows.map(row => row.map(value => literal(value).replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
}
