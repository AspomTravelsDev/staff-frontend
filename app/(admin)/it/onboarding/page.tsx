import { getApplications } from "@/lib/api/hr";
import type { OnboardingApplication } from "@/lib/types/hr";
import { ItOnboardingClient } from "./components/it-onboarding-client";
import { DataLoadError } from "@/components/data-load-error";
import { unstable_rethrow } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ItOnboardingPage() {
  let applications: OnboardingApplication[] = [];
  try {
    applications = await getApplications();
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to fetch applications for IT provisioning:", error);
    return <DataLoadError title="Unable to load onboarding applications" />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <ItOnboardingClient applications={applications} />
    </div>
  );
}
