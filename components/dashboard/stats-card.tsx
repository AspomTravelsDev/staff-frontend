import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  icon: LucideIcon;
  value: string;
  description: string;
  color: "blue" | "green" | "red" | "yellow";
}

export function StatsCard({
  title,
  icon: Icon,
  value,
  description,
  color,
}: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-50/80 border border-blue-400 dark:bg-blue-950/80 dark:border-blue-800",
    green:
      "bg-green-50/80 border border-green-400 dark:bg-green-950/80 dark:border-green-800",
    red: "bg-red-50/80 border border-red-400 dark:bg-red-950/80 dark:border-red-800",
    yellow:
      "bg-yellow-50/80 border border-yellow-400 dark:bg-yellow-950/80 dark:border-yellow-800",
  };

  return (
    <Card className={colorClasses[color] + " shadow-none"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1.5 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs font-medium sm:text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="min-w-0 px-3 pb-3 sm:px-6 sm:pb-6">
        <div className="min-w-0 text-[13px] font-bold leading-tight tabular-nums [overflow-wrap:anywhere] sm:break-normal sm:text-xl">{value}</div>
        <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}
