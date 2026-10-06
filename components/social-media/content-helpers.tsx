import type { ContentAssignment } from "@/types/content-collections";
import { Badge } from "@/components/ui/badge";

export function AssignmentProgress({ assignment }: { assignment: ContentAssignment }) {
  const count = assignment.ideas.length;
  return <div className="flex flex-wrap items-center gap-2">
    <Badge variant={count >= assignment.required_count ? "default" : "secondary"}>
      {count >= assignment.required_count ? "Complete" : count ? "In progress" : "Not started"}
    </Badge>
    <span className="text-sm text-muted-foreground">{count} of {assignment.required_count} ideas submitted</span>
  </div>;
}

export function deadlineLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value)) + " WAT";
}

// Inputs display Lagos wall time; explicit offset avoids browser timezone ambiguity.
export function deadlineInput(value: string) {
  const date = new Date(new Date(value).getTime() + 60 * 60 * 1000);
  return date.toISOString().slice(0, 16);
}

export function deadlineISO(value: string) {
  return new Date(value + ":00+01:00").toISOString();
}
