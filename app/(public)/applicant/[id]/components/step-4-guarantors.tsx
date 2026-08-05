"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFormStep, redirectToPreviousStep } from "../actions";
import { uploadPublicFile } from "@/lib/api/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuarantorRefereeData } from "@/lib/types/form-data";
import { toast } from "sonner";

type FormState = {
  error?: string;
  success?: boolean;
  nextStep?: number;
  submittedData?: Record<string, string>;
};

interface GarantorPreview {
  [key: number]: string | null;
}

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;

const resolvePreviewUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("/api/")) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    return apiBase ? `${apiBase}${url}` : url;
  }
  return url;
};

export function Step4Guarantors({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: GuarantorRefereeData;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [guarantor1Preview, setGuarantor1Preview] = useState<string | null>(
    null,
  );
  const [guarantor2Preview, setGuarantor2Preview] = useState<string | null>(
    null,
  );
  const [g1StoredPhoto, setG1StoredPhoto] = useState(
    initialData?.guarantors?.[0]?.passportPhoto
  );
  const [g2StoredPhoto, setG2StoredPhoto] = useState(
    initialData?.guarantors?.[1]?.passportPhoto
  );
  const [isUploadingG1, setIsUploadingG1] = useState(false);
  const [isUploadingG2, setIsUploadingG2] = useState(false);
  const [fileErrors, setFileErrors] = useState<{
    [key: number]: string | null;
  }>({
    0: null,
    1: null,
  });

  const [guarantor1Relationship, setGuarantor1Relationship] = useState<string>(
    initialData?.guarantors?.[0]?.relationship || "",
  );
  const [guarantor2Relationship, setGuarantor2Relationship] = useState<string>(
    initialData?.guarantors?.[1]?.relationship || "",
  );

  const toSubmittedData = (formData: FormData) =>
    Object.fromEntries(
      Array.from(formData.entries()).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );

  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    guarantorIndex: number,
  ) => {
    const file = e.target.files?.[0];
    setFileErrors((prev) => ({ ...prev, [guarantorIndex]: null }));

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setFileErrors((prev) => ({
          ...prev,
          [guarantorIndex]:
            "Please upload a PNG or JPEG image. WebP is not supported.",
        }));
        if (guarantorIndex === 0) setGuarantor1Preview(null);
        else setGuarantor2Preview(null);
        e.target.value = ""; // Clear input
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const message = "Image exceeds 1MB. Please compress and re-upload.";
        setFileErrors((prev) => ({ ...prev, [guarantorIndex]: message }));
        toast.error(message);
        if (guarantorIndex === 0) setGuarantor1Preview(null);
        else setGuarantor2Preview(null);
        e.target.value = "";
        return;
      }

      // Preview only - upload will happen on form submit
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        if (guarantorIndex === 0) {
          setGuarantor1Preview(preview);
        } else {
          setGuarantor2Preview(preview);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = async () => {
    await redirectToPreviousStep(applicationId, 4);
  };

  const handleSubmitAction = async (
    _prevState: FormState | null,
    formData: FormData,
  ): Promise<FormState> => {
    try {
      const requiredFields = [
        "guarantor1_firstName",
        "guarantor1_lastName",
        "guarantor1_phoneNumber",
        "guarantor1_relationship",
        "guarantor2_firstName",
        "guarantor2_lastName",
        "guarantor2_phoneNumber",
        "guarantor2_relationship",
      ];

      const fieldLabels: Record<string, string> = {
        guarantor1_firstName: "Guarantor 1: First Name",
        guarantor1_lastName: "Guarantor 1: Last Name",
        guarantor1_phoneNumber: "Guarantor 1: Phone Number",
        guarantor1_relationship: "Guarantor 1: Relationship",
        guarantor2_firstName: "Guarantor 2: First Name",
        guarantor2_lastName: "Guarantor 2: Last Name",
        guarantor2_phoneNumber: "Guarantor 2: Phone Number",
        guarantor2_relationship: "Guarantor 2: Relationship",
      };

      const missingFields: string[] = [];
      for (const field of requiredFields) {
        const value = String(formData.get(field) || "").trim();
        if (!value) {
          missingFields.push(fieldLabels[field] || field);
        }
      }

      if (missingFields.length > 0) {
        return {
          error: `Please complete the following required fields: ${missingFields.join(", ")}`,
          submittedData: toSubmittedData(formData),
        };
      }

      // Upload guarantor 1 photo if provided
      const g1PhotoFile = formData.get("guarantor1_photo") as File | null;
      const hasNewG1Photo = !!(g1PhotoFile && g1PhotoFile.size > 0 && g1PhotoFile.name);
      let g1PhotoData = g1StoredPhoto || initialData?.guarantors?.[0]?.passportPhoto;

      if (hasNewG1Photo) {
        try {
          const g1Result = await uploadPublicFile(
            applicationId,
            g1PhotoFile as File,
            `guarantor1_pass_${applicationId}`,
          );
          g1PhotoData = {
            fileName: (g1PhotoFile as File).name,
            uploadedAt: new Date().toISOString(),
            storagePath: g1Result.storagePath,
            fileId: g1Result.fileId,
          };
          setG1StoredPhoto(g1PhotoData);
        } catch (g1Error: any) {
          return {
            error: `Guarantor 1 photo upload failed: ${g1Error.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      // Upload guarantor 2 photo if provided
      const g2PhotoFile = formData.get("guarantor2_photo") as File | null;
      const hasNewG2Photo = !!(g2PhotoFile && g2PhotoFile.size > 0 && g2PhotoFile.name);
      let g2PhotoData = g2StoredPhoto || initialData?.guarantors?.[1]?.passportPhoto;

      if (hasNewG2Photo) {
        try {
          const g2Result = await uploadPublicFile(
            applicationId,
            g2PhotoFile as File,
            `guarantor2_pass_${applicationId}`,
          );
          g2PhotoData = {
            fileName: (g2PhotoFile as File).name,
            uploadedAt: new Date().toISOString(),
            storagePath: g2Result.storagePath,
            fileId: g2Result.fileId,
          };
          setG2StoredPhoto(g2PhotoData);
        } catch (g2Error: any) {
          return {
            error: `Guarantor 2 photo upload failed: ${g2Error.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      // Extract guarantor 1 data
      const guarantor1 = {
        firstName: formData.get("guarantor1_firstName") as string,
        middleName: formData.get("guarantor1_middleName") as string | null,
        lastName: formData.get("guarantor1_lastName") as string,
        ageDob: formData.get("guarantor1_ageDob") as string | null,
        phoneNumber: formData.get("guarantor1_phoneNumber") as string,
        alternatePhoneNumber: formData.get("guarantor1_alternatePhone") as
          | string
          | null,
        email: formData.get("guarantor1_email") as string | null,
        address: {
          street: formData.get("guarantor1_street") as string | null,
          homeAddress: formData.get("guarantor1_homeAddress") as string | null,
          city: formData.get("guarantor1_city") as string | null,
          state: formData.get("guarantor1_state") as string | null,
          country: formData.get("guarantor1_country") as string | null,
        },
        occupation: formData.get("guarantor1_occupation") as string,
        employerName: formData.get("guarantor1_employerName") as string | null,
        employerAddress: formData.get("guarantor1_employerAddress") as
          | string
          | null,
        relationship: formData.get("guarantor1_relationship") as string,
        yearsKnown: formData.get("guarantor1_yearsKnown")
          ? parseInt(formData.get("guarantor1_yearsKnown") as string)
          : null,
        characterAssessment: formData.get("guarantor1_characterAssessment") as
          | string
          | null,
        liabilityAccepted:
          formData.get("guarantor1_liabilityAccepted") === "on",
        liabilityAcceptedAt: new Date().toISOString(),
        passportPhoto: g1PhotoData,
      };

      // Extract guarantor 2 data
      const guarantor2 = {
        firstName: formData.get("guarantor2_firstName") as string,
        middleName: formData.get("guarantor2_middleName") as string | null,
        lastName: formData.get("guarantor2_lastName") as string,
        ageDob: formData.get("guarantor2_ageDob") as string | null,
        phoneNumber: formData.get("guarantor2_phoneNumber") as string,
        alternatePhoneNumber: formData.get("guarantor2_alternatePhone") as
          | string
          | null,
        email: formData.get("guarantor2_email") as string | null,
        address: {
          street: formData.get("guarantor2_street") as string | null,
          homeAddress: formData.get("guarantor2_homeAddress") as string | null,
          city: formData.get("guarantor2_city") as string | null,
          state: formData.get("guarantor2_state") as string | null,
          country: formData.get("guarantor2_country") as string | null,
        },
        occupation: formData.get("guarantor2_occupation") as string,
        employerName: formData.get("guarantor2_employerName") as string | null,
        employerAddress: formData.get("guarantor2_employerAddress") as
          | string
          | null,
        relationship: formData.get("guarantor2_relationship") as string,
        yearsKnown: formData.get("guarantor2_yearsKnown")
          ? parseInt(formData.get("guarantor2_yearsKnown") as string)
          : null,
        characterAssessment: formData.get("guarantor2_characterAssessment") as
          | string
          | null,
        liabilityAccepted:
          formData.get("guarantor2_liabilityAccepted") === "on",
        liabilityAcceptedAt: new Date().toISOString(),
        passportPhoto: g2PhotoData,
      };

      const data = {
        guarantorReferee: {
          guarantors: [guarantor1, guarantor2],
          referee: initialData?.referee || {},
        },
      };

      return saveFormStep(applicationId, 4, data);
    } catch (error) {
      return {
        error: "An error occurred during upload. Please try again.",
        submittedData: toSubmittedData(formData),
      };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  useEffect(() => {
    if (!state?.error || !state.submittedData || !formRef.current) return;

    for (const [name, value] of Object.entries(state.submittedData)) {
      const elements = formRef.current.querySelectorAll(`[name="${name}"]`);
      elements.forEach((element) => {
        if (element instanceof HTMLInputElement) {
          if (element.type === "checkbox") {
            element.checked = value === "on";
          } else if (element.type !== "file") {
            element.value = value;
          }
        } else if (
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          element.value = value;
        }
      });
      if (name === "guarantor1_relationship") setGuarantor1Relationship(value);
      if (name === "guarantor2_relationship") setGuarantor2Relationship(value);
    }
  }, [state]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state?.error]);

  const renderGuarantorSection = (
    index: number,
    title: string,
    relationship: string,
    setRelationship: (val: string) => void,
    data?: any,
  ) => {
    const prefix = `guarantor${index + 1}_`;
    const storedPhoto = index === 0 ? g1StoredPhoto : g2StoredPhoto;
    const existingStoredUrl = resolvePreviewUrl(storedPhoto?.storagePath);

    return (
      <div key={index} className="space-y-4">
        {index > 0 && <Separator />}
        <div>
          <h4 className="text-base font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">
            Provide details and passport photograph
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Fill all required fields. You will download, sign, and re-upload
            final forms in steps 7 and 8.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}firstName`} className="text-sm">
              First Name <span className="text-destructive font-semibold ml-1">*</span>
            </Label>
            <Input
              id={`${prefix}firstName`}
              name={`${prefix}firstName`}
              defaultValue={data?.firstName || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}middleName`} className="text-sm">
              Middle Name
            </Label>
            <Input
              id={`${prefix}middleName`}
              name={`${prefix}middleName`}
              defaultValue={data?.middleName || ""}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`${prefix}lastName`} className="text-sm">
            Last Name <span className="text-destructive font-semibold ml-1">*</span>
          </Label>
          <Input
            id={`${prefix}lastName`}
            name={`${prefix}lastName`}
            defaultValue={data?.lastName || ""}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}ageDob`} className="text-sm">
              Date of Birth (YYYY-MM-DD)
            </Label>
            <Input
              id={`${prefix}ageDob`}
              name={`${prefix}ageDob`}
              type="date"
              defaultValue={data?.ageDob || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}phoneNumber`} className="text-sm">
              Phone Number <span className="text-destructive font-semibold ml-1">*</span>
            </Label>
            <Input
              id={`${prefix}phoneNumber`}
              name={`${prefix}phoneNumber`}
              defaultValue={data?.phoneNumber || ""}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}alternatePhone`} className="text-sm">
              Alternate Phone
            </Label>
            <Input
              id={`${prefix}alternatePhone`}
              name={`${prefix}alternatePhone`}
              defaultValue={data?.alternatePhoneNumber || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}email`} className="text-sm">
              Email Address
            </Label>
            <Input
              id={`${prefix}email`}
              name={`${prefix}email`}
              type="email"
              defaultValue={data?.email || ""}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`${prefix}street`} className="text-sm">
            Street Address
          </Label>
          <Input
            id={`${prefix}street`}
            name={`${prefix}street`}
            defaultValue={data?.address?.street || ""}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor={`${prefix}city`} className="text-sm">
              City
            </Label>
            <Input
              id={`${prefix}city`}
              name={`${prefix}city`}
              defaultValue={data?.address?.city || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}state`} className="text-sm">
              State/Province
            </Label>
            <Input
              id={`${prefix}state`}
              name={`${prefix}state`}
              defaultValue={data?.address?.state || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}country`} className="text-sm">
              Country
            </Label>
            <Input
              id={`${prefix}country`}
              name={`${prefix}country`}
              defaultValue={data?.address?.country || ""}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}occupation`} className="text-sm">
              Occupation / Job Title
            </Label>
            <Input
              id={`${prefix}occupation`}
              name={`${prefix}occupation`}
              defaultValue={data?.occupation || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}employerName`} className="text-sm">
              Employer Name
            </Label>
            <Input
              id={`${prefix}employerName`}
              name={`${prefix}employerName`}
              defaultValue={data?.employerName || ""}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`${prefix}employerAddress`} className="text-sm">
            Employer Address
          </Label>
          <Input
            id={`${prefix}employerAddress`}
            name={`${prefix}employerAddress`}
            defaultValue={data?.employerAddress || ""}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}relationship`} className="text-sm">
              Relationship to Applicant <span className="text-destructive font-semibold ml-1">*</span>
            </Label>
            <Select
              value={relationship}
              onValueChange={setRelationship}
            >
              <SelectTrigger id={`${prefix}relationship`}>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Father">Father</SelectItem>
                <SelectItem value="Brother">Brother</SelectItem>
                <SelectItem value="Sister">Sister</SelectItem>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Friend">Friend</SelectItem>
                <SelectItem value="Colleague">Colleague</SelectItem>
                <SelectItem value="Relative">Relative</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name={`${prefix}relationship`}
              value={relationship}
              required
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}yearsKnown`} className="text-sm">
              Years Known (Number)
            </Label>
            <Input
              id={`${prefix}yearsKnown`}
              name={`${prefix}yearsKnown`}
              type="number"
              min="0"
              defaultValue={data?.yearsKnown || ""}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`${prefix}characterAssessment`} className="text-sm">
            Character Assessment / Comments
          </Label>
          <textarea
            id={`${prefix}characterAssessment`}
            name={`${prefix}characterAssessment`}
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            rows={3}
            defaultValue={data?.characterAssessment || ""}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`${prefix}liabilityAccepted`}
              name={`${prefix}liabilityAccepted`}
              defaultChecked={data?.liabilityAccepted}
            />
            <Label
              htmlFor={`${prefix}liabilityAccepted`}
              className="font-normal text-sm"
            >
              I accept liability as a guarantor (Guarantor will confirm on
              printed form)
            </Label>
          </div>
        </div>

        {/* Passport Photo Upload */}
        <div className="rounded-lg border p-4 bg-muted/30">
          <Label htmlFor={`${prefix}photo`} className="font-medium">
            Passport Photograph
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Upload a clear passport-size photograph (JPG, PNG, max 1MB) -
            Optional, can be provided later
          </p>

          <input
            type="file"
            id={`${prefix}photo`}
            name={`${prefix}photo`}
            accept="image/jpeg,image/png"
            onChange={(e) => handlePhotoChange(e, index)}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />

          {fileErrors[index] && (
            <p className="text-sm font-medium text-destructive mt-2">
              {fileErrors[index]}
            </p>
          )}

          {guarantor1Preview && index === 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium mb-2">Preview:</p>
              <img
                src={guarantor1Preview}
                alt={`${title} passport preview`}
                className="h-32 w-24 rounded border border-muted-foreground object-cover"
              />
            </div>
          )}

          {guarantor2Preview && index === 1 && (
            <div className="mt-4">
              <p className="text-xs font-medium mb-2">Preview:</p>
              <img
                src={guarantor2Preview}
                alt={`${title} passport preview`}
                className="h-32 w-24 rounded border border-muted-foreground object-cover"
              />
            </div>
          )}

          {!(index === 0 ? guarantor1Preview : guarantor2Preview) &&
            existingStoredUrl && (
              <div className="mt-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={existingStoredUrl}
                    alt={`${title} current passport`}
                    className="h-16 w-12 rounded border object-cover"
                  />
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">
                      ✓ Passport photo stored
                    </p>
                    <p className="text-[10px] text-green-600/80 dark:text-green-500/80">
                      Upload new to replace
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Guarantors Details</h3>
        <p className="text-sm text-muted-foreground">
          Step 4 of 6 - Provide details for two (2) guarantors including
          passport photographs
        </p>
      </div>

      {/* Guarantor 1 */}
      {renderGuarantorSection(
        0,
        "Guarantor 1",
        guarantor1Relationship,
        setGuarantor1Relationship,
        initialData?.guarantors?.[0],
      )}

      {/* Guarantor 2 */}
      {renderGuarantorSection(
        1,
        "Guarantor 2",
        guarantor2Relationship,
        setGuarantor2Relationship,
        initialData?.guarantors?.[1],
      )}

      {/* Error Display */}
      {state?.error && (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Next: Referee"}
        </Button>
      </div>
    </form>
  );
}
