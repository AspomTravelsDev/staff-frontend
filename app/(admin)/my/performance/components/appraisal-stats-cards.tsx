import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, TrendingUp, Calendar } from "lucide-react";
import type { AppraisalStats } from "@/lib/api/performance-appraisal";

interface AppraisalStatsCardsProps {
  stats: AppraisalStats;
}

export function AppraisalStatsCards({ stats }: AppraisalStatsCardsProps) {
  const cards = [
    {
      title: "Total Appraisals",
      value: stats.total_appraisals,
      description: "Completed reviews",
      icon: Trophy,
      color: "text-blue-600",
    },
    {
      title: "Pending",
      value: stats.pending_self_appraisal,
      description: "Awaiting submission",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Average Rating",
      value: stats.average_rating ? stats.average_rating.toFixed(1) : "N/A",
      description: "Out of 10",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Last Review",
      value: stats.last_review_date
        ? new Date(stats.last_review_date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : "N/A",
      description: "Most recent",
      icon: Calendar,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
