import { getITGuide, updateITGuide } from "@/lib/api/it-guides";
import { ITGuideForm } from "../../components/it-guide-form";
import { notFound } from "next/navigation";
import { type ITGuideFormValues } from "@/lib/validations/it-guides";

interface EditITGuidePageProps {
  params: {
    id: string;
  };
}

export default async function EditITGuidePage({
  params,
}: EditITGuidePageProps) {
  const { id } = await params;
  const guide = await getITGuide(id);

  if (!guide) {
    notFound();
  }

  const handleSubmit = async (values: ITGuideFormValues) => {
    "use server";
    await updateITGuide(id, values);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit IT Guide</h1>
        <p className="text-muted-foreground mt-2">
          Update the information and content for this guide.
        </p>
      </div>

      <ITGuideForm initialData={guide} onSubmit={handleSubmit} />
    </div>
  );
}
