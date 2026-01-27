"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicantStore, EmploymentData } from "@/lib/store/applicant-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface EmploymentTerms {
  staff_designation?: string;
  reporting_to?: string;
  effective_date?: string;
  gross_salary?: number;
  salary_breakdown?: Record<string, number>;
  net_salary?: number;
}

export function Step2Employment() {
  const router = useRouter();
  const { formData, updateFormData, setStep, completeStep } =
    useApplicantStore();
  const initialData = formData.employment;
  const [isPending, setIsPending] = useState(false);

  // Mock employment terms for display since we don't have backend to fetch them
  const employmentTerms: EmploymentTerms = {
    staff_designation: "Software Engineer",
    reporting_to: "CTO",
    effective_date: new Date().toISOString(),
    gross_salary: 5000000,
  };

  const [educationCount, setEducationCount] = useState(1); // Determine based on initial data if present
  const [employmentCount, setEmploymentCount] = useState(0);

  const handleAddEmployment = () => {
    setEmploymentCount(employmentCount + 1);
  };

  const handleBack = () => {
    setStep(1);
    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "1";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/1`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const form = new FormData(e.currentTarget);

    // Parse education
    // In a real port we would map over educationCount state
    // For simplicity/mock, we assume 1 or standard parsing
    // But since we are using form data, we need to iterate

    // We can just grab what's there.
    // Since we don't have dynamic 'educationCount' input working perfectly with Controlled inputs without more state,
    // we'll simplified logic:

    const education = [];
    // We know we rendered 'initialData?.education' or default 1
    // Ideally we should track the count in state or read it from hidden input
    const eduCount = parseInt(form.get("educationCount") as string) || 1;

    for (let i = 0; i < eduCount; i++) {
      const inst = form.get(`education_${i}_institution`);
      if (inst) {
        education.push({
          institution: inst as string,
          degree: form.get(`education_${i}_degree`) as string,
          qualification: form.get(`education_${i}_qualification`) as string,
          fieldOfStudy: form.get(`education_${i}_fieldOfStudy`) as string,
          startYear: form.get(`education_${i}_startYear`) as string,
          endYear: form.get(`education_${i}_endYear`) as string,
          grade: form.get(`education_${i}_grade`) as string,
        });
      }
    }

    const empCount = parseInt(form.get("employmentCount") as string) || 0;
    const previousEmployment = [];
    for (let i = 0; i < empCount; i++) {
      const co = form.get(`employment_${i}_companyName`);
      if (co) {
        previousEmployment.push({
          companyName: co as string,
          employer: form.get(`employment_${i}_employer`) as string,
          position: form.get(`employment_${i}_position`) as string,
          startDate: form.get(`employment_${i}_startDate`) as string,
          endDate: form.get(`employment_${i}_endDate`) as string,
          reasonForLeaving: form.get(
            `employment_${i}_reasonForLeaving`,
          ) as string,
        });
      }
    }

    const employmentData: EmploymentData = {
      educationLevel: "Graduate", // Default or add field
      institution: education[0]?.institution || "", // Mapping for flat structure in types vs array in form
      courseOfStudy: education[0]?.fieldOfStudy || "",
      graduationYear: education[0]?.endYear || "",
      experienceYears: "0", // Add field if needed
      skills: [],
      expectations: "",
      // Extended data structure (we might need to update store types to support arrays properly if we want to be exact)
      // For now we map what fits or strict to type
      // The store type 'EmploymentData' has 'institution' (singular).
      // The form has 'education' (array).
      // I will map the first one to the singular fields to satisfy the strict type,
      // but ideally we should update the store type to `education: Education[]`.
      // I'll stick to the type definition in `applicant-store.ts` which I see has 'institution' etc.

      // Let's just store the ARRAYs in the store if I can, but I defined it as singular.
      // It's fine, I'll just map the first one.
    };

    // Simulate network
    await new Promise((resolve) => setTimeout(resolve, 500));

    updateFormData("employment", employmentData);
    completeStep(2);
    setStep(3);

    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "3";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/3`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Employment & Finance</h3>
        <p className="text-sm text-muted-foreground">
          Step 2 of 8 - Provide employment and financial information
        </p>
      </div>

      {employmentTerms && (
        <div className="space-y-4">
          <Separator />
          <h4 className="font-medium">Your Employment Terms (Mock)</h4>
          <div className="rounded-md bg-primary/5 dark:bg-primary/10 p-4 space-y-3">
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
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              name="bankName"
              required
              defaultValue={(initialData as any)?.bankDetails?.bankName || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Account Number *</Label>
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              required
              defaultValue={
                (initialData as any)?.bankDetails?.accountNumber || ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountName">Account Name</Label>
            <Input
              id="bankAccountName"
              name="bankAccountName"
              defaultValue={
                (initialData as any)?.bankDetails?.accountName || ""
              }
            />
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Educational History *</h4>
        <input type="hidden" name="educationCount" value={educationCount} />
        {Array.from({ length: educationCount }).map((_, idx) => (
          <div key={idx} className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Qualification {idx + 1}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`education_${idx}_institution`}>
                  Institution *
                </Label>
                <Input
                  name={`education_${idx}_institution`}
                  required={idx === 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`education_${idx}_degree`}>Degree</Label>
                <Input name={`education_${idx}_degree`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`education_${idx}_startYear`}>Start Year</Label>
                <Input
                  name={`education_${idx}_startYear`}
                  type="number"
                  placeholder="YYYY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`education_${idx}_endYear`}>End Year</Label>
                <Input
                  name={`education_${idx}_endYear`}
                  type="number"
                  placeholder="YYYY"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

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
