"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect } from "react";
import { useApplicantStore } from "@/lib/store/applicant-store";
import { StepIndicator } from "@/components/applicant/step-indicator";
import { Step1Personal } from "@/components/applicant/step-1-personal";
import { Step2Employment } from "@/components/applicant/step-2-employment";
import { Step3Legal } from "@/components/applicant/step-3-legal";
import { Step4Guarantors } from "@/components/applicant/step-4-guarantors";
import { Step5Referee } from "@/components/applicant/step-5-referee";
import { Step6Media } from "@/components/applicant/step-6-media";
import { Step7Documents } from "@/components/applicant/step-7-documents";
import { Step8UploadSigned } from "@/components/applicant/step-8-upload-signed";
import { Card, CardContent } from "@/components/ui/card";

export default function ApplicantStepPage() {
  const params = useParams();
  const step = params.step as string;
  const stepNumber = parseInt(step);
  const { setStep } = useApplicantStore();

  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
    notFound();
  }

  // Sync store with URL
  useEffect(() => {
    setStep(stepNumber);
  }, [stepNumber, setStep]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Software Engineer Application</h1>
        <p className="text-muted-foreground">Application ID: {params.id}</p>
      </div>

      {/* Step Indicator */}
      <div className="relative">
        <StepIndicator />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {stepNumber === 1 && <Step1Personal />}
          {stepNumber === 2 && <Step2Employment />}
          {stepNumber === 3 && <Step3Legal />}
          {stepNumber === 4 && <Step4Guarantors />}
          {stepNumber === 5 && <Step5Referee />}
          {stepNumber === 6 && <Step6Media />}
          {stepNumber === 7 && <Step7Documents />}
          {stepNumber === 8 && <Step8UploadSigned />}
        </CardContent>
      </Card>
    </div>
  );
}
