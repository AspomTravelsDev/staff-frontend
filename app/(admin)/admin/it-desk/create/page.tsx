"use client";

import { ITGuideForm } from "../components/it-guide-form";
import { createITGuide } from "@/lib/api/it-guides";
import { type ITGuideFormValues } from "@/lib/validations/it-guides";

export default function CreateITGuidePage() {
  const handleSubmit = async (values: ITGuideFormValues) => {
    await createITGuide(values);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create IT Guide</h1>
        <p className="text-muted-foreground mt-2">
          Share knowledge and guides with the rest of the staff.
        </p>
      </div>

      <ITGuideForm onSubmit={handleSubmit} />
    </div>
  );
}
