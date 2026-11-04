import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { getInformationDeskEntries } from "@/lib/api/information-desk";
import { InformationDeskView } from "@/components/information-desk/information-desk-view";

export const metadata: Metadata = { title: "Birth Services Information Desk | Aspom", description: "Birth Services FAQs and shared files." };

export default async function BirthServicesInformationDeskPage() {
  const [user, information] = await Promise.all([getCurrentUser(), getInformationDeskEntries("birth-services")]);
  return <div className="container mx-auto max-w-7xl py-8"><InformationDeskView desk="birth-services" information={information} canManage={userHasAnyRole(user, ["birth-services", "super"])} /></div>;
}
