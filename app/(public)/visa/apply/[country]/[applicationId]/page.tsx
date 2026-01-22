import { notFound } from "next/navigation";
import type { VisaCountry } from "@/lib/visa/fields";
import { getApplication } from "./queries";
import { VisaFormWrapper } from "./components/visa-form-wrapper";

interface PageProps {
  params: Promise<{
    country: string;
    applicationId: string;
  }>;
}

const validCountries = ["canada", "uk", "schengen"];

export default async function VisaApplicationPage({ params }: PageProps) {
  const { country, applicationId } = await params;

  // Validate country parameter
  if (!validCountries.includes(country)) {
    notFound();
  }

  // Fetch existing application data (includes admin pre-fills)
  const application = await getApplication(
    applicationId,
    country as VisaCountry,
  );

  if (!application) {
    notFound();
  }

  // Check if already submitted
  if (application.status === "submitted") {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
          <svg
            className="size-8"
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
        <h1 className="mb-2 text-2xl font-bold">Application Submitted</h1>
        <p className="text-muted-foreground">
          This visa application has already been submitted and is being
          processed.
        </p>
        <p className="text-muted-foreground mt-4 text-sm">
          Application ID:{" "}
          <code className="bg-muted rounded px-2 py-1">{applicationId}</code>
        </p>
      </div>
    );
  }

  return (
    <VisaFormWrapper
      applicationId={applicationId}
      country={country as VisaCountry}
      initialData={application.data}
      initialStep={application.current_step}
    />
  );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { country } = await params;
  const countryNames: Record<string, string> = {
    canada: "Canada",
    uk: "United Kingdom",
    schengen: "Schengen",
  };

  return {
    title: `${countryNames[country] || "Visa"} Application | Aspom Travels`,
    description: `Complete your ${countryNames[country] || "visa"} application form`,
  };
}
