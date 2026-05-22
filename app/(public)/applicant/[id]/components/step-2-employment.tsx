"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveFormStep, redirectToPreviousStep } from "../actions";
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
import { EmploymentFinanceData } from "@/lib/types/form-data";

type FormState = {
  error?: string;
  success?: boolean;
  nextStep?: number;
  submittedData?: Record<string, string>;
};

interface EmploymentTerms {
  staff_designation?: string;
  reporting_to?: string;
  effective_date?: string;
  gross_salary?: number;
  salary_breakdown?: Record<string, number>;
  net_salary?: number;
}

const QUALIFICATION_OPTIONS = [
  "B.Sc.",
  "M.Sc.",
  "Ph.D",
  "HND",
  "OND",
  "ND",
  "NCE",
  "SSCE",
  "Other",
] as const;

const GRADE_OPTIONS = [
  "First Class Honours",
  "Second Class Upper",
  "Second Class Lower",
  "Third Class",
  "Distinction",
  "Upper Credit",
  "Lower Credit",
  "Merit",
  "Pass",
  "Other",
] as const;

export function Step2Employment({
  applicationId,
  initialData,
  employmentTerms,
}: {
  applicationId: string;
  initialData?: EmploymentFinanceData;
  employmentTerms?: EmploymentTerms;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [employmentCount, setEmploymentCount] = useState(
    initialData?.previousEmployment?.length || 0,
  );
  const [educationCount, setEducationCount] = useState(
    initialData?.education?.length || 1,
  );
  const [qualificationValues, setQualificationValues] = useState<
    Record<number, string>
  >({});
  const [gradeValues, setGradeValues] = useState<Record<number, string>>({});

  const toSubmittedData = (formData: FormData) =>
    Object.fromEntries(
      Array.from(formData.entries()).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );

  const handleAddEmployment = () => {
    setEmploymentCount(employmentCount + 1);
  };

  const handleAddEducation = () => {
    setEducationCount(educationCount + 1);
  };

  const handleRemoveEducation = () => {
    if (educationCount > 1) {
      setEducationCount(educationCount - 1);
    }
  };

  const handleRemoveEmployment = () => {
    if (employmentCount > 0) {
      setEmploymentCount(employmentCount - 1);
    }
  };

  const handleSubmitAction = async (
    _prevState: FormState | null,
    formData: FormData,
  ): Promise<FormState> => {
    const missingFields: string[] = [];

    const bankName = String(formData.get("bankName") || "").trim();
    const bankAccountNumber = String(
      formData.get("bankAccountNumber") || "",
    ).trim();

    if (!bankName) missingFields.push("Bank Name");
    if (!bankAccountNumber) missingFields.push("Bank Account Number");

    // Parse education array
    const educationCount =
      parseInt(formData.get("educationCount") as string) || 1;
    const education = [];

    // First education row is strictly required
    const inst0 = String(formData.get("education_0_institution") || "").trim();
    const qual0 = String(formData.get("education_0_qualification") || "").trim();
    const start0 = String(formData.get("education_0_startYear") || "").trim();
    const end0 = String(formData.get("education_0_endYear") || "").trim();

    if (!inst0) missingFields.push("Education 1: Institution");
    if (!qual0) missingFields.push("Education 1: Qualification");
    if (!start0) missingFields.push("Education 1: Start Year");
    if (!end0) missingFields.push("Education 1: End Year");

    if (inst0 && qual0 && start0 && end0) {
      education.push({
        institution: inst0,
        qualification: qual0,
        fieldOfStudy: formData.get("education_0_fieldOfStudy"),
        startYear: start0,
        endYear: end0,
        grade: formData.get("education_0_grade"),
      });
    }

    // Additional education rows (optional, but if started, they must be completed)
    for (let i = 1; i < educationCount; i++) {
      const institution = String(
        formData.get(`education_${i}_institution`) || "",
      ).trim();
      const qualification = String(
        formData.get(`education_${i}_qualification`) || "",
      ).trim();
      const startYear = String(
        formData.get(`education_${i}_startYear`) || "",
      ).trim();
      const endYear = String(
        formData.get(`education_${i}_endYear`) || "",
      ).trim();

      if (institution || qualification || startYear || endYear) {
        if (!institution) missingFields.push(`Education ${i + 1}: Institution`);
        if (!qualification) missingFields.push(`Education ${i + 1}: Qualification`);
        if (!startYear) missingFields.push(`Education ${i + 1}: Start Year`);
        if (!endYear) missingFields.push(`Education ${i + 1}: End Year`);

        if (institution && qualification && startYear && endYear) {
          education.push({
            institution,
            qualification,
            fieldOfStudy: formData.get(`education_${i}_fieldOfStudy`),
            startYear,
            endYear,
            grade: formData.get(`education_${i}_grade`),
          });
        }
      }
    }

    if (missingFields.length > 0) {
      return {
        error: `Please complete the following required fields: ${missingFields.join(", ")}`,
        submittedData: toSubmittedData(formData),
      };
    }

    // Parse employment array
    const employmentCount =
      parseInt(formData.get("employmentCount") as string) || 0;
    const previousEmployment = [];
    for (let i = 0; i < employmentCount; i++) {
      const employer = formData.get(`employment_${i}_employer`);
      if (employer) {
        previousEmployment.push({
          employer,
          position: formData.get(`employment_${i}_position`),
          startDate: formData.get(`employment_${i}_startDate`),
          endDate: formData.get(`employment_${i}_endDate`),
          year: formData.get(`employment_${i}_year`),
          reasonForLeaving: formData.get(`employment_${i}_reasonForLeaving`),
        });
      }
    }

    const data = {
      employmentFinance: {
        bankDetails: {
          accountNumber: formData.get("bankAccountNumber"),
          accountName: formData.get("bankAccountName"),
          bankName: formData.get("bankName"),
        },
        education,
        previousEmployment:
          previousEmployment.length > 0 ? previousEmployment : undefined,
      },
    };
    return saveFormStep(applicationId, 2, data);
  };

  const handleBack = async () => {
    await redirectToPreviousStep(applicationId, 2);
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  useEffect(() => {
    if (!state?.error || !state.submittedData || !formRef.current) return;

    const restoredQualificationValues: Record<number, string> = {};
    const restoredGradeValues: Record<number, string> = {};

    for (const [name, value] of Object.entries(state.submittedData)) {
      const qualificationMatch = name.match(/^education_(\d+)_qualification$/);
      if (qualificationMatch) {
        restoredQualificationValues[Number(qualificationMatch[1])] = value;
      }

      const gradeMatch = name.match(/^education_(\d+)_grade$/);
      if (gradeMatch) {
        restoredGradeValues[Number(gradeMatch[1])] = value;
      }

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

    setQualificationValues((prev) => ({
      ...prev,
      ...restoredQualificationValues,
    }));
    setGradeValues((prev) => ({ ...prev, ...restoredGradeValues }));
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Employment & Finance</h3>
        <p className="text-sm text-muted-foreground">
          Step 2 of 6 - Provide employment and financial information
        </p>
      </div>

      {/* HR-filled Employment Terms (Read-only) */}
      {employmentTerms && (
        <div className="space-y-4">
          <Separator />
          <h4 className="font-medium">Your Employment Terms</h4>
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Position
                </p>
                <p className="text-sm font-semibold">
                  {employmentTerms.staff_designation}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Reporting To
                </p>
                <p className="text-sm font-semibold">
                  {employmentTerms.reporting_to}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Effective Date
                </p>
                <p className="text-sm font-semibold">
                  {employmentTerms.effective_date &&
                    new Date(
                      employmentTerms.effective_date,
                    ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Gross Salary
                </p>
                <p className="text-sm font-semibold">
                  ₦
                  {employmentTerms.gross_salary?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Details */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Bank Details</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="bankName"
              name="bankName"
              required
              defaultValue={initialData?.bankDetails?.bankName || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Account Number <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              required
              defaultValue={initialData?.bankDetails?.accountNumber || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountName">Account Name</Label>
            <Input
              id="bankAccountName"
              name="bankAccountName"
              defaultValue={initialData?.bankDetails?.accountName || ""}
            />
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="space-y-4">
        <Separator />
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Educational History <span className="text-destructive font-semibold ml-1">*</span></h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddEducation}
          >
            + Add Education
          </Button>
        </div>
        <input type="hidden" name="educationCount" value={educationCount} />
        {Array.from({ length: educationCount }).map((_, idx) => {
          const edu = initialData?.education?.[idx];
          return (
            <div key={idx} className="space-y-4 rounded-lg border p-4 relative">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Qualification {idx + 1}</p>
                {idx > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveEducation}
                    className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`education_${idx}_institution`}>
                    Institution {idx === 0 && <span className="text-destructive font-semibold ml-1">*</span>}
                  </Label>
                  <Input
                    id={`education_${idx}_institution`}
                    name={`education_${idx}_institution`}
                    required={idx === 0}
                    defaultValue={edu?.institution || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`education_${idx}_qualification`}>
                    Qualification {idx === 0 && <span className="text-destructive font-semibold ml-1">*</span>}
                  </Label>
                  <Select
                    value={qualificationValues[idx]}
                    onValueChange={(value) =>
                      setQualificationValues((prev) => ({
                        ...prev,
                        [idx]: value,
                      }))
                    }
                  >
                    <SelectTrigger id={`education_${idx}_qualification`}>
                      <SelectValue
                        placeholder={
                          edu?.qualification || "Select qualification"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALIFICATION_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    name={`education_${idx}_qualification`}
                    value={qualificationValues[idx] ?? edu?.qualification ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`education_${idx}_fieldOfStudy`}>
                    Field of Study
                  </Label>
                  <Input
                    id={`education_${idx}_fieldOfStudy`}
                    name={`education_${idx}_fieldOfStudy`}
                    defaultValue={edu?.fieldOfStudy || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`education_${idx}_startYear`}>
                    Start Year {idx === 0 && <span className="text-destructive font-semibold ml-1">*</span>}
                  </Label>
                  <Input
                    id={`education_${idx}_startYear`}
                    name={`education_${idx}_startYear`}
                    type="number"
                    placeholder="YYYY"
                    required={idx === 0}
                    defaultValue={edu?.startYear || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`education_${idx}_endYear`}>
                    End Year {idx === 0 && <span className="text-destructive font-semibold ml-1">*</span>}
                  </Label>
                  <Input
                    id={`education_${idx}_endYear`}
                    name={`education_${idx}_endYear`}
                    type="number"
                    placeholder="YYYY"
                    required={idx === 0}
                    defaultValue={edu?.endYear || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`education_${idx}_grade`}>Grade</Label>
                  <Select
                    value={gradeValues[idx]}
                    onValueChange={(value) =>
                      setGradeValues((prev) => ({
                        ...prev,
                        [idx]: value,
                      }))
                    }
                  >
                    <SelectTrigger id={`education_${idx}_grade`}>
                      <SelectValue placeholder={edu?.grade || "Select grade"} />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    name={`education_${idx}_grade`}
                    value={gradeValues[idx] ?? edu?.grade ?? ""}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Previous Employment */}
      <div className="space-y-4">
        <Separator />
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Previous Employment (Optional)</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddEmployment}
          >
            + Add Employment
          </Button>
        </div>
        <input type="hidden" name="employmentCount" value={employmentCount} />
        {Array.from({ length: employmentCount }).map((_, idx) => {
          const emp = initialData?.previousEmployment?.[idx];
          return (
            <div key={idx} className="space-y-4 rounded-lg border p-4 relative">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Employment {idx + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveEmployment}
                  className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`employment_${idx}_employer`}>Employer</Label>
                  <Input
                    id={`employment_${idx}_employer`}
                    name={`employment_${idx}_employer`}
                    defaultValue={emp?.employer || emp?.companyName || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`employment_${idx}_position`}>Position</Label>
                  <Input
                    id={`employment_${idx}_position`}
                    name={`employment_${idx}_position`}
                    defaultValue={emp?.position || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`employment_${idx}_startDate`}>
                    Start Date
                  </Label>
                  <Input
                    id={`employment_${idx}_startDate`}
                    name={`employment_${idx}_startDate`}
                    type="month"
                    defaultValue={emp?.startDate || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`employment_${idx}_endDate`}>End Date</Label>
                  <Input
                    id={`employment_${idx}_endDate`}
                    name={`employment_${idx}_endDate`}
                    type="month"
                    defaultValue={emp?.endDate || ""}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`employment_${idx}_reasonForLeaving`}>
                    Reason for Leaving
                  </Label>
                  <Input
                    id={`employment_${idx}_reasonForLeaving`}
                    name={`employment_${idx}_reasonForLeaving`}
                    defaultValue={emp?.reasonForLeaving || ""}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
          {isPending ? "Saving..." : "Next: Legal Agreements"}
        </Button>
      </div>
    </form>
  );
}
