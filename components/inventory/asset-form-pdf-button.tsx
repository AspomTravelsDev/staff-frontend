"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { InventoryAssignment } from "@/lib/api/inventory";

export async function downloadAssetFormPdf(
  assignment?: InventoryAssignment | null,
  assignments?: InventoryAssignment[],
  filename?: string
) {
  if (!assignment && (!assignments || assignments.length === 0)) {
    toast.error("No assignment data available for PDF export.");
    return;
  }

  try {
    const { pdf } = await import("@react-pdf/renderer");
    const { AssetFormPdfDocument } = await import("@/lib/pdf/asset-form-pdf");

    const docElement = (
      <AssetFormPdfDocument
        assignment={assignment}
        assignments={assignments}
      />
    );

    const blob = await pdf(docElement).toBlob();
    const defaultName = assignment
      ? `Asset_Form_${assignment.inventoryItem?.serialNumber || assignment.id}.pdf`
      : `Staff_Asset_Form_${new Date().toISOString().slice(0, 10)}.pdf`;

    const downloadName = filename || defaultName;
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    toast.success("Asset Form PDF generated successfully!");
  } catch (error: any) {
    console.error("PDF generation error:", error);
    toast.error("Failed to generate PDF form.");
  }
}

interface AssetFormPdfButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  assignment?: InventoryAssignment | null;
  assignments?: InventoryAssignment[];
  filename?: string;
  label?: string;
  hideIfEmpty?: boolean;
}

export function AssetFormPdfButton({
  assignment,
  assignments,
  filename,
  label = "Download Asset Form (PDF)",
  variant = "outline",
  size = "sm",
  className,
  hideIfEmpty = true,
  ...props
}: AssetFormPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const hasData = !!assignment || (Array.isArray(assignments) && assignments.length > 0);

  if (!hasData && hideIfEmpty) {
    return null;
  }

  const handleDownload = async () => {
    if (!hasData) {
      toast.error("No assigned gadget available to generate asset declaration form.");
      return;
    }

    setLoading(true);
    try {
      await downloadAssetFormPdf(assignment, assignments, filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={loading || !hasData}
      title={!hasData ? "No assigned gadget available" : undefined}
      className={className}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileText className="w-4 h-4 mr-2 text-rose-600 dark:text-rose-400" />
      )}
      {label}
    </Button>
  );
}

