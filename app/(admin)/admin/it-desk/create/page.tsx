"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ITGuideForm } from "../components/it-guide-form";
import { createITGuide } from "@/lib/api/it-guides";
import { type ITGuideFormValues } from "@/lib/validations/it-guides";

export default function CreateITGuidePage() {
  const handleSubmit = async (values: ITGuideFormValues) => {
    await createITGuide(values);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <Link
          href="/admin/it-desk"
          className="inline-flex items-center text-sm font-medium text-primary mb-4 hover:underline"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Manage IT Desk
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create IT Guide</h1>
        <p className="text-muted-foreground mt-1">
          Share knowledge, portal walkthroughs, and guides with the rest of the staff.
        </p>
      </div>

      <ITGuideForm onSubmit={handleSubmit} />
    </div>
  );
}

