import { Metadata } from "next";
import { getVisaInformation } from "@/lib/api/visa";
import { InformationDeskView } from "./components/information-desk-view";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Visa Information Desk | Aspom",
  description: "Visa Information and Document Checklists",
};

export default async function VisaInformationDeskPage() {
  const user = await getCurrentUser();

  // Only Visa Officers and Super Admins can manage information
  const canManage = user?.role === "visa" || user?.role === "super";

  // Fetch all information entries
  const information = await getVisaInformation();

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <InformationDeskView information={information} canManage={canManage} />
    </div>
  );
}
