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
    // Fetch all info and find the specific one.
    // If the API provided a fetchById endpoint, it would be better,
    // but the current API only provides getVisaInformation().
    const information = await getVisaInformation();
    infoRecord = information.find((item) => item.id === id) || null;
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <ManageInfoForm infoRecord={infoRecord} />
        </div>
      </div>
    </div>
  );
}
