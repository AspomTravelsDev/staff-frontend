import { getWeeklyFeedbackActive } from "@/lib/api/weekly-feedback";
import { WeeklyFeedbackFormView } from "./components/weekly-feedback-form-view";

export const metadata = {
  title: "Weekly Anonymous Questionnaire | Aspom Portal",
  description:
    "Complete the weekly anonymous questionnaire required before submitting daily reports.",
};

export default async function WeeklyFeedbackPage() {
  const result = await getWeeklyFeedbackActive();
  const initialData = result.success ? result.data : null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Weekly Anonymous Questionnaire
        </h1>
        <p className="text-muted-foreground">
          Save a draft and come back any time before Friday 9:00 PM.
        </p>
      </div>

      <WeeklyFeedbackFormView initialData={initialData} />
    </div>
  );
}
