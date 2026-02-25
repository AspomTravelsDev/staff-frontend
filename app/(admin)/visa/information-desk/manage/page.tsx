import { Metadata } from "next";
import { getVisaInformation } from "@/lib/api/visa";
import { ManageInfoForm } from "./manage-info-form";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Manage Visa Information | Aspom",
  description: "Create or edit Visa Information",
};

interface ManageInfoPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function ManageInfoPage(props: ManageInfoPageProps) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();

  // Only Visa Officers and Super Admins can manage information
  const canManage = user?.role === "visa" || user?.role === "super";

  if (!canManage) {
    redirect("/visa/information-desk");
  }

  const { id } = searchParams;
  let infoRecord = null;

  if (id) {
    const information = await getVisaInformation();
    infoRecord = information.find((item) => item.id === id) || null;
  }

  return (
    <div className="">
      <div className="flex justify-center">
        <div className="w-full">
          <ManageInfoForm infoRecord={infoRecord} />
        </div>
      </div>
    </div>
  );
}
