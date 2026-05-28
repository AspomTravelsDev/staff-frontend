/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
// import { redirectToPreviousStep, saveFormStep } from "../actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// import { MediaData } from "@/lib/types/form-data";
import { downloadPdfFormsAction } from "../pdf-actions";
import { RequiredSignedAssetDocument } from "@/lib/types/hr";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  FileCheck,
  Sparkles
} from "lucide-react";

type PdfDownloadResult = {
  error?: string;
  guarantor1Url?: string;
  guarantor2Url?: string;
  refereeUrl?: string;
  offerLetterUrl?: string;
  ndaUrl?: string;
  personalFormUrl?: string;
  kycUrl?: string;
};

export function Step7Documents({
  applicationId,
  initialData,
  requiredAssetDocuments = [],
}: {
  applicationId: string;
  initialData?: any;
  requiredAssetDocuments?: RequiredSignedAssetDocument[];
}) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [urls, setUrls] = useState<PdfDownloadResult | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [dressCodeAcknowledged, setDressCodeAcknowledged] = useState(
    initialData?.dressCodeAcknowledged || false
  );

  const generateUrls = async (showToast = false) => {
    setIsGenerating(true);
    setDownloadError(null);
    try {
      const result = await downloadPdfFormsAction(applicationId, {
        includeAdminOnly: true,
      });

      if (result.error) {
        setDownloadError(result.error);
        if (showToast) toast.error(result.error);
      } else {
        setUrls(result);
        if (showToast) toast.success("Documents generated successfully!");
      }
    } catch (err) {
      setDownloadError("Failed to prepare your documents. Please refresh to try again.");
      if (showToast) toast.error("Failed to prepare documents.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateUrls();
  }, [applicationId]);

  const downloadFile = async (url: string, fileName: string) => {
    setDownloadingFile(fileName);
    try {
      const proxyUrl = `/api/proxy-file?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error("Network response was not ok");
      
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
      toast.error(`Failed to download ${fileName}. Please try again.`);
    } finally {
      setDownloadingFile(null);
    }
  };

  const getRequiredForms = (pdfUrls: PdfDownloadResult) => {
    const list = [];
    if (pdfUrls.guarantor1Url) {
      list.push({
        id: "guarantor1",
        label: "Guarantor 1 Form",
        description: "To be printed, completed and physically signed by your first guarantor.",
        url: pdfUrls.guarantor1Url,
        filename: "Guarantor_1_Form.pdf",
      });
    }
    if (pdfUrls.guarantor2Url) {
      list.push({
        id: "guarantor2",
        label: "Guarantor 2 Form",
        description: "To be printed, completed and physically signed by your second guarantor.",
        url: pdfUrls.guarantor2Url,
        filename: "Guarantor_2_Form.pdf",
      });
    }
    if (pdfUrls.refereeUrl) {
      list.push({
        id: "referee",
        label: "Referee Form",
        description: "To be printed, completed and physically signed by your professional or academic referee.",
        url: pdfUrls.refereeUrl,
        filename: "Referee_Form.pdf",
      });
    }
    if (pdfUrls.ndaUrl) {
      list.push({
        id: "nda",
        label: "NDA Agreement",
        description: "Your Non-Disclosure Agreement. Print, sign, and date it.",
        url: pdfUrls.ndaUrl,
        filename: "NDA_Agreement.pdf",
      });
    }

    // Add extra required documents from assets
    for (const doc of requiredAssetDocuments) {
      if (!doc.assetUrl) continue;
      const extension = doc.filename.split(".").pop() || "pdf";
      const normalized = doc.label.replace(/\s+/g, "_");
      list.push({
        id: doc.key,
        label: doc.label,
        description: "Required company document. Print, sign, and date it.",
        url: doc.assetUrl,
        filename: `${normalized}.${extension}`,
      });
    }

    return list;
  };

  const getRecordForms = (pdfUrls: PdfDownloadResult) => {
    const list = [];
    if (pdfUrls.offerLetterUrl) {
      list.push({
        id: "offerLetter",
        label: "Offer Letter",
        description: "Your official employment offer letter from ASPOM Travels.",
        url: pdfUrls.offerLetterUrl,
        filename: "Offer_Letter.pdf",
      });
    }
    if (pdfUrls.personalFormUrl) {
      list.push({
        id: "personalForm",
        label: "Personal Data Form (Copy)",
        description: "A PDF archive copy of the personal details you submitted in Step 1.",
        url: pdfUrls.personalFormUrl,
        filename: "Personal_Data_Form.pdf",
      });
    }
    if (pdfUrls.kycUrl) {
      list.push({
        id: "kyc",
        label: "KYC Form (Copy)",
        description: "A PDF copy of your address and physical verification details from Step 2.",
        url: pdfUrls.kycUrl,
        filename: "KYC_Form.pdf",
      });
    }
    return list;
  };

  const requiredForms = urls ? getRequiredForms(urls) : [];
  const recordForms = urls ? getRecordForms(urls) : [];

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    toast.info("Starting download of all documents...");
    
    try {
      const allFiles = [...requiredForms, ...recordForms];
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        await downloadFile(file.url, file.filename);
        // Add a delay between downloads to reduce browser blockage on iOS/Safari
        if (i < allFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      toast.success("All downloads initiated successfully!");
    } catch (err) {
      toast.error("An error occurred during batch download.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleBack = async () => {
    await redirectToPreviousStep(applicationId, 7);
  };

  const handleProceedToUpload = async () => {
    if (!dressCodeAcknowledged) {
      toast.error("Please acknowledge the dress code guidelines to proceed.");
      return;
    }
    setIsNavigating(true);
    // Save step 7 as completed before navigating to step 8
    await saveFormStep(applicationId, 7, {
      documents: {
        formsDownloaded: true,
        downloadedAt: new Date().toISOString(),
        dressCodeAcknowledged: true,
        dressCodeAcknowledgedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Download Documents</h3>
        <p className="text-sm text-muted-foreground">
          Step 7 of 8 - Download and print the required forms before final upload in the next step
        </p>
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-lg border bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium">Generating your personalized document packet...</p>
            <p className="text-xs text-muted-foreground mt-1">This will take about 3-5 seconds</p>
          </div>
        </div>
      ) : downloadError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 space-y-3">
          <div className="flex gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Failed to generate documents</p>
              <p className="text-xs opacity-90 mt-1">{downloadError}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => generateUrls(true)} className="flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* iOS / iPhone Warning Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10 p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-amber-900 dark:text-amber-400">
                  Are you on an iPhone or iPad?
                </h5>
                <p className="text-xs text-amber-800 dark:text-amber-500 mt-1">
                  Mobile browsers (especially Safari) block downloading multiple files automatically. 
                  Please use the individual <strong>Download PDF</strong> buttons below to download each document one by one.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Required Signed Forms */}
          {requiredForms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-semibold">1. Print, Sign & Upload back (Required)</h4>
              </div>
              <p className="text-xs text-muted-foreground -mt-1 pl-7">
                These forms must be printed, filled, physically signed by the respective parties, and uploaded in Step 8.
              </p>
              <div className="grid gap-3 pl-0 md:pl-7">
                {requiredForms.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/5 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-destructive/10 text-destructive shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{file.label}</span>
                          <span className="text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.5 rounded uppercase">
                            Required
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{file.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(file.url, file.filename)}
                      disabled={downloadingFile === file.filename}
                      className="w-full md:w-auto shrink-0 flex items-center gap-1.5"
                    >
                      {downloadingFile === file.filename ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Personal Records */}
          {recordForms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                <h4 className="text-sm font-semibold">2. Keep for your records (Optional)</h4>
              </div>
              <p className="text-xs text-muted-foreground -mt-1 pl-7">
                Copies of your offer letter and your compiled data forms. Keep them for your personal records.
              </p>
              <div className="grid gap-3 pl-0 md:pl-7">
                {recordForms.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/5 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">{file.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{file.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(file.url, file.filename)}
                      disabled={downloadingFile === file.filename}
                      className="w-full md:w-auto shrink-0 flex items-center gap-1.5"
                    >
                      {downloadingFile === file.filename ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Dress Code Guideline */}
          <div className="space-y-4 rounded-lg border p-4 bg-card shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <h4 className="text-sm font-semibold">3. Dress Guidelines</h4>
            </div>
            <p className="text-xs text-muted-foreground pl-7 -mt-2">
              Please review ASPOM&apos;s corporate dress code and guidelines. You are required to read and acknowledge these guidelines to proceed.
            </p>

            <div className="pl-0 md:pl-7 space-y-4">
              <div className="relative overflow-hidden rounded-lg border bg-muted/10 group max-w-lg mx-auto">
                <img
                  src="/dresscode.png"
                  alt="ASPOM Dress Code Guidelines"
                  className="w-full h-auto object-contain max-h-87.5 transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="flex items-start space-x-3 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-950/20 dark:bg-indigo-950/5">
                <Checkbox
                  id="dress-code-ack"
                  checked={dressCodeAcknowledged}
                  onCheckedChange={(checked) => setDressCodeAcknowledged(!!checked)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="dress-code-ack"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I acknowledge that I have reviewed the ASPOM Dress Code & Guidelines.
                  </label>
                  <p className="text-xs text-muted-foreground">
                    I understand that I am expected to adhere to these standards during my employment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download All Button */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-semibold">Batch Download Option</p>
                <p className="text-xs mt-0.5">
                  If you are on a desktop/laptop, you can download all forms at once using the button below.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || isGenerating}
              className="w-full"
              variant="default"
            >
              {isDownloadingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Downloading Packet...
                </>
              ) : (
                `Download All Forms (${requiredForms.length + recordForms.length} PDFs)`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack} disabled={isNavigating}>
          Back
        </Button>
        <Button
          type="button"
          disabled={isGenerating || !urls || isNavigating}
          onClick={handleProceedToUpload}
        >
          {isNavigating ? "Proceeding..." : "Proceed to Upload Signed Forms"}
        </Button>
      </div>
    </div>
  );
}

