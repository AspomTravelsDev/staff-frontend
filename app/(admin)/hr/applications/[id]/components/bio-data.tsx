/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ApplicationFormData } from "@/lib/types/form-data";
import { AddressVerificationToggle } from "./address-verification-toggle";

interface BioDataProps {
  formData: ApplicationFormData & {
    address_verification?: any;
    address_verified?: boolean;
    guarantorReferee?: any;
  };
  applicationId?: string;
}
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex min-w-0 flex-col py-1">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
    <span className="wrap-break-word text-sm font-medium">{value || "—"}</span>
  </div>
);
export function BioData({ formData, applicationId }: BioDataProps) {
  const { personal, employmentFinance, legal, guarantorReferee } = formData;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const addressParts = [
    personal?.residentialAddress?.houseNumber,
    personal?.residentialAddress?.address,
    personal?.residentialAddress?.busStop,
    personal?.residentialAddress?.city,
    personal?.residentialAddress?.state,
    personal?.residentialAddress?.country,
  ].filter(Boolean);
  const addressText = addressParts.length > 0 ? addressParts.join(", ") : null;

  const g1 = guarantorReferee?.guarantors?.[0];
  const g1FullName =
    g1?.fullName ||
    [g1?.firstName, g1?.middleName, g1?.lastName].filter(Boolean).join(" ");
  const g1Address = g1?.address
    ? [
        g1.address.street,
        g1.address.homeAddress,
        g1.address.city,
        g1.address.state,
        g1.address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "—";

  const g2 = guarantorReferee?.guarantors?.[1];
  const g2FullName =
    g2?.fullName ||
    [g2?.firstName, g2?.middleName, g2?.lastName].filter(Boolean).join(" ");
  const g2Address = g2?.address
    ? [
        g2.address.street,
        g2.address.homeAddress,
        g2.address.city,
        g2.address.state,
        g2.address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "—";

  const ref = guarantorReferee?.referee;
  const refFullName = ref?.fullName || ref?.nameOfReferee;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold px-1">Applicant Bio Data</h3>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="flex h-auto w-full max-w-full gap-1 overflow-x-auto sm:grid sm:grid-cols-4 sm:overflow-visible">
          <TabsTrigger
            className="min-h-10 min-w-max flex-none whitespace-nowrap px-3 py-2 text-center leading-tight sm:min-w-0 sm:flex-1 sm:whitespace-normal"
            value="personal"
          >
            Personal Info
          </TabsTrigger>
          <TabsTrigger
            className="min-h-10 min-w-max flex-none whitespace-nowrap px-3 py-2 text-center leading-tight sm:min-w-0 sm:flex-1 sm:whitespace-normal"
            value="professional"
          >
            Professional
          </TabsTrigger>
          <TabsTrigger
            className="min-h-10 min-w-max flex-none whitespace-nowrap px-3 py-2 text-center leading-tight sm:min-w-0 sm:flex-1 sm:whitespace-normal"
            value="background"
          >
            Account & Background
          </TabsTrigger>
          <TabsTrigger
            className="min-h-10 min-w-max flex-none whitespace-nowrap px-3 py-2 text-center leading-tight sm:min-w-0 sm:flex-1 sm:whitespace-normal"
            value="guarantors"
          >
            Guarantors & Referee
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InfoRow label="Title" value={personal?.title} />
                <InfoRow label="First Name" value={personal?.firstName} />
                <InfoRow label="Middle Name" value={personal?.middleName} />
                <InfoRow label="Last Name" value={personal?.lastName} />
                <InfoRow label="Gender" value={personal?.gender} />
                <InfoRow
                  label="Marital Status"
                  value={personal?.maritalStatus}
                />
                <InfoRow
                  label="Date of Birth"
                  value={formatDate(personal?.dateOfBirth)}
                />
                <InfoRow label="Birthplace" value={personal?.birthplace} />
                <InfoRow label="Nationality" value={personal?.nationality} />
                <InfoRow label="Religion" value={personal?.religion} />
                <InfoRow
                  label="Languages"
                  value={personal?.languagesSpoken?.join(", ")}
                />
              </div>

              <Separator />

              {/* Identification */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Identification</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoRow
                    label="National ID / Voter's Card"
                    value={personal?.identification?.nationalIdOrVotersCardNo}
                  />
                  <InfoRow
                    label="Passport No"
                    value={personal?.identification?.passportNo}
                  />
                  <InfoRow
                    label="Passport Expiry"
                    value={formatDate(
                      personal?.identification?.passportExpiryDate,
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold mb-3">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow
                    label="Primary Phone"
                    value={personal?.phoneNumber}
                  />
                  <InfoRow
                    label="Alternate Phone"
                    value={personal?.alternatePhoneNumber}
                  />
                  <InfoRow label="Email Address" value={personal?.email} />
                </div>
              </div>

              <Separator />

              {/* Residential Address */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Residential Address</h4>
                  {applicationId && (
                    <AddressVerificationToggle
                      applicationId={applicationId}
                      addressText={addressText}
                      landmark={personal?.nearestLandmark}
                      initialVerified={Boolean(
                        formData?.address_verification?.verified ||
                        formData?.address_verified,
                      )}
                      verifiedAt={formData?.address_verification?.verified_at}
                      verifiedByName={
                        formData?.address_verification?.verified_by?.name
                      }
                      mode="inline"
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow label="Address" value={addressText || "—"} />
                  <InfoRow
                    label="Nearest Landmark"
                    value={personal?.nearestLandmark}
                  />
                  <InfoRow
                    label="Building Description"
                    value={personal?.buildingDescription}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Gate Color" value={personal?.gateColor} />
                    <InfoRow label="House Color" value={personal?.houseColor} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Emergency Contact */}
              <div>
                <h4 className="text-sm font-semibold mb-3">
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoRow
                    label="Name"
                    value={personal?.emergencyContact?.name}
                  />
                  <InfoRow
                    label="Relationship"
                    value={personal?.emergencyContact?.relationship}
                  />
                  <InfoRow
                    label="Phone Number"
                    value={personal?.emergencyContact?.phoneNumber}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="mt-4 space-y-6">
          {/* Education */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-semibold mb-4 underline">
                Education History
              </h4>
              {employmentFinance &&
              employmentFinance.education &&
              employmentFinance.education.length > 0 ? (
                <div className="space-y-6">
                  {employmentFinance.education.map((edu, index) => {
                    const educationList = employmentFinance.education!;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoRow
                            label="Institution"
                            value={edu.institution}
                          />
                          <InfoRow
                            label="Qualification"
                            value={edu.qualification}
                          />
                          <InfoRow
                            label="Field of Study"
                            value={edu.fieldOfStudy}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <InfoRow label="From" value={edu.startYear} />
                            <InfoRow label="To" value={edu.endYear} />
                            <InfoRow label="Grade" value={edu.grade} />
                          </div>
                        </div>
                        {index < educationList.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No education history recorded.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Previous Employment */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-semibold mb-4 underline">
                Work Experience
              </h4>
              {employmentFinance &&
              employmentFinance.previousEmployment &&
              employmentFinance.previousEmployment.length > 0 ? (
                <div className="space-y-6">
                  {employmentFinance.previousEmployment.map((work, index) => {
                    const employmentList =
                      employmentFinance.previousEmployment!;
                    return (
                      <div key={index} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoRow
                            label="Company / Employer"
                            value={work.companyName || work.employer}
                          />
                          <InfoRow
                            label="Position Held"
                            value={work.position}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <InfoRow label="Duration" value={work.year} />
                            <div className="flex flex-col py-1">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Period
                              </span>
                              <span className="text-sm font-medium">
                                {work.startDate} - {work.endDate}
                              </span>
                            </div>
                          </div>
                          <InfoRow
                            label="Reason for Leaving"
                            value={work.reasonForLeaving}
                          />
                        </div>
                        {index < employmentList.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No previous employment recorded.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certifications */}
          {employmentFinance &&
          employmentFinance.certifications &&
          employmentFinance.certifications.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-4 underline">
                  Certifications
                </h4>
                <div className="space-y-4">
                  {employmentFinance.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <InfoRow label="Credential Name" value={cert.name} />
                      <InfoRow
                        label="Issuing Organization"
                        value={cert.issuingOrganization}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="background" className="mt-4 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Bank Details */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  Bank Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoRow
                    label="Bank Name"
                    value={employmentFinance?.bankDetails?.bankName}
                  />
                  <InfoRow
                    label="Account Name"
                    value={employmentFinance?.bankDetails?.accountName}
                  />
                  <InfoRow
                    label="Account Number"
                    value={employmentFinance?.bankDetails?.accountNumber}
                  />
                </div>
              </div>

              {/* <Separator /> */}

              {/* Legal Declarations */}
              {/* <div>
                <h4 className="text-sm font-semibold mb-3">Legal Declarations</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <span className="text-sm">Criminal convictions or pending cases?</span>
                    <Badge variant={legal?.legalDeclaration?.hasConvictions ? "destructive" : "secondary"}>
                      {legal?.legalDeclaration?.hasConvictions ? "YES" : "NO"}
                    </Badge>
                  </div>
                  {legal?.legalDeclaration?.hasConvictions && (
                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                      <p className="text-xs font-medium text-destructive lowercase mb-1 underline">Details provided:</p>
                      <p className="text-sm">{legal.legalDeclaration.convictionDetails}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <span className="text-sm">Significant medical conditions?</span>
                    <Badge variant={legal?.legalDeclaration?.hasMedicalConditions ? "destructive" : "secondary"}>
                      {legal?.legalDeclaration?.hasMedicalConditions ? "YES" : "NO"}
                    </Badge>
                  </div>
                   {legal?.legalDeclaration?.hasMedicalConditions && (
                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                      <p className="text-xs font-medium text-destructive lowercase mb-1 underline">Details provided:</p>
                      <p className="text-sm">{legal.legalDeclaration.medicalConditionDetails}</p>
                    </div>
                  )}
                </div>
              </div> */}

              <Separator />

              {/* Consent & Agreements */}
              <div>
                <h4 className="text-sm font-semibold mb-3">
                  Consents & Agreements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2 border rounded flex items-center justify-between">
                    <span className="text-xs font-medium">NDA Accepted</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(legal?.ndaAcceptedAt)}
                    </span>
                  </div>
                  <div className="p-2 border rounded flex items-center justify-between">
                    <span className="text-xs font-medium">
                      Non-Compete Accepted
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(legal?.nonCompeteAcceptedAt)}
                    </span>
                  </div>
                  <div className="p-2 border rounded flex items-center justify-between">
                    <span className="text-xs font-medium">
                      Confidentiality Accepted
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(legal?.confidentialityAcceptedAt)}
                    </span>
                  </div>
                  <div className="p-2 border rounded flex items-center justify-between">
                    <span className="text-xs font-medium">Terms Accepted</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(legal?.termsAcceptedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guarantors" className="mt-4 space-y-6">
          {/* Guarantor 1 */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span>Guarantor 1</span>
                  {g1?.relationship && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {g1.relationship}
                    </Badge>
                  )}
                </h4>
                {g1?.liabilityAccepted && (
                  <Badge variant="secondary" className="text-xs">
                    Liability Accepted
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoRow label="Full Name" value={g1FullName} />
                <InfoRow label="Phone Number" value={g1?.phoneNumber} />
                <InfoRow
                  label="Alternate Phone"
                  value={g1?.alternatePhoneNumber}
                />
                <InfoRow label="Email Address" value={g1?.email} />
                <InfoRow label="Occupation" value={g1?.occupation} />
                <InfoRow
                  label="Years Known"
                  value={g1?.yearsKnown ? `${g1.yearsKnown} years` : "—"}
                />
                <InfoRow label="Employer Name" value={g1?.employerName} />
                <InfoRow label="Employer Address" value={g1?.employerAddress} />
                <InfoRow label="Residential Address" value={g1Address} />
              </div>

              {g1?.characterAssessment && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Character Assessment
                  </h5>
                  <p className="text-sm bg-muted/30 p-3 rounded border">
                    {g1.characterAssessment}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guarantor 2 */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span>Guarantor 2</span>
                  {g2?.relationship && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {g2.relationship}
                    </Badge>
                  )}
                </h4>
                {g2?.liabilityAccepted && (
                  <Badge variant="secondary" className="text-xs">
                    Liability Accepted
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoRow label="Full Name" value={g2FullName} />
                <InfoRow label="Phone Number" value={g2?.phoneNumber} />
                <InfoRow
                  label="Alternate Phone"
                  value={g2?.alternatePhoneNumber}
                />
                <InfoRow label="Email Address" value={g2?.email} />
                <InfoRow label="Occupation" value={g2?.occupation} />
                <InfoRow
                  label="Years Known"
                  value={g2?.yearsKnown ? `${g2.yearsKnown} years` : "—"}
                />
                <InfoRow label="Employer Name" value={g2?.employerName} />
                <InfoRow label="Employer Address" value={g2?.employerAddress} />
                <InfoRow label="Residential Address" value={g2Address} />
              </div>

              {g2?.characterAssessment && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Character Assessment
                  </h5>
                  <p className="text-sm bg-muted/30 p-3 rounded border">
                    {g2.characterAssessment}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referee */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span>Referee</span>
                  {ref?.relationshipType && (
                    <Badge
                      variant="outline"
                      className="text-xs font-normal capitalize"
                    >
                      {ref.relationshipType}
                    </Badge>
                  )}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoRow label="Full Name" value={refFullName} />
                <InfoRow label="Phone Number" value={ref?.phoneNumber} />
                <InfoRow
                  label="Alternate Phone"
                  value={ref?.phoneNumberAlternate}
                />
                <InfoRow label="Email Address" value={ref?.emailAddress} />
                <InfoRow label="Organization" value={ref?.organization} />
                <InfoRow
                  label="Position / Occupation"
                  value={ref?.position || ref?.occupation}
                />
                <InfoRow label="How Long Known" value={ref?.howLongKnown} />
                <InfoRow label="Address" value={ref?.address} />
              </div>

              {ref?.professionalAssessment && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Professional Assessment
                  </h5>
                  <p className="text-sm bg-muted/30 p-3 rounded border">
                    {ref.professionalAssessment}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
