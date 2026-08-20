import { WeeklyFeedbackAdminClient } from "./components/weekly-feedback-admin-client";

export const metadata = {
  title: "Staff Pulse & Surveys Management | Aspom Portal",
  description:
    "Manage staff pulse questions, publish open surveys, and review response analytics.",
};

export default function HRWeeklyFeedbackPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Pulse & Surveys</h1>
        <p className="text-muted-foreground">
          Manage survey questions, publish questionnaires, and review response analytics in one place.
        </p>
      </div>

      <WeeklyFeedbackAdminClient />
    </div>
  );
}
