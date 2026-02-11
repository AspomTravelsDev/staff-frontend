import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AppraisalStatsCards } from "./components/appraisal-stats-cards";
import { AppraisalTable } from "./components/appraisal-table";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Performance Reviews
          </h1>
          <p className="text-muted-foreground">
            Track and manage your performance appraisals
          </p>
        </div>
        <Link href="/my/performance/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Start New Appraisal
          </Button>
        </Link>
      </div>

      <AppraisalStatsCards />

      <AppraisalTable />
    </div>
  );
}
