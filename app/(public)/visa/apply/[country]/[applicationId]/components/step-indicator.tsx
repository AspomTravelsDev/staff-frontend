"use client";

import { cn } from "@/lib/utils";
import { type VisaCountry, getStepsForCountry } from "@/lib/visa/fields";
import { IconCheck } from "@tabler/icons-react";

interface StepIndicatorProps {
  country: VisaCountry;
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (step: number) => void;
  className?: string;
}

export function StepIndicator({
  country,
  currentStep,
  completedSteps = [],
  onStepClick,
  className,
}: StepIndicatorProps) {
  const steps = getStepsForCountry(country);

  return (
    <nav className={cn("w-full", className)} aria-label="Form progress">
      {/* Desktop view - horizontal */}
      <ol className="hidden md:flex md:items-center md:gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted =
            completedSteps.includes(stepNumber) || stepNumber < currentStep;
          const isClickable =
            onStepClick && (isCompleted || stepNumber <= currentStep);

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                disabled={!isClickable}
                className={cn(
                  "group flex w-full flex-col items-center gap-1",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default",
                )}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                    isActive &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted &&
                      !isActive &&
                      "border-primary bg-primary text-primary-foreground",
                    !isActive &&
                      !isCompleted &&
                      "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {isCompleted && !isActive ? (
                    <IconCheck className="size-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {/* Step label */}
                <span
                  className={cn(
                    "text-center text-xs transition-colors",
                    isActive && "text-foreground font-medium",
                    isCompleted && !isActive && "text-foreground",
                    !isActive && !isCompleted && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    stepNumber < currentStep
                      ? "bg-primary"
                      : "bg-muted-foreground/20",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile view - compact */}
      <div className="md:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-muted-foreground text-sm">
            {steps[currentStep - 1]?.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="mt-2 flex justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick?.(stepNumber)}
                disabled={stepNumber > currentStep}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  isActive && "bg-primary",
                  isCompleted && "bg-primary/60",
                  !isActive && !isCompleted && "bg-muted-foreground/30",
                )}
                aria-label={`Go to ${step.label}`}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Compact version for sidebar/narrow layouts
export function StepIndicatorCompact({
  country,
  currentStep,
  completedSteps = [],
  onStepClick,
  className,
}: StepIndicatorProps) {
  const steps = getStepsForCountry(country);

  return (
    <nav className={cn("w-full", className)} aria-label="Form progress">
      <ol className="space-y-1">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted =
            completedSteps.includes(stepNumber) || stepNumber < currentStep;
          const isClickable =
            onStepClick && (isCompleted || stepNumber <= currentStep);

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                disabled={!isClickable}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  isActive && "bg-primary/10 text-primary",
                  isCompleted && !isActive && "text-foreground hover:bg-muted",
                  !isActive && !isCompleted && "text-muted-foreground",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    isActive &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted &&
                      !isActive &&
                      "border-primary bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "border-muted-foreground/30",
                  )}
                >
                  {isCompleted && !isActive ? (
                    <IconCheck className="size-3" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{step.label}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {step.description}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
