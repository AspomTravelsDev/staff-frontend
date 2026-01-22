"use client";

import { useFormContext } from "react-hook-form";
import {
  getFieldsForStep,
  shouldShowField,
  type VisaCountry,
} from "@/lib/visa/fields";
import { FormField } from "./form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StepContentProps {
  country: VisaCountry;
}

export function IdentityStep({ country }: StepContentProps) {
  const { watch } = useFormContext();
  const formValues = watch();
  const fields = getFieldsForStep(country, "identity");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity & Nationality</CardTitle>
        <CardDescription>
          Enter your personal identification details exactly as they appear in
          your passport
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          if (!shouldShowField(field, formValues)) return null;
          return (
            <FormField
              key={field.name}
              field={field}
              className={
                field.type === "textarea" || field.type === "address"
                  ? "sm:col-span-2"
                  : undefined
              }
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

export function ResidencyStep({ country }: StepContentProps) {
  const { watch } = useFormContext();
  const formValues = watch();
  const fields = getFieldsForStep(country, "residency");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Residency & Contact</CardTitle>
        <CardDescription>
          Provide your current address and contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          if (!shouldShowField(field, formValues)) return null;
          return (
            <FormField
              key={field.name}
              field={field}
              className={
                field.type === "address" || field.name.includes("address")
                  ? "sm:col-span-2"
                  : undefined
              }
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

export function DocumentsStep({ country }: StepContentProps) {
  const { watch } = useFormContext();
  const formValues = watch();
  const fields = getFieldsForStep(country, "documents");

  // Separate document upload fields
  const textFields = fields.filter((f) => f.type !== "file");
  const fileFields = fields.filter((f) => f.type === "file");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Passport Details</CardTitle>
          <CardDescription>
            Enter your passport information as shown in your travel document
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {textFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return <FormField key={field.name} field={field} />;
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Uploads</CardTitle>
          <CardDescription>
            Upload clear scans or photos of your documents
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {fileFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return <FormField key={field.name} field={field} />;
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export function EmploymentStep({ country }: StepContentProps) {
  const { watch } = useFormContext();
  const formValues = watch();
  const fields = getFieldsForStep(country, "employment");

  // Separate by type
  const statusFields = fields.filter(
    (f) =>
      ["emp_status", "job_title"].includes(f.name) ||
      f.name.startsWith("employer"),
  );
  const historyFields = fields.filter((f) => f.type === "timeline");
  const financeFields = fields.filter((f) =>
    [
      "annual_income",
      "savings_amount",
      "additional_income",
      "financial_means",
    ].includes(f.name),
  );
  const fileFields = fields.filter((f) => f.type === "file");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Employment</CardTitle>
          <CardDescription>
            Provide details about your current employment status
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {statusFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return (
              <FormField
                key={field.name}
                field={field}
                className={
                  field.type === "address" ? "sm:col-span-2" : undefined
                }
              />
            );
          })}
        </CardContent>
      </Card>

      {historyFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employment & Education History</CardTitle>
            <CardDescription>
              List your employment and education history for the required period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {historyFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return <FormField key={field.name} field={field} />;
            })}
          </CardContent>
        </Card>
      )}

      {financeFields.filter((f) => shouldShowField(f, formValues)).length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>
              Provide details about your financial means
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {financeFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return (
                <FormField
                  key={field.name}
                  field={field}
                  className={
                    field.type === "textarea" ? "sm:col-span-2" : undefined
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {fileFields.filter((f) => shouldShowField(f, formValues)).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supporting Documents</CardTitle>
            <CardDescription>
              Upload employment and financial documents
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            {fileFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return <FormField key={field.name} field={field} />;
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function FamilyStep({ country }: StepContentProps) {
  const { watch } = useFormContext();
  const formValues = watch();
  const fields = getFieldsForStep(country, "family");

  // Group fields
  const parentFields = fields.filter(
    (f) => f.name.includes("father") || f.name.includes("mother"),
  );
  const spouseFields = fields.filter((f) => f.name.includes("spouse"));
  const otherFields = fields.filter(
    (f) =>
      !f.name.includes("father") &&
      !f.name.includes("mother") &&
      !f.name.includes("spouse"),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parent Information</CardTitle>
          <CardDescription>Provide details about your parents</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {parentFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return <FormField key={field.name} field={field} />;
          })}
        </CardContent>
      </Card>

      {spouseFields.filter((f) => shouldShowField(f, formValues)).length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spouse / Partner Information</CardTitle>
            <CardDescription>
              Provide details about your spouse or partner
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {spouseFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return <FormField key={field.name} field={field} />;
            })}
          </CardContent>
        </Card>
      )}

      {otherFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Family Information</CardTitle>
            <CardDescription>
              Additional family-related questions
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {otherFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return (
                <FormField
                  key={field.name}
                  field={field}
                  className={
                    field.type === "timeline" || field.type === "textarea"
                      ? "sm:col-span-2"
                      : undefined
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function TripStep({ country }: StepContentProps) {
  const { watch } = useFormContext();
  const formValues = watch();
  const fields = getFieldsForStep(country, "trip");

  // Group fields
  const dateFields = fields.filter((f) =>
    [
      "arrival_date",
      "departure_date",
      "purpose_main",
      "purpose_details",
    ].includes(f.name),
  );
  const inviterFields = fields.filter(
    (f) => f.name.startsWith("inviter") || f.name === "has_inviter",
  );
  const accommodationFields = fields.filter((f) =>
    f.name.startsWith("accommodation"),
  );
  const schengenFields = fields.filter((f) =>
    ["first_entry_state", "entries_requested"].includes(f.name),
  );
  const ukFields = fields.filter((f) => f.name === "trip_description");
  const fileFields = fields.filter((f) => f.type === "file");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Travel Dates & Purpose</CardTitle>
          <CardDescription>
            When are you planning to travel and why?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {dateFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return (
              <FormField
                key={field.name}
                field={field}
                className={
                  field.type === "textarea" ? "sm:col-span-2" : undefined
                }
              />
            );
          })}
          {schengenFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return <FormField key={field.name} field={field} />;
          })}
          {ukFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return (
              <FormField
                key={field.name}
                field={field}
                className="sm:col-span-2"
              />
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Host / Inviter Information</CardTitle>
          <CardDescription>
            Do you have someone inviting or hosting you?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {inviterFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return (
              <FormField
                key={field.name}
                field={field}
                className={
                  field.type === "address" ? "sm:col-span-2" : undefined
                }
              />
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accommodation</CardTitle>
          <CardDescription>
            Where will you be staying during your visit?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {accommodationFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return (
              <FormField
                key={field.name}
                field={field}
                className={
                  field.type === "address" ? "sm:col-span-2" : undefined
                }
              />
            );
          })}
        </CardContent>
      </Card>

      {fileFields.filter((f) => shouldShowField(f, formValues)).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Travel Documents</CardTitle>
            <CardDescription>
              Upload your travel-related documents
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            {fileFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return <FormField key={field.name} field={field} />;
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function HistoryStep({ country }: StepContentProps) {
  const { watch } = useFormContext();
  const formValues = watch();
  const fields = getFieldsForStep(country, "history");

  // Group fields
  const refusalFields = fields.filter((f) => f.name.includes("refusal"));
  const travelFields = fields.filter(
    (f) =>
      f.name.includes("travel") ||
      f.name.includes("eea") ||
      f.name.includes("five_eyes"),
  );
  const securityFields = fields.filter(
    (f) =>
      f.name.includes("criminal") ||
      f.name.includes("security") ||
      f.name.includes("immigration_breach"),
  );
  const schengenFields = fields.filter(
    (f) => f.name.includes("fingerprint") || f.name.includes("schengen_visa"),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visa Refusal History</CardTitle>
          <CardDescription>Have you ever been refused a visa?</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {refusalFields.map((field) => {
            if (!shouldShowField(field, formValues)) return null;
            return (
              <FormField
                key={field.name}
                field={field}
                className={
                  field.type === "textarea" ? "sm:col-span-2" : undefined
                }
              />
            );
          })}
        </CardContent>
      </Card>

      {travelFields.filter((f) => shouldShowField(f, formValues)).length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>Travel History</CardTitle>
            <CardDescription>Your international travel history</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {travelFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return (
                <FormField
                  key={field.name}
                  field={field}
                  className={
                    field.type === "timeline" || field.type === "textarea"
                      ? "sm:col-span-2"
                      : undefined
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {securityFields.filter((f) => shouldShowField(f, formValues)).length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>Security & Background</CardTitle>
            <CardDescription>
              Please answer the following security questions honestly
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {securityFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return (
                <FormField
                  key={field.name}
                  field={field}
                  className={
                    field.type === "textarea" ? "sm:col-span-2" : undefined
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {schengenFields.filter((f) => shouldShowField(f, formValues)).length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Schengen Applications</CardTitle>
            <CardDescription>
              Previous Schengen visa and biometrics information
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {schengenFields.map((field) => {
              if (!shouldShowField(field, formValues)) return null;
              return <FormField key={field.name} field={field} />;
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
