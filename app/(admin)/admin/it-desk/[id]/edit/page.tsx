import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { renderDataPage } from "@/lib/api/render-data-page";
import { getITGuide } from "@/lib/api/it-guides";
import { Button } from "@/components/ui/button";
import { ITGuideForm } from "../../components/it-guide-form";
import { notFound } from "next/navigation";

interface EditITGuidePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditITGuidePage({
  params,
}: EditITGuidePageProps) {
  return renderDataPage(async () => {
    const { id } = await params;
    const guide = await getITGuide(id);

    if (!guide) {
      notFound();
    }

    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin/it-desk"
              className="inline-flex items-center text-sm font-medium text-primary mb-4 hover:underline"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Manage IT Desk
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Edit IT Guide</h1>
            <p className="text-muted-foreground mt-1">
              Update the information and content for this guide.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/my/it/${guide.slug}`}>
              <Eye className="mr-1.5 h-4 w-4" />
              View on IT Desk
            </Link>
          </Button>
        </div>

        <ITGuideForm initialData={guide} />
      </div>
    );
  }, "Unable to load this IT guide");
}

