import { getITGuide } from "@/lib/api/it-guides";
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

interface ITGuideDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function ITGuideDetailPage({
  params,
}: ITGuideDetailPageProps) {
  const { slug } = await params;
  const guide = await getITGuide(slug);

  if (!guide) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
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
            <span className="text-foreground font-medium wrap-break-word md:truncate">
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

          <div className="flex flex-wrap items-center gap-y-4 gap-x-8 text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest">
                  Author
                </p>
                <p className="font-medium text-foreground">
                  {guide.author_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest">
                  Published
                </p>
                <p className="font-medium text-foreground">
                  {guide.published_at
                    ? new Date(guide.published_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Draft"}
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-background"
              >
                <Share2 className="h-4 w-4" />
              </Button>
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
}
