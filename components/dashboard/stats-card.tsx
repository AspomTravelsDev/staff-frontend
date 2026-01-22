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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
