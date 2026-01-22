"use client";

import {
  IconUser,
  IconHome,
  IconFileText,
  IconBriefcase,
  IconUsers,
  IconPlane,
  IconHistory,
} from "@tabler/icons-react";

import type { ApplicationDetail } from "../../queries";
import { FORM_STEPS } from "@/lib/visa/fields";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ApplicationDetailViewProps {
  application: ApplicationDetail;
}

const STEP_ICONS = [
  IconUser,
  IconHome,
  IconFileText,
  IconBriefcase,
  IconUsers,
  IconPlane,
  IconHistory,
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const COUNTRY_LABELS: Record<string, string> = {
  canada: "Canada Visa",
  uk: "UK Standard Visitor Visa",
  schengen: "Schengen Visa",
};

// Field display mapping
const FIELD_LABELS: Record<string, string> = {
  given_names: "Given Names",
  surname: "Surname",
  email_address: "Email Address",
  dob: "Date of Birth",
  gender: "Gender",
  place_of_birth_city: "Place of Birth (City)",
  place_of_birth_country: "Place of Birth (Country)",
  current_nationality: "Current Nationality",
  nationality_at_birth: "Nationality at Birth",
  other_nationalities: "Other Nationalities",
  national_id_number: "National ID Number",
  passport_number: "Passport Number",
  passport_issue_date: "Passport Issue Date",
  passport_expiry_date: "Passport Expiry Date",
  passport_issuing_authority: "Passport Issuing Authority",
  marital_status: "Marital Status",
  phone_number: "Phone Number",
  current_address: "Current Address",
  address_duration: "Duration at Address",
  correspondence_address_same: "Same Correspondence Address",
  correspondence_address: "Correspondence Address",
  uk_national_insurance: "UK National Insurance Number",
  current_occupation: "Current Occupation",
  employer_name: "Employer Name",
  employer_address: "Employer Address",
  employer_phone: "Employer Phone",
  job_title: "Job Title",
  annual_income: "Annual Income",
  employment_start_date: "Employment Start Date",
  spouse_name: "Spouse Name",
  spouse_dob: "Spouse Date of Birth",
  spouse_nationality: "Spouse Nationality",
  spouse_passport_number: "Spouse Passport Number",
  father_name: "Father's Name",
  father_dob: "Father's Date of Birth",
  father_nationality: "Father's Nationality",
  mother_name: "Mother's Name",
  mother_dob: "Mother's Date of Birth",
  mother_nationality: "Mother's Nationality",
  dependents: "Number of Dependents",
  travel_purpose: "Purpose of Travel",
  intended_arrival_date: "Intended Arrival Date",
  intended_departure_date: "Intended Departure Date",
  accommodation_type: "Accommodation Type",
  accommodation_address: "Accommodation Address",
  host_name: "Host Name",
  host_relationship: "Relationship to Host",
  host_address: "Host Address",
  trip_funding_source: "Trip Funding Source",
  estimated_travel_cost: "Estimated Travel Cost",
  previous_uk_visa: "Previous UK Visa",
  previous_refusals: "Previous Visa Refusals",
  criminal_convictions: "Criminal Convictions",
  travel_history_10_years: "Travel History (10 Years)",
  address_history_10_years: "Address History (10 Years)",
};

export function ApplicationDetailView({
  application,
}: ApplicationDetailViewProps) {
  const { data, status, country, current_step } = application;

  // Determine which steps have data
  const stepsWithData = FORM_STEPS.map((step, index) => {
    const stepNumber = index + 1;
    return {
      name: step.label,
      number: stepNumber,
      Icon: STEP_ICONS[index],
      completed: stepNumber < current_step,
      current: stepNumber === current_step,
    };
  });

  // Group data by steps (simplified view)
  const renderValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined || value === "") {
      return "Not provided";
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return "None";
      // For timeline entries
      if (value[0] && typeof value[0] === "object" && "from" in value[0]) {
        return `${value.length} entries`;
      }
      return value.join(", ");
    }
    if (typeof value === "object") {
      // For address objects
      const addr = value as Record<string, string>;
      const parts = [
        addr.line1,
        addr.line2,
        addr.city,
        addr.state,
        addr.postal_code,
        addr.country,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "Not provided";
    }
    return String(value);
  };

  // Convert data to array of entries for display
  const dataEntries = Object.entries(data as Record<string, unknown>).filter(
    ([, value]) => value !== undefined,
  );

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Visa Type</p>
              <p className="font-medium">{COUNTRY_LABELS[country]}</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "px-3 py-1 text-sm capitalize",
              STATUS_COLORS[status],
            )}
          >
            {status}
          </Badge>
        </CardContent>
      </Card>

      {/* Step progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form Progress</CardTitle>
          <CardDescription>
            {status === "submitted"
              ? "Application submitted"
              : `Currently on step ${String(current_step)} of ${FORM_STEPS.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {stepsWithData.map((step, idx: number) => (
              <div key={step.name} className="flex items-center">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2",
                    step.completed &&
                      "border-green-500 bg-green-500 text-white",
                    step.current && "border-blue-500 bg-blue-500 text-white",
                    !step.completed &&
                      !step.current &&
                      "border-muted-foreground/30",
                  )}
                >
                  <step.Icon className="size-4" />
                </div>
                {idx < stepsWithData.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 w-4 sm:w-8",
                      step.completed ? "bg-green-500" : "bg-muted",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Application data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Data</CardTitle>
          <CardDescription>
            Information provided by the applicant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataEntries.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No data has been submitted yet
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dataEntries.map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium">
                    {FIELD_LABELS[key] || key.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm">{renderValue(key, value)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline entries if present */}
      {data.travel_history_10y &&
        Array.isArray(data.travel_history_10y) &&
        data.travel_history_10y.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Travel History</CardTitle>
              <CardDescription>
                Countries visited in the last 10 years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.travel_history_10y.map((entry, idx: number) => (
                  <div
                    key={idx}
                    className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {entry.country || entry.city || "Unknown"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {entry.purpose || ""}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {String(entry.entry_date || entry.start_date || "")} —{" "}
                      {String(entry.exit_date || entry.end_date || "")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Employment history if present */}
      {data.emp_history_10yr &&
        Array.isArray(data.emp_history_10yr) &&
        data.emp_history_10yr.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment History</CardTitle>
              <CardDescription>
                Previous employment in the last 10 years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.emp_history_10yr.map((entry, idx: number) => (
                  <div
                    key={idx}
                    className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {entry.position || entry.organization || "Unknown"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {entry.organization && entry.city
                          ? `${entry.organization}, ${entry.city}`
                          : entry.organization || entry.city || ""}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {String(entry.start_date || "")} —{" "}
                      {String(entry.end_date || "")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
