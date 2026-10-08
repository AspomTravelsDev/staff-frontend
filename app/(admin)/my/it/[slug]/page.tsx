import { renderDataPage } from "@/lib/api/render-data-page";
import { getITGuide, markITGuideAsRead } from "@/lib/api/it-guides";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Share2,
  Printer,
  ChevronRight,
  Home,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ITGuideContent } from "../components/it-guide-content";
import { ITGuideShareDialog } from "../components/it-guide-share-dialog";
import { AvatarStack } from "@/components/avatar-stack";
import { ITGuideReadTracker } from "./components/it-guide-read-tracker";

interface ITGuideDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function ITGuideDetailPage({
  params,
}: ITGuideDetailPageProps) {
  return renderDataPage(async () => {
  const { slug } = await params;
  const guide = await getITGuide(slug);

  if (!guide) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <ITGuideReadTracker id={guide.id} />
      {/* Breadcrumbs */}
      <div className="bg-muted/30 border-b w-full">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Link
              href="/dashboard"
              className="hover:text-primary flex items-center gap-1 shrink-0"
            >
              <Home className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link href="/my/it" className="hover:text-primary shrink-0">
              IT Information Desk
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground font-medium break-all md:truncate">
              {guide.title}
            </span>
          </nav>
        </div>
      </div>

      <article className="container mx-auto max-w-4xl px-4 py-12 w-full overflow-hidden">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/my/it"
            className="inline-flex items-center text-sm font-medium text-primary mb-8 hover:underline group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to IT Desk
          </Link>

          <div className="flex items-center gap-2 mb-6">
            <Badge
              variant="outline"
              className="text-primary border-primary/20 bg-primary/5 px-3 py-1"
            >
              <Tag className="mr-1.5 h-3 w-3" />
              {guide.category || "General"}
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 leading-[1.15]">
            {guide.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-4 gap-x-8 text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Author
                </p>
                <p className="font-semibold text-foreground leading-none">
                  {guide.author_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <AvatarStack users={guide.readers || []} />
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Published
                </p>
                <p className="font-semibold text-foreground leading-none">
                  {guide.published_at
                    ? new Intl.DateTimeFormat("en-US", {
                        timeZone: "Africa/Lagos",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(guide.published_at))
                    : "Draft"}
                </p>
              </div>
            </div>

            <div className="sm:ml-auto flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:hidden mr-auto">
                Actions
              </span>
              <ITGuideShareDialog title={guide.title} slug={slug} />
            </div>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-lg prose-slate max-w-none dark:prose-invert 
          prose-headings:font-bold prose-headings:tracking-tight 
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-2xl prose-img:shadow-xl
          prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800
          mb-16"
        >
          <ITGuideContent content={guide.content} />
        </div>

        <Separator className="mb-12" />
      </article>
    </div>
  );

  }, "Unable to load this IT guide");
}
