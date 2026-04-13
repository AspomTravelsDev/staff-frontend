"use client";

import { useActionState, useState } from "react";
import { submitApplication, redirectToPreviousStep } from "../actions";
import { uploadPublicFile } from "@/lib/api/hr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RequiredSignedAssetDocument } from "@/lib/types/hr";

type FormState = {
  error?: string;
  success?: boolean;
};

interface SignedDocument {
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  fileId?: string;
}

interface SignedDocumentsData {
  guarantor1Signed?: SignedDocument;
  guarantor2Signed?: SignedDocument;
  refereeSigned?: SignedDocument;
  ndaSigned?: SignedDocument;
  indemnitySigned?: SignedDocument;
  [key: string]: SignedDocument | undefined;
}

interface RequiredUploadDocument {
  key: string;
  inputName: string;
  uploadFieldPrefix: string;
  label: string;
  description: string;
}

const BASE_REQUIRED_DOCUMENTS: RequiredUploadDocument[] = [
  {
    key: "guarantor1Signed",
    inputName: "guarantor1_signed",
    uploadFieldPrefix: "guarantor_1_signed",
    label: "Signed Guarantor 1 Form *",
    description: "Upload the signed form from your first guarantor",
  },
  {
    key: "guarantor2Signed",
    inputName: "guarantor2_signed",
    uploadFieldPrefix: "guarantor_2_signed",
    label: "Signed Guarantor 2 Form *",
    description: "Upload the signed form from your second guarantor",
  },
  {
    key: "refereeSigned",
    inputName: "referee_signed",
    uploadFieldPrefix: "referee_signed",
    label: "Signed Referee Form *",
    description: "Upload the signed form from your referee",
  },
  {
    key: "ndaSigned",
    inputName: "nda_signed",
    uploadFieldPrefix: "nda_signed",
    label: "Signed NDA Agreement *",
    description: "Upload your signed NDA agreement",
  },
  {
    key: "indemnitySigned",
    inputName: "indemnity_signed",
    uploadFieldPrefix: "indemnity_signed",
    label: "Signed Indemnity Form *",
    description: "Upload your signed indemnity form",
  },
];

const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;

