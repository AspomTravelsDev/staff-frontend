import { renderDataPage } from "@/lib/api/render-data-page";
import { getITGuides } from "@/lib/api/it-guides";
import { getCurrentUser } from "@/lib/auth/session";
import { MarkITGuidesReadOnVisit } from "./components/mark-it-guides-read-on-visit";
import { estimateReadingTimeMinutes } from "./components/it-guide-content";
import {
  Search,
  BookOpen,
  ChevronRight,
  Clock,
  HelpCircle,
  Cpu,
  ShieldCheck,
  Globe,
  Settings2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatLagosDate } from "@/lib/utils/attendance";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  Software: BookOpen,
  Hardware: Cpu,
  Network: Globe,
  Security: ShieldCheck,
  General: HelpCircle,
  Policies: ShieldCheck,
  "Portal Guide": BookOpen,
};

const CATEGORIES = [
  { value: "All", label: "All Guides" },
  { value: "Portal Guide", label: "Portal Guide" },
  { value: "Policies", label: "HR/IT Policies" },
  { value: "Software", label: "Software" },
  { value: "Hardware", label: "Hardware" },
  { value: "Network", label: "Network" },
  { value: "Security", label: "Security" },
  { value: "General", label: "General" },
];

export default async function ITInformationDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  return renderDataPage(async () => {
    const { category: activeCategory, q: rawQuery } = await searchParams;
    const searchQuery = (rawQuery ?? "").trim();

    const [{ items: allGuides }, user] = await Promise.all([
      getITGuides({
        status: "published",
        limit: 100,
        category:
          activeCategory && activeCategory !== "All"
            ? activeCategory
            : undefined,
      }),
      getCurrentUser().catch(() => null),
    ]);

    const canManage =
      Boolean(user) &&
      (["it", "super", "compliance"].includes(user?.role ?? "") ||
        (user?.secondary_roles ?? []).some((r) =>
          ["it", "super", "compliance"].includes(r),
        ));

    const guides = searchQuery
      ? allGuides.filter((guide) => {
          const haystack = `${guide.title} ${guide.excerpt ?? ""} ${guide.category ?? ""} ${guide.content.replace(/<[^>]*>/g, " ")}`.toLowerCase();
          return haystack.includes(searchQuery.toLowerCase());
        })
      : allGuides;

    const buildFilterHref = (cat: string, query: string) => {
      const params = new URLSearchParams();
      if (cat && cat !== "All") params.set("category", cat);
      if (query.trim()) params.set("q", query.trim());
      const qs = params.toString();
      return qs ? `/my/it?${qs}` : "/my/it";
    };

    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <MarkITGuidesReadOnVisit />
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-14 px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge
                variant="secondary"
                className="bg-primary-foreground/10 text-primary-foreground border-none"
              >
                Knowledge Base
              </Badge>
              {canManage && (
                <Link href="/admin/it-desk">
                  <Badge
                    variant="outline"
                    className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/25 cursor-pointer"
                  >
                    <Settings2 className="mr-1.5 h-3 w-3" />
                    Manage Guides
                  </Badge>
                </Link>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              IT Information Desk
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed mb-8">
              Step-by-step portal guides, IT documentation, and policies to keep
              you productive.
            </p>

            {/* Search Bar */}
            <form
              action="/my/it"
              method="GET"
              className="max-w-xl mx-auto flex items-center gap-2 bg-background text-foreground rounded-full p-1.5 shadow-lg"
            >
              {activeCategory && activeCategory !== "All" && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
              <Search className="ml-3.5 h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search guides by title, topic, or keyword..."
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-10 text-sm"
              />
              {searchQuery && (
                <Link
                  href={buildFilterHref(activeCategory ?? "All", "")}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </Link>
              )}
              <Button type="submit" size="sm" className="rounded-full px-5 h-9">
                Search
              </Button>
            </form>
          </div>
        </section>

        {/* Main Content */}
        <main className="container mx-auto max-w-6xl py-10 px-4 grow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {activeCategory && activeCategory !== "All"
                  ? `${CATEGORIES.find((c) => c.value === activeCategory)?.label ?? activeCategory}`
                  : "All Published Guides"}
              </h2>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {guides.length} result{guides.length === 1 ? "" : "s"} for{" "}
                  <span className="font-medium text-foreground">
                    &quot;{searchQuery}&quot;
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive =
                  activeCategory === cat.value ||
                  (!activeCategory && cat.value === "All");
                return (
                  <Link
                    key={cat.value}
                    href={buildFilterHref(cat.value, searchQuery)}
                    scroll={false}
                  >
                    <Badge
                      variant={isActive ? "default" : "outline"}
                      className={`px-3.5 py-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      {cat.label}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>

          {guides.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed flex flex-col items-center justify-center px-4">
              <div className="p-4 bg-muted rounded-full mb-4">
                <HelpCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No matching guides found</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {searchQuery || (activeCategory && activeCategory !== "All")
                  ? "Try clearing your search or switching to All Guides."
                  : "We haven't published any IT guides yet. Please check back later!"}
              </p>
              {(searchQuery || (activeCategory && activeCategory !== "All")) && (
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/my/it">Reset filters</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => {
                const Icon =
                  CATEGORY_ICONS[guide.category || "General"] || HelpCircle;
                const readingMinutes = estimateReadingTimeMinutes(guide.content);
                return (
                  <Link
                    key={guide.id}
                    href={`/my/it/${guide.slug}`}
                    className="group"
                  >
                    <Card className="h-full border shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden rounded-2xl group-hover:-translate-y-0.5 flex flex-col">
                      <div className="h-1.5 bg-primary w-full" />
                      <CardHeader className="pt-5 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-muted text-muted-foreground text-[10px] uppercase tracking-wider font-bold border-none"
                            >
                              {guide.category || "General"}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {readingMinutes} min
                          </span>
                        </div>
                        <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                          {guide.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grow pb-4">
                        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                          {guide.excerpt ||
                            "Dive into this guide to learn more about this topic..."}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 pb-5 flex items-center justify-between border-t/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <span>{guide.author_name}</span>
                          <span>•</span>
                          <span>
                            {guide.published_at
                              ? formatLagosDate(guide.published_at)
                              : "Draft"}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        {/* Support Section */}
        <section className="bg-card border-t py-12 px-4 shadow-inner">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-2xl font-bold mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h3>
            <p className="text-muted-foreground mb-8">
              If you still need assistance after checking these guides, please
              open an IT issue or contact us directly.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/my/it/assets">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 rounded-full font-bold shadow-xs hover:cursor-pointer"
                >
                  View My Assigned Devices
                </Button>
              </Link>
              <Link href="/my/it-issue">
                <Button
                  size="lg"
                  className="h-12 px-7 rounded-full font-bold shadow-md hover:cursor-pointer"
                >
                  Report an IT Issue
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }, "Unable to load IT guides");
}
