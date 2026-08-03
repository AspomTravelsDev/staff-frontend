"use client";

import { useActionState, useState } from "react";
import { submitApplication, redirectToPreviousStep } from "../actions";
import { uploadPublicFile } from "@/lib/api/hr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RequiredSignedAssetDocument } from "@/lib/types/hr";
import { MediaData } from "@/lib/types/form-data";

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
  [key: string]: SignedDocument | undefined;
}

interface RequiredUploadDocument {
  key: string;
  inputName: string;
  uploadFieldPrefix: string;
  label: string;
  description: string;
}

interface SupportingUploadDocument {
  key: keyof MediaData;
  inputName: string;
  uploadFieldPrefix: string;
  label: string;
  description: string;
}

const SUPPORTING_DOCUMENTS: SupportingUploadDocument[] = [
  {
    key: "validId",
    inputName: "validId",
    uploadFieldPrefix: "applicant_id",
    label: "Valid Means of ID (Passport, National ID, Voter Card, or Driver License) *",
    description: "Upload a clear PDF, PNG, or JPEG copy of your valid ID",
  },
  {
    key: "oLevelResults",
    inputName: "oLevelResults",
    uploadFieldPrefix: "applicant_olevel",
    label: "O Level Results *",
    description: "Upload a clear PDF, PNG, or JPEG copy of your O Level results",
  },
  {
    key: "nyscCertificate",
    inputName: "nyscCertificate",
    uploadFieldPrefix: "applicant_nysc",
    label: "NYSC Certificate *",
    description: "Upload a clear PDF, PNG, or JPEG copy of your NYSC discharge / exemption certificate",
  },
  {
    key: "universityCertificate",
    inputName: "universityCertificate",
    uploadFieldPrefix: "applicant_uni",
    label: "University Certificate / Proof of Completion *",
    description: "Upload a clear PDF, PNG, or JPEG copy of your degree or diploma certificate",
  },
  {
    key: "birthCertificate",
    inputName: "birthCertificate",
    uploadFieldPrefix: "applicant_birth_cert",
    label: "Birth Certificate / Age Declaration *",
    description: "Upload a clear PDF, PNG, or JPEG copy of your birth certificate or age declaration",
  },
  {
    key: "resumeCv",
    inputName: "resumeCv",
    uploadFieldPrefix: "applicant_resume",
    label: "Resume / CV *",
    description: "Upload a clear PDF, PNG, or JPEG copy of your Resume / CV",
  },
];

const BASE_REQUIRED_DOCUMENTS: RequiredUploadDocument[] = [
  {
    key: "guarantor1Signed",
    inputName: "guarantor1_signed",
    uploadFieldPrefix: "guarantor_1_signed",
    label: "Signed Guarantor 1 Form *",
    description: "Upload the complete signed multi-page PDF form from your first guarantor",
  },
  {
    key: "guarantor2Signed",
    inputName: "guarantor2_signed",
    uploadFieldPrefix: "guarantor_2_signed",
    label: "Signed Guarantor 2 Form *",
    description: "Upload the complete signed multi-page PDF form from your second guarantor",
  },
  {
    key: "refereeSigned",
    inputName: "referee_signed",
    uploadFieldPrefix: "referee_signed",
    label: "Signed Referee Form *",
    description: "Upload the complete signed multi-page PDF form from your referee",
  },
  {
    key: "ndaSigned",
    inputName: "nda_signed",
    uploadFieldPrefix: "nda_signed",
    label: "Signed NDA Agreement *",
    description: "Upload the complete signed multi-page PDF Non-Disclosure Agreement",
  },
];

const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;

