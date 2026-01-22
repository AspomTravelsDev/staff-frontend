"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconLoader2,
  IconCopy,
  IconCheck,
  IconExternalLink,
} from "@tabler/icons-react";

import type { VisaCountry } from "@/lib/visa/fields";
import { getPrefillableFields } from "@/lib/visa/fields";
import type { VisaFormData } from "@/lib/stores/visa-form-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createApplication } from "../actions";

const COUNTRIES: { value: VisaCountry; label: string }[] = [
  { value: "canada", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "schengen", label: "Schengen" },
];

export function CreateApplicationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdApplication, setCreatedApplication] = useState<{
    id: string;
    publicUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [country, setCountry] = useState<VisaCountry | "">("");
  const [prefillData, setPrefillData] = useState<Partial<VisaFormData>>({});

  const prefillableFields = getPrefillableFields();

  const handlePrefillChange = (name: string, value: string) => {
    setPrefillData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!country) {
      setError("Please select a destination country");
      return;
    }

    // Generate UUID on client
    const applicationId = crypto.randomUUID();

    startTransition(async () => {
      const result = await createApplication(
        applicationId,
        country,
        prefillData,
      );

      if (result.success && result.data) {
        setCreatedApplication(result.data);
      } else {
        setError(result.error || "Failed to create application");
      }
    });
  };

  const handleCopyLink = async () => {
    if (!createdApplication) return;

    try {
      await navigator.clipboard.writeText(createdApplication.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = createdApplication.publicUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateAnother = () => {
    setCreatedApplication(null);
    setCountry("");
    setPrefillData({});
  };

  // Show success state
  if (createdApplication) {
    return (
      <Card>
        <CardHeader>
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <IconCheck className="size-6" />
          </div>
          <CardTitle className="text-center">Application Created!</CardTitle>
          <CardDescription className="text-center">
            Share the link below with your client to complete their visa
            application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Application ID</Label>
            <code className="bg-muted block rounded-md p-3 text-sm">
              {createdApplication.id}
            </code>
          </div>

          <div className="space-y-2">
            <Label>Public Application Link</Label>
            <div className="flex gap-2">
              <Input
                value={createdApplication.publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button type="button" variant="outline" onClick={handleCopyLink}>
                {copied ? (
                  <IconCheck className="size-4" />
                ) : (
                  <IconCopy className="size-4" />
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <a
                  href={createdApplication.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconExternalLink className="size-4" />
                </a>
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              This link can be shared with the applicant to complete their form
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCreateAnother}
            >
              Create Another
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => router.push("/visa/applications")}
            >
              View All Applications
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Country selection */}
        <Card>
          <CardHeader>
            <CardTitle>Destination Country</CardTitle>
            <CardDescription>
              Select the country the client is applying for a visa to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={country}
              onValueChange={(v) => setCountry(v as VisaCountry)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Pre-fill fields (optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Pre-fill Information (Optional)</CardTitle>
            <CardDescription>
              Pre-fill known information to save the applicant time. All fields
              are optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {prefillableFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name} className="text-sm">
                  {field.label}
                </Label>
                <Input
                  id={field.name}
                  type={field.type === "email" ? "email" : "text"}
                  value={(prefillData[field.name] as string) || ""}
                  onChange={(e) =>
                    handlePrefillChange(field.name, e.target.value)
                  }
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !country}
        >
          {isPending ? (
            <>
              <IconLoader2 className="mr-2 size-4 animate-spin" />
              Creating Application...
            </>
          ) : (
            "Create Application"
          )}
        </Button>
      </div>
    </form>
  );
}
