import { notFound } from "next/navigation";
import Link from "next/link";
import { getAnnouncementById } from "@/lib/api/announcements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Megaphone, Newspaper, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { AnnouncementContent } from "@/app/(admin)/my/announcement/components/announcement-content";
import { AnnouncementReadTracker } from "./components/announcement-read-tracker";
import { AvatarStack } from "@/components/avatar-stack";

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
    <div className="mx-auto w-full px-4 sm:px-8 md:px-16 py-8 sm:py-12">
      <AnnouncementReadTracker id={id} />

      {/* Navigation */}
      <div className="mb-10 md:mb-16">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-3 text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          <Link href="/announcements" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 text-primary animate-in slide-in-from-right-1 fade-in duration-700" />
            <span className="font-medium tracking-tight">
              Back to Newsletter & Announcements
            </span>
          </Link>
        </Button>
      </div>

      {/* Integrated Article Layout */}
      <div className="space-y-12 md:space-y-16">
        <header className="space-y-8 md:space-y-12">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className="px-3 py-1 capitalize gap-2 text-[10px] font-black tracking-wider ring-1 ring-inset ring-primary/20"
            >
              <TypeIcon className="h-4 w-4 text-primary" />
              {announcement.type === "newsletter"
                ? "Newsletter"
                : "Announcement"}
            </Badge>
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
              <CalendarIcon className="h-4 w-4 opacity-50" />
              {format(
                new Date(announcement.published_at ?? announcement.updated_at),
                "MMMM dd, yyyy",
              )}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.95] text-balance">
              {announcement.title}
            </h1>
            <div className="flex items-center gap-4 text-base md:text-xl lg:text-2xl text-muted-foreground/80">
              <span className="h-1 w-12 bg-primary/30 rounded-full hidden sm:block"></span>
              <p className="font-medium">
                By{" "}
                <strong className="text-foreground font-black">
                  {announcement.author_name}
                </strong>
              </p>
            </div>

            <div className="pt-2">
              <AvatarStack users={announcement.readers || []} />
            </div>
          </div>
        </header>

        <hr className="border-t-2 border-muted/50" />

        <article className="w-full max-w-4xl">
          <AnnouncementContent
            className="prose prose-base sm:prose-lg md:prose-xl lg:prose-2xl dark:prose-invert max-w-none wrap-break-word [word-break:normal] overflow-x-hidden leading-relaxed sm:leading-loose selection:bg-primary/20"
            content={announcement.content}
          />
        </article>
      </div>
    </div>
  );
}
