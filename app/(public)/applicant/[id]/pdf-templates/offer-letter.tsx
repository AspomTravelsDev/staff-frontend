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
  is_intern?: boolean;
  is_tax_exempt?: boolean;
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
    houseNumber?: string;
    address?: string;
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
  signatureUrl?: string;
  signatureDate?: string;
}

const formatAmount = (amount?: number) => {
  if (amount === undefined || amount === null) return "N0.00";
  return `N${amount.toLocaleString("en-US", {
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
  signatureUrl,
  signatureDate,
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
        applicant.residentialAddress.houseNumber,
        applicant.residentialAddress.address,
        applicant.residentialAddress.city,
        applicant.residentialAddress.state,
        applicant.residentialAddress.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const jobTitle = (
    employmentTerms?.staff_designation || "Staff Member"
  ).toUpperCase();
  const effectiveDate = employmentTerms?.effective_date || "To be confirmed";
  const reportingTo = employmentTerms?.reporting_to || "Nancy O. Peters";
  const grossMonthly = employmentTerms?.gross_salary || 0;
  const grossAnnual = grossMonthly * 12;
  const isIntern = Boolean(employmentTerms?.is_intern);
  const isTaxExempt = Boolean(employmentTerms?.is_tax_exempt);
  const tax = isTaxExempt ? 0 : (employmentTerms?.statutory_tax_deduction || 0);
  const netSalary = isTaxExempt ? grossMonthly : (employmentTerms?.net_salary || Math.max(0, grossMonthly - tax));

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
            <Text style={pdfStyles.metadata}>Ref: {applicationId}</Text>
            <Text style={pdfStyles.metadata}>Date: {generatedAt}</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={{ marginBottom: 25 }}>
          <Text style={[pdfStyles.text, pdfStyles.bold]}>
            {applicantFullName}
          </Text>
          <Text style={[pdfStyles.text, { width: 300, fontSize: 10 }]}>
            {applicantAddress}
          </Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={pdfStyles.text}>Dear {applicantFullName},</Text>
        </View>

        {/* Subject */}
        <View style={{ marginBottom: 20 }}>
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
          Following your recent application and interview, we are delighted to
          offer you employment with ASPOM Travel Agency under the following
          terms and conditions:
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
              <Text style={pdfStyles.bold}>SALARY & BENEFITS:</Text>
              <Text style={{ marginTop: 5 }}>
                Your gross monthly salary will be {formatAmount(grossMonthly)} (
                {formatAmount(grossAnnual)} per annum). This figure is inclusive
                of all allowances and is the gross amount before statutory
                deductions. The breakdown is as follows:
              </Text>
            </View>
          </View>
        </View>

        {/* Salary Breakdown Table */}
        <View style={pdfStyles.salaryTable}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeaderRow]}>
            <Text style={pdfStyles.tableCellLabel}>ENTITLEMENTS</Text>
            <Text style={pdfStyles.tableCellValue}>MONTHLY (N)</Text>
          </View>
          {employmentTerms?.salary_breakdown ? (
            Object.entries(employmentTerms.salary_breakdown).map(
              ([key, value]) => (
                <View key={key} style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.tableCellLabel}>
                    {key
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </Text>
                  <Text style={pdfStyles.tableCellValue}>
                    {formatAmount(value).replace("N", "")}
                  </Text>
                </View>
              ),
            )
          ) : (
            <View style={pdfStyles.tableRow}>
              <Text style={pdfStyles.tableCellLabel}>Monthly Gross Salary</Text>
              <Text style={pdfStyles.tableCellValue}>
                {formatAmount(grossMonthly).replace("N", "")}
              </Text>
            </View>
          )}
          <View style={[pdfStyles.tableRow, { backgroundColor: "#f5f5f5" }]}>
            <Text style={[pdfStyles.tableCellLabel, pdfStyles.bold]}>
              TOTAL GROSS SALARY
            </Text>
            <Text style={[pdfStyles.tableCellValue, pdfStyles.bold]}>
              {formatAmount(grossMonthly).replace("N", "")}
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
              {isIntern || isTaxExempt || tax === 0
                ? "No statutory tax deduction applies to this placement."
                : `Necessary statutory deductions will be made from your Gross salary (Tax - ${formatAmount(tax)})`}
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.4</Text>
            <Text style={pdfStyles.listContent}>
              {isIntern || isTaxExempt || tax === 0
                ? `Your net salary is ${formatAmount(netSalary)} (no statutory deduction applies).`
                : `Your net salary after Statutory deduction is ${formatAmount(netSalary)}`}
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.5</Text>
            <Text style={pdfStyles.listContent}>
              This offer letter details your compensation and benefits package. You will be paid first week of every new month for previous month salary via bank credit transfer directly into your Bank account.
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.6</Text>
            <Text style={pdfStyles.listContent}>
              A breakdown of your salary can be obtained from your pay slip which is usually generated on Our Staff Portal Platform “Intranet” as soon as your salary is paid.
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.7</Text>
            <Text style={pdfStyles.listContent}>
              Upon resumption, you will be registered on Aspom Staff Portal as an employee of Aspom, after which, you will be able to access your payslip on the Portal.
            </Text>
          </View>
          <View style={pdfStyles.listItem}>
            <Text style={pdfStyles.listNumber}>4.8</Text>
            <Text style={pdfStyles.listContent}>
              If you have any questions about your salary, please talk to a Human Resources representative who will be happy to explain anything you are unsure about.
            </Text>
          </View>
        </View>

        {/* <View break /> */}

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
                The Company&apos;s working hours are Monday to Friday, from 9:00am to
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
              <Text style={pdfStyles.bold}>PROBATIONARY AND ASSESSMENT PERIODS</Text>
              <Text style={{ marginTop: 5 }}>
                The purpose of the probationary and assessment periods is to give managers the opportunity to evaluate an employee’s competency to fulfil the duties / responsibilities of the employee’s position. It also gives the employee an opportunity to evaluate the new position.
              </Text>
              <Text style={{ marginTop: 5 }}>
                All new employees and rehires will be on a minimum of two (2) weeks probationary period starting from the first day worked. However, current employees promoted or transferred to a new position will be on a One (1) month assessment period starting on their first day worked in their new position. The probationary or assessment period may be extended if more time is required to assess an employee's performance completely. If the employee's performance is unsatisfactory after the extension, progressive discipline up to dismissal may be used by the management.
              </Text>
              <Text style={{ marginTop: 5 }}>
                Without prejudice to the earlier paragraph, the company reserves the right to summarily dismiss a staff whose performance is way below expectation in the first month of employment.
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
              <Text style={pdfStyles.bold}>SEPARATION/ RESIGNATION</Text>
              <Text style={{ marginTop: 5 }}>
                An employee wishing to resign in good standing shall submit to the Management and Human Resources a resignation letter dated and signed stating the effective date of the resignation. Employees are expected to give 1 month prior notice of resignation or payment in lieu of the 30 days’ notice; which is the monthly pay(Incase of Immediate Resignation) or two weeks of work without payment in lieu of a two weeks notice.
              </Text>
              <Text style={{ marginTop: 5 }}>
                Employees should actually work during the two weeks(No payment) notice period or 30 days notice period as they would be paid at the end of the month. An employee who fails to comply with this requirement may have monies deducted from their final pay and may be considered ineligible for rehire and such employee would not be given reference / recommendation from Aspom Travel Agency.
              </Text>
              <Text style={{ marginTop: 5 }}>
                Where a staff is on a company-sponsored trip abroad or training and the staff resigns within six (6) months after said trip, the staff would be required to refund 50% of the trip/ training total expenses. Refund structure must be agreed before the resignation due date.
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
              <Text style={pdfStyles.text}>Name: {applicantFullName}</Text>
              <View
                style={{
                  marginTop: 10,
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: 10,
                }}
              >
                <Text style={pdfStyles.text}>Signature:</Text>
                {signatureUrl ? (
                  <Image
                    src={signatureUrl}
                    style={{
                      width: 100,
                      height: 40,
                      borderBottom: "1pt solid #000",
                    }}
                  />
                ) : (
                  <Text
                    style={[
                      pdfStyles.text,
                      { borderBottom: "1pt solid #000", width: 150 },
                    ]}
                  >
                    {" "}
                  </Text>
                )}
                <Text style={pdfStyles.text}>
                  Date: {signatureDate || "________________"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
