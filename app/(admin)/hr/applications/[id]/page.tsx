import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getApplication } from "@/lib/api/hr";
import { CopyLinkButton } from "./components/copy-link-button";
import { DocumentPreviews } from "./components/document-previews";
import { ApplicationActionsClient } from "./components/application-actions-client";
import { BioData } from "./components/bio-data";
import { ApplicationExportButton } from "../components/application-export-button";
import { ApplicationTimeline } from "./components/application-timeline";


export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let application;
  try {
    application = await getApplication(id);
  } catch {
    notFound();
  }

  if (!application) {
    notFound();
  }

  const getStatusBadge = (status: string | null) => {
    const statusMap = {
      invited: { label: "Invited", variant: "secondary" as const },
      in_progress: { label: "In Progress", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const },
    };

    const statusInfo =
      statusMap[status as keyof typeof statusMap] || statusMap.invited;

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "₦0.00";
    return `₦${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const applicantUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  }/applicant/${application.id}`;

  const employmentTerms = application.form_data?.employment_terms;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{application.application_id}</h1>
            {getStatusBadge(application.status)}
          </div>
          <p className="text-muted-foreground">{application.position_title}</p>
        </div>
        <div className="flex items-center gap-2">
          <ApplicationExportButton
            applications={[application]}
            filename={application.application_id || "hr-application"}
          />
          <Button variant="outline" asChild>
            <Link href="/hr/applications">Back to List</Link>
          </Button>
        </div>
      </div>

      {/* Applicant Information */}
      <Card>
        <CardHeader>
          <CardTitle>Applicant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">
                {application.applicant_name || "Not provided yet"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{application.applicant_email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Position
              </p>
              <p className="text-sm">{application.position_title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Invited On
              </p>
              <p className="text-sm">{formatDate(application.invited_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed On
              </p>
              <p className="text-sm">{formatDate(application.completed_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Dress Code Acknowledged
              </p>
              <p className="text-sm flex items-center gap-1.5 mt-0.5">
                {application.form_data?.documents?.dressCodeAcknowledged ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    Yes (on {formatDate(application.form_data.documents.dressCodeAcknowledgedAt)})
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
                    No
                  </>
                )}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium">Applicant Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all">
                {applicantUrl}
              </code>
              <CopyLinkButton url={applicantUrl} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding History Timeline */}
      <ApplicationTimeline application={application as any} />

      {/* Bio Data */}
      {application.form_data && (
        <BioData formData={application.form_data as any} />
      )}

      {/* Employment Terms */}
      {employmentTerms && (
        <Card>
          <CardHeader>
            <CardTitle>Employment Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reporting To
                </p>
                <p className="text-sm">{employmentTerms.reporting_to}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Effective Date
                </p>
                <p className="text-sm">
                  {formatDate(employmentTerms.effective_date)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gross Salary
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(employmentTerms.gross_salary)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Net Salary
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(employmentTerms.net_salary)}
                </p>
              </div>
            </div>

            {employmentTerms.salary_breakdown && (
              <>
                <Separator />
                <div>
                  <p className="mb-3 text-sm font-medium">Salary Breakdown</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(employmentTerms.salary_breakdown).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {key
                              .split("_")
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1),
                              )
                              .join(" ")}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(value as number)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Previews */}
      <DocumentPreviews
        applicationId={application.application_id}
        generatedPdfs={application.form_data?.generatedPdfs as any}
        signedDocuments={application.form_data?.signedDocuments as any}
        media={application.form_data?.media as any}
      />

      {/* Actions */}
      <ApplicationActionsClient
        applicationId={application.id}
        readableId={application.application_id}
        status={application.status}
      />
    </div>
  );
}
