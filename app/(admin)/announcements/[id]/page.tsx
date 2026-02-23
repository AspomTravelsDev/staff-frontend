import { notFound } from "next/navigation";
import { getAnnouncementById } from "@/lib/api/announcements";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Megaphone, Newspaper } from "lucide-react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnnouncementPage({ params }: PageProps) {
  const { id } = await params;

  const announcement = await getAnnouncementById(id);

  if (!announcement) {
    notFound();
  }

  const TypeIcon = announcement.type === "newsletter" ? Newspaper : Megaphone;

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge variant="outline" className="capitalize gap-1.5">
              <TypeIcon className="h-3.5 w-3.5" />
              {announcement.type === "newsletter"
                ? "Newsletter"
                : "Announcement"}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {format(
                new Date(announcement.published_at ?? announcement.updated_at),
                "dd MMMM yyyy",
              )}
            </div>
          </div>

          <CardTitle className="text-2xl leading-snug">
            {announcement.title}
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            By <strong>{announcement.author_name}</strong>
          </p>
        </CardHeader>

        <CardContent>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
