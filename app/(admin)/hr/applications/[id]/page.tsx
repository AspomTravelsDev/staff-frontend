/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, unstable_rethrow } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getApplication } from "@/lib/api/hr";
import { ExpectedActionError } from "@/lib/api/action-result";
import { DataLoadError } from "@/components/data-load-error";
import { CopyLinkButton } from "./components/copy-link-button";
import { DocumentPreviews } from "./components/document-previews";
import { ApplicationActionsClient } from "./components/application-actions-client";
import { BioData } from "./components/bio-data";
import { ApplicationExportButton } from "../components/application-export-button";
import { ApplicationTimeline } from "./components/application-timeline";
import { AddressVerificationToggle } from "./components/address-verification-toggle";
import { ContactVerificationSelect } from "./components/contact-verification-select";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let application;
  try {
    application = await getApplication(id);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ExpectedActionError && error.code === "HTTP_404") notFound();
    console.error("Failed to load onboarding application:", error);
    return <DataLoadError title="Unable to load this application" />;
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

  const personal = application.form_data?.personal;
  const addressParts = [
    personal?.residentialAddress?.houseNumber,
    personal?.residentialAddress?.address,
    personal?.residentialAddress?.busStop,
    personal?.residentialAddress?.city,
    personal?.residentialAddress?.state,
    personal?.residentialAddress?.country,
  ].filter(Boolean);
  const formattedAddress =
    addressParts.length > 0 ? addressParts.join(", ") : null;

  const addressVerification = application.form_data?.address_verification;
  const isAddressVerified = Boolean(
    addressVerification?.verified || application.form_data?.address_verified,
  );

  const guarantorReferee = application.form_data?.guarantorReferee;
  const guarantor1 = guarantorReferee?.guarantors?.[0];
  const guarantor2 = guarantorReferee?.guarantors?.[1];
  const referee = guarantorReferee?.referee;

  const g1Name =
    guarantor1?.fullName ||
    [guarantor1?.firstName, guarantor1?.middleName, guarantor1?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Not provided yet";
  const g1Phone =
    [guarantor1?.phoneNumber, guarantor1?.alternatePhoneNumber]
      .filter(Boolean)
      .join(" / ") || "—";

  const g2Name =
    guarantor2?.fullName ||
    [guarantor2?.firstName, guarantor2?.middleName, guarantor2?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Not provided yet";
  const g2Phone =
    [guarantor2?.phoneNumber, guarantor2?.alternatePhoneNumber]
      .filter(Boolean)
      .join(" / ") || "—";

  const refName =
    referee?.fullName || referee?.nameOfReferee || "Not provided yet";
  const refPhone =
    [referee?.phoneNumber, referee?.phoneNumberAlternate]
      .filter(Boolean)
      .join(" / ") || "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-all text-2xl font-bold sm:text-3xl">
              {application.application_id}
            </h1>
            {getStatusBadge(application.status)}
          </div>
          <p className="text-muted-foreground">{application.position_title}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <ApplicationExportButton
            applications={[application]}
            filename={application.application_id || "hr-application"}
          />
          <Button
            variant="outline"
            asChild
            className="min-h-6"
          >
            <Link href="/hr/applications">Back to List</Link>
          </Button>
        </div>
      </div>

      {/* Applicant Information */}
      <Card>
        <CardHeader>
          <CardTitle>Applicant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">
                {application.applicant_name || "Not provided yet"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Personal Email
              </p>
              <p className="text-sm">{application.applicant_email}</p>
            </div>
            {application.corporate_email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Corporate Work Email
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className="font-mono text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30"
                  >
                    {application.corporate_email}
                  </Badge>
                  {application.portal_status?.status === "accepted" && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      Portal Active
                    </Badge>
                  )}
                  {application.portal_status?.status === "pending" && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] gap-1"
                    >
                      Portal Invite Pending
                    </Badge>
                  )}
                  {application.portal_status?.status === "expired" && (
                    <Badge variant="destructive" className="text-[11px]">
                      Portal Invite Expired
                    </Badge>
                  )}
                </div>
              </div>
            )}
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
                    Yes (on{" "}
                    {formatDate(
                      application.form_data.documents.dressCodeAcknowledgedAt,
                    )}
                    )
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

          {/* Residential Address & Verification */}
          <AddressVerificationToggle
            applicationId={application.id}
            addressText={formattedAddress}
            landmark={personal?.nearestLandmark}
            initialVerified={isAddressVerified}
            verifiedAt={addressVerification?.verified_at}
            verifiedByName={addressVerification?.verified_by?.name}
            verificationProof={addressVerification?.proof}
          />

          <Separator />

          {/* Guarantors & Referee Summary */}
          <div>
            <h4 className="text-sm font-semibold mb-3">
              Guarantors &amp; Referee Summary
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Guarantor 1 */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Guarantor 1
                  </span>
                  {guarantor1?.relationship && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 font-normal"
                    >
                      {guarantor1.relationship}
                    </Badge>
                  )}
                  {guarantor1 && (
                    <ContactVerificationSelect
                      applicationId={application.id}
                      contact="guarantor"
                      index={0}
                      initialStatus={
                        guarantor1.verification?.status || "unverified"
                      }
                      initialProof={guarantor1.verification?.proof}
                    />
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {g1Name}
                </p>
                <div className="text-xs text-muted-foreground flex flex-col gap-0.5 pt-0.5">
                  <span className="font-medium text-foreground">{g1Phone}</span>
                  {guarantor1?.email && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {guarantor1.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Guarantor 2 */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Guarantor 2
                  </span>
                  {guarantor2?.relationship && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 font-normal"
                    >
                      {guarantor2.relationship}
                    </Badge>
                  )}
                  {guarantor2 && (
                    <ContactVerificationSelect
                      applicationId={application.id}
                      contact="guarantor"
                      index={1}
                      initialStatus={
                        guarantor2.verification?.status || "unverified"
                      }
                      initialProof={guarantor2.verification?.proof}
                    />
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {g2Name}
                </p>
                <div className="text-xs text-muted-foreground flex flex-col gap-0.5 pt-0.5">
                  <span className="font-medium text-foreground">{g2Phone}</span>
                  {guarantor2?.email && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {guarantor2.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Referee */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Referee
                  </span>
                  {referee?.relationshipType && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 font-normal capitalize"
                    >
                      {referee.relationshipType}
                    </Badge>
                  )}
                  {referee && (
                    <ContactVerificationSelect
                      applicationId={application.id}
                      contact="referee"
                      initialStatus={
                        referee.verification?.status || "unverified"
                      }
                      initialProof={referee.verification?.proof}
                    />
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {refName}
                </p>
                <div className="text-xs text-muted-foreground flex flex-col gap-0.5 pt-0.5">
                  <span className="font-medium text-foreground">
                    {refPhone}
                  </span>
                  {referee?.organization && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {referee.organization}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium">Applicant Link</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
        <BioData
          formData={application.form_data as any}
          applicationId={application.id}
        />
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
        applicantName={application.applicant_name}
        applicantEmail={application.applicant_email}
        positionTitle={application.position_title}
        corporateEmail={application.corporate_email}
        corporateEmailProvisionedAt={application.corporate_email_provisioned_at}
        formData={application.form_data}
      />
    </div>
  );
}
