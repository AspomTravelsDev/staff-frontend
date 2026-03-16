"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toJpeg } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SanctionGridExportButtonProps {
  targetId: string;
  fileNamePrefix?: string;
}

export function SanctionGridExportButton({
  targetId,
  fileNamePrefix = "sanction-grid",
}: SanctionGridExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      toast.error("Grid not found for export");
      return;
    }

    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.download = `${fileNamePrefix}-${stamp}.jpg`;
      link.href = dataUrl;
      link.click();

      toast.success("Sanction grid exported successfully");
    } catch (error) {
      console.error("Failed to export sanction grid", error);
      toast.error("Failed to export sanction grid");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Exporting..." : "Export Grid JPG"}
    </Button>
  );
}
