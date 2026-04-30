"use client";

import { useState } from "react";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toJpeg } from "html-to-image";
import { toast } from "sonner";
import JSZip from "jszip";
import { PayslipContent } from "@/app/(admin)/my/payslip/components/payslip-content";
import type { PayrollEntry } from "@/lib/api/payroll";

interface BulkExportButtonProps {
  entries: PayrollEntry[];
  monthLabel: string;
  payrollMonth: string; // Expects YYYY-MM
}

export function BulkExportButton({ entries, monthLabel, payrollMonth }: BulkExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<PayrollEntry | null>(null);

  const handleBulkExport = async () => {
    if (entries.length === 0) return;

    setIsExporting(true);
    const zip = new JSZip();
    const toastId = toast.loading(`Preparing bulk export for ${entries.length} payslips...`);

    try {
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
          
          // dataUrl is "data:image/jpeg;base64,..."
          const base64Data = dataUrl.split(",")[1];
          const safeName = (entry.user?.name || "Staff").replace(/[^a-z0-9]/gi, "_");
          const fileName = `Payslip_${safeName}_${monthLabel}.jpg`;
          zip.file(fileName, base64Data, { base64: true });
        }
        
        toast.loading(`Capturing ${i + 1} of ${entries.length} payslips...`, { id: toastId });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(content);
      link.href = url;
      link.download = `Payslips_${monthLabel.replace(/\s+/g, "_")}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Bulk export completed! ${entries.length} payslips saved.`, { id: toastId });
    } catch (err) {
      console.error("Bulk export failed", err);
      toast.error("Failed to export payslips", { id: toastId });
    } finally {
      setIsExporting(false);
      setCurrentEntry(null);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 border-primary/20 hover:bg-primary/5 text-primary transition-all active:scale-95"
        onClick={handleBulkExport}
        disabled={isExporting || entries.length === 0}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4 mr-2" />
        )}
        {isExporting ? "Exporting..." : "Export All (JPG)"}
      </Button>

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
