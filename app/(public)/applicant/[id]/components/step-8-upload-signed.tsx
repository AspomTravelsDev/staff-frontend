"use client";

import { useActionState, useState } from "react";
import { submitApplication, redirectToPreviousStep } from "../actions";
import { uploadPublicFile } from "@/lib/api/hr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type FormState = {
  error?: string;
  success?: boolean;
};

interface SignedDocument {
  fileName: string;
  storagePath: string;
  uploadedAt: string;
}

interface SignedDocumentsData {
  guarantor1Signed?: SignedDocument;
  guarantor2Signed?: SignedDocument;
  refereeSigned?: SignedDocument;
}

export function Step8UploadSigned({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: SignedDocumentsData;
}) {
  const [guarantor1Preview, setGuarantor1Preview] = useState<string | null>(
    null,
  );
  const [guarantor2Preview, setGuarantor2Preview] = useState<string | null>(
    null,
  );
  const [refereePreview, setRefereePreview] = useState<string | null>(null);

  const [guarantor1Uploaded, setGuarantor1Uploaded] = useState<boolean>(
    !!initialData?.guarantor1Signed?.storagePath,
  );
  const [guarantor2Uploaded, setGuarantor2Uploaded] = useState<boolean>(
    !!initialData?.guarantor2Signed?.storagePath,
  );
  const [refereeUploaded, setRefereeUploaded] = useState<boolean>(
    !!initialData?.refereeSigned?.storagePath,
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [fileErrors, setFileErrors] = useState<{
    [key: string]: string | null;
  }>({});

  const handleFilePreview = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (value: string | null) => void,
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
        setPreview(null);
        e.target.value = ""; // Clear input
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
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
      const guarantor1File = formData.get("guarantor1_signed") as File | null;
      const guarantor2File = formData.get("guarantor2_signed") as File | null;
      const refereeFile = formData.get("referee_signed") as File | null;

      // Validate all files are present (either new upload or existing)
      const hasGuarantor1 =
        (guarantor1File && guarantor1File.size > 0) || guarantor1Uploaded;
      const hasGuarantor2 =
        (guarantor2File && guarantor2File.size > 0) || guarantor2Uploaded;
      const hasReferee =
        (refereeFile && refereeFile.size > 0) || refereeUploaded;

      if (!hasGuarantor1 || !hasGuarantor2 || !hasReferee) {
        setIsUploading(false);
        return { error: "Please upload all three signed documents" };
      }

      const signedDocuments: SignedDocumentsData = {};

      // Upload Guarantor 1 signed document
      if (guarantor1File && guarantor1File.size > 0) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            guarantor1File,
            "guarantor_1_signed",
          );
          signedDocuments.guarantor1Signed = {
            fileName: guarantor1File.name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
          };
          setGuarantor1Uploaded(true);
        } catch (error: any) {
          setIsUploading(false);
          return { error: `Guarantor 1 upload failed: ${error.message}` };
        }
      }

      // Upload Guarantor 2 signed document
      if (guarantor2File && guarantor2File.size > 0) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            guarantor2File,
            "guarantor_2_signed",
          );
          signedDocuments.guarantor2Signed = {
            fileName: guarantor2File.name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
          };
          setGuarantor2Uploaded(true);
        } catch (error: any) {
          setIsUploading(false);
          return { error: `Guarantor 2 upload failed: ${error.message}` };
        }
      }

      // Upload Referee signed document
      if (refereeFile && refereeFile.size > 0) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            refereeFile,
            "referee_signed",
          );
          signedDocuments.refereeSigned = {
            fileName: refereeFile.name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
          };
          setRefereeUploaded(true);
        } catch (error: any) {
          setIsUploading(false);
          return { error: `Referee upload failed: ${error.message}` };
        }
      }

      // Submit application with signed documents
      const result = await submitApplication(applicationId, {
        signedDocuments,
      });

      setIsUploading(false);
      return result;
    } catch (error) {
      setIsUploading(false);
      return { error: "An error occurred during upload. Please try again." };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  const allUploaded =
    guarantor1Uploaded && guarantor2Uploaded && refereeUploaded;
  const hasNewFiles = guarantor1Preview || guarantor2Preview || refereePreview;

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Upload Signed Documents</h3>
        <p className="text-sm text-muted-foreground">
          Step 8 of 8 - Upload the signed forms from your guarantors and referee
          to complete your application
        </p>
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <h4 className="text-sm font-semibold text-amber-800 mb-2">
          Important Instructions
        </h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Upload scanned copies or photos of the signed forms</li>
          <li>• Accepted formats: PDF, JPG, PNG (max 10MB each)</li>
          <li>• Ensure signatures are clearly visible</li>
          <li>• All three documents must be uploaded to complete</li>
        </ul>
      </div>

      <div className="space-y-6">
        {/* Guarantor 1 Upload */}
        <div className="rounded-lg border p-4">
          <Label htmlFor="guarantor1_signed" className="text-base font-medium">
            Signed Guarantor 1 Form *
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Upload the signed form from your first guarantor
          </p>

          <input
            type="file"
            id="guarantor1_signed"
            name="guarantor1_signed"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) =>
              handleFilePreview(e, setGuarantor1Preview, "guarantor1")
            }
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />

          {fileErrors.guarantor1 && (
            <p className="text-sm font-medium text-destructive mt-2">
              {fileErrors.guarantor1}
            </p>
          )}

          {(guarantor1Preview ||
            initialData?.guarantor1Signed?.storagePath) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <span>✓</span>
              <span>
                {guarantor1Preview
                  ? "New file selected"
                  : "Previously uploaded"}
              </span>
            </div>
          )}
        </div>

        {/* Guarantor 2 Upload */}
        <div className="rounded-lg border p-4">
          <Label htmlFor="guarantor2_signed" className="text-base font-medium">
            Signed Guarantor 2 Form *
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Upload the signed form from your second guarantor
          </p>

          <input
            type="file"
            id="guarantor2_signed"
            name="guarantor2_signed"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) =>
              handleFilePreview(e, setGuarantor2Preview, "guarantor2")
            }
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />

          {fileErrors.guarantor2 && (
            <p className="text-sm font-medium text-destructive mt-2">
              {fileErrors.guarantor2}
            </p>
          )}

          {(guarantor2Preview ||
            initialData?.guarantor2Signed?.storagePath) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <span>✓</span>
              <span>
                {guarantor2Preview
                  ? "New file selected"
                  : "Previously uploaded"}
              </span>
            </div>
          )}
        </div>

        {/* Referee Upload */}
        <div className="rounded-lg border p-4">
          <Label htmlFor="referee_signed" className="text-base font-medium">
            Signed Referee Form *
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Upload the signed form from your referee
          </p>

          <input
            type="file"
            id="referee_signed"
            name="referee_signed"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFilePreview(e, setRefereePreview, "referee")}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />

          {fileErrors.referee && (
            <p className="text-sm font-medium text-destructive mt-2">
              {fileErrors.referee}
            </p>
          )}

          {(refereePreview || initialData?.refereeSigned?.storagePath) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <span>✓</span>
              <span>
                {refereePreview ? "New file selected" : "Previously uploaded"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Completion Note */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
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
          disabled={isPending || isUploading || (!allUploaded && !hasNewFiles)}
          className="bg-green-600 hover:bg-green-700"
        >
          {isPending || isUploading ? "Submitting..." : "Complete Application"}
        </Button>
      </div>
    </form>
  );
}
