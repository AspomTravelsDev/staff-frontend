"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ApplicationFormData } from "@/lib/types/form-data";

interface BioDataProps {
  formData: ApplicationFormData;
}

export function BioData({ formData }: BioDataProps) {
  const { personal, employmentFinance, legal } = formData;

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

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col py-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold px-1">Applicant Bio Data</h3>
      
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="background">Account & Background</TabsTrigger>
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
                <InfoRow label="Marital Status" value={personal?.maritalStatus} />
                <InfoRow label="Date of Birth" value={formatDate(personal?.dateOfBirth)} />
                <InfoRow label="Birthplace" value={personal?.birthplace} />
                <InfoRow label="Nationality" value={personal?.nationality} />
                <InfoRow label="Religion" value={personal?.religion} />
                <InfoRow label="Languages" value={personal?.languagesSpoken?.join(", ")} />
              </div>

              <Separator />

              {/* Identification */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Identification</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoRow label="National ID / Voter's Card" value={personal?.identification?.nationalIdOrVotersCardNo} />
                  <InfoRow label="Passport No" value={personal?.identification?.passportNo} />
                  <InfoRow label="Passport Expiry" value={formatDate(personal?.identification?.passportExpiryDate)} />
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow label="Primary Phone" value={personal?.phoneNumber} />
                  <InfoRow label="Alternate Phone" value={personal?.alternatePhoneNumber} />
                  <InfoRow label="Email Address" value={personal?.email} />
                </div>
              </div>

              <Separator />

              {/* Residential Address */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Residential Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow 
                    label="Address" 
                    value={`${personal?.residentialAddress?.street}, ${personal?.residentialAddress?.city}, ${personal?.residentialAddress?.state}, ${personal?.residentialAddress?.country}`} 
                  />
                  <InfoRow label="Nearest Landmark" value={personal?.nearestLandmark} />
                  <InfoRow label="Building Description" value={personal?.buildingDescription} />
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Gate Color" value={personal?.gateColor} />
                    <InfoRow label="House Color" value={personal?.houseColor} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Emergency Contact */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoRow label="Name" value={personal?.emergencyContact?.name} />
                  <InfoRow label="Relationship" value={personal?.emergencyContact?.relationship} />
                  <InfoRow label="Phone Number" value={personal?.emergencyContact?.phoneNumber} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="mt-4 space-y-6">
          {/* Education */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-semibold mb-4 underline">Education History</h4>
              {employmentFinance && employmentFinance.education && employmentFinance.education.length > 0 ? (
                <div className="space-y-6">
                  {employmentFinance.education.map((edu, index) => {
                    const educationList = employmentFinance.education!;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoRow label="Institution" value={edu.institution} />
                          <InfoRow label="Degree / Qualification" value={`${edu.degree} ${edu.qualification}`} />
                          <InfoRow label="Field of Study" value={edu.fieldOfStudy} />
                          <div className="grid grid-cols-3 gap-2">
                            <InfoRow label="From" value={edu.startYear} />
                            <InfoRow label="To" value={edu.endYear} />
                            <InfoRow label="Grade" value={edu.grade} />
                          </div>
                        </div>
                        {index < educationList.length - 1 && <Separator className="mt-4" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No education history recorded.</p>
              )}
            </CardContent>
          </Card>

          {/* Previous Employment */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-semibold mb-4 underline">Work Experience</h4>
              {employmentFinance && employmentFinance.previousEmployment && employmentFinance.previousEmployment.length > 0 ? (
                <div className="space-y-6">
                  {employmentFinance.previousEmployment.map((work, index) => {
                    const employmentList = employmentFinance.previousEmployment!;
                    return (
                      <div key={index} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoRow label="Company / Employer" value={work.companyName || work.employer} />
                          <InfoRow label="Position Held" value={work.position} />
                          <div className="grid grid-cols-2 gap-2">
                            <InfoRow label="Duration" value={work.year} />
                            <div className="flex flex-col py-1">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</span>
                              <span className="text-sm font-medium">{work.startDate} - {work.endDate}</span>
                            </div>
                          </div>
                          <InfoRow label="Reason for Leaving" value={work.reasonForLeaving} />
                        </div>
                        {index < employmentList.length - 1 && <Separator className="mt-4" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No previous employment recorded.</p>
              )}
            </CardContent>
          </Card>

          {/* Certifications */}
          {employmentFinance && employmentFinance.certifications && employmentFinance.certifications.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-4 underline">Certifications</h4>
                <div className="space-y-4">
                  {employmentFinance.certifications.map((cert, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoRow label="Credential Name" value={cert.name} />
                      <InfoRow label="Issuing Organization" value={cert.issuingOrganization} />
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
                  <InfoRow label="Bank Name" value={employmentFinance?.bankDetails?.bankName} />
                  <InfoRow label="Account Name" value={employmentFinance?.bankDetails?.accountName} />
                  <InfoRow label="Account Number" value={employmentFinance?.bankDetails?.accountNumber} />
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
                <h4 className="text-sm font-semibold mb-3">Consents & Agreements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2 border rounded flex items-center justify-between">
                    <span className="text-xs font-medium">NDA Accepted</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(legal?.ndaAcceptedAt)}</span>
                  </div>
                  <div className="p-2 border rounded flex items-center justify-between">
                    <span className="text-xs font-medium">Non-Compete Accepted</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(legal?.nonCompeteAcceptedAt)}</span>
                  </div>
                  <div className="p-2 border rounded flex items-center justify-between">
                    <span className="text-xs font-medium">Confidentiality Accepted</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(legal?.confidentialityAcceptedAt)}</span>
                  </div>
                  <div className="p-2 border rounded flex items-center justify-between">
                    <span className="text-xs font-medium">Terms Accepted</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(legal?.termsAcceptedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
