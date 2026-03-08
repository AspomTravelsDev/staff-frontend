import React from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles, COMPANY_LOGO_URL, COMPANY_ADDRESSES } from "./styles";

interface GuarantorData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  ageDob?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  email?: string;
  address?: {
    street?: string;
    homeAddress?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  occupation?: string;
  position?: string;
  employerName?: string;
  employerAddress?: string;
  relationship?: string;
  yearsKnown?: number;
  characterAssessment?: string;
  passportPhoto?: {
    storagePath?: string;
  };
}

interface ApplicantData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  residentialAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface GuarantorFormPdfProps {
  guarantor: GuarantorData;
  applicant: ApplicantData;
  guarantorIndex: number;
  applicationId: string;
  positionTitle: string;
  generatedAt: string;
  companyLogoUrl?: string;
  passportPhotoUrl?: string;
  applicantPhotoUrl?: string;
  applicantSignatureUrl?: string;
}

export const GuarantorFormPdf: React.FC<GuarantorFormPdfProps> = ({
  guarantor,
  applicant,
  guarantorIndex,
  applicationId,
  positionTitle,
  generatedAt,
  companyLogoUrl = COMPANY_LOGO_URL,
  passportPhotoUrl,
  applicantPhotoUrl,
  applicantSignatureUrl,
}) => {
  const applicantFullName = [
    applicant?.firstName,
    applicant?.middleName,
    applicant?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const guarantorFullName = [
    guarantor?.firstName,
    guarantor?.middleName,
    guarantor?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const guarantorAddress = [
    guarantor?.address?.street,
    guarantor?.address?.homeAddress,
    guarantor?.address?.city,
    guarantor?.address?.state,
    guarantor?.address?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const occupationPosition = [guarantor?.occupation, guarantor?.position]
    .filter(Boolean)
    .join(" - ");

  const employerInfo = [guarantor?.employerName, guarantor?.employerAddress]
    .filter(Boolean)
    .join(", ");

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.logoContainer}>
            {companyLogoUrl ? (
              <Image src={companyLogoUrl} style={pdfStyles.logo} />
            ) : (
              <View style={pdfStyles.logo} />
            )}
          </View>

          <View style={pdfStyles.companyInfo}>
            <Text style={pdfStyles.companyName}>ASPOM TRAVEL AGENCY</Text>
            <Text style={pdfStyles.companyAddress}>
              {COMPANY_ADDRESSES.head}
            </Text>
            <Text style={pdfStyles.companyAddress}>
              {COMPANY_ADDRESSES.abuja}
            </Text>
            <Text style={pdfStyles.companyAddress}>
              {COMPANY_ADDRESSES.ikeja}
            </Text>
          </View>

          <View style={pdfStyles.photoBox}>
            {passportPhotoUrl ? (
              <Image src={passportPhotoUrl} style={pdfStyles.passportPhoto} />
            ) : (
              <View style={pdfStyles.photoPlaceholder}>
                <Text style={pdfStyles.photoPlaceholderText}>
                  Guarantor Photo
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Metadata */}
        <Text style={pdfStyles.metadata}>
          Application ID: {applicationId} | Generated: {generatedAt}
        </Text>

        {/* Form Title */}
        <Text style={pdfStyles.formTitle}>STAFF GUARANTOR FORM</Text>

        {/* Applicant Name */}
        <View style={pdfStyles.fieldGroup}>
          <Text style={pdfStyles.fieldLabel}>Name of Applicant:</Text>
          <View style={pdfStyles.fieldLine}>
            <Text>{applicantFullName || "N/A"}</Text>
          </View>
        </View>

        {/* Introduction Text */}
        <Text style={pdfStyles.declarationText}>
          The above named individual has applied to our organization for the
          position of a{" "}
          <Text style={pdfStyles.declarationFill}>
            {positionTitle || "N/A"}
          </Text>
          . She/he is therefore being considered for employment.
        </Text>

        <Text style={pdfStyles.declarationText}>
          You have been selected as his/her Guarantor. In line with our policy,
          it will be appreciated if you could fill this form and assure us that
          while he/she is in our employment and his/her whereabouts is unknown
          to us, or whether he/she is found wanting in any way, you will be
          responsible for the outcome of his/her actions until the issue is
          resolved.
        </Text>

        {/* Guarantors Details */}
        <Text style={pdfStyles.sectionTitle}>
          GUARANTOR {guarantorIndex} DETAILS
        </Text>

        <View style={pdfStyles.fieldRow}>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabelItalic}>First Name</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{guarantor?.firstName || ""}</Text>
            </View>
          </View>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabelItalic}>Middle Name</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{guarantor?.middleName || ""}</Text>
            </View>
          </View>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabelItalic}>Last Name</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{guarantor?.lastName || ""}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.fieldRow}>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Date of Birth / Age</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{guarantor?.ageDob || ""}</Text>
            </View>
          </View>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Phone Number</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{guarantor?.phoneNumber || ""}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.fieldRow}>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Email Address</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{guarantor?.email || ""}</Text>
            </View>
          </View>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Alternate Phone</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{guarantor?.alternatePhoneNumber || ""}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.fieldGroup}>
          <Text style={pdfStyles.fieldLabel}>Home Address</Text>
          <View style={pdfStyles.fieldLine}>
            <Text>{guarantorAddress || ""}</Text>
          </View>
        </View>

        {/* Employment Information */}
        <Text style={pdfStyles.sectionTitle}>EMPLOYMENT INFORMATION</Text>

        <View style={pdfStyles.fieldRow}>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Occupation / Position</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{occupationPosition || ""}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.fieldGroup}>
          <Text style={pdfStyles.fieldLabel}>Employer Name & Address</Text>
          <View style={pdfStyles.fieldLine}>
            <Text>{employerInfo || ""}</Text>
          </View>
        </View>

        {/* Relationship to Applicant */}
        <Text style={pdfStyles.sectionTitle}>RELATIONSHIP TO APPLICANT</Text>

        <View style={pdfStyles.fieldRow}>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Relationship</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{guarantor?.relationship || ""}</Text>
            </View>
          </View>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Years Known</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>
                {guarantor?.yearsKnown ? `${guarantor.yearsKnown} years` : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.fieldGroup}>
          <Text style={pdfStyles.fieldLabel}>Character Assessment</Text>
          <View style={pdfStyles.fieldLine}>
            <Text>{guarantor?.characterAssessment || ""}</Text>
          </View>
        </View>

        {/* Declaration */}
        <View style={pdfStyles.declarationSection}>
          <Text style={pdfStyles.sectionTitle}>DECLARATION</Text>

          <Text style={pdfStyles.declarationText}>
            I,{" "}
            <Text style={pdfStyles.declarationFill}>
              {guarantorFullName || "___________"}
            </Text>{" "}
            (Guarantor's name) hereby attest that{" "}
            <Text style={pdfStyles.declarationFill}>
              {applicantFullName || "___________"}
            </Text>{" "}
            (Employee's name) is being guaranteed financially by me. I do hereby
            assure my cooperation and total support whenever he/she is found
            wanting financially on the job. I hereby accept to stand as
            guarantor for him/her and agree to indemnify{" "}
            <Text style={pdfStyles.declarationFill}>Aspom Travel Agency</Text>{" "}
            of all financial losses arising from any malpractice and also
            promise to pay up any outstanding debt within one month of being
            contacted and being given full evidence of any indebtedness on his /
            her part.
          </Text>
        </View>

        {/* Guarantor Signature */}
        <View style={pdfStyles.signatureRow}>
          <View style={pdfStyles.signatureField}>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureLabel}>Guarantor's Signature</Text>
          </View>
          <View style={pdfStyles.signatureField}>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureLabel}>Date</Text>
          </View>
        </View>

        {/* Applicant Declaration and Signature */}
        <View style={pdfStyles.declarationSection}>
          <Text style={pdfStyles.sectionTitle}>APPLICANT'S DECLARATION</Text>
          <Text style={pdfStyles.declarationText}>
            I,{" "}
            <Text style={pdfStyles.declarationFill}>
              {applicantFullName || "___________"}
            </Text>{" "}
            hereby declare that all the information provided in this application
            is true and correct to the best of my knowledge. I understand that
            any false statement may result in the termination of my employment.
          </Text>
          <View style={pdfStyles.signatureRow}>
            <View style={pdfStyles.signatureField}>
              {applicantSignatureUrl && (
                <Image
                  src={applicantSignatureUrl}
                  style={pdfStyles.signatureImage}
                />
              )}
              <View style={pdfStyles.signatureLine} />
              <Text style={pdfStyles.signatureLabel}>
                Applicant's Signature & Date
              </Text>
            </View>
          </View>
        </View>

        {/* Witness Section */}
        <View style={pdfStyles.witnessSection} wrap={false}>
          <Text style={pdfStyles.witnessTitle}>WITNESS</Text>

          <View style={pdfStyles.fieldRow}>
            <View style={pdfStyles.fieldColumn}>
              <Text style={pdfStyles.fieldLabel}>Full Name</Text>
              <View style={pdfStyles.fieldLine}>
                <Text></Text>
              </View>
            </View>
            <View style={pdfStyles.fieldColumn}>
              <Text style={pdfStyles.fieldLabel}>Phone Number</Text>
              <View style={pdfStyles.fieldLine}>
                <Text></Text>
              </View>
            </View>
          </View>

          <View style={pdfStyles.fieldGroup}>
            <Text style={pdfStyles.fieldLabel}>Address</Text>
            <View style={pdfStyles.fieldLine}>
              <Text></Text>
            </View>
          </View>

          <View style={pdfStyles.signatureRow}>
            <View style={pdfStyles.signatureField}>
              <View style={pdfStyles.signatureLine} />
              <Text style={pdfStyles.signatureLabel}>Witness Signature</Text>
            </View>
            <View style={pdfStyles.signatureField}>
              <View style={pdfStyles.signatureLine} />
              <Text style={pdfStyles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
