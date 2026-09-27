"use client";

import { useState } from "react";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toJpeg } from "html-to-image";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

interface ExportButtonProps {
  entry?: any;
}

export function ExportButton({ entry }: ExportButtonProps = {}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "jpg" | "pdf") => {
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

      const runStatus = entry?.run?.status || entry?.run_status;
      const isDraft = entry
        ? entry.status !== "approved" ||
          (Boolean(runStatus) && runStatus !== "closed")
        : false;
      const draftSuffix = isDraft ? "_DRAFT" : "";

      const monthName = entry?.run?.payroll_month
        ? new Date(entry.run.payroll_month + "-01")
            .toLocaleString("default", { month: "short", year: "numeric" })
            .replace(/\s+/g, "_")
        : new Date()
            .toLocaleString("default", { month: "short", year: "numeric" })
            .replace(/\s+/g, "_");

      if (format === "jpg") {
        const link = document.createElement("a");
        link.download = `Payslip_${monthName}${draftSuffix}.jpg`;
        link.href = dataUrl;
        link.click();
        toast.success(`Payslip ${isDraft ? "(Draft) " : ""}exported as JPG successfully`);
      } else {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [element.offsetWidth, element.offsetHeight],
        });
        pdf.addImage(dataUrl, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);
        pdf.save(`Payslip_${monthName}${draftSuffix}.pdf`);
        toast.success(`Payslip ${isDraft ? "(Draft) " : ""}exported as PDF successfully`);
      }
    } catch (err) {
      console.error("Export failed", err);
      toast.error(`Failed to export payslip ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-background transition-all active:scale-95 flex items-center gap-1"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          {isExporting ? "Exporting..." : "Export Payslip"}
          <ChevronDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="cursor-pointer">
          📄 Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("jpg")} className="cursor-pointer">
          🖼️ Export as JPG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
