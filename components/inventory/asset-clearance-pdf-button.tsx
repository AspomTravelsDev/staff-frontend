"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { InventoryAssignment } from "@/lib/api/inventory";

export async function downloadAssetClearancePdf(
  assignment: InventoryAssignment,
  allAssignments?: InventoryAssignment[],
  filename?: string
) {
  if (!assignment) {
    toast.error("No clearance assignment data available for PDF export.");
    return;
  }

  try {
    const { pdf } = await import("@react-pdf/renderer");
    const { AssetClearancePdfDocument } = await import("@/lib/pdf/asset-clearance-pdf");

    const docElement = (
      <AssetClearancePdfDocument
        assignment={assignment}
        allAssignments={allAssignments}
      />
    );

    const blob = await pdf(docElement).toBlob();
    const defaultName = `Asset_Clearance_Certificate_${assignment.assignee?.name?.replace(/\s+/g, "_") || assignment.id}.pdf`;

    const downloadName = filename || defaultName;
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    toast.success("Asset Clearance Certificate generated successfully!");
  } catch (error: any) {
    console.error("Clearance PDF generation error:", error);
    toast.error("Failed to generate Asset Clearance Certificate PDF.");
  }
}

interface AssetClearancePdfButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  assignment: InventoryAssignment;
  allAssignments?: InventoryAssignment[];
  filename?: string;
  label?: string;
}

export function AssetClearancePdfButton({
  assignment,
  allAssignments,
  filename,
  label = "Download Clearance Certificate (PDF)",
  variant = "outline",
  size = "sm",
  className,
  ...props
}: AssetClearancePdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await downloadAssetClearancePdf(assignment, allAssignments, filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
      )}
      {label}
    </Button>
  );
}
