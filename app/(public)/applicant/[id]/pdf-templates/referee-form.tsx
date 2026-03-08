import React from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles, COMPANY_LOGO_URL, COMPANY_ADDRESSES } from "./styles";

interface RefereeAssessment {
  howLongKnown?: string;
  capacity?: string;
  lastContact?: string;
  abilityToGetAlong?: string;
  primarySkills?: string;
  areasToImprove?: string;
  collaborationComfort?: string;
  characterOpinion?: string;
  trustworthyWithConfidentialInfo?: boolean;
  observedIllegalActivity?: string;
  recommendForPosition?: string;
}

interface RefereeData {
  fullName?: string;
  nameOfReferee?: string;
  phoneNumber?: string;
  phoneNumberAlternate?: string;
  emailAddress?: string;
  organization?: string;
  address?: string;
  occupation?: string;
  position?: string;
  relationshipType?: "professional" | "academic" | "personal";
  yearsKnown?: number;
  howLongKnown?: string;
  professionalAssessment?: string;
  assessment?: RefereeAssessment;
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

interface RefereeFormPdfProps {
  referee: RefereeData;
  applicant: ApplicantData;
  applicationId: string;
  positionTitle: string;
  generatedAt: string;
  companyLogoUrl?: string;
  passportPhotoUrl?: string;
  applicantPhotoUrl?: string;
  applicantSignatureUrl?: string;
}

// Helper to convert boolean to Yes/No/blank
const boolToYesNo = (value?: boolean): string => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
};

