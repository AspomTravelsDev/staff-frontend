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
import { getProxiedImageUrl } from "@/lib/utils";
import { MediaData } from "@/lib/types/form-data";

interface SignedDocument {
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  fileId?: string;
}

interface GeneratedPdf {
  storagePath: string;
  generatedAt: string;
  fileSize: number;
  fileId?: string;
}

interface DocumentPreviewsProps {
  applicationId: string;
  generatedPdfs?: {
    guarantor1?: GeneratedPdf;
    guarantor2?: GeneratedPdf;
    referee?: GeneratedPdf;
    offerLetter?: GeneratedPdf;
    nda?: GeneratedPdf;
    personalForm?: GeneratedPdf;
    kyc?: GeneratedPdf;
  };
  signedDocuments?: {
    guarantor1Signed?: SignedDocument;
    guarantor2Signed?: SignedDocument;
    refereeSigned?: SignedDocument;
    ndaSigned?: SignedDocument;
    [key: string]: SignedDocument | undefined;
  };
  media?: MediaData;
}

interface DocumentCardProps {
  title: string;
  description: string;
  documentUrl?: string;
  uploadedAt?: string;
  type: "unsigned" | "signed";
  fileId?: string;
  fileName?: string;
}

function getFileExtension(fileName?: string, url?: string): string {
  const nameOrUrl = fileName || url || "";
  const cleanPath = nameOrUrl.split("?")[0];
  const parts = cleanPath.split(".");
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase();
    if (["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      return ext;
    }
  }
  return "pdf";
}

