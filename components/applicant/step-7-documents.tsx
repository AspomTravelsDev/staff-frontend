"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicantStore } from "@/lib/store/applicant-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Step7Documents() {
  const router = useRouter();
  const { setStep, completeStep } = useApplicantStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleDownloadForms = async () => {
    setIsDownloading(true);
    // Mock download delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setHasDownloaded(true);
    setIsDownloading(false);

    // In a real app we'd trigger file downloads here
    alert("Mock: PDFs would be downloaded here!");
  };

  const handleBack = () => {
    setStep(6);
    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "6";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/6`);
    }
  };

  const handleProceed = () => {
    completeStep(7);
    setStep(8);
    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "8";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/8`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Download Documents</h3>
        <p className="text-sm text-muted-foreground">
          Step 7 of 8 - Download forms for guarantors and referee
        </p>
      </div>

      <div className="rounded-lg bg-primary/5 dark:bg-primary/10 p-4 space-y-4">
        <p className="text-sm">Please download the 3 required forms:</p>
        <ul className="text-sm text-muted-foreground list-disc pl-5">
          <li>Guarantor 1 Form</li>
          <li>Guarantor 2 Form</li>
          <li>Referee Form</li>
        </ul>

        <Button
          onClick={handleDownloadForms}
          disabled={isDownloading}
          className="w-full"
        >
          {isDownloading ? "Generating PDFs..." : "Download All Forms"}
        </Button>

        {hasDownloaded && (
          <p className="text-sm text-green-600">✓ Forms downloaded (mock).</p>
        )}
      </div>

      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleProceed} disabled={!hasDownloaded}>
          Proceed to Upload
        </Button>
      </div>
    </div>
  );
}
