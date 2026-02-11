"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

export function RatingCriteria() {
  return (
    <Alert className="bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription>
        <div className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
          Performance Rating Criteria:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              5
            </Badge>
            <span>Exceptional (&gt;90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              4
            </Badge>
            <span>Exceeded Expectations (81-90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
              3
            </Badge>
            <span>Satisfactory (70-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400"
            >
              2
            </Badge>
            <span>Requires Improvement (50-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">1</Badge>
            <span>Unsatisfactory (&lt;50%)</span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