function DocumentCard({
  title,
  description,
  documentUrl,
  uploadedAt,
  type,
  fileId,
  fileName,
}: DocumentCardProps) {
  // Use secure download route if fileId is available, otherwise fallback to the provided URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const backendDownloadUrl = fileId
    ? `${baseUrl}/api/files/download/${fileId}`
    : documentUrl;
  const proxiedUrl = backendDownloadUrl
    ? getProxiedImageUrl(backendDownloadUrl)
    : undefined;
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    const targetUrl = proxiedUrl || backendDownloadUrl || documentUrl;
    if (!targetUrl) return;

    setIsLoading(true);
    try {
      // In a real environment with CORS issues, you might just window.open()
      // or dispatch to a download server action. We try direct fetch here.
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const ext = getFileExtension(fileName, documentUrl);
      link.download = `${title.replace(/\s+/g, "_")}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback
      window.open(targetUrl, "_blank");
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

  const ext = documentUrl ? getFileExtension(fileName, documentUrl) : "pdf";
  const isImage = ["jpg", "jpeg", "png"].includes(ext);

  const iconContainerClass = documentUrl
    ? isImage
      ? "flex h-10 w-10 items-center justify-center rounded bg-blue-100 text-blue-600"
      : "flex h-10 w-10 items-center justify-center rounded bg-red-100 text-red-600"
    : "flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-gray-400";

  return (
    <div
      className="relative rounded-lg border bg-card p-4 transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={iconContainerClass}>
              {isImage ? (
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
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              ) : (
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
              )}
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
      {isHovering && proxiedUrl && (
        <div className="absolute inset-0 rounded-lg bg-black/80 flex flex-col items-center justify-center gap-3 z-10 transition-opacity">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(proxiedUrl, "_blank")}
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
  media,
}: DocumentPreviewsProps) {
  const knownSignedDocumentKeys = new Set([
    "guarantor1Signed",
    "guarantor2Signed",
    "refereeSigned",
    "ndaSigned",
  ]);

  const extraSignedDocuments = Object.entries(signedDocuments ?? {}).filter(
    ([key, value]) => !knownSignedDocumentKeys.has(key) && !!value?.storagePath,
  );

  const formatExtraSignedDocumentTitle = (
    key: string,
    value: SignedDocument,
  ) => {
    if (value.fileName) {
      return value.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
    }

    return key
      .replace(/^asset_/, "")
      .replace(/_signed$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (match) => match.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Generated forms (including internal HR documents) and signed uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unsigned/Generated Documents */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Generated Forms
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            {!signedDocuments?.guarantor1Signed && (
              <DocumentCard
                title="Guarantor 1 Form"
                description="Form for first guarantor"
                documentUrl={generatedPdfs?.guarantor1?.storagePath}
                uploadedAt={generatedPdfs?.guarantor1?.generatedAt}
                fileId={generatedPdfs?.guarantor1?.fileId}
                type="unsigned"
              />
            )}
            {!signedDocuments?.guarantor2Signed && (
              <DocumentCard
                title="Guarantor 2 Form"
                description="Form for second guarantor"
                documentUrl={generatedPdfs?.guarantor2?.storagePath}
                uploadedAt={generatedPdfs?.guarantor2?.generatedAt}
                fileId={generatedPdfs?.guarantor2?.fileId}
                type="unsigned"
              />
            )}
            {!signedDocuments?.refereeSigned && (
              <DocumentCard
                title="Referee Form"
                description="Professional reference form"
                documentUrl={generatedPdfs?.referee?.storagePath}
                uploadedAt={generatedPdfs?.referee?.generatedAt}
                fileId={generatedPdfs?.referee?.fileId}
                type="unsigned"
              />
            )}
            {!signedDocuments?.ndaSigned && (
              <DocumentCard
                title="NDA Agreement"
                description="Personalized non-disclosure agreement"
                documentUrl={generatedPdfs?.nda?.storagePath}
                uploadedAt={generatedPdfs?.nda?.generatedAt}
                fileId={generatedPdfs?.nda?.fileId}
                type="unsigned"
              />
            )}
            <DocumentCard
              title="Personal Data Form"
              description="Internal HR personal profile document"
              documentUrl={generatedPdfs?.personalForm?.storagePath}
              uploadedAt={generatedPdfs?.personalForm?.generatedAt}
              fileId={generatedPdfs?.personalForm?.fileId}
              type="unsigned"
            />
            <DocumentCard
              title="KYC / Staff Details"
              description="Internal KYC and next-of-kin record"
              documentUrl={generatedPdfs?.kyc?.storagePath}
              uploadedAt={generatedPdfs?.kyc?.generatedAt}
              fileId={generatedPdfs?.kyc?.fileId}
              type="unsigned"
            />
            {/* Offer letter is special: we show it in the unsigned section ONLY if not completed */}
            {!signedDocuments?.refereeSigned &&
              !generatedPdfs?.offerLetter?.generatedAt && (
                <DocumentCard
                  title="Offer Letter"
                  description="Official employment offer"
                  documentUrl={generatedPdfs?.offerLetter?.storagePath}
                  uploadedAt={generatedPdfs?.offerLetter?.generatedAt}
                  fileId={generatedPdfs?.offerLetter?.fileId}
                  type="unsigned"
                />
              )}
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
              fileId={signedDocuments?.guarantor1Signed?.fileId}
              fileName={signedDocuments?.guarantor1Signed?.fileName}
              type="signed"
            />
            <DocumentCard
              title="Guarantor 2 Signed"
              description="Signed by second guarantor"
              documentUrl={signedDocuments?.guarantor2Signed?.storagePath}
              uploadedAt={signedDocuments?.guarantor2Signed?.uploadedAt}
              fileId={signedDocuments?.guarantor2Signed?.fileId}
              fileName={signedDocuments?.guarantor2Signed?.fileName}
              type="signed"
            />
            <DocumentCard
              title="Referee Signed"
              description="Signed by referee"
              documentUrl={signedDocuments?.refereeSigned?.storagePath}
              uploadedAt={signedDocuments?.refereeSigned?.uploadedAt}
              fileId={signedDocuments?.refereeSigned?.fileId}
              fileName={signedDocuments?.refereeSigned?.fileName}
              type="signed"
            />
            <DocumentCard
              title="NDA Signed"
              description="Signed by applicant"
              documentUrl={signedDocuments?.ndaSigned?.storagePath}
              uploadedAt={signedDocuments?.ndaSigned?.uploadedAt}
              fileId={signedDocuments?.ndaSigned?.fileId}
              fileName={signedDocuments?.ndaSigned?.fileName}
              type="signed"
            />
            <DocumentCard
              title="Signed Offer Letter"
              description="Electronic signature applied"
              documentUrl={generatedPdfs?.offerLetter?.storagePath}
              uploadedAt={generatedPdfs?.offerLetter?.generatedAt}
              fileId={generatedPdfs?.offerLetter?.fileId}
              type="signed"
            />
            {extraSignedDocuments.map(([key, value]) => {
              if (!value) return null;

              return (
                <DocumentCard
                  key={key}
                  title={formatExtraSignedDocumentTitle(key, value)}
                  description="Additional signed document"
                  documentUrl={value.storagePath}
                  uploadedAt={value.uploadedAt}
                  fileId={value.fileId}
                  fileName={value.fileName}
                  type="signed"
                />
              );
            })}
          </div>
        </div>

        {/* Supporting Documents (Optional) */}
        {!!(
          media?.validId?.storagePath ||
          media?.oLevelResults?.storagePath ||
          media?.nyscCertificate?.storagePath ||
          media?.universityCertificate?.storagePath ||
          media?.birthCertificate?.storagePath ||
          media?.resumeCv?.storagePath
        ) && (
          <div>
            <div className="border-t my-6 border-zinc-200 dark:border-zinc-800" />
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Supporting Documents (Uploaded by Applicant)
            </h4>
            <div className="grid gap-3 md:grid-cols-3">
              {media?.validId?.storagePath && (
                <DocumentCard
                  title="Valid Means of ID"
                  description="Applicant identity document"
                  documentUrl={media.validId.storagePath}
                  uploadedAt={media.validId.uploadedAt}
                  fileId={media.validId.fileId}
                  fileName={media.validId.fileName}
                  type="signed"
                />
              )}
              {media?.oLevelResults?.storagePath && (
                <DocumentCard
                  title="O Level Results"
                  description="Academic qualification document"
                  documentUrl={media.oLevelResults.storagePath}
                  uploadedAt={media.oLevelResults.uploadedAt}
                  fileId={media.oLevelResults.fileId}
                  fileName={media.oLevelResults.fileName}
                  type="signed"
                />
              )}
              {media?.nyscCertificate?.storagePath && (
                <DocumentCard
                  title="NYSC Certificate"
                  description="NYSC discharge or exemption certificate"
                  documentUrl={media.nyscCertificate.storagePath}
                  uploadedAt={media.nyscCertificate.uploadedAt}
                  fileId={media.nyscCertificate.fileId}
                  fileName={media.nyscCertificate.fileName}
                  type="signed"
                />
              )}
              {media?.universityCertificate?.storagePath && (
                <DocumentCard
                  title="University Certificate"
                  description="Degree certificate or proof of completion"
                  documentUrl={media.universityCertificate.storagePath}
                  uploadedAt={media.universityCertificate.uploadedAt}
                  fileId={media.universityCertificate.fileId}
                  fileName={media.universityCertificate.fileName}
                  type="signed"
                />
              )}
              {media?.birthCertificate?.storagePath && (
                <DocumentCard
                  title="Birth Certificate"
                  description="Birth certificate or age declaration"
                  documentUrl={media.birthCertificate.storagePath}
                  uploadedAt={media.birthCertificate.uploadedAt}
                  fileId={media.birthCertificate.fileId}
                  fileName={media.birthCertificate.fileName}
                  type="signed"
                />
              )}
              {media?.resumeCv?.storagePath && (
                <DocumentCard
                  title="Resume / CV"
                  description="Applicant professional resume or CV"
                  documentUrl={media.resumeCv.storagePath}
                  uploadedAt={media.resumeCv.uploadedAt}
                  fileId={media.resumeCv.fileId}
                  fileName={media.resumeCv.fileName}
                  type="signed"
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
