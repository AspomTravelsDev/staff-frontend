"use client";

import { UnifiedVisaForm } from "@/components/visa/samples/unified-visa-form";
import { FileText } from "lucide-react";

export default function VisaSamplesPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      {/* CLEAN PAGE HEADER */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="size-6 text-primary" />
          Visa Document Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill applicant profile & trip details once to generate and download all 6 embassy-formatted Word (.docx) documents.
        </p>
      </div>

      {/* 2-COLUMN WORKSPACE */}
      <UnifiedVisaForm />
    </div>
  );
}