export function Step8UploadSigned({
  applicationId,
  initialData,
  initialMediaData,
  requiredAssetDocuments = [],
}: {
  applicationId: string;
  initialData?: SignedDocumentsData;
  initialMediaData?: MediaData;
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

  const missingSupportingDocuments = SUPPORTING_DOCUMENTS.filter(
    (doc) => !initialMediaData?.[doc.key]?.storagePath
  );

  const extraRequiredDocuments: RequiredUploadDocument[] =
    requiredAssetDocuments.map((document) => ({
      key: document.key,
      inputName: document.key,
      uploadFieldPrefix: document.key,
      label: `Signed ${document.label} *`,
      description: `Upload the complete signed multi-page PDF for ${document.label.toLowerCase()}`,
    }));

  const requiredDocuments = [
    ...BASE_REQUIRED_DOCUMENTS,
    ...extraRequiredDocuments,
  ];

  const handleSupportingFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    setFileErrors((prev) => ({ ...prev, [fieldName]: null }));

    if (file) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setFileErrors((prev) => ({
          ...prev,
          [fieldName]: "Please upload a PDF, PNG, or JPEG. WebP is not supported.",
        }));
        setPreviews((prev) => ({ ...prev, [fieldName]: null }));
        e.target.value = "";
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

  const handleFilePreview = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const file = e.target.files?.[0];
    setFileErrors((prev) => ({ ...prev, [fieldName]: null }));

    if (file) {
      // Validate file type
      const validTypes = ["application/pdf"];
      if (!validTypes.includes(file.type)) {
        setFileErrors((prev) => ({
          ...prev,
          [fieldName]: "Please upload a PDF document.",
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
      const unattachedSupportingDocs = missingSupportingDocuments.filter((document) => {
        const file = formData.get(document.inputName) as File | null;
        return !(file && file.size > 0 && file.name);
      });

      if (unattachedSupportingDocs.length > 0) {
        setIsUploading(false);
        const missingLabels = unattachedSupportingDocs.map((doc) => doc.label.replace(" *", ""));
        return {
          error: `Please upload the following required supporting document(s): ${missingLabels.join(", ")}`,
        };
      }

      const missingDocuments = requiredDocuments.filter((document) => {
        const file = formData.get(document.inputName) as File | null;
        return !(
          (file && file.size > 0) ||
          !!persistedSignedDocuments[document.key]?.storagePath
        );
      });

      if (missingDocuments.length > 0) {
        setIsUploading(false);
        const missingLabels = missingDocuments.map((doc) => doc.label.replace(" *", ""));
        return {
          error: `Please upload the following required signed documents: ${missingLabels.join(", ")}`,
        };
      }

      const updatedMediaData: Record<string, any> = { ...(initialMediaData || {}) };

      for (const document of missingSupportingDocuments) {
        const file = formData.get(document.inputName) as File | null;
        if (!file || file.size === 0) continue;

        try {
          const result = await uploadPublicFile(
            applicationId,
            file,
            `${document.uploadFieldPrefix}_${applicationId}`
          );

          updatedMediaData[document.key] = {
            fileName: file.name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
            fileId: result.fileId,
          };
        } catch (error: any) {
          setIsUploading(false);
          return {
            error: `${document.label.replace(" *", "")} upload failed: ${error.message}`,
          };
        }
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

      const stepDataToSubmit: Record<string, any> = {
        signedDocuments: finalSignedDocuments,
      };
      if (missingSupportingDocuments.length > 0) {
        stepDataToSubmit.media = updatedMediaData;
      }

      // Submit the application with the collected signed documents data
      const result = await submitApplication(applicationId, stepDataToSubmit);

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

  const isReadyToSubmit =
    requiredDocuments.every(
      (document) =>
        !!persistedSignedDocuments[document.key]?.storagePath ||
        !!previews[document.key],
    ) &&
    missingSupportingDocuments.every(
      (document) => !!previews[document.key],
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
          Important Upload Instructions
        </h4>
        <ul className="text-sm text-amber-700 dark:text-amber-600 space-y-1.5">
          <li>
            • <strong>Upload the entire document:</strong> Do not upload only the signature page or a cropped photo of the signature. You must upload the <strong>complete multi-page PDF document</strong>.
          </li>
          <li>• <strong>Accepted format:</strong> PDF only (max 2MB each) for signed forms. Image uploads (PNG, JPEG, WebP) are not accepted for signed forms.</li>
          <li>
            • <strong>Signing Digitally:</strong> You can sign without printing. Windows users can download the free{" "}
            <a
              href="https://apps.microsoft.com/detail/9p90n80cht78"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-amber-900 dark:hover:text-amber-400"
            >
              PDF Ink App
            </a>{" "}
            to draw signatures. Mac/iOS users can open the PDF and use built-in Markup.
          </li>
          <li>• Ensure all signatures, dates, and filled fields are clear and legible.</li>
          <li>• Incomplete or unsigned documents will be returned for correction.</li>
        </ul>
      </div>

      {missingSupportingDocuments.length > 0 && (
        <div className="space-y-4 rounded-lg border border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div>
            <h4 className="text-base font-semibold text-amber-900 dark:text-amber-300">
              Required Supporting Documents (Pending Upload)
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
              Your application is missing the following mandatory supporting credentials. Accepted formats are PDF, PNG, and JPEG up to 2MB each.
            </p>
          </div>

          <div className="space-y-4">
            {missingSupportingDocuments.map((document) => {
              const hasPreview = !!previews[document.key];

              return (
                <div className="rounded-lg border bg-card p-4" key={document.key}>
                  <Label htmlFor={document.inputName} className="text-sm font-medium">
                    {document.label.endsWith(" *") ? (
                      <>
                        {document.label.slice(0, -2)}
                        <span className="text-destructive font-semibold ml-1">*</span>
                      </>
                    ) : (
                      document.label
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2 mt-0.5">
                    {document.description}
                  </p>

                  <input
                    type="file"
                    id={document.inputName}
                    name={document.inputName}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleSupportingFileChange(e, document.key)}
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />

                  {fileErrors[document.key] && (
                    <p className="text-xs font-medium text-destructive mt-1.5">
                      {fileErrors[document.key]}
                    </p>
                  )}

                  {hasPreview && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <span>✓</span>
                      <span>Selected for upload</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                {document.label.endsWith(" *") ? (
                  <>
                    {document.label.slice(0, -2)}
                    <span className="text-destructive font-semibold ml-1">*</span>
                  </>
                ) : (
                  document.label
                )}
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                {document.description}
              </p>

              <input
                type="file"
                id={document.inputName}
                name={document.inputName}
                accept=".pdf"
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

