import { notFound } from "next/navigation";
import { getPublicApplication } from "@/lib/api/hr";
import { StepIndicator } from "../components/step-indicator";
import { Step1Personal } from "../components/step-1-personal";
import { Step2Employment } from "../components/step-2-employment";
import { Step3Legal } from "../components/step-3-legal";
import { Step4Guarantors } from "../components/step-4-guarantors";
import { Step5Referee } from "../components/step-5-referee";
import { Step6Media } from "../components/step-6-media";
import { Step7Documents } from "../components/step-7-documents";
import { Step8UploadSigned } from "../components/step-8-upload-signed";
import { RequiredSignedAssetDocument } from "@/lib/types/hr";

export default async function ApplicantStepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>;
}) {
  const { id, step } = await params;
  const stepNumber = parseInt(step);

  // Validate step is between 1-8
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
    notFound();
  }

  let application;

  try {
    application = await getPublicApplication(id);
  } catch (error) {
    notFound();
  }

  if (!application) {
    notFound();
  }

  const formData = (application.form_data || {}) as any;
  const requiredAssetDocuments =
    (application.required_signed_assets as
      | RequiredSignedAssetDocument[]
      | undefined) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-card text-card-foreground p-6 shadow-sm border">
        <h2 className="text-2xl font-bold">{application.position_title}</h2>
        <p className="text-muted-foreground">
          Applicant ID: {application.application_id}
        </p>
        <p className="text-sm text-muted-foreground">
          Email: {application.applicant_email}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="relative">
        <StepIndicator currentStep={stepNumber} />
      </div>

      <div className="rounded-lg bg-card text-card-foreground p-6 shadow-sm border">
        {stepNumber === 1 && (
          <Step1Personal applicationId={id} initialData={formData.personal} />
        )}
        {stepNumber === 2 && (
          <Step2Employment
            applicationId={id}
            initialData={formData.employmentFinance}
            employmentTerms={formData.employment_terms}
          />
        )}
        {stepNumber === 3 && (
          <Step3Legal applicationId={id} initialData={formData.legal} />
        )}
        {stepNumber === 4 && (
          <Step4Guarantors
            applicationId={id}
            initialData={formData.guarantorReferee}
          />
        )}
        {stepNumber === 5 && (
          <Step5Referee
            applicationId={id}
            initialData={formData.guarantorReferee}
          />
        )}
        {stepNumber === 6 && (
          <Step6Media applicationId={id} initialData={formData.media} />
        )}
        {stepNumber === 7 && (
          <Step7Documents
            applicationId={id}
            initialData={formData.media}
            requiredAssetDocuments={requiredAssetDocuments}
          />
        )}
        {stepNumber === 8 && (
          <Step8UploadSigned
            applicationId={id}
            initialData={formData.signedDocuments}
            requiredAssetDocuments={requiredAssetDocuments}
          />
        )}
      </div>
    </div>
  );
}
