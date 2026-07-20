"use client";

import { BreadcrumbItem } from "@/types/file-types";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 hover:text-foreground transition-colors font-medium text-xs uppercase tracking-wider"
        title="Visa Documents Root"
      >
        <Home className="h-3.5 w-3.5" />
        Home
      </button>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={item.id} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
            {isLast ? (
              <span className="font-semibold text-foreground truncate max-w-40">
                {item.name}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(item.id)}
                className="hover:text-foreground transition-colors truncate max-w-40"
              >
                {item.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
