import { renderDataPage } from "@/lib/api/render-data-page";
import { getITGuide } from "@/lib/api/it-guides";
import { getCurrentUser } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  User,
  Tag,
  ChevronRight,
  Home,
  ListTree,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ITGuideContent,
  estimateReadingTimeMinutes,
  extractITGuideHeadings,
} from "../components/it-guide-content";
import {
  ITGuidePrintButton,
  ITGuideShareDialog,
} from "../components/it-guide-share-dialog";
import { AvatarStack } from "@/components/avatar-stack";
import { ITGuideReadTracker } from "./components/it-guide-read-tracker";

interface ITGuideDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ITGuideDetailPage({
  params,
}: ITGuideDetailPageProps) {
  return renderDataPage(async () => {
    const { slug } = await params;
    const [guide, user] = await Promise.all([
      getITGuide(slug),
      getCurrentUser().catch(() => null),
    ]);

    if (!guide) {
      notFound();
    }

    const canEdit =
      Boolean(user) &&
      (["it", "super", "compliance"].includes(user?.role ?? "") ||
        (user?.secondary_roles ?? []).some((r) =>
          ["it", "super", "compliance"].includes(r),
        ));

    const readingMinutes = estimateReadingTimeMinutes(guide.content);
    const { headings } = extractITGuideHeadings(guide.content);
    const showToc = headings.length >= 2;

    return (
      <div className="min-h-screen bg-background">
        <ITGuideReadTracker id={guide.id} />
        {/* Breadcrumbs */}
        <div className="bg-muted/30 border-b w-full print:hidden">
          <div className="container mx-auto max-w-6xl px-4 py-4">
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

        <article className="container mx-auto max-w-6xl px-4 py-10 w-full">
          {/* Header */}
          <header className="mb-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
              <Link
                href="/my/it"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to IT Desk
              </Link>
              {canEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/it-desk/${guide.id}/edit`}>
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    Edit Guide
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <Badge
                variant="outline"
                className="text-primary border-primary/20 bg-primary/5 px-3 py-1"
              >
                <Tag className="mr-1.5 h-3 w-3" />
                {guide.category || "General"}
              </Badge>
              <Badge variant="secondary" className="px-2.5 py-1 font-normal">
                <Clock className="mr-1.5 h-3 w-3 text-muted-foreground" />
                {readingMinutes} min read
              </Badge>
              {guide.status === "draft" && (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  Draft
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-[1.15]">
              {guide.title}
            </h1>

            {guide.excerpt && (
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mb-6 leading-relaxed">
                {guide.excerpt}
              </p>
            )}

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

              <div className="sm:ml-auto flex items-center gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto print:hidden">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:hidden mr-auto">
                  Actions
                </span>
                <ITGuidePrintButton />
                <ITGuideShareDialog title={guide.title} slug={slug} />
              </div>
            </div>
          </header>

          {/* Main Body + Optional Sticky Table of Contents */}
          <div
            className={
              showToc
                ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16"
                : "mb-16"
            }
          >
            {showToc && (
              <aside className="lg:col-span-4 lg:order-2 lg:sticky lg:top-6 rounded-xl border bg-card p-5 shadow-xs print:hidden">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                  <ListTree className="h-4 w-4 text-primary" />
                  On this page
                </h2>
                <nav aria-label="Table of contents">
                  <ul className="space-y-2 text-sm">
                    {headings.map((heading) => (
                      <li
                        key={heading.id}
                        className={
                          heading.level === 3
                            ? "pl-3.5 border-l border-border"
                            : ""
                        }
                      >
                        <a
                          href={`#${heading.id}`}
                          className={`block transition-colors hover:text-primary ${
                            heading.level === 2
                              ? "font-medium text-foreground/90"
                              : "text-xs text-muted-foreground"
                          }`}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}

            <div
              className={`${
                showToc ? "lg:col-span-8 lg:order-1" : "max-w-4xl"
              } rounded-2xl border bg-card p-6 md:p-10 shadow-xs`}
            >
              <ITGuideContent content={guide.content} />
            </div>
          </div>

          <Separator className="mb-12 print:hidden" />
        </article>
      </div>
    );
  }, "Unable to load this IT guide");
}

