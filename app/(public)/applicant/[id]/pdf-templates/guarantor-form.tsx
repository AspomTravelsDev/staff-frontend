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
            <Image src={companyLogoUrl} style={pdfStyles.logo} />
          </View>
          <View style={pdfStyles.companyInfo}>
            <Text style={pdfStyles.companyName}>ASPOM TRAVEL AGENCY</Text>
            <Text style={pdfStyles.companyAddress}>
              {COMPANY_ADDRESSES.head}
            </Text>
            <Text style={pdfStyles.companyAddress}>
              {COMPANY_ADDRESSES.ikeja}
            </Text>
            <Text style={pdfStyles.companyAddress}>
              {COMPANY_ADDRESSES.abuja}
            </Text>
          </View>
          <View style={pdfStyles.headerRight}>
            <View style={pdfStyles.photoBox}>
              {passportPhotoUrl ? (
                <Image src={passportPhotoUrl} style={pdfStyles.passportPhoto} />
              ) : (
                <View
                  style={[
                    pdfStyles.passportPhoto,
                    {
                      backgroundColor: "#f5f5f5",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Text style={{ fontSize: 7, color: "#999" }}>PHOTO</Text>
                </View>
              )}
            </View>
            <View style={{ marginTop: 5 }}>
              <Text style={pdfStyles.metadata}>Ref: {applicationId}</Text>
              <Text style={pdfStyles.metadata}>Date: {generatedAt}</Text>
            </View>
          </View>
        </View>

        {/* Form Title */}
        <Text style={pdfStyles.formTitle}>STAFF GUARANTOR FORM</Text>

        {/* Applicant Name */}
        <View style={pdfStyles.fieldGroup}>
          <Text style={pdfStyles.fieldLabel}>Name of Applicant:</Text>
          <View style={pdfStyles.fieldLine}>
            <Text>{applicantFullName || "N/A"}</Text>
          </View>
        </View>

        <Text style={pdfStyles.paragraph}>
          The above named individual has applied to our organization for the
          position of a{" "}
          <Text style={pdfStyles.bold}>{positionTitle || "N/A"}</Text>. She/he
          is therefore being considered for employment.
        </Text>

        <Text style={pdfStyles.paragraph}>
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
        <View style={{ marginTop: 10 }}>
          <Text style={pdfStyles.sectionTitle}>DECLARATION</Text>
          <Text style={pdfStyles.paragraph}>
            I,{" "}
            <Text style={pdfStyles.bold}>
              {guarantorFullName || "____________________"}
            </Text>{" "}
            hereby attest that{" "}
            <Text style={pdfStyles.bold}>
              {applicantFullName || "____________________"}
            </Text>{" "}
            is being guaranteed financially by me. I do hereby assure my
            cooperation and total support whenever he/she is found wanting
            financially on the job. I hereby accept to stand as guarantor for
            him/her and agree to indemnify{" "}
            <Text style={pdfStyles.bold}>Aspom Travel Agency</Text> of all
            financial losses arising from any malpractice and also promise to
            pay up any outstanding debt within one month of being contacted and
            being given full evidence of any indebtedness on his/her part.
          </Text>
        </View>

        <View style={pdfStyles.signatureRow}>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureText}>Guarantor's Signature</Text>
          </View>
          <View style={pdfStyles.signatureBlock}>
            <View style={pdfStyles.signatureLine}>
              <Text style={{ fontSize: 9 }}>{generatedAt}</Text>
            </View>
            <Text style={pdfStyles.signatureText}>Date</Text>
          </View>
        </View>

        {/* Applicant Declaration and Signature */}
        <View style={{ marginTop: 20 }}>
          <Text style={pdfStyles.sectionTitle}>APPLICANT'S DECLARATION</Text>
          <Text style={pdfStyles.paragraph}>
            I,{" "}
            <Text style={pdfStyles.bold}>
              {applicantFullName || "____________________"}
            </Text>{" "}
            hereby declare that all the information provided in this application
            is true and correct to the best of my knowledge. I understand that
            any false statement may result in the termination of my employment.
          </Text>
          <View style={pdfStyles.signatureRow}>
            <View style={pdfStyles.signatureBlock}>
              <View style={pdfStyles.signatureLine}>
                {applicantSignatureUrl && (
                  <Image
                    src={applicantSignatureUrl}
                    style={pdfStyles.signatureImage}
                  />
                )}
              </View>
              <Text style={pdfStyles.signatureText}>
                Applicant's Signature & Date
              </Text>
            </View>
          </View>
        </View>

        {/* Witness Section */}
        <View style={pdfStyles.witnessSection} wrap={false}>
          <Text style={pdfStyles.sectionTitle}>WITNESS</Text>

          <View style={pdfStyles.fieldRow}>
            <View style={pdfStyles.fieldColumn}>
              <Text style={pdfStyles.fieldLabel}>Full Name</Text>
              <View style={pdfStyles.fieldLine} />
            </View>
            <View style={pdfStyles.fieldColumn}>
              <Text style={pdfStyles.fieldLabel}>Phone Number</Text>
              <View style={pdfStyles.fieldLine} />
            </View>
          </View>

          <View style={pdfStyles.fieldGroup}>
            <Text style={pdfStyles.fieldLabel}>Address</Text>
            <View style={pdfStyles.fieldLine} />
          </View>

          <View style={pdfStyles.signatureRow}>
            <View style={pdfStyles.signatureBlock}>
              <View style={pdfStyles.signatureLine} />
              <Text style={pdfStyles.signatureText}>Witness Signature</Text>
            </View>
            <View style={pdfStyles.signatureBlock}>
              <View style={pdfStyles.signatureLine} />
              <Text style={pdfStyles.signatureText}>Date</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
