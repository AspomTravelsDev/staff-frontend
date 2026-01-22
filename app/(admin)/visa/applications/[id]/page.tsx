import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";

import { getApplicationDetail } from "../queries";
import { ApplicationDetailView } from "./components/application-detail-view";
import { ApplicationActions } from "./components/application-actions";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Application ${id.slice(0, 8)}... | Aspom Travels`,
    description: "View visa application details",
  };
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const application = await getApplicationDetail(id);

  if (!application) {
    notFound();
  }

  const publicUrl = `/visa/apply/${application.country}/${application.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="size-8">
              <Link href="/visa/applications">
                <IconArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Application Details</h1>
          </div>
          <p className="text-muted-foreground ml-11">
            Application ID:{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
              {application.id}
            </code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {application.status === "draft" && (
            <Button variant="outline" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <IconExternalLink className="mr-2 size-4" />
                Open Public Form
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Application data */}
        <div className="lg:col-span-2">
          <ApplicationDetailView application={application} />
        </div>

        {/* Sidebar with actions */}
        <div className="space-y-4">
          <ApplicationActions application={application} />
        </div>
      </div>
    </div>
  );
}
