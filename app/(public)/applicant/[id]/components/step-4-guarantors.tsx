"use client";

import { useActionState, useState } from "react";
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

type FormState = {
  error?: string;
  success?: boolean;
  nextStep?: number;
};

interface GarantorPreview {
  [key: number]: string | null;
}

export function Step4Guarantors({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: GuarantorRefereeData;
}) {
  const router = useRouter();
  const [guarantor1Preview, setGuarantor1Preview] = useState<string | null>(
    null,
  );
  const [guarantor2Preview, setGuarantor2Preview] = useState<string | null>(
    null,
  );
  const [guarantor1PhotoUrl, setGuarantor1PhotoUrl] = useState<string | null>(
    initialData?.guarantors?.[0]?.passportPhoto?.storagePath || null,
  );
  const [guarantor2PhotoUrl, setGuarantor2PhotoUrl] = useState<string | null>(
    initialData?.guarantors?.[1]?.passportPhoto?.storagePath || null,
  );
  const [isUploadingG1, setIsUploadingG1] = useState(false);
  const [isUploadingG2, setIsUploadingG2] = useState(false);
  const [fileErrors, setFileErrors] = useState<{
    [key: number]: string | null;
  }>({
    0: null,
    1: null,
  });

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
      // Upload guarantor 1 photo
      const g1PhotoFile = formData.get("guarantor1_photo") as File | null;
      let g1PhotoUrl: string | null = null;

      if (g1PhotoFile && g1PhotoFile.size > 0 && g1PhotoFile.name) {
        try {
          const g1Result = await uploadPublicFile(
            applicationId,
            g1PhotoFile,
            "guarantor1_pass",
          );
          g1PhotoUrl = g1Result.storagePath;
        } catch (g1Error: any) {
          return {
            error: `Guarantor 1 photo upload failed: ${g1Error.message}`,
          };
        }
      }

      // Upload guarantor 2 photo
      const g2PhotoFile = formData.get("guarantor2_photo") as File | null;
      let g2PhotoUrl: string | null = null;

      if (g2PhotoFile && g2PhotoFile.size > 0 && g2PhotoFile.name) {
        try {
          const g2Result = await uploadPublicFile(
            applicationId,
            g2PhotoFile,
            "guarantor2_pass",
          );
          g2PhotoUrl = g2Result.storagePath;
        } catch (g2Error: any) {
          return {
            error: `Guarantor 2 photo upload failed: ${g2Error.message}`,
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
        position: formData.get("guarantor1_position") as string | null,
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
        ...(g1PhotoUrl && {
          passportPhoto: {
            fileName: g1PhotoFile?.name || "passport_photo.jpg",
            uploadedAt: new Date().toISOString(),
            storagePath: g1PhotoUrl,
          },
        }),
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
        position: formData.get("guarantor2_position") as string | null,
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
        ...(g2PhotoUrl && {
          passportPhoto: {
            fileName: g2PhotoFile?.name || "passport_photo.jpg",
            uploadedAt: new Date().toISOString(),
            storagePath: g2PhotoUrl,
          },
        }),
      };

      const data = {
        guarantorReferee: {
          guarantors: [guarantor1, guarantor2],
          referee: initialData?.referee || {},
        },
      };

      return saveFormStep(applicationId, 4, data);
    } catch (error) {
      return { error: "An error occurred during upload. Please try again." };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  const renderGuarantorSection = (index: number, title: string, data?: any) => {
    const prefix = `guarantor${index + 1}_`;
    const preview =
      index === 0
        ? guarantor1Preview ||
          (initialData?.guarantors?.[index]?.passportPhoto?.storagePath
            ? "stored"
            : null)
        : guarantor2Preview ||
          (initialData?.guarantors?.[index]?.passportPhoto?.storagePath
            ? "stored"
            : null);

    return (
      <div key={index} className="space-y-4">
        {index > 0 && <Separator />}
        <div>
          <h4 className="text-base font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">
            Provide details and passport photograph
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}firstName`} className="text-sm">
              First Name *
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
            Last Name *
          </Label>
          <Input
            id={`${prefix}lastName`}
            name={`${prefix}lastName`}
            defaultValue={data?.lastName || ""}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              Phone Number *
            </Label>
            <Input
              id={`${prefix}phoneNumber`}
              name={`${prefix}phoneNumber`}
              defaultValue={data?.phoneNumber || ""}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-3 gap-4">
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

        <div>
          <Label htmlFor={`${prefix}occupation`} className="text-sm">
            Occupation
          </Label>
          <Input
            id={`${prefix}occupation`}
            name={`${prefix}occupation`}
            defaultValue={data?.occupation || ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}position`} className="text-sm">
              Position/Job Title
            </Label>
            <Input
              id={`${prefix}position`}
              name={`${prefix}position`}
              defaultValue={data?.position || ""}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}relationship`} className="text-sm">
              Relationship to Applicant
            </Label>
            <Input
              id={`${prefix}relationship`}
              name={`${prefix}relationship`}
              defaultValue={data?.relationship || ""}
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
            Upload a clear passport-size photograph (JPG, PNG, max 5MB) -
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

          {preview ||
          (index === 0 &&
            initialData?.guarantors?.[0]?.passportPhoto?.storagePath) ||
          (index === 1 &&
            initialData?.guarantors?.[1]?.passportPhoto?.storagePath) ? (
            <div className="mt-4">
              <p className="text-xs font-medium mb-2">Preview:</p>
              {preview === "stored" ? (
                <div className="h-32 w-24 rounded border border-dashed border-muted-foreground flex items-center justify-center bg-muted">
                  <p className="text-xs text-muted-foreground">Photo stored</p>
                </div>
              ) : preview ? (
                <img
                  src={preview}
                  alt={`${title} passport preview`}
                  className="h-32 w-24 rounded border border-muted-foreground object-cover"
                />
              ) : (
                <img
                  src={
                    index === 0
                      ? initialData?.guarantors?.[0]?.passportPhoto?.storagePath
                      : initialData?.guarantors?.[1]?.passportPhoto?.storagePath
                  }
                  alt={`${title} passport photo`}
                  className="h-32 w-24 rounded border border-muted-foreground object-cover"
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Guarantors Details</h3>
        <p className="text-sm text-muted-foreground">
          Step 4 of 6 - Provide details for two (2) guarantors including
          passport photographs
        </p>
      </div>

      {/* Guarantor 1 */}
      {renderGuarantorSection(0, "Guarantor 1", initialData?.guarantors?.[0])}

      {/* Guarantor 2 */}
      {renderGuarantorSection(1, "Guarantor 2", initialData?.guarantors?.[1])}

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
