"use client";

import { TravelPurposeGenerator } from "@/components/visa/samples/travel-purpose-generator";
import { FileText } from "lucide-react";

export default function TravelInfoGeneratorPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="size-6 text-primary" />
          Travel Info Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate concise, context-aware purpose of travel options tailored for visa applications and embassy forms.
        </p>
      </div>

      {/* GENERATOR WORKSPACE */}
      <div className="max-w-4xl">
        <TravelPurposeGenerator />
      </div>
    </div>
  );
}
