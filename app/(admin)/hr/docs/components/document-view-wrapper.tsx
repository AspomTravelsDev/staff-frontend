"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { DocumentFile } from "@/types/file-types";
import { DocumentListTable } from "./document-list-table";
import { DocumentGrid } from "./document-grid";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentViewWrapperProps {
  documents: DocumentFile[];
  showDelete?: boolean;
}

export function DocumentViewWrapper({
  documents,
  showDelete = false,
}: DocumentViewWrapperProps) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "grid" | "list")}
          className="w-auto"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "grid" ? (
        <DocumentGrid
          documents={documents}
          isLoading={false}
          showDelete={showDelete}
        />
      ) : (
        <DocumentListTable
          documents={documents}
          isLoading={false}
          showDelete={showDelete}
        />
      )}
    </div>
  );
}
