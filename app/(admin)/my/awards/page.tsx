import { renderDataPage } from "@/lib/api/render-data-page";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getMyAwards } from "@/lib/api/awards";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Trophy, Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata = {
  title: "My Awards | ASPOM",
  description: "View your received awards and recognitions.",
};

export default async function MyAwardsPage() {
  return renderDataPage(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const awards = await getMyAwards();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Awards</h1>
        <p className="text-muted-foreground">
          View your recognition and achievements.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {awards.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No Awards Yet</CardTitle>
              <CardDescription>
                You haven't received any awards yet. Keep up the great work!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          awards.map((award) => (
            <Card key={award.id} className="overflow-hidden">
              {award.image && (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={award.image.url}
                    alt={award.award_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2">
                    {format(new Date(award.month), "MMMM yyyy")}
                  </Badge>
                  {/* Fallback icon if no image */}
                  {!award.image && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <CardTitle className="text-xl">{award.award_name}</CardTitle>
                {/* Show custom name if it differs, or just rely on award_name which api says is display label */}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {award.description && (
                    <p className="text-sm text-muted-foreground italic">
                      &quot;{award.description}&quot;
                    </p>
                  )}

                  <div className="flex items-center text-sm text-muted-foreground pt-2 border-t mt-4">
                    <User className="mr-2 h-3 w-3" />
                    <span>Awarded by {award.awarded_by.name}</span>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-2 h-3 w-3" />
                    <span>{format(new Date(award.awarded_at), "PP")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  }, "Unable to load your awards");
}
