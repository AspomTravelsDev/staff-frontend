import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeaveStat } from "../queries";

interface StatCardsProps {
  stats: LeaveStat;
}

export function StatCards({ stats }: StatCardsProps) {
  const items = [
    { label: "Total Leave Days Left", value: stats.totalLeaveDaysLeft },
    { label: "Casual Leave Days", value: stats.casualLeaveDays },
    { label: "Emergency Leave Taken", value: stats.emergencyLeaveTaken },
    { label: "Total Days Absent", value: stats.totalDaysAbsent },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{item.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
