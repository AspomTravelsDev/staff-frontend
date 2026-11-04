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
  onClick?: () => void;
  active?: boolean;
  compact?: boolean;
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
  onClick,
  active = false,
  compact = false,
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

  const card = (
    <Card className={cn(cardStyles, isDashboard && "shadow-none", compact && "gap-1.5 py-3", className)}>
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", compact && "pb-0")}>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={cn("h-4 w-4", iconClassName || "text-muted-foreground")}
        />
      </CardHeader>
      <CardContent>
        <div className={cn("font-bold", compact ? "text-xl leading-7" : "text-2xl")}>{value}</div>
        {footer ? (
          <div className="mt-3">{footer}</div>
        ) : description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!onClick) return card;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="group w-full cursor-pointer rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className={cn(
        cardStyles,
        isDashboard && "shadow-none",
        "h-full transition-colors group-hover:bg-muted/40",
        active && "ring-2 ring-primary ring-offset-2",
        compact && "gap-1.5 py-3",
        className,
      )}>
        <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", compact && "pb-0")}>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={cn("h-4 w-4", iconClassName || "text-muted-foreground")} />
        </CardHeader>
        <CardContent>
          <div className={cn("font-bold", compact ? "text-xl leading-7" : "text-2xl")}>{value}</div>
          {footer ? <div className="mt-3">{footer}</div> : description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </CardContent>
      </Card>
    </button>
  );
}
