import { WeeklyFeedbackAdminClient } from "./components/weekly-feedback-admin-client";

export const metadata = {
  title: "Weekly Feedback Management | Aspom Portal",
  description:
    "Manage weekly anonymous questionnaire and review basic analytics.",
};

export default function HRWeeklyFeedbackPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weekly Feedback</h1>
        <p className="text-muted-foreground">
          Manage questions and publication, then review response analytics in
          one place.
        </p>
      </div>

      <WeeklyFeedbackAdminClient />
    </div>
  );
}
