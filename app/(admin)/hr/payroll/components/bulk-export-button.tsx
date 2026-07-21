"use client";

import { useState } from "react";
import { Loader2, Image as ImageIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toJpeg } from "html-to-image";
import { toast } from "sonner";
import JSZip from "jszip";
import { PayslipContent } from "@/app/(admin)/my/payslip/components/payslip-content";
import type { PayrollEntry } from "@/lib/api/payroll";

interface BulkExportButtonProps {
  entries: PayrollEntry[];
  allCount?: number;
  monthLabel: string;
  payrollMonth: string; // Expects YYYY-MM
}

export function BulkExportButton({ entries, allCount, monthLabel, payrollMonth }: BulkExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<PayrollEntry | null>(null);

  const handleBulkExport = async (formatType: "jpg" | "pdf") => {
    if (entries.length === 0) return;

    setIsExporting(true);
    const zip = new JSZip();
    const toastId = toast.loading(`Preparing bulk export for ${entries.length} payslips as ${formatType.toUpperCase()}...`);

    try {
      const { jsPDF } = await import("jspdf");

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        setCurrentEntry(entry);
        
        // Wait for React to render the specific entry
        // We use a slightly longer delay to ensure all styles and fonts are applied
        await new Promise((resolve) => setTimeout(resolve, 500));

        const element = document.getElementById("bulk-payslip-renderer");
        if (element) {
          const dataUrl = await toJpeg(element, {
            quality: 0.9,
            backgroundColor: "#ffffff",
            style: {
              // Ensure it looks like a proper document
              borderRadius: "0",
              margin: "0",
            }
          });
          
          const safeName = (entry.user?.name || "Staff").replace(/[^a-z0-9]/gi, "_");

          if (formatType === "jpg") {
            const base64Data = dataUrl.split(",")[1];
            const fileName = `Payslip_${safeName}_${monthLabel}.jpg`;
            zip.file(fileName, base64Data, { base64: true });
          } else {
            const pdf = new jsPDF({
              orientation: "portrait",
              unit: "px",
              format: [element.offsetWidth, element.offsetHeight],
            });
            pdf.addImage(dataUrl, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);
            
            const pdfOutput = pdf.output("arraybuffer");
            const fileName = `Payslip_${safeName}_${monthLabel}.pdf`;
            zip.file(fileName, pdfOutput);
          }
        }
        
        toast.loading(`Capturing ${i + 1} of ${entries.length} payslips...`, { id: toastId });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(content);
      link.href = url;
      link.download = `Payslips_${monthLabel.replace(/\s+/g, "_")}_${formatType.toUpperCase()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Bulk export completed! ${entries.length} payslips saved.`, { id: toastId });
    } catch (err) {
      console.error("Bulk export failed", err);
      toast.error(`Failed to export payslips as ${formatType.toUpperCase()}`, { id: toastId });
    } finally {
      setIsExporting(false);
      setCurrentEntry(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 border-primary/20 hover:bg-primary/5 text-primary transition-all active:scale-95 flex items-center gap-1"
            disabled={isExporting || entries.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-1" />
            )}
            {isExporting 
              ? `Exporting ${entries.length}...` 
              : entries.length < (allCount || 0) 
                ? `Export Selected (${entries.length})` 
                : "Export All"}
            <ChevronDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => handleBulkExport("pdf")} className="cursor-pointer">
            📄 Export as PDF Zip
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBulkExport("jpg")} className="cursor-pointer">
            🖼️ Export as JPG Zip
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden Renderer: Only mounted during export */}
      {currentEntry && (
        <div 
          className="fixed pointer-events-none opacity-0 overflow-hidden" 
          style={{ top: "-9999px", left: "-9999px", width: "1000px" }}
        >
          <div id="bulk-payslip-renderer" style={{ width: "1000px" }} className="bg-white p-8">
            <PayslipContent 
              entry={currentEntry} 
              user={currentEntry.user} 
              id="bulk-payslip-renderer-content" 
              fallbackMonth={payrollMonth}
            />
          </div>
        </div>
      )}
    </>
  );
}
