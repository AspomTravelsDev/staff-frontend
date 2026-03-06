"use client";

import { useState } from "react";
import { IconCheck, IconEdit, IconFile } from "@tabler/icons-react";

import type { VisaCountry, FormStep } from "@/lib/visa/fields";
import {
  FORM_STEPS,
  getFieldsForStep,
  getFieldByName,
} from "@/lib/visa/fields";
import type { VisaFormData } from "@/lib/stores/visa-form-store";
import type {
  AddressInput,
  TimelineEntry,
  UploadedFile,
} from "@/lib/validations/visa";
import { formatLagosDate } from "@/lib/utils/attendance";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ReviewStepProps {
  country: VisaCountry;
  formData: VisaFormData;
  onEditStep?: (step: number) => void;
}

export function ReviewStep({ country, formData, onEditStep }: ReviewStepProps) {
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const formatValue = (value: unknown, fieldName: string): React.ReactNode => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground italic">Not provided</span>;
    }

    // Handle dates
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return formatLagosDate(value);
      } catch {
        return value;
      }
    }

    // Handle addresses
    if (typeof value === "object" && "street" in (value as object)) {
      const addr = value as AddressInput;
      const parts = [
        addr.street,
        addr.city,
        addr.state,
        addr.postal_code,
        addr.country,
      ].filter(Boolean);
      return (
        parts.join(", ") || (
          <span className="text-muted-foreground italic">Not provided</span>
        )
      );
    }

    // Handle file uploads
    if (Array.isArray(value) && value.length > 0 && "name" in value[0]) {
      const files = value as UploadedFile[];
      return (
        <div className="space-y-1">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-2 text-sm">
              <IconFile className="size-4" />
              <span>{file.name}</span>
            </div>
          ))}
        </div>
      );
    }

    // Handle timeline entries
    if (Array.isArray(value) && value.length > 0 && "id" in value[0]) {
      const entries = value as TimelineEntry[];
      return (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const summary = [
              entry.activity_type,
              entry.organization || entry.institution,
              entry.position || entry.field_of_study,
              entry.country,
              entry.child_name,
            ]
              .filter(Boolean)
              .join(" • ");

            const dates =
              entry.start_date && entry.end_date
                ? `${formatLagosDate(entry.start_date as string)} – ${formatLagosDate(entry.end_date as string)}`
                : entry.entry_date && entry.exit_date
                  ? `${formatLagosDate(entry.entry_date as string)} – ${formatLagosDate(entry.exit_date as string)}`
                  : null;

            return (
              <div
                key={entry.id}
                className="bg-muted/50 rounded-md p-2 text-sm"
              >
                <div className="font-medium">
                  {summary || `Entry ${index + 1}`}
                </div>
                {dates && (
                  <div className="text-muted-foreground text-xs">{dates}</div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Handle simple arrays
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // Handle booleans
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    // Get label for select/radio values
    const field = getFieldByName(fieldName);
    if (field?.options) {
      const option = field.options.find((o) => o.value === value);
      if (option) return option.label;
    }

    return String(value);
  };

  const renderStepReview = (
    step: (typeof FORM_STEPS)[number],
    stepIndex: number,
  ) => {
    const fields = getFieldsForStep(country, step.id as FormStep);
    const filledFields = fields.filter((f) => {
      const value = formData[f.name];
      return value !== undefined && value !== null && value !== "";
    });

    if (filledFields.length === 0) {
      return null;
    }

    return (
      <Card key={step.id}>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">{step.label}</CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </div>
          {onEditStep && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(stepIndex + 1)}
            >
              <IconEdit className="mr-1.5 size-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {filledFields.map((field) => (
              <div
                key={field.name}
                className={
                  field.type === "address" ||
                  field.type === "timeline" ||
                  field.type === "textarea"
                    ? "sm:col-span-2"
                    : undefined
                }
              >
                <dt className="text-muted-foreground text-xs font-medium">
                  {field.label}
                </dt>
                <dd className="mt-0.5 text-sm">
                  {formatValue(formData[field.name], field.name)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Review header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCheck className="text-primary size-5" />
            Review Your Application
          </CardTitle>
          <CardDescription>
            Please review all the information you have provided before
            submitting your application. Make sure all details are accurate and
            complete.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step reviews */}
      {FORM_STEPS.map((step, index) => renderStepReview(step, index))}

      {/* Declaration */}
      <Card>
        <CardHeader>
          <CardTitle>Declaration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="mb-3">
              I hereby declare that the information provided in this application
              is true, complete, and accurate to the best of my knowledge. I
              understand that:
            </p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>
                Providing false or misleading information may result in the
                refusal of my visa application
              </li>
              <li>
                I may be required to provide additional documentation to support
                my application
              </li>
              <li>
                The submission of this application does not guarantee the
                issuance of a visa
              </li>
              <li>
                Processing times may vary depending on the volume of
                applications and completeness of documentation
              </li>
            </ul>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Checkbox
              id="declaration"
              checked={declarationAccepted}
              onCheckedChange={(checked) =>
                setDeclarationAccepted(checked === true)
              }
            />
            <Label
              htmlFor="declaration"
              className="cursor-pointer text-sm leading-relaxed"
            >
              I have read and understood the declaration above. I confirm that
              all information provided is true and accurate, and I consent to
              the processing of my personal data for the purpose of this visa
              application.
            </Label>
          </div>

          {!declarationAccepted && (
            <p className="text-destructive text-xs">
              You must accept the declaration before submitting your application
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