export const RefereeFormPdf: React.FC<RefereeFormPdfProps> = ({
  referee,
  applicant,
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

  const applicantAddress = [
    applicant?.residentialAddress?.street,
    applicant?.residentialAddress?.city,
    applicant?.residentialAddress?.state,
    applicant?.residentialAddress?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const refereeName = referee?.fullName || referee?.nameOfReferee || "";
  const assessment = referee?.assessment || {};

  // Combine howLongKnown from both sources
  const howLongKnown =
    assessment?.howLongKnown ||
    referee?.howLongKnown ||
    (referee?.yearsKnown ? `${referee.yearsKnown} years` : "");

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
                  Referee Photo
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Metadata */}
        <Text style={pdfStyles.metadata}>
          Application ID: {applicationId} | Generated: {generatedAt}
        </Text>

        {/* Confidential Banner */}
        <Text style={pdfStyles.confidentialBanner}>CONFIDENTIAL</Text>

        {/* Two-column header: Company address | Applicant info */}
        <View style={pdfStyles.twoColumnHeader}>
          <View style={pdfStyles.headerColumnLeft}>
            <Text style={pdfStyles.fieldLabel}>TO: Aspom Travel Agency</Text>
            <Text style={{ fontSize: 9, marginBottom: 2 }}>
              Plot 69 Admiralty Way,
            </Text>
            <Text style={{ fontSize: 9, marginBottom: 2 }}>Lekki Phase 1,</Text>
            <Text style={{ fontSize: 9, marginBottom: 2 }}>Lekki, Lagos.</Text>
            <Text style={{ fontSize: 9 }}>Lagos, Nigeria</Text>
          </View>
          <View style={pdfStyles.headerColumnRight}>
            <View style={pdfStyles.fieldGroup}>
              <View style={pdfStyles.fieldLine}>
                <Text>{applicantFullName || ""}</Text>
              </View>
              <Text style={{ fontSize: 9, textAlign: "center" }}>
                Applicant's Name
              </Text>
            </View>
            <View style={pdfStyles.fieldGroup}>
              <View style={pdfStyles.fieldLine}>
                <Text>{applicantAddress || ""}</Text>
              </View>
              <Text style={{ fontSize: 9, textAlign: "center" }}>
                Applicant's Address
              </Text>
            </View>
          </View>
        </View>

        {/* Confidential Section */}
        <View style={pdfStyles.witnessSection}>
          <Text style={pdfStyles.witnessTitle}>
            ASPOM TRAVELS - CONFIDENTIAL REPORT
          </Text>
          <Text style={pdfStyles.text}>
            This report is confidential and is for the exclusive use of the HR
            Department. Please ensure all details are accurate and complete.
          </Text>
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

        {/* Introduction */}
        <Text style={pdfStyles.declarationText}>
          We would appreciate your help in providing us with a reference for the
          individual named above who has applied to work with us for the
          position of{" "}
          <Text style={pdfStyles.declarationFill}>
            {positionTitle || "N/A"}
          </Text>
          .
        </Text>

        {/* Referee Details */}
        <Text style={pdfStyles.sectionTitle}>REFEREE DETAILS</Text>

        <View style={pdfStyles.fieldGroup}>
          <Text style={pdfStyles.fieldLabel}>Name of Referee:</Text>
          <View style={pdfStyles.fieldLine}>
            <Text>{refereeName}</Text>
          </View>
        </View>

        <View style={pdfStyles.fieldGroup}>
          <Text style={pdfStyles.fieldLabel}>Address:</Text>
          <View style={pdfStyles.fieldLine}>
            <Text>{referee?.address || ""}</Text>
          </View>
        </View>

        <View style={pdfStyles.fieldRow}>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Occupation:</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{referee?.occupation || ""}</Text>
            </View>
          </View>
          <View style={pdfStyles.fieldColumn}>
            <Text style={pdfStyles.fieldLabel}>Phone Number:</Text>
            <View style={pdfStyles.fieldLine}>
              <Text>{referee?.phoneNumber || ""}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.fieldGroup}>
          <Text style={pdfStyles.fieldLabel}>Email Address:</Text>
          <View style={pdfStyles.fieldLine}>
            <Text>{referee?.emailAddress || ""}</Text>
          </View>
        </View>

        {/* Questions Section */}
        <Text style={pdfStyles.sectionTitle}>REFERENCE QUESTIONS</Text>

        {/* Q1 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            1. How long have you known the applicant and in what capacity?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>
              {howLongKnown}
              {assessment?.capacity ? ` - ${assessment.capacity}` : ""}
            </Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
        </View>

        {/* Q2 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            2. When was the last time you had contact with the applicant?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>{assessment?.lastContact || ""}</Text>
          </View>
        </View>

        {/* Q3 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            3. How would you describe the applicant's ability to get along well
            with others?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>{assessment?.abilityToGetAlong || ""}</Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
        </View>

        {/* Q4 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            4. What are the applicant's primary positive skills and qualities?
            What areas could they improve on?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>
              {assessment?.primarySkills || ""}
              {assessment?.areasToImprove
                ? ` | Areas to improve: ${assessment.areasToImprove}`
                : ""}
            </Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
        </View>

        {/* Q5 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            5. How comfortable would you be in having the applicant collaborate
            with you on an important project?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>{assessment?.collaborationComfort || ""}</Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
        </View>

        {/* Q6 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            6. What is your opinion of the applicant's personal character,
            honesty and reliability?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>{assessment?.characterOpinion || ""}</Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
        </View>

        {/* Q7 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            7. Is there any reason why you wouldn't trust the applicant with
            confidential information?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>
              {boolToYesNo(assessment?.trustworthyWithConfidentialInfo)}
            </Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
        </View>

        {/* Q8 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            8. Have you ever observed or had knowledge of the applicant doing
            anything you felt was illegal or questionable?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>{assessment?.observedIllegalActivity || ""}</Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
        </View>

        {/* Q9 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            9. Is there anything else you would like to tell us about the
            applicant?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>{referee?.professionalAssessment || ""}</Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
          <View style={pdfStyles.answerLineMulti}>
            <Text></Text>
          </View>
        </View>

        {/* Q10 */}
        <View style={pdfStyles.questionGroup}>
          <Text style={pdfStyles.questionText}>
            10. Do you recommend the applicant for the position?
          </Text>
          <View style={pdfStyles.answerLine}>
            <Text>{assessment?.recommendForPosition || ""}</Text>
          </View>
        </View>

        {/* Declaration */}
        <Text
          style={[
            pdfStyles.declarationText,
            { marginTop: 20, fontFamily: "Times-Italic" },
          ]}
        >
          I confirm that the details I have provided are accurate to the best of
          my knowledge.
        </Text>

        {/* Signature */}
        <View style={pdfStyles.signatureRow}>
          <View style={pdfStyles.signatureField}>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureLabel}>Signature</Text>
          </View>
          <View style={pdfStyles.signatureField}>
            <View style={pdfStyles.signatureLine} />
            <Text style={pdfStyles.signatureLabel}>Date</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
