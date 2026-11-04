import type { Metadata } from "next";
import { getInformationDeskEntries } from "@/lib/api/information-desk";
import { InformationDeskView } from "@/components/information-desk/information-desk-view";

export const metadata: Metadata = { title: "Birth Services Information Desk | Aspom", description: "Birth Services FAQs and shared files for staff." };

export default async function Page() {
  const information = await getInformationDeskEntries("birth-services");
  return <div className="container mx-auto max-w-7xl py-8"><InformationDeskView desk="birth-services" information={information} canManage={false} /></div>;
}
