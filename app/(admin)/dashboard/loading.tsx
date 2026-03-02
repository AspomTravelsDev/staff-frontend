"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-12 pt-6">
      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>

      {/* Quick Links */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-md" />
          ))}
        </div>
      </div>

      {/* Recent Updates + Staff of the Month */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-5/7 bg-card border rounded-xl p-6 min-h-[300px] flex flex-col gap-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="flex-1 min-h-[300px] rounded-xl" />
      </div>
    </div>
  );
}
