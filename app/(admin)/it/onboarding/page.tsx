import { getApplications } from "@/lib/api/hr";
import type { OnboardingApplication } from "@/lib/types/hr";
import { ItOnboardingClient } from "./components/it-onboarding-client";

export const dynamic = "force-dynamic";

export default async function ItOnboardingPage() {
  let applications: OnboardingApplication[] = [];
  try {
    applications = await getApplications();
  } catch (error) {
    console.error("Failed to fetch applications for IT provisioning:", error);
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <ItOnboardingClient applications={applications} />
    </div>
  );
}
