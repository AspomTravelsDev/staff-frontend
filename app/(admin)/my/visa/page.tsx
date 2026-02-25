import { Metadata } from "next";
import { getVisaInformation } from "@/lib/api/visa";
import { InformationDeskView } from "@/app/(admin)/visa/information-desk/components/information-desk-view";

export const metadata: Metadata = {
  title: "Visa Information Desk | Aspom",
  description: "Visa information, checklists, and FAQs for staff.",
};

export default async function MyVisaPage() {
  const information = await getVisaInformation();

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <InformationDeskView information={information} canManage={false} />
    </div>
  );
}
