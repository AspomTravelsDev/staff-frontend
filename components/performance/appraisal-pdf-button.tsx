"use client";

import { useState, type ComponentProps } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/api/action-result";
import { getAppraisalById } from "@/lib/api/performance-appraisal";
import { getAssignedReview } from "@/lib/api/performance-review.actions";
import type { AppraisalPdfSource } from "@/lib/pdf/performance-appraisal-pdf";

interface AppraisalPdfButtonProps
  extends Omit<ComponentProps<typeof Button>, "onClick"> {
  data?: AppraisalPdfSource | null;
  reviewId?: string;
  appraisalId?: string;
  label?: string;
  iconOnly?: boolean;
}

export async function downloadAppraisalPdf(source: AppraisalPdfSource) {
  const { generateAppraisalPdfBlob } = await import(
    "@/lib/pdf/performance-appraisal-pdf"
  );
  const { blob, filename } = await generateAppraisalPdfBlob(source);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

export function AppraisalPdfButton({
  data,
  reviewId,
  appraisalId,
  label = "Download PDF",
  iconOnly = false,
  variant = "outline",
  size = "sm",
  className,
  ...props
}: AppraisalPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let resolved: AppraisalPdfSource | null = data ?? null;
      if (!resolved && reviewId) {
        resolved = await callAction(() => getAssignedReview(reviewId));
      } else if (!resolved && appraisalId) {
        resolved = await getAppraisalById(appraisalId);
      }

      if (!resolved) {
        toast.error("Appraisal details are not available for PDF export.");
        return;
      }

      await downloadAppraisalPdf(resolved);
      toast.success("Branded appraisal PDF downloaded.");
    } catch (error) {
      console.error("Failed to generate appraisal PDF:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to generate appraisal PDF. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={loading}
      onClick={handleDownload}
      className={className}
      title={label}
      {...props}
    >
      {loading ? (
        <Loader2
          className={`size-4 animate-spin ${iconOnly ? "" : "mr-1.5"}`}
          aria-hidden="true"
        />
      ) : (
        <Download
          className={`size-4 ${iconOnly ? "" : "mr-1.5"}`}
          aria-hidden="true"
        />
      )}
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </Button>
  );
}
