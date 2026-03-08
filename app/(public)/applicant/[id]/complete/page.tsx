import { redirect } from "next/navigation";
import { getApplicationByUUID } from "../queries";

export default async function ApplicantCompletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validate application
  let application;
  try {
    application = await getApplicationByUUID(id);
  } catch (error) {
    redirect("/");
  }

  // Ensure application is actually completed
  if (application.status !== "completed") {
    redirect(`/applicant/${id}/1`); // Redirect to start if not completed
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 flex-col items-center justify-center rounded-full bg-emerald-100 p-0 shadow-xs">
        <svg
          className="h-10 w-10 text-emerald-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-3xl font-bold">
        Application Submitted Successfully!
      </h2>

      <div className="rounded-lg bg-white p-6 shadow-sm text-left mx-auto max-w-xl space-y-4">
        <p className="text-muted-foreground">
          Thank you for completing the Aspom HR Onboarding process. Your
          application
          <strong> ({application.application_id}) </strong>
          has been successfully submitted and is now under review.
        </p>

        <h3 className="text-lg font-semibold mt-6">Next Steps</h3>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            Our HR team will review your submitted documents and signed
            agreements.
          </li>
          <li>
            We will contact your provided referees and guarantors for
            verification.
          </li>
          <li>
            You will receive further communication from us regarding your
            official start date and orientation schedule.
          </li>
        </ul>

        <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> Please keep an eye on your email inbox (
            <span className="font-medium">{application.applicant_email}</span>)
            for any follow-up questions from our team.
          </p>
        </div>
      </div>
    </div>
  );
}
