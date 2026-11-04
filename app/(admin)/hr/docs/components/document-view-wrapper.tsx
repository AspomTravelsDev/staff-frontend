"use client";

import { useState } from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocumentFile } from "@/types/file-types";
import { DocumentListTable } from "./document-list-table";
import { DocumentGrid } from "./document-grid";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentViewWrapperProps {
  documents: DocumentFile[];
  showDelete?: boolean;
  departments?: string[];
}

export function DocumentViewWrapper({
  documents,
  showDelete = false,
  departments = [],
}: DocumentViewWrapperProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filteredDocuments = documents.filter(document => {
    const text = [document.title, document.description, document.original_name, document.department, document.category, document.category_label, document.type_label]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" aria-label="Search employee documents" placeholder="Search documents…" value={search} onChange={event => setSearch(event.target.value)} className="h-9 pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none" />
          {search && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 size-7 -translate-y-1/2" aria-label="Clear document search" onClick={() => setSearch("")}><X className="size-3.5" /></Button>}
        </div>
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "grid" | "list")}
          className="w-auto"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid" className="gap-2" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2" aria-label="List view">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {terms.length > 0 && <p role="status" className="text-sm text-muted-foreground">{filteredDocuments.length} of {documents.length} documents</p>}
      {terms.length > 0 && filteredDocuments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No matching documents</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different title, department, category or file name.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>Clear search</Button>
        </div>
      ) : view === "grid" ? (
        <DocumentGrid
          documents={filteredDocuments}
          isLoading={false}
          showDelete={showDelete}
          departments={departments}
        />
      ) : (
        <DocumentListTable
          documents={filteredDocuments}
          isLoading={false}
          showDelete={showDelete}
          departments={departments}
        />
      )}
    </div>
  );
}
