"use client";

export function StepIndicator({ currentStep }: { currentStep: number }) {
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
              className={`flex h-10 w-10 items-center justify-center rounded-full font-medium text-sm ${
                step.number < currentStep
                  ? "bg-green-500 text-white"
                  : step.number === currentStep
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step.number < currentStep ? "✓" : step.number}
            </div>

            {/* Step Label */}
            <span
              className={`mt-2 text-xs font-medium ${
                step.number <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>

            {/* Connector Line */}
            {/* {index < steps.length - 1 && (
              <div
                className={`absolute top-5 h-0.5 w-16 ${
                  step.number < currentStep ? "bg-green-500" : "bg-gray-200"
                }`}
                style={{
                  left: `calc(50% + 2rem)`,
                }}
              />
            )} */}
          </div>
        ))}
      </div>
    </div>
  );
}
