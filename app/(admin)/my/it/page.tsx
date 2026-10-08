import { renderDataPage } from "@/lib/api/render-data-page";
import { getITGuides } from "@/lib/api/it-guides";
import {
  Search,
  BookOpen,
  ChevronRight,
  HelpCircle,
  Cpu,
  ShieldCheck,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLagosDate } from "@/lib/utils/attendance";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CATEGORY_ICONS: Record<string, any> = {
  Software: BookOpen,
  Hardware: Cpu,
  Network: Globe,
  Security: ShieldCheck,
  General: HelpCircle,
  Policies: ShieldCheck,
  "Portal Guide": BookOpen,
};

export default async function ITInformationDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  return renderDataPage(async () => {
  const { category: activeCategory } = await searchParams;

  const { items: guides } = await getITGuides({
    status: "published",
    limit: 50,
    category: activeCategory === "All" ? undefined : activeCategory,
  });

  const categories = [
    "All",
    "Portal Guide",
    "Software",
    "Hardware",
    "Network",
    "Security",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge
            variant="secondary"
            className="mb-4 bg-primary-foreground/10 text-primary-foreground border-none"
          >
            Knowledge Base
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            IT Information Desk
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about our IT systems, software, and
            hardware. Detailed guides and documentation to keep you productive.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl py-12 px-4 grow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            {activeCategory && activeCategory !== "All"
              ? `${activeCategory} Guides`
              : "Latest IT Guides"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive =
                activeCategory === cat || (!activeCategory && cat === "All");
              return (
                <Link
                  key={cat}
                  href={cat === "All" ? "/my/it" : `/my/it?category=${cat}`}
                  scroll={false}
                >
                  <Badge
                    variant={isActive ? "default" : "outline"}
                    className={`px-4 py-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>

        {guides.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed flex flex-col items-center justify-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No guides found</h3>
            <p className="text-muted-foreground mt-2">
              We haven't published any IT guides yet. Please check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide) => {
              const Icon =
                CATEGORY_ICONS[guide.category || "General"] || HelpCircle;
              return (
                <Link
                  key={guide.id}
                  href={`/my/it/${guide.slug}`}
                  className="group"
                >
                  <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl group-hover:-translate-y-1">
                    <div className="h-2 bg-primary w-full" />
                    <CardHeader className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
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
                      <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                        {guide.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                        {guide.excerpt ||
                          "Dive into this guide to learn more about this topic..."}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 pb-6 flex items-center justify-between">
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
            Can't find what you're looking for?
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
                className="h-14 px-8 rounded-full font-bold shadow-sm hover:cursor-pointer"
              >
                View My Assigned Devices
              </Button>
            </Link>
            <Link href="/my/it-issue">
              <Button
                size="lg"
                className="h-14 px-8 rounded-full font-bold shadow-lg hover:cursor-pointer"
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
