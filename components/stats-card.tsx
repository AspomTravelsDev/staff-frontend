import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  icon: LucideIcon;
  value: React.ReactNode;
  description?: string;
  footer?: React.ReactNode; // Custom footer content (replaces description if provided)
  variant?: "default" | "dashboard";
  cardColor?: "blue" | "green" | "red" | "yellow" | "purple" | "orange";
  iconClassName?: string;
  className?: string; // For any extra card styling
}

export function StatsCard({
  title,
  icon: Icon,
  value,
  description,
  footer,
  variant = "default",
  cardColor = "blue",
  iconClassName,
  className,
}: StatsCardProps) {
  const dashboardColors = {
    blue: "bg-blue-50/80 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    green:
      "bg-green-50/80 border-green-200 dark:bg-green-950/30 dark:border-green-800",
    red: "bg-red-50/80 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    yellow:
      "bg-yellow-50/80 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800",
    purple:
      "bg-purple-50/80 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800",
    orange:
      "bg-orange-50/80 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
  };

  const isDashboard = variant === "dashboard";
  const cardStyles = isDashboard ? dashboardColors[cardColor] : "bg-card";

  return (
    <Card className={cn(cardStyles, isDashboard && "shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={cn("h-4 w-4", iconClassName || "text-muted-foreground")}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {footer ? (
          <div className="mt-3">{footer}</div>
        ) : description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
