import { getWeeklyFeedbackActive } from "@/lib/api/weekly-feedback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

      <Alert>
        <AlertTitle>Confidentiality Notice</AlertTitle>
        <AlertDescription>
          This questionnaire is anonymous. Individual responses are reviewed in
          aggregate for team improvement and are not traced back to specific
          staff members.
        </AlertDescription>
      </Alert>

      <WeeklyFeedbackFormView initialData={initialData} />
    </div>
  );
}
