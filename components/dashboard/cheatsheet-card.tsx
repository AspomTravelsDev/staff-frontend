import { BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CheatsheetItem } from "@/types/cheatsheet-types";
import Link from "next/link";

interface CheatsheetCardProps {
  item: CheatsheetItem | null;
}

export function CheatsheetCard({ item }: CheatsheetCardProps) {
  if (!item) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-white to-primary/5 p-5 shadow-sm dark:border-primary/30 dark:from-primary/10 dark:via-zinc-900 dark:to-primary/5 transition-all duration-300 hover:shadow-md hover:border-primary/45">
      {/* Decorative background glows */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Icon wrapper */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <BookOpen className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Daily Cheatsheet
            </span>
            {item.category && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 text-[10px] px-2 py-0.5 font-semibold">
                {item.category}
              </Badge>
            )}
          </div>
          <h4 className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
            {item.title}
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-5xl">
            {item.content}
          </p>
        </div>

        {/* Quick action */}
        <div className="shrink-0 self-end md:self-center">
          <Link
            href="/my/cheatsheet-quiz"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-foreground hover:bg-primary bg-primary/5 px-3 py-1.5 rounded-lg transition-all border border-primary/20"
          >
            <span>Take Daily Quiz</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
