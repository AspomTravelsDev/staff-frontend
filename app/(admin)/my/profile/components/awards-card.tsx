import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { Award } from "@/lib/api/awards";

interface AwardsCardProps {
  awards: Award[];
}

export function AwardsCard({ awards }: AwardsCardProps) {
  const recentAwards = awards.slice(0, 3); // Show top 3

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Recent Awards</CardTitle>
          <CardDescription>
            You have received {awards.length} award{awards.length !== 1 && "s"}.
          </CardDescription>
        </div>
        <Trophy className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 mt-4">
        {awards.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            <Trophy className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No awards yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAwards.map((award) => (
              <div
                key={award.id}
                className="flex items-start justify-between space-x-4 rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {award.award_name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {award.description || "No description"}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {format(new Date(award.month), "MMM yyyy")}
                </Badge>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/my/awards">
              View All Awards
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
