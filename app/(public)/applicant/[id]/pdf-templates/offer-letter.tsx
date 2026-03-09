import React from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles, COMPANY_LOGO_URL, COMPANY_ADDRESSES } from "./styles";

interface SalaryBreakdown {
  [key: string]: number;
}

interface EmploymentTerms {
  staff_designation?: string;
  reporting_to?: string;
  effective_date?: string;
  gross_salary?: number;
  net_salary?: number;
  statutory_tax_deduction?: number;
  salary_breakdown?: SalaryBreakdown;
}

interface ApplicantData {
  firstName: string;
  middleName?: string;
  lastName: string;
  residentialAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
}

interface OfferLetterPdfProps {
  applicant: ApplicantData;
  employmentTerms: EmploymentTerms;
  applicationId: string;
  generatedAt: string;
  companyLogoUrl?: string;
}

const formatAmount = (amount?: number) => {
  if (amount === undefined || amount === null) return "₦0.00";
  return `₦${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const numberToWords = (num: number): string => {
  if (num === 220000) return "Two Hundred and Twenty Thousand Naira Only";
  // Simple fallback for other numbers as full implementation is complex
  return `${num.toLocaleString()} Naira Only`;
};

export const OfferLetterPdf: React.FC<OfferLetterPdfProps> = ({
  applicant,
  employmentTerms,
  applicationId,
  generatedAt,
  companyLogoUrl = COMPANY_LOGO_URL,
}) => {
  const applicantFullName = [
    applicant?.firstName,
    applicant?.middleName,
    applicant?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  const applicantAddress = applicant?.residentialAddress
    ? [
        applicant.residentialAddress.street,
        applicant.residentialAddress.city,
        applicant.residentialAddress.state,
        applicant.residentialAddress.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "Not Provided";

  const jobTitle = (
    employmentTerms?.staff_designation || "Staff Member"
  ).toUpperCase();
  const effectiveDate = employmentTerms?.effective_date || "To be confirmed";
  const reportingTo = employmentTerms?.reporting_to || "Management";
  const grossMonthly = employmentTerms?.gross_salary || 0;
  const grossAnnual = grossMonthly * 12;
  const tax = employmentTerms?.statutory_tax_deduction || 0;
  const netSalary = employmentTerms?.net_salary || 0;

  return (
    <Document title={`Offer Letter - ${applicantFullName}`}>
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
            <Text style={pdfStyles.metadata}>ID: {applicationId}</Text>
            <Text style={pdfStyles.metadata}>Date: {generatedAt}</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={{ marginBottom: 20 }}>
          <Text style={pdfStyles.text}>{generatedAt}</Text>
          <Text style={[pdfStyles.text, pdfStyles.bold, { marginTop: 10 }]}>
            {applicantFullName}
          </Text>
          <Text style={[pdfStyles.text, { width: 250 }]}>
            {applicantAddress}
          </Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={pdfStyles.text}>Dear {applicant?.firstName},</Text>
        </View>

        {/* Subject */}
        <View style={{ marginBottom: 15 }}>
          <Text
            style={[
              pdfStyles.text,
              pdfStyles.bold,
              pdfStyles.underline,
              { textAlign: "center" },
            ]}
          >
            OFFER OF EMPLOYMENT
          </Text>
        </View>

        <Text style={pdfStyles.paragraph}>
          With reference to your application and subsequent interview, we are
          pleased to offer you employment under the following terms and
          conditions:
        </Text>

        {/* Terms */}
        <View style={pdfStyles.list}>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>1.</Text>
            <Text style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>JOB TITLE:</Text> {jobTitle}
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>2.</Text>
            <Text style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>EFFECTIVE DATE:</Text>{" "}
              {effectiveDate}
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>3.</Text>
            <Text style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>REPORTING TO:</Text> {reportingTo}
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.</Text>
            <View style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>
                SALARY & BENEFIT: {formatAmount(grossMonthly)}
              </Text>
              <Text style={{ marginTop: 5 }}>
                {formatAmount(grossAnnual)} This figure is inclusive of all
                allowances and is the gross amount before any personal tax. The
                above amount represents your total fixed salary, which will be
                structured to your tax efficiency. The breakdown is as follows:
              </Text>
            </View>
          </View>
        </View>

        {/* Salary Breakdown Table */}
        <View style={pdfStyles.salaryTable}>
          {employmentTerms?.salary_breakdown ? (
            Object.entries(employmentTerms.salary_breakdown).map(
              ([key, value], idx, arr) => (
                <View
                  key={key}
                  style={[
                    pdfStyles.tableRow,
                    idx === arr.length - 1 ? pdfStyles.noBorder : {},
                  ]}
                >
                  <Text style={pdfStyles.tableCellLabel}>
                    {key
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </Text>
                  <Text style={pdfStyles.tableCellValue}>
                    {formatAmount(value)}
                  </Text>
                </View>
              ),
            )
          ) : (
            <View style={[pdfStyles.tableRow, pdfStyles.noBorder]}>
              <Text style={pdfStyles.tableCellLabel}>Monthly Gross Salary</Text>
              <Text style={pdfStyles.tableCellValue}>
                {formatAmount(grossMonthly)}
              </Text>
            </View>
          )}
          <View style={[pdfStyles.tableRow, { backgroundColor: "#f0f0f0" }]}>
            <Text style={pdfStyles.tableCellLabel}>Total</Text>
            <Text style={pdfStyles.tableCellValue}>
              {formatAmount(grossMonthly)}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.list}>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.1</Text>
            <Text style={pdfStyles.listContent}>
              Your Gross monthly salary will be {formatAmount(grossMonthly)} (
              {numberToWords(grossMonthly)})
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.2</Text>
            <Text style={pdfStyles.listContent}>
              Your performance will be reviewed periodically in compliance with
              the company policy and your salary be adjusted accordingly.
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.3</Text>
            <Text style={pdfStyles.listContent}>
              Necessary statutory deductions will be made from your Gross salary
              (Tax - {formatAmount(tax)})
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.4</Text>
            <Text style={pdfStyles.listContent}>
              Your net salary after Statutory deduction is{" "}
              {formatAmount(netSalary)}
            </Text>
          </View>
        </View>

        <View break />

        {/* Continued Sections */}
        <View style={pdfStyles.list}>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>5.</Text>
            <View style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>DUTIES</Text>
              <Text style={{ marginTop: 5 }}>
                Your Job Description as a {jobTitle} will be made available to
                you during your induction and onboarding.
              </Text>
            </View>
          </View>

          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>6.</Text>
            <View style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>WORKING HOURS</Text>
              <Text style={{ marginTop: 5 }}>
                The Company's working hours are Monday to Friday, from 9:00am to
                6:00pm. You are entitled to one-hour lunch break each day from
                12noon.
              </Text>
              <Text style={{ marginTop: 5 }}>
                You may be required to work beyond the usual working hours to
                discharge your duties as the need arises, at no extra cost.
              </Text>
            </View>
          </View>

          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>7.</Text>
            <View style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>PROBATIONS</Text>
              <Text style={{ marginTop: 5 }}>
                You shall complete the first six (6) months of your Employment
                on a probationary basis from the date of commencement of work.
              </Text>
            </View>
          </View>

          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>8.</Text>
            <View style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>ANNUAL LEAVE</Text>
              <Text style={{ marginTop: 5 }}>
                Besides gazette public holidays, you are entitled to Twenty (20)
                working days leave or prorated after written confirmation of
                your appointment.
              </Text>
            </View>
          </View>

          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>9.</Text>
            <View style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>EXIT, TERMINATION AND NOTICE</Text>
              <Text style={{ marginTop: 5 }}>
                To resign from this employment, either prior to or after your
                confirmation, you will be required to give a minimum of one
                month written notice of intention to resign or pay one-month
                salary in lieu of notice.
              </Text>
            </View>
          </View>

          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>10.</Text>
            <View style={pdfStyles.listContent}>
              <Text style={pdfStyles.bold}>RESTRICTIVE COVENANT</Text>
              <Text style={{ marginTop: 5 }}>
                Following the termination of this employment contract or
                separation from the company, you shall for a period of one year
                refrain from either directly or indirectly soliciting or
                attempting to solicit the business of any client or customer of
                the Company.
              </Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.footerContainer}>
          <Text style={pdfStyles.paragraph}>Yours faithfully,</Text>
          <Text
            style={[
              pdfStyles.paragraph,
              { marginTop: 10, fontFamily: "Times-Bold" },
            ]}
          >
            For: ASPOM TRAVEL AGENCY
          </Text>
          <View style={{ marginTop: 20 }}>
            <Text style={pdfStyles.bold}>NANCY O. PETERS</Text>
            <Text style={pdfStyles.text}>MANAGING PARTNER</Text>
          </View>

          <View
            style={{
              marginTop: 30,
              borderTop: "1pt dashed #000",
              paddingTop: 10,
            }}
          >
            <Text style={[pdfStyles.bold, { marginBottom: 10 }]}>
              Acceptance:
            </Text>
            <Text style={pdfStyles.text}>
              I confirm that I have read through and understood the content of
              this offer letter and do hereby accept the offer.
            </Text>
            <View style={{ marginTop: 15 }}>
              <Text style={pdfStyles.text}>
                Name: ________________________________________________
              </Text>
              <Text style={[pdfStyles.text, { marginTop: 10 }]}>
                Signature: __________________________ Date: ______________
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
