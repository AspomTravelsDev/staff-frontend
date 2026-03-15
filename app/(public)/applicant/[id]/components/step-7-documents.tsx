"use client";

import { useState } from "react";
import { redirectToPreviousStep, saveFormStep } from "../actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MediaData } from "@/lib/types/form-data";
import { downloadPdfFormsAction } from "../pdf-actions";

export function Step7Documents({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: MediaData;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleDownloadForms = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const result = await downloadPdfFormsAction(applicationId);

      if (result.error) {
        setDownloadError(result.error);
        return;
      }

      // Download PDF files via fetch to force download by proxying to bypass CORS
      const downloadFile = async (url: string, fileName: string) => {
        try {
          const proxyUrl = `/api/proxy-file?url=${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.error(`Failed to download ${fileName}:`, err);
        }
      };

      if (result.guarantor1Url) {
        await downloadFile(result.guarantor1Url, "Guarantor_1_Form.pdf");
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      if (result.guarantor2Url) {
        await downloadFile(result.guarantor2Url, "Guarantor_2_Form.pdf");
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      if (result.refereeUrl) {
        await downloadFile(result.refereeUrl, "Referee_Form.pdf");
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      if (result.ndaUrl) {
        await downloadFile(result.ndaUrl, "NDA_Agreement.pdf");
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      if (result.indemnityUrl) {
        await downloadFile(result.indemnityUrl, "ASPOM_Indemnity.pdf");
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      if (result.offerLetterUrl) {
        await downloadFile(result.offerLetterUrl, "Offer_Letter.pdf");
      }

      setHasDownloaded(true);
    } catch (err) {
      setDownloadError("Failed to download forms. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBack = async () => {
    await redirectToPreviousStep(applicationId, 7);
  };

  const handleProceedToUpload = async () => {
    setIsNavigating(true);
    // Save step 7 as completed before navigating to step 8
    await saveFormStep(applicationId, 7, {
      documents: {
        formsDownloaded: true,
        downloadedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Download Documents</h3>
        <p className="text-sm text-muted-foreground">
          Step 7 of 8 - Download and print the required forms before final
          upload
        </p>
      </div>

      <div className="space-y-6">
        {/* Download Forms Info */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Required Documents</h4>
            <p className="text-sm text-muted-foreground">
              Please download the following forms and have them completed and
              signed where required:
            </p>
            <ul className="text-sm text-muted-foreground mt-3 ml-4 space-y-1">
              <li>
                • <strong>Guarantor 1 Form</strong> - To be completed by your
                first guarantor
              </li>
              <li>
                • <strong>Guarantor 2 Form</strong> - To be completed by your
                second guarantor
              </li>
              <li>
                • <strong>Referee Form</strong> - To be completed by your
                referee
              </li>
              <li>
                • <strong>NDA Agreement</strong> - Sign and upload in the final
                step
              </li>
              <li>
                • <strong>Indemnity Form</strong> - Sign and upload in the final
                step
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Once completed, you will need to submit these forms as part of
              your onboarding process.
            </p>
            <Button
              type="button"
              onClick={handleDownloadForms}
              disabled={isDownloading}
              className="w-full"
              variant="default"
            >
              {isDownloading
                ? "Generating PDFs..."
                : "Download Required Forms (5 PDFs + Offer Letter)"}
            </Button>
            {downloadError && (
              <div className="mt-3 rounded text-sm text-destructive bg-destructive/10 p-2 border border-destructive/20">
                {downloadError}
              </div>
            )}
            {hasDownloaded && (
              <div className="mt-3 rounded text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 border border-green-100 dark:border-green-900/30">
                ✓ Forms downloaded successfully. You can now proceed to upload
                the signed documents.
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 p-4 space-y-2">
          <h5 className="text-sm font-semibold text-yellow-900 dark:text-yellow-500">
            Important Instructions
          </h5>
          <ul className="text-sm text-yellow-800 dark:text-yellow-600 space-y-1">
            <li>• Print all required forms</li>
            <li>• Distribute guarantor and referee forms appropriately</li>
            <li>• Ensure they complete all required fields</li>
            <li>• Sign your NDA and indemnity documents</li>
            <li>• Collect all signed forms for upload in the next step</li>
            <li>• Keep copies for your records</li>
          </ul>
        </div>

        {/* Next Step Info */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-4 border border-blue-100 dark:border-blue-900/20">
          <p className="text-sm dark:text-blue-300">
            <strong>Next Step:</strong> After downloading the forms and getting
            them signed, you will upload the signed documents in the final step
            to complete your application.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          type="button"
          disabled={!hasDownloaded || isNavigating}
          onClick={handleProceedToUpload}
        >
          {isNavigating ? "Proceeding..." : "Proceed to Upload Signed Forms"}
        </Button>
      </div>
    </div>
  );
}
