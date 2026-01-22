"use client";

import { useEffect, useCallback, useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconLoader2,
  IconCheck,
  IconArrowLeft,
  IconArrowRight,
  IconDeviceFloppy,
} from "@tabler/icons-react";

import type { VisaCountry } from "@/lib/visa/fields";
import { getStepsForCountry } from "@/lib/visa/fields";
import { createStepSchema } from "@/lib/validations/visa";
import {
  useVisaFormStore,
  type VisaFormData,
} from "@/lib/stores/visa-form-store";

import { Button } from "@/components/ui/button";
import { StepIndicator } from "./step-indicator";
import {
  IdentityStep,
  ResidencyStep,
  DocumentsStep,
  EmploymentStep,
  FamilyStep,
  TripStep,
  HistoryStep,
} from "./step-content";
import { ReviewStep } from "./review-step";
import { saveDraft, submitApplication } from "../actions";

interface VisaFormWrapperProps {
  applicationId: string;
  country: VisaCountry;
  initialData?: Partial<VisaFormData>;
  initialStep?: number;
}

export function VisaFormWrapper({
  applicationId,
  country,
  initialData = {},
  initialStep = 1,
}: VisaFormWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    currentStep,
    formData,
    initializeApplication,
    setStep,
    nextStep,
    prevStep,
    updateFields,
    markAsSaved,
  } = useVisaFormStore();

  const steps = getStepsForCountry(country);
  const currentStepId = steps[currentStep - 1]?.id;
  const isLastStep = currentStep === steps.length;
  const isReviewStep = currentStep === steps.length + 1;

  // Get the appropriate schema for current step
  const stepSchema = currentStepId
    ? createStepSchema(country, currentStepId)
    : undefined;

  // Initialize form with react-hook-form
  const methods = useForm<VisaFormData>({
    resolver: stepSchema ? zodResolver(stepSchema) : undefined,
    defaultValues: formData,
    mode: "onBlur",
  });

  const { handleSubmit, watch, reset, formState } = methods;

  // Initialize application in store on mount
  useEffect(() => {
    // Check if we need to initialize or load from server
    const storeId = useVisaFormStore.getState().applicationId;
    const storeCountry = useVisaFormStore.getState().country;
    const storeFormData = useVisaFormStore.getState().formData;

    if (storeId !== applicationId || storeCountry !== country) {
      // New application or different one - initialize with server data
      initializeApplication(applicationId, country, initialData);
      reset(initialData);
      setStep(initialStep);
    } else {
      // Same application - merge server data with local (local takes precedence for drafts)
      const mergedData = { ...initialData, ...storeFormData };
      reset(mergedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, country]);

  // Sync form values to Zustand store
  useEffect(() => {
    const subscription = watch((values) => {
      updateFields(values as Partial<VisaFormData>);
    });
    return () => subscription.unsubscribe();
  }, [watch, updateFields]);

  // Auto-save draft on step change or after inactivity
  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const result = await saveDraft(
        applicationId,
        country,
        currentStep,
        formData,
      );
      if (result.success) {
        markAsSaved();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, country, currentStep, formData, markAsSaved]);

  // Auto-save on step change
  useEffect(() => {
    const storeFormData = useVisaFormStore.getState().formData;
    const timeoutId = setTimeout(() => {
      if (Object.keys(storeFormData).length > 0) {
        handleSaveDraft();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Handle next step
  const handleNext = handleSubmit(async () => {
    // Save current progress
    await handleSaveDraft();

    if (isLastStep) {
      // Go to review step
      setStep(steps.length + 1);
    } else {
      nextStep();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Handle previous step
  const handlePrev = () => {
    prevStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle final submission
  const handleFinalSubmit = async () => {
    setSubmitError(null);

    startTransition(async () => {
      const result = await submitApplication(applicationId, country, formData);

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setSubmitError(result.error || "Failed to submit application");
      }
    });
  };

  // Navigate to specific step
  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Render success state
  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-6 flex size-20 items-center justify-center rounded-full">
          <IconCheck className="size-10" />
        </div>
        <h1 className="mb-3 text-3xl font-bold">Application Submitted!</h1>
        <p className="text-muted-foreground mb-6">
          Your visa application has been successfully submitted. You will
          receive a confirmation email shortly.
        </p>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Application ID:</span>{" "}
            <code className="bg-background rounded px-2 py-1 font-mono">
              {applicationId}
            </code>
          </p>
        </div>
        <p className="text-muted-foreground mt-6 text-sm">
          Please save your application ID for future reference. You can use it
          to check the status of your application.
        </p>
      </div>
    );
  }

  // Get country display name
  const countryNames: Record<VisaCountry, string> = {
    canada: "Canada",
    uk: "United Kingdom",
    schengen: "Schengen",
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">
          {countryNames[country]} Visa Application
        </h1>
        <p className="text-muted-foreground mt-1">
          Application ID:{" "}
          <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
            {applicationId}
          </code>
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator
          country={country}
          currentStep={Math.min(currentStep, steps.length)}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleNext}>
          {/* Step content */}
          <div className="mb-8">
            {isReviewStep ? (
              <ReviewStep country={country} formData={formData} />
            ) : (
              currentStepId && (
                <>
                  {currentStepId === "identity" && (
                    <IdentityStep country={country} />
                  )}
                  {currentStepId === "residency" && (
                    <ResidencyStep country={country} />
                  )}
                  {currentStepId === "documents" && (
                    <DocumentsStep country={country} />
                  )}
                  {currentStepId === "employment" && (
                    <EmploymentStep country={country} />
                  )}
                  {currentStepId === "family" && (
                    <FamilyStep country={country} />
                  )}
                  {currentStepId === "trip" && <TripStep country={country} />}
                  {currentStepId === "history" && (
                    <HistoryStep country={country} />
                  )}
                </>
              )
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t pt-6">
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePrev}>
                  <IconArrowLeft className="mr-2 size-4" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Save status indicator */}
              <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                {saveStatus === "saving" && (
                  <>
                    <IconLoader2 className="size-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <IconCheck className="text-primary size-4" />
                    <span>Saved</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <span className="text-destructive">Save failed</span>
                )}
              </div>

              {/* Manual save button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                <IconDeviceFloppy className="mr-2 size-4" />
                Save Draft
              </Button>

              {/* Next/Submit button */}
              {isReviewStep ? (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isPending}
                  className="min-w-35"
                >
                  {isPending ? (
                    <>
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <IconCheck className="mr-2 size-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              ) : (
                <Button type="submit" disabled={formState.isSubmitting}>
                  {isLastStep ? "Review Application" : "Next"}
                  <IconArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="bg-destructive/10 text-destructive mt-4 rounded-lg p-4 text-sm">
              {submitError}
            </div>
          )}
        </form>
      </FormProvider>
    </div>
  );
}
