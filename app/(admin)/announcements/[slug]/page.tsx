import { notFound } from "next/navigation";
import { newsData } from "@/lib/data/mock-news";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AnnouncementPage({ params }: PageProps) {
  const { slug } = await params;

  const getSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  const newsItem = newsData.find((item) => getSlug(item.title) === slug);

  if (!newsItem) {
    notFound();
  }

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{newsItem.category}</Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {new Date(newsItem.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <CardTitle className="text-3xl">{newsItem.title}</CardTitle>
          <Badge
            className="w-fit"
            variant={
              newsItem.status === "Important" || newsItem.status === "Alert"
                ? "destructive"
                : "secondary"
            }
          >
            {newsItem.status}
          </Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose dark:prose-invert max-w-none">
            <p className="leading-7">{newsItem.content}</p>
            {/* Placeholder for more content since our mock data is simple */}
            <p className="mt-4 leading-7 text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
