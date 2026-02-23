"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, type ExportColumn } from "@/lib/utils/export";

interface TableExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  selectedIndices?: Set<number> | number[] | Set<string> | string[];
  keyExtractor?: (item: T, index: number) => string | number;
}

export function TableExportButton<T>({
  data,
  columns,
  filename = "export",
  selectedIndices,
  keyExtractor,
}: TableExportButtonProps<T>) {
  const handleExport = () => {
    let dataToExport = data;

    if (selectedIndices) {
      if (selectedIndices instanceof Set && selectedIndices.size > 0) {
        dataToExport = data.filter((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : index;
          return (selectedIndices as Set<any>).has(key);
        });
      } else if (Array.isArray(selectedIndices) && selectedIndices.length > 0) {
        dataToExport = data.filter((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : index;
          return (selectedIndices as any[]).includes(key);
        });
      }
    }

    if (dataToExport.length === 0) {
      dataToExport = data;
    }

    exportToCSV(dataToExport, columns, filename);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export
    </Button>
  );
}
