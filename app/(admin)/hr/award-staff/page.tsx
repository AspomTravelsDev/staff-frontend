import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getAllAwards } from "@/lib/api/awards";
// import { AwardStatsCards } from "./components/award-stats";
import { AwardsTable } from "./components/awards-table";
import { CreateAwardDialog } from "./components/create-award-dialog";

export const metadata = {
  title: "Award Staff | HR",
  description: "Recognize and award staff members.",
};

export default async function AwardStaffPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "hr" && user.role !== "super")) {
    // Basic redirect for now, cleaner middleware handling handles this usually
    // but just in case
    redirect("/dashboard");
  }

  // Fetch initial data on the server
  // Note: getAllAwards is an assumption for admin listing.
  const awards = await getAllAwards();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Awards</h1>
          <p className="text-sm text-muted-foreground">
            Recognize and celebrate employee achievements.
          </p>
        </div>
        <CreateAwardDialog />
      </div>

      {/* Stats temporarily removed as per new API guide */}
      {/* <AwardStatsCards stats={stats} /> */}

      <AwardsTable awards={awards} />
    </div>
  );
}
