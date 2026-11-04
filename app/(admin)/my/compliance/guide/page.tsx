import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { renderDataPage } from "@/lib/api/render-data-page";
import { getComplianceSanctionGrid } from "@/lib/api/compliance";
import { ComplianceGuideContent } from "./guide-content";

export default async function ComplianceGuidePage() {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const { steps, client_error_levels } = await getComplianceSanctionGrid({ user_id: user.id });

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Compliance Guide</h1>
          <p className="text-muted-foreground">
            Understand occurrence values, company rules and disciplinary steps.
          </p>
        </div>
        <ComplianceGuideContent steps={steps} clientErrorLevels={client_error_levels} />
      </div>
    );
  }, "Unable to load the compliance guide");
}
