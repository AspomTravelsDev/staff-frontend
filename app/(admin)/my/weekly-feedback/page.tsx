import { getWeeklyFeedbackActive } from "@/lib/api/weekly-feedback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WeeklyFeedbackFormView } from "./components/weekly-feedback-form-view";

export const metadata = {
  title: "Staff Pulse & Surveys | Aspom Portal",
  description:
    "Share your feedback anonymously to help improve office culture and workplace environment.",
};

export default async function WeeklyFeedbackPage() {
  const result = await getWeeklyFeedbackActive();
  const initialData = result.success ? result.data : null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Staff Pulse & Surveys
        </h1>
        <p className="text-muted-foreground">
          Share your feedback anonymously at your own pace to help improve office culture and team alignment.
        </p>
      </div>

      <Alert>
        <AlertTitle>Confidentiality Notice</AlertTitle>
        <AlertDescription>
          This survey is anonymous. Individual responses are reviewed in
          aggregate for team improvement and are not traced back to specific
          staff members.
        </AlertDescription>
      </Alert>

      <WeeklyFeedbackFormView initialData={initialData} />
    </div>
  );
}
