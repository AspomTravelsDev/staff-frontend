import { renderDataPage } from "@/lib/api/render-data-page";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { userHasAnyRole } from "@/types/user-types";
import { getAllAwards } from "@/lib/api/awards";
// import { AwardStatsCards } from "./components/award-stats";
import { AwardsTable } from "./components/awards-table";
import { CreateAwardDialog } from "./components/create-award-dialog";
import { StatsCard } from "@/components/stats-card";
import { Trophy, Users, Building2, Calendar } from "lucide-react";

export const metadata = {
  title: "Award Staff | HR",
  description: "Recognize and award staff members.",
};

export default async function AwardStaffPage() {
  return renderDataPage(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!userHasAnyRole(user, ["hr", "super", "compliance", "office-operations"])) {
    redirect("/dashboard");
  }

  const awards = await getAllAwards();

  const totalAwards = awards.length;

  const staffCounts: Record<string, number> = {};
  awards.forEach((award) => {
    if (award.user && award.user.name) {
      staffCounts[award.user.name] = (staffCounts[award.user.name] || 0) + 1;
    }
  });
  const mostAwardedStaff = Object.entries(staffCounts).reduce(
    (max, [name, count]) => (count > max.count ? { name, count } : max),
    { name: "N/A", count: 0 },
  );

  const deptCounts: Record<string, number> = {};
  awards.forEach((award) => {
    if (award.user && award.user.department) {
      deptCounts[award.user.department] =
        (deptCounts[award.user.department] || 0) + 1;
    }
  });
  const mostAwardedDept = Object.entries(deptCounts).reduce(
    (max, [name, count]) => (count > max.count ? { name, count } : max),
    { name: "N/A", count: 0 },
  );

  const months = new Set(awards.map((a) => a.month));
  const uniqueMonthsCount = months.size || 1;
  const avgAwardsPerMonth = (totalAwards / uniqueMonthsCount).toFixed(1);

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Awards"
          icon={Trophy}
          value={totalAwards}
          description="All time awards"
          cardColor="blue"
          variant="dashboard"
        />
        <StatsCard
          title="Most Awarded Staff"
          icon={Users}
          value={mostAwardedStaff.name}
          description={`${mostAwardedStaff.count} awards received`}
          cardColor="green"
          variant="dashboard"
        />
        <StatsCard
          title="Top Department"
          icon={Building2}
          value={mostAwardedDept.name}
          description={`${mostAwardedDept.count} awards received`}
          cardColor="purple"
          variant="dashboard"
        />
        <StatsCard
          title="Monthly Average"
          icon={Calendar}
          value={avgAwardsPerMonth}
          description="Awards per month"
          cardColor="orange"
          variant="dashboard"
        />
      </div>

      <AwardsTable awards={awards} />
    </div>
  );

  }, "Unable to load staff awards");
}
