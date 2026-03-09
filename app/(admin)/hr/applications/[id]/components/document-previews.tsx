"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SignedDocument {
  fileName: string;
  storagePath: string;
  uploadedAt: string;
}

interface GeneratedPdf {
  storagePath: string;
  generatedAt: string;
  fileSize: number;
}

interface DocumentPreviewsProps {
  applicationId: string;
  generatedPdfs?: {
    guarantor1?: GeneratedPdf;
    guarantor2?: GeneratedPdf;
    referee?: GeneratedPdf;
    offerLetter?: GeneratedPdf;
  };
  signedDocuments?: {
    guarantor1Signed?: SignedDocument;
    guarantor2Signed?: SignedDocument;
    refereeSigned?: SignedDocument;
  };
}

interface DocumentCardProps {
  title: string;
  description: string;
  documentUrl?: string;
  uploadedAt?: string;
  type: "unsigned" | "signed";
}

function DocumentCard({
  title,
  description,
  documentUrl,
  uploadedAt,
  type,
}: DocumentCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!documentUrl) return;

    setIsLoading(true);
    try {
      // In a real environment with CORS issues, you might just window.open()
      // or dispatch to a download server action. We try direct fetch here.
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback
      window.open(documentUrl, "_blank");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="relative rounded-lg border bg-card p-4 transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-red-100 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M10 12h4" />
                <path d="M10 16h4" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-sm">{title}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>

          {uploadedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Generated: {formatDate(uploadedAt)}
            </p>
          )}
        </div>

        <Badge
          variant={documentUrl ? "default" : "secondary"}
          className={documentUrl ? "bg-green-600 hover:bg-green-600" : ""}
        >
          {documentUrl ? "Available" : "Pending"}
        </Badge>
      </div>

      {/* Hover Preview & Actions */}
      {isHovering && documentUrl && (
        <div className="absolute inset-0 rounded-lg bg-black/80 flex flex-col items-center justify-center gap-3 z-10 transition-opacity">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(documentUrl, "_blank")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={isLoading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              {isLoading ? "..." : "Download"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentPreviews({
  applicationId,
  generatedPdfs,
  signedDocuments,
}: DocumentPreviewsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Generated forms and signed uploads from the applicant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unsigned/Generated Documents */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Generated Forms (Unsigned)
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            <DocumentCard
              title="Guarantor 1 Form"
              description="Form for first guarantor"
              documentUrl={generatedPdfs?.guarantor1?.storagePath}
              uploadedAt={generatedPdfs?.guarantor1?.generatedAt}
              type="unsigned"
            />
            <DocumentCard
              title="Guarantor 2 Form"
              description="Form for second guarantor"
              documentUrl={generatedPdfs?.guarantor2?.storagePath}
              uploadedAt={generatedPdfs?.guarantor2?.generatedAt}
              type="unsigned"
            />
            <DocumentCard
              title="Referee Form"
              description="Professional reference form"
              documentUrl={generatedPdfs?.referee?.storagePath}
              uploadedAt={generatedPdfs?.referee?.generatedAt}
              type="unsigned"
            />
            <DocumentCard
              title="Offer Letter"
              description="Official employment offer"
              documentUrl={generatedPdfs?.offerLetter?.storagePath}
              uploadedAt={generatedPdfs?.offerLetter?.generatedAt}
              type="unsigned"
            />
          </div>
        </div>

        {/* Signed Documents */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Signed Documents (Uploaded by Applicant)
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            <DocumentCard
              title="Guarantor 1 Signed"
              description="Signed by first guarantor"
              documentUrl={signedDocuments?.guarantor1Signed?.storagePath}
              uploadedAt={signedDocuments?.guarantor1Signed?.uploadedAt}
              type="signed"
            />
            <DocumentCard
              title="Guarantor 2 Signed"
              description="Signed by second guarantor"
              documentUrl={signedDocuments?.guarantor2Signed?.storagePath}
              uploadedAt={signedDocuments?.guarantor2Signed?.uploadedAt}
              type="signed"
            />
            <DocumentCard
              title="Referee Signed"
              description="Signed by referee"
              documentUrl={signedDocuments?.refereeSigned?.storagePath}
              uploadedAt={signedDocuments?.refereeSigned?.uploadedAt}
              type="signed"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
