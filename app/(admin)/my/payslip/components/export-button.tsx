"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toJpeg } from "html-to-image";
import { toast } from "sonner";

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById("payslip-document");
    if (!element) {
      toast.error("Payslip document not found");
      return;
    }

    setIsExporting(true);
    try {
      // Give a small delay to ensure styles are perfectly applied
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        style: {
          borderRadius: "0",
        },
      });

      const link = document.createElement("a");
      link.download = `Payslip_${new Date().toLocaleString("default", { month: "short", year: "numeric" })}.jpg`;
      link.href = dataUrl;
      link.click();

      toast.success("Payslip exported successfully");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Failed to export payslip image");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="bg-background shadow-sm hover:shadow-md transition-all active:scale-95"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isExporting ? "Exporting..." : "Export to JPG"}
    </Button>
  );
}
