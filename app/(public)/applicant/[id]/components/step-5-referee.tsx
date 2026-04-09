"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GuarantorRefereeData } from "@/lib/types/form-data";
import { toast } from "sonner";

type FormState = {
  error?: string;
  success?: boolean;
  nextStep?: number;
  submittedData?: Record<string, string>;
};

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;
const ALLOWED_REFEREE_RELATIONSHIPS = ["professional", "academic"] as const;
const REFEREE_VALIDATION_ERROR =
  "Referee must be a professional/academic contact and cannot be one of your guarantors.";

const normalizeText = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizePhone = (value: unknown): string =>
  String(value || "").replace(/\D+/g, "");

const resolvePreviewUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("/api/")) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    return apiBase ? `${apiBase}${url}` : url;
  }
  return url;
};

export function Step5Referee({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: GuarantorRefereeData;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [refereePhotoPreview, setRefereePhotoPreview] = useState<string | null>(
    null,
  );
  const [refereePhotoUrl, setRefereePhotoUrl] = useState<string | null>(
    resolvePreviewUrl(initialData?.referee?.passportPhoto?.storagePath),
  );
  const [relationshipType, setRelationshipType] = useState<string>(() => {
    const currentValue = normalizeText(initialData?.referee?.relationshipType);
    return ALLOWED_REFEREE_RELATIONSHIPS.includes(
      currentValue as (typeof ALLOWED_REFEREE_RELATIONSHIPS)[number],
    )
      ? currentValue
      : "";
  });
  const [trustworthyValue, setTrustworthyValue] = useState<string>(
    initialData?.referee?.assessment?.trustworthyWithConfidentialInfo === true
      ? "yes"
      : initialData?.referee?.assessment?.trustworthyWithConfidentialInfo ===
          false
        ? "no"
        : "",
  );

  const [fileError, setFileError] = useState<string | null>(null);

  const toSubmittedData = (formData: FormData) =>
    Object.fromEntries(
      Array.from(formData.entries()).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setFileError(
          "Please upload a PNG or JPEG image. WebP is not supported.",
        );
        setRefereePhotoPreview(null);
        e.target.value = ""; // Clear input
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const message = "Image exceeds 1MB. Please compress and re-upload.";
        setFileError(message);
        toast.error(message);
        setRefereePhotoPreview(null);
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setRefereePhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = async () => {
    await redirectToPreviousStep(applicationId, 5);
  };

  const handleSubmitAction = async (
    _prevState: FormState | null,
    formData: FormData,
  ): Promise<FormState> => {
    try {
      const requiredFields = [
        "referee_fullName",
        "referee_phoneNumber",
        "referee_relationshipType",
        "referee_howLongKnown",
        "referee_occupation",
        "referee_address",
      ];

      for (const field of requiredFields) {
        const value = String(formData.get(field) || "").trim();
        if (!value) {
          return {
            error: "Please complete all required referee fields.",
            submittedData: toSubmittedData(formData),
          };
        }
      }

      const refereeRelationshipType = normalizeText(
        formData.get("referee_relationshipType"),
      );
      if (
        !ALLOWED_REFEREE_RELATIONSHIPS.includes(
          refereeRelationshipType as (typeof ALLOWED_REFEREE_RELATIONSHIPS)[number],
        )
      ) {
        return {
          error: REFEREE_VALIDATION_ERROR,
          submittedData: toSubmittedData(formData),
        };
      }

      const refereeFullName = normalizeText(formData.get("referee_fullName"));
      const refereeEmail = normalizeText(formData.get("referee_emailAddress"));
      const refereePhone = normalizePhone(formData.get("referee_phoneNumber"));

      const isSameAsGuarantor = (initialData?.guarantors || []).some(
        (guarantor) => {
          const guarantorName = normalizeText(
            guarantor?.fullName ||
              `${guarantor?.firstName || ""} ${guarantor?.middleName || ""} ${guarantor?.lastName || ""}`,
          );
          const guarantorEmail = normalizeText(guarantor?.email);
          const guarantorPhone = normalizePhone(guarantor?.phoneNumber);

          const sameName =
            refereeFullName &&
            guarantorName &&
            refereeFullName === guarantorName;
          const sameEmail =
            refereeEmail && guarantorEmail && refereeEmail === guarantorEmail;
          const samePhone =
            refereePhone && guarantorPhone && refereePhone === guarantorPhone;

          return Boolean(sameName || sameEmail || samePhone);
        },
      );

      if (isSameAsGuarantor) {
        return {
          error: REFEREE_VALIDATION_ERROR,
          submittedData: toSubmittedData(formData),
        };
      }

      // Upload referee photo
      const refereePhotoFile = formData.get("referee_photo") as File | null;
      let uploadedPhotoUrl: string | null = null;
      let uploadedPhotoFileId: string | undefined;

      if (
        refereePhotoFile &&
        refereePhotoFile.size > 0 &&
        refereePhotoFile.name
      ) {
        try {
          const photoResult = await uploadPublicFile(
            applicationId,
            refereePhotoFile,
            `referee_pass_${applicationId}`,
          );
          uploadedPhotoUrl = photoResult.storagePath;
          setRefereePhotoUrl(resolvePreviewUrl(photoResult.storagePath));
          uploadedPhotoFileId = photoResult.fileId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (uploadError: any) {
          return {
            error: `Photo upload failed: ${uploadError.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      // Parse trustworthy value
      const trustworthyRaw = formData.get(
        "assessment_trustworthyWithConfidentialInfo",
      ) as string;
      let trustworthyWithConfidentialInfo: boolean | undefined;
      if (trustworthyRaw === "yes") {
        trustworthyWithConfidentialInfo = true;
      } else if (trustworthyRaw === "no") {
        trustworthyWithConfidentialInfo = false;
      }

      const data = {
        guarantorReferee: {
          guarantors: initialData?.guarantors || [],
          referee: {
            fullName: formData.get("referee_fullName") as string,
            nameOfReferee: formData.get("referee_nameOfReferee") as
              | string
              | null,
            phoneNumber: formData.get("referee_phoneNumber") as string,
            phoneNumberAlternate: formData.get(
              "referee_phoneNumberAlternate",
            ) as string | null,
            emailAddress: formData.get("referee_emailAddress") as string | null,
            organization: formData.get("referee_organization") as string | null,
            address: formData.get("referee_address") as string | null,
            occupation: formData.get("referee_occupation") as string | null,
            relationshipType: formData.get("referee_relationshipType") as
              | string
              | null,
            howLongKnown: formData.get("referee_howLongKnown") as string | null,
            professionalAssessment: formData.get(
              "referee_professionalAssessment",
            ) as string | null,
            // Assessment questions
            assessment: {
              howLongKnown: formData.get("referee_howLongKnown") as
                | string
                | null,
              capacity: formData.get("assessment_capacity") as string | null,
              lastContact: formData.get("assessment_lastContact") as
                | string
                | null,
              abilityToGetAlong: formData.get(
                "assessment_abilityToGetAlong",
              ) as string | null,
              primarySkills: formData.get("assessment_primarySkills") as
                | string
                | null,
              areasToImprove: formData.get("assessment_areasToImprove") as
                | string
                | null,
              collaborationComfort: formData.get(
                "assessment_collaborationComfort",
              ) as string | null,
              characterOpinion: formData.get("assessment_characterOpinion") as
                | string
                | null,
              trustworthyWithConfidentialInfo,
              observedIllegalActivity: formData.get(
                "assessment_observedIllegalActivity",
              ) as string | null,
              recommendForPosition: formData.get(
                "assessment_recommendForPosition",
              ) as string | null,
            },
            passportPhoto: uploadedPhotoUrl
              ? {
                  fileName: refereePhotoFile?.name || "referee_photo.jpg",
                  uploadedAt: new Date().toISOString(),
                  storagePath: uploadedPhotoUrl,
                  fileId: uploadedPhotoFileId,
                }
              : initialData?.referee?.passportPhoto,
          },
        },
      };

      return saveFormStep(applicationId, 5, data);
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
    }
  }, [state]);

  const assessment = initialData?.referee?.assessment;

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Referee Details</h3>
        <p className="text-sm text-muted-foreground">
          Step 5 of 6 - Provide details for one (1) professional or academic
          referee
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
          Complete all required fields. In steps 7 and 8, download forms, ensure
          signatures are present, then re-upload signed copies.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
        <p className="font-semibold">Important referee rule</p>
        <p className="mt-1">
          Your referee must be a professional or academic contact and must not
          be one of your guarantors.
        </p>
      </div>

      {/* Basic Referee Information */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="referee_fullName" className="text-sm">
              Full Name *
            </Label>
            <Input
              id="referee_fullName"
              name="referee_fullName"
              defaultValue={initialData?.referee?.fullName || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="referee_phoneNumber" className="text-sm">
              Phone Number *
            </Label>
            <Input
              id="referee_phoneNumber"
              name="referee_phoneNumber"
              defaultValue={initialData?.referee?.phoneNumber || ""}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="referee_phoneNumberAlternate" className="text-sm">
              Alternate Phone Number
            </Label>
            <Input
              id="referee_phoneNumberAlternate"
              name="referee_phoneNumberAlternate"
              defaultValue={initialData?.referee?.phoneNumberAlternate || ""}
            />
          </div>
          <div>
            <Label htmlFor="referee_emailAddress" className="text-sm">
              Email Address
            </Label>
            <Input
              id="referee_emailAddress"
              name="referee_emailAddress"
              type="email"
              defaultValue={initialData?.referee?.emailAddress || ""}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="referee_organization" className="text-sm">
              Organization / Company *
            </Label>
            <Input
              id="referee_organization"
              name="referee_organization"
              defaultValue={initialData?.referee?.organization || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="referee_occupation" className="text-sm">
              Occupation / Job Title *
            </Label>
            <Input
              id="referee_occupation"
              name="referee_occupation"
              defaultValue={initialData?.referee?.occupation || ""}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="referee_address" className="text-sm">
            Address *
          </Label>
          <Input
            id="referee_address"
            name="referee_address"
            defaultValue={initialData?.referee?.address || ""}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <div>
            <Label htmlFor="referee_relationshipType" className="text-sm">
              Relationship Type *
            </Label>
            <Select
              value={relationshipType}
              onValueChange={setRelationshipType}
            >
              <SelectTrigger id="referee_relationshipType">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">
                  Professional / Colleague
                </SelectItem>
                <SelectItem value="academic">Academic / Teacher</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="referee_relationshipType"
              value={relationshipType}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="referee_howLongKnown" className="text-sm">
            How Long Have You Known Applicant? *
          </Label>
          <Input
            id="referee_howLongKnown"
            name="referee_howLongKnown"
            placeholder="e.g., 5 years as a colleague"
            defaultValue={initialData?.referee?.howLongKnown || ""}
            required
          />
        </div>

        {/* Passport Photo Upload */}
        <div className="rounded-lg border p-4 bg-muted/30">
          <Label htmlFor="referee_photo" className="font-medium">
            Passport Photograph
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Upload a clear passport-size photograph (JPG, PNG, max 1MB) -
            Optional, can be provided later
          </p>

          <input
            type="file"
            id="referee_photo"
            name="referee_photo"
            accept="image/jpeg,image/png"
            onChange={handlePhotoChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
          />

          {fileError && (
            <p className="text-sm font-medium text-destructive mt-2">
              {fileError}
            </p>
          )}

          {refereePhotoPreview && (
            <div className="mt-4">
              <p className="text-xs font-medium mb-2">Preview:</p>
              <img
                src={refereePhotoPreview}
                alt="Referee passport preview"
                className="h-32 w-24 rounded border border-muted-foreground object-cover"
              />
            </div>
          )}

          {!refereePhotoPreview && refereePhotoUrl && (
            <div className="mt-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={refereePhotoUrl}
                  alt="Current referee passport"
                  className="h-20 w-16 rounded border object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    ✓ Referee passport photo stored
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-500/80">
                    Upload new to replace
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assessment Questions - Collapsible */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="assessment" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-col items-start">
              <span className="font-semibold">Assessment Questions</span>
              <span className="text-xs text-muted-foreground font-normal">
                Optional - Referee will complete these on the printed form
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              These questions will appear on the referee form PDF. You can
              pre-fill them if the referee has already provided answers, or
              leave them blank for the referee to complete on the printed form.
            </p>

            {/* Q1: Capacity */}
            <div>
              <Label htmlFor="assessment_capacity" className="text-sm">
                1. In what capacity do you know the applicant?
              </Label>
              <Input
                id="assessment_capacity"
                name="assessment_capacity"
                placeholder="e.g., Direct supervisor, Colleague, Professor"
                defaultValue={assessment?.capacity || ""}
              />
            </div>

            {/* Q2: Last Contact */}
            <div>
              <Label htmlFor="assessment_lastContact" className="text-sm">
                2. When was the last time you had contact with the applicant?
              </Label>
              <Input
                id="assessment_lastContact"
                name="assessment_lastContact"
                placeholder="e.g., Last week, 3 months ago"
                defaultValue={assessment?.lastContact || ""}
              />
            </div>

            {/* Q3: Ability to Get Along */}
            <div>
              <Label htmlFor="assessment_abilityToGetAlong" className="text-sm">
                3. How would you describe the applicant&apos;s ability to get along
                well with others?
              </Label>
              <textarea
                id="assessment_abilityToGetAlong"
                name="assessment_abilityToGetAlong"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                rows={2}
                defaultValue={assessment?.abilityToGetAlong || ""}
              />
            </div>

            {/* Q4: Skills and Improvements */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="assessment_primarySkills" className="text-sm">
                  4a. Primary positive skills and qualities
                </Label>
                <textarea
                  id="assessment_primarySkills"
                  name="assessment_primarySkills"
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  rows={2}
                  defaultValue={assessment?.primarySkills || ""}
                />
              </div>
              <div>
                <Label htmlFor="assessment_areasToImprove" className="text-sm">
                  4b. Areas they could improve on
                </Label>
                <textarea
                  id="assessment_areasToImprove"
                  name="assessment_areasToImprove"
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  rows={2}
                  defaultValue={assessment?.areasToImprove || ""}
                />
              </div>
            </div>

            {/* Q5: Collaboration Comfort */}
            <div>
              <Label
                htmlFor="assessment_collaborationComfort"
                className="text-sm"
              >
                5. How comfortable would you be having the applicant collaborate
                with you on an important project?
              </Label>
              <textarea
                id="assessment_collaborationComfort"
                name="assessment_collaborationComfort"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                rows={2}
                defaultValue={assessment?.collaborationComfort || ""}
              />
            </div>

            {/* Q6: Character Opinion */}
            <div>
              <Label htmlFor="assessment_characterOpinion" className="text-sm">
                6. What is your opinion of the applicant&apos;s personal character,
                honesty and reliability?
              </Label>
              <textarea
                id="assessment_characterOpinion"
                name="assessment_characterOpinion"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                defaultValue={assessment?.characterOpinion || ""}
              />
            </div>

            {/* Q7: Trustworthy with Confidential Info */}
            <div>
              <Label className="text-sm">
                7. Is there any reason why you wouldn&apos;t trust the applicant with
                confidential information?
              </Label>
              <Select
                value={trustworthyValue}
                onValueChange={setTrustworthyValue}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select an answer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Would not trust</SelectItem>
                  <SelectItem value="no">No - Would trust</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name="assessment_trustworthyWithConfidentialInfo"
                value={trustworthyValue}
              />
            </div>

            {/* Q8: Observed Illegal Activity */}
            <div>
              <Label
                htmlFor="assessment_observedIllegalActivity"
                className="text-sm"
              >
                8. Have you ever observed or had knowledge of the applicant
                doing anything illegal or questionable?
              </Label>
              <textarea
                id="assessment_observedIllegalActivity"
                name="assessment_observedIllegalActivity"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                rows={2}
                defaultValue={assessment?.observedIllegalActivity || ""}
              />
            </div>

            {/* Q9: Additional Comments */}
            <div>
              <Label
                htmlFor="referee_professionalAssessment"
                className="text-sm"
              >
                9. Is there anything else you would like to tell us about the
                applicant?
              </Label>
              <textarea
                id="referee_professionalAssessment"
                name="referee_professionalAssessment"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                defaultValue={
                  initialData?.referee?.professionalAssessment || ""
                }
              />
            </div>

            {/* Q10: Recommendation */}
            <div>
              <Label
                htmlFor="assessment_recommendForPosition"
                className="text-sm"
              >
                10. Do you recommend the applicant for the position?
              </Label>
              <Input
                id="assessment_recommendForPosition"
                name="assessment_recommendForPosition"
                placeholder="e.g., Yes, highly recommended"
                defaultValue={assessment?.recommendForPosition || ""}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
          {isPending ? "Saving..." : "Next: Media & Signature"}
        </Button>
      </div>
    </form>
  );
}
