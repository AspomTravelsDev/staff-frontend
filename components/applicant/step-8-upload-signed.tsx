"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicantStore } from "@/lib/store/applicant-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function Step8UploadSigned() {
  const router = useRouter();
  const { setStep, completeStep, resetForm } = useApplicantStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [files, setFiles] = useState<{
    g1: boolean;
    g2: boolean;
    ref: boolean;
  }>({
    g1: false,
    g2: false,
    ref: false,
  });

  const handleFileChange =
    (key: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        setFiles((prev) => ({ ...prev, [key]: true }));
      }
    };

  const handleBack = () => {
    setStep(7);
    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "7";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/7`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSuccess(true);
    completeStep(8);
    // Optional: resetForm() or redirect to a thank you page
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl">
          ✓
        </div>
        <h2 className="text-2xl font-bold">Application Submitted!</h2>
        <p className="text-muted-foreground">
          Thank you for applying. We will review your application and get back
          to you shortly.
        </p>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Upload Signed Documents</h3>
        <p className="text-sm text-muted-foreground">
          Step 8 of 8 - Upload the signed forms
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <Label>Signed Guarantor 1 Form *</Label>
          <input
            type="file"
            required
            className="block w-full mt-2 text-sm"
            onChange={handleFileChange("g1")}
          />
        </div>
        <div className="rounded-lg border p-4">
          <Label>Signed Guarantor 2 Form *</Label>
          <input
            type="file"
            required
            className="block w-full mt-2 text-sm"
            onChange={handleFileChange("g2")}
          />
        </div>
        <div className="rounded-lg border p-4">
          <Label>Signed Referee Form *</Label>
          <input
            type="file"
            required
            className="block w-full mt-2 text-sm"
            onChange={handleFileChange("ref")}
          />
        </div>
      </div>

      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !files.g1 || !files.g2 || !files.ref}
        >
          {isSubmitting ? "Submitting Application..." : "Complete Application"}
        </Button>
      </div>
    </form>
  );
}
