import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getReviews, getPerformanceStats } from "@/lib/api/performance";
import { PerformanceStatsCards } from "./components/performance-stats";
import { PerformanceTable } from "./components/performance-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function PerformancePage() {
  const user = await getCurrentUser();

  // Access Control: HR
  if (!user) {
    redirect("/login");
  }

  // Fetch data
  const [reviewsData, stats] = await Promise.all([
    getReviews({ limit: 100 }),
    getPerformanceStats(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Track employee appraisals and feedback sessions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Review
        </Button>
      </div>

      <PerformanceStatsCards stats={stats} />

      <PerformanceTable reviews={reviewsData.items} />
    </div>
  );
}