export function Step8UploadSigned({
  applicationId,
  initialData,
  requiredAssetDocuments = [],
}: {
  applicationId: string;
  initialData?: SignedDocumentsData;
  requiredAssetDocuments?: RequiredSignedAssetDocument[];
}) {
  const [previews, setPreviews] = useState<Record<string, string | null>>({});

  const [persistedSignedDocuments, setPersistedSignedDocuments] =
    useState<SignedDocumentsData>(initialData || {});

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [fileErrors, setFileErrors] = useState<{
    [key: string]: string | null;
  }>({});

  const extraRequiredDocuments: RequiredUploadDocument[] =
    requiredAssetDocuments.map((document) => ({
      key: document.key,
      inputName: document.key,
      uploadFieldPrefix: document.key,
      label: `Signed ${document.label} *`,
      description: `Upload your signed ${document.label.toLowerCase()}`,
    }));

  const requiredDocuments = [
    ...BASE_REQUIRED_DOCUMENTS,
    ...extraRequiredDocuments,
  ];

  const handleFilePreview = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const file = e.target.files?.[0];
    setFileErrors((prev) => ({ ...prev, [fieldName]: null }));

    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setFileErrors((prev) => ({
          ...prev,
          [fieldName]:
            "Please upload a PDF, PNG, or JPEG. WebP is not supported.",
        }));
        setPreviews((prev) => ({ ...prev, [fieldName]: null }));
        e.target.value = ""; // Clear input
        return;
      }

      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        const message = "Document exceeds 2MB. Please compress and re-upload.";
        setFileErrors((prev) => ({
          ...prev,
          [fieldName]: message,
        }));
        toast.error(message);
        setPreviews((prev) => ({ ...prev, [fieldName]: null }));
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews((prev) => ({
          ...prev,
          [fieldName]: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = async () => {
    await redirectToPreviousStep(applicationId, 8);
  };

  const handleSubmitAction = async (
    _prevState: FormState | null,
    formData: FormData,
  ): Promise<FormState> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const missingDocuments = requiredDocuments.filter((document) => {
        const file = formData.get(document.inputName) as File | null;
        return !(
          (file && file.size > 0) ||
          !!persistedSignedDocuments[document.key]?.storagePath
        );
      });

      if (missingDocuments.length > 0) {
        setIsUploading(false);
        return { error: "Please upload all required signed documents" };
      }

      const uploadedSignedDocuments: SignedDocumentsData = {};

      for (const document of requiredDocuments) {
        const file = formData.get(document.inputName) as File | null;
        if (!file || file.size === 0) continue;

        try {
          const result = await uploadPublicFile(
            applicationId,
            file,
            `${document.uploadFieldPrefix}_${applicationId}`,
          );

          uploadedSignedDocuments[document.key] = {
            fileName: file.name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
            fileId: result.fileId,
          };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          setIsUploading(false);
          return {
            error: `${document.label.replace(" *", "")} upload failed: ${error.message}`,
          };
        }
      }

      const finalSignedDocuments: SignedDocumentsData = {
        ...persistedSignedDocuments,
        ...uploadedSignedDocuments,
      };

      setPersistedSignedDocuments(finalSignedDocuments);

      // Submit the application with the collected signed documents data
      const result = await submitApplication(applicationId, {
        signedDocuments: finalSignedDocuments,
      });

      setIsUploading(false);
      return result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // In Next.js server actions, redirect() throws a special error.
      // We must not catch it if we want the redirect to work.
      // However, since this is called in a client action, we can't easily distinguish it without imports.
      // But submitApplication already handles the redirect.

      console.error("Submission error:", error);
      setIsUploading(false);

      // If the error message is just about redirect, we can ignore it or re-throw
      if (error.message?.includes("NEXT_REDIRECT")) {
        throw error;
      }

      return {
        error: "An error occurred during submission. Please try again.",
      };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  const isReadyToSubmit = requiredDocuments.every(
    (document) =>
      !!persistedSignedDocuments[document.key]?.storagePath ||
      !!previews[document.key],
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Upload Signed Documents</h3>
        <p className="text-sm text-muted-foreground">
          Step 8 of 8 - Upload the signed forms from your guarantors and referee
          to complete your application
        </p>
      </div>

      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-4">
        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-500 mb-2">
          Important Instructions
        </h4>
        <ul className="text-sm text-amber-700 dark:text-amber-600 space-y-1">
          <li>• Upload scanned copies or photos of the signed forms</li>
          <li>• Accepted formats: PDF, JPG, PNG (max 2MB each)</li>
          <li>• Ensure signatures are clearly visible</li>
          <li>• Unsigned uploads may be returned for correction</li>
          <li>• All required signed documents must be uploaded to complete</li>
        </ul>
      </div>

      <div className="space-y-6">
        {requiredDocuments.map((document) => {
          const hasPreview = !!previews[document.key];
          const hasPersisted =
            !!persistedSignedDocuments[document.key]?.storagePath;

          return (
            <div className="rounded-lg border p-4" key={document.key}>
              <Label
                htmlFor={document.inputName}
                className="text-base font-medium"
              >
                {document.label}
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                {document.description}
              </p>

              <input
                type="file"
                id={document.inputName}
                name={document.inputName}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFilePreview(e, document.key)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />

              {fileErrors[document.key] && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {fileErrors[document.key]}
                </p>
              )}

              {(hasPreview || hasPersisted) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <span>✓</span>
                  <span>
                    {hasPreview ? "New file selected" : "Previously uploaded"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Note */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-400">
          <strong>Note:</strong> Once you submit, your application will be
          marked as complete and sent to HR for review. Make sure all documents
          are correctly uploaded before submitting.
        </p>
      </div>

      {/* Error Display */}
      {(state?.error || uploadError) && (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive">
            {state?.error || uploadError}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          type="submit"
          disabled={isPending || isUploading || !isReadyToSubmit}
          className="bg-green-600 hover:bg-green-700"
        >
          {isPending || isUploading ? "Submitting..." : "Complete Application"}
        </Button>
      </div>
    </form>
  );
}
