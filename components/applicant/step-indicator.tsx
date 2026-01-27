"use client";

import { useApplicantStore } from "@/lib/store/applicant-store";

export function StepIndicator() {
  const currentStep = useApplicantStore((state) => state.currentStep);
  const steps = [
    { number: 1, label: "Personal" },
    { number: 2, label: "Employment" },
    { number: 3, label: "Legal" },
    { number: 4, label: "Guarantors" },
    { number: 5, label: "Referee" },
    { number: 6, label: "Media" },
    { number: 7, label: "Download" },
    { number: 8, label: "Upload Signed" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center">
            {/* Step Circle */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full font-medium text-sm transition-colors duration-200 ${
                step.number < currentStep
                  ? "bg-green-500 text-white"
                  : step.number === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {step.number < currentStep ? "✓" : step.number}
            </div>

            {/* Step Label */}
            <span
              className={`mt-2 text-xs font-medium text-center hidden sm:block ${
                step.number <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
      {/* Progress Bar (Mobile) */}
      <div className="mt-4 h-2 w-full rounded-full bg-gray-100 sm:hidden">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
