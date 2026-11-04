import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { getInformationDeskEntry } from "@/lib/api/information-desk";
import { ManageInfoForm } from "@/components/information-desk/manage-info-form";

export const metadata: Metadata = { title: "Manage Birth Services Information | Aspom" };

export default async function ManageBirthServicesInformationPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentUser();
  if (!userHasAnyRole(user, ["birth-services", "super"])) redirect("/my/birth-services");
  const { id } = await searchParams;
  const record = id ? await getInformationDeskEntry("birth-services", id) : null;
  return <ManageInfoForm key={record?.id ?? "new"} desk="birth-services" infoRecord={record} />;
}
