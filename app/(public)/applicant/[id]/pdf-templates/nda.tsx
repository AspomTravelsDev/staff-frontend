/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles, COMPANY_LOGO_URL } from "./styles";

// ── Shared local styles ──────────────────────────────────────────────────────
const s = {
  page: {
    ...pdfStyles.page,
    paddingBottom: 60,
  },
  centeredLogo: {
    alignItems: "center" as const,
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 60,
    objectFit: "contain" as const,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    textAlign: "center" as const,
    textDecoration: "underline" as const,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  doubleLine: {
    borderTop: "2pt solid #000",
    borderBottom: "0.5pt solid #000",
    marginBottom: 18,
    paddingTop: 2,
  },
  bold: {
    fontFamily: "Times-Bold",
    fontSize: 10,
  },
  text: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.5,
  },
  justified: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.6,
    textAlign: "justify" as const,
  },
  partyBlock: {
    marginBottom: 6,
    paddingLeft: 30,
  },
  partyRight: {
    textAlign: "right" as const,
    fontFamily: "Times-Bold",
    fontSize: 10,
    marginTop: 2,
    marginBottom: 10,
  },
  andLine: {
    textAlign: "center" as const,
    fontFamily: "Times-Roman",
    fontSize: 10,
    marginVertical: 8,
  },
  listItem: {
    flexDirection: "row" as const,
    marginBottom: 4,
  },
  bullet: {
    width: 20,
    fontFamily: "Times-Roman",
    fontSize: 10,
  },
  listContent: {
    flex: 1,
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.6,
    textAlign: "justify" as const,
  },
  sectionNumber: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  underlinedField: {
    borderBottom: "1pt solid #000",
    minWidth: 180,
    marginLeft: 4,
    paddingBottom: 1,
  },
  signatureRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 20,
  },
  signatureCol: {
    width: "45%",
  },
  signatureLine: {
    borderBottom: "1pt solid #000",
    marginBottom: 4,
    height: 30,
  },
  watermark: {
    position: "absolute" as const,
    top: "30%",
    left: "15%",
    width: 320,
    height: 200,
    opacity: 0.06,
  },
  blueBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: "#1a3c8f",
  },
  metaRow: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    marginBottom: 6,
  },
  metaText: {
    fontFamily: "Times-Roman",
    fontSize: 9,
    color: "#555",
  },
};

// ── Sub-components declared OUTSIDE the main component ──────────────────────

const SectionHeading = ({
  number,
  title,
}: {
  number: string;
  title: string;
}) => (
  <View style={{ marginTop: 14, marginBottom: 4 }}>
    <Text style={s.sectionNumber}>
      {number}.{"  "}
      {title}
    </Text>
  </View>
);

const BulletItem = ({ letter, text }: { letter: string; text: string }) => (
  <View style={[s.listItem, { paddingLeft: 20 }]}>
    <Text style={s.bullet}>{letter}.</Text>
    <Text style={s.listContent}>{text}</Text>
  </View>
);

const PageHeader = ({ companyLogoUrl }: { companyLogoUrl: string }) => (
  <View style={s.centeredLogo} fixed>
    <Image src={companyLogoUrl} style={s.logo} />
  </View>
);

// ── Props ────────────────────────────────────────────────────────────────────

interface NdaProps {
  employeeName: string;
  employeeAddress?: string;
  jobTitle?: string;
  executionDate?: string;
  applicationId?: string;
  generatedAt?: string;
  companyLogoUrl?: string;
  signatureUrl?: string;
  signatureDate?: string;
}

// ── Main component ───────────────────────────────────────────────────────────

export const NdaLetterPdf: React.FC<NdaProps> = ({
  employeeName,
  employeeAddress = "",
  jobTitle = "Staff Member",
  executionDate = "15th day of October 2026",
  applicationId = "",
  generatedAt = "",
  companyLogoUrl = COMPANY_LOGO_URL,
  signatureUrl,
  signatureDate,
}) => {
  const fullNameUpper = employeeName.toUpperCase();

  return (
    <Document title={`NDA - ${fullNameUpper}`}>
      <Page size="A4" style={s.page}>
        {/* Watermark */}
        <Image src={companyLogoUrl} style={s.watermark} fixed />

        {/* Logo */}
        <PageHeader companyLogoUrl={companyLogoUrl} />

        {/* Optional ref / date */}
        {(applicationId || generatedAt) && (
          <View style={s.metaRow}>
            {applicationId && (
              <Text style={s.metaText}>
                Ref: {applicationId}
                {"  "}
              </Text>
            )}
            {generatedAt && <Text style={s.metaText}>Date: {generatedAt}</Text>}
          </View>
        )}

        {/* Title */}
        <Text style={s.title}>NON-DISCLOSURE AND NON-COMPETE AGREEMENT</Text>
        <View style={s.doubleLine} />

        {/* Preamble */}
        <Text style={[s.justified, { marginBottom: 10 }]}>
          <Text style={s.bold}>
            THIS NON-DISCLOSURE AGREEMENT (the "Agreement") dated this{" "}
          </Text>
          <Text style={s.justified}>{executionDate} </Text>
          <Text style={s.bold}>(the "Execution Date")</Text>
        </Text>

        <Text style={[s.bold, { marginBottom: 8 }]}>BETWEEN:</Text>

        {/* Employer */}
        <View style={s.partyBlock}>
          <Text style={s.justified}>
            Aspom Travels Agency of Plot 69 Admiralty Way, Lekki Phase 1, Lekki,
            Lagos.
          </Text>
          <Text style={[s.text, { textAlign: "center" }]}>
            (the "Employer")
          </Text>
        </View>
        <Text style={s.partyRight}>OF THE FIRST PART</Text>

        <Text style={s.andLine}>-AND-</Text>

        {/* Employee */}
        <View style={s.partyBlock}>
          <View style={{ flexDirection: "row", marginBottom: 4 }}>
            <Text style={s.text}>Employee Name</Text>
            <Text style={[s.text, s.underlinedField]}>{employeeName}</Text>
          </View>
          <View style={{ flexDirection: "row", marginBottom: 4 }}>
            <Text style={s.text}>Of Address</Text>
            <Text style={[s.text, s.underlinedField]}>{employeeAddress}</Text>
          </View>
          <Text style={[s.text, { textAlign: "center" }]}>
            (The "Employee&quot;)
          </Text>
        </View>
        <Text style={s.partyRight}>OF THE SECOND PART</Text>

        {/* Background */}
        <View style={{ marginTop: 10 }}>
          <Text
            style={[
              s.bold,
              {
                textAlign: "center",
                marginBottom: 6,
                textDecoration: "underline",
              },
            ]}
          >
            BACKGROUND
          </Text>
          <Text style={[s.justified, { marginBottom: 6 }]}>
            The employee is currently or may be employed as an employee with the
            Employer as <Text style={s.bold}>{jobTitle}</Text>. In addition to
            this responsibility or position (the &quot;Employment&quot;), this
            Agreement also covers any position and responsibility now or later
            assigned to the Employee by the Employer.
          </Text>
          <Text style={[s.justified, { marginBottom: 6 }]}>
            The Employee will receive from the Employer, or develop on the
            behalf of the Employer, Confidential Information as a result of the
            Employment (the &quot;Permitted Purpose&quot;).
          </Text>
          <Text style={s.justified}>
            While employed by the Employer, Employee shall devote his or her
            full working time to the Employer&apos;s affairs and shall
            faithfully and diligently serve the Employer&apos;s interests.
          </Text>
        </View>

        {/* 1. Confidentiality */}
        <SectionHeading number="1" title="CONFIDENTIALITY" />
        <Text style={[s.justified, { marginBottom: 6 }]}>
          Employee recognizes and acknowledges that the systems which Employer
          owns, plans or develops, whether for its own use or for use by its
          clients, are confidential and are the property of the Employer.
          Employee further recognizes and acknowledges that in order to enable
          Employer to perform services for its clients, such clients may furnish
          to Employer confidential information concerning their business
          affairs, property, methods of operation or other data; that the good
          will afforded to Employer depends upon, among other things, Employer
          and its employees keeping such services and information confidential
          (collectively, including Employer systems and Employer client
          information, the &quot;Confidential Information&quot;).
        </Text>
        <Text style={[s.justified, { marginBottom: 6 }]}>
          Confidential Information means all data and information relating to
          the business and management of the Employer, but not limited to the
          following:
        </Text>
        <BulletItem letter="a" text="Customer Information" />
        <BulletItem letter="b" text="Marketing and Development Information" />
        <BulletItem letter="c" text="Business Operation" />
        <BulletItem letter="d" text="Service Information" />
        <BulletItem letter="e" text="Intellectual Property" />
        <BulletItem letter="f" text="Financial and Accounting Information" />
        <View style={[s.listItem, { paddingLeft: 20 }]}>
          <Text style={s.bullet}>g.</Text>
          <Text style={s.listContent}>
            Confidential information will also include any information that has
            been disclosed by a third party to the Employer and is protected by
            a Non-Disclosure entered into between the third party and the
            employer.
          </Text>
        </View>

        {/* 2. Non-Disclosure */}
        <SectionHeading number="2" title="NON-DISCLOSURE" />
        <Text style={s.justified}>
          Employee agrees that, except as directed by Employer, the Employee
          will not at any time, whether during or after his employment with
          Employer, disclose to any person or use any Confidential Information,
          or permit any person to examine and/or make copies of any documents
          which contain or are derived from Confidential Information, whether
          prepared by the Employee or otherwise coming into the Employee&apos;s
          possession or control without the prior written permission of
          Employer.
        </Text>

        {/* 3. Possession */}
        <SectionHeading number="3" title="POSSESSION" />
        <Text style={s.justified}>
          Employee agrees that upon request by Employer, and in any event upon
          termination of employment, Employee shall turn over to Employer all
          documents, papers or other material in her possession or under her
          control which may contain or be derived from Confidential Information,
          together with all documents, notes or other work product which is
          connected with or derived from Employee&apos;s services to Employer
          whether or not such material is at the date hereof in Employee&apos;s
          possession. Employee agrees that the Employee shall have no
          proprietary interest in any work product developed or used by Employee
          and arising out of his employment by Employer. Employee shall, from
          time to time as may be requested by Employer, do all things which may
          be necessary to establish or document Employer&apos;s ownership of any
          such work product, including, but not limited to execution of
          appropriate copyright applications or assignments.
        </Text>

        {/* 4. Non-Competition */}
        <SectionHeading number="4" title="NON-COMPETITION" />
        <Text style={s.justified}>
          Please note - In consideration of the company&apos;s new policy to
          have paid trainings for staff development, Employee shall not, until
          one year after termination of the employment relationship between
          Employer and Employee, engage, directly or indirectly, or through any
          corporations or associates in any trade, business, enterprise or
          employment which is competitive with Employer&apos;s current offering
          (Aspom Travel / Aspom Birth Services). After the one (1) year period,
          you will be limited to location of similar travel/birth services
          businesses in Lagos Island, Ikoyi, VI, VGC, Lekki-Epe Express Area.
        </Text>

        {/* 5. Training */}
        <SectionHeading number="5" title="TRAINING & TRAVEL COSTS AGREEMENT" />
        <Text style={s.justified}>
          The Employee undertakes to reimburse to the Employer Fifty percent
          (50%) of the training and/or travel costs if he/she resigns from the
          employment of the Employer within six (6) months after the end of the
          training(s) and or travelled on expense paid trip by the Employer.
        </Text>

        {/* 6. Saving Provision */}
        <SectionHeading number="6" title="SAVING PROVISION" />
        <Text style={s.justified}>
          Employer and Employee agree and stipulate that the agreements and
          covenants not to compete contained in the preceding paragraph are fair
          and reasonable in light of all of the facts and circumstances of the
          relationship between Employee and Employer; however, Employee and
          Employer are aware that in certain circumstances courts have refused
          to enforce certain agreements not to compete. Therefore, in
          furtherance of and not in derogation of the provisions of the
          preceding paragraph, Employer and Employee agree that in the event a
          court should decline to enforce the provisions of the preceding
          paragraph, that paragraph shall be deemed to be modified to restrict
          Employee&apos;s competition with Employer to the maximum extent, in
          both time and geography, which the court shall find enforceable;
          however, in no event shall the provisions of the preceding paragraph
          be deemed to be more restrictive to Employee than those contained
          therein.
        </Text>

        {/* 7. Enforceable */}
        <SectionHeading number="7" title="ENFORCEABLE" />
        <Text style={s.justified}>
          The provisions of this Agreement shall be enforceable notwithstanding
          the existence of any claim or cause of action of Employee against
          Employer whether predicated on this Agreement or otherwise.
        </Text>

        {/* 8. Entire Agreement */}
        <SectionHeading number="8" title="ENTIRE AGREEMENT" />
        <Text style={s.justified}>
          This Agreement contains the entire agreement of the parties relating
          to the subject matter hereof. This Agreement may be modified only by
          an instrument in writing signed by both parties hereto.
        </Text>

        {/* 9. Injunctive Relief */}
        <SectionHeading number="9" title="INJUNCTIVE RELIEF" />
        <Text style={s.justified}>
          The Employee acknowledges that disclosure of any Confidential
          Information or breach of any of the non-competitive covenants or
          agreements contained herein will give rise to irreparable injury to
          Employer or clients of Employer, inadequately compensable in damages.
          Accordingly, Employer or, where appropriate a client of Employer, may
          seek and obtain injunctive relief against the breach or threatened
          breach of the foregoing undertakings, in addition to any other legal
          remedies which may be available. The Employee further acknowledges and
          agrees that in the event of the termination of employment with the
          Employer the Employee&apos;s experience and capabilities are such that
          the Employee can obtain employment in business activities which are of
          a different or non-competing nature with his or her activities as an
          employee of Employer; and that the enforcement of a remedy hereunder
          by way of injunction shall not prevent the Employee from earning a
          reasonable livelihood. The Employee further acknowledges and agrees
          that the covenants contained herein are necessary for the protection
          of the Employer&apos;s legitimate business interests and are
          reasonable in scope and content.
        </Text>

        {/* 10. Employer's Clients */}
        <SectionHeading number="10" title="EMPLOYER'S CLIENTS" />
        <Text style={s.justified}>
          If Employee&apos;s employment with Employer terminates for any reason,
          the Employee shall not, for a period of one year from the date of
          termination, have any business dealings whatsoever, either directly or
          indirectly or through corporate entities or associates with any
          customer or client of Employer or its subsidiaries or any person or
          firm which has contacted or been contacted by Employer as a potential
          customer or client of Employer; and Employee shall keep in strictest
          confidence, both during the Employee&apos;s employment and subsequent
          to termination of employment, and shall not during the period of
          employment or thereafter disclose or divulge to any person, firm or
          corporation, or use directly or indirectly, for the Employee&apos;s
          own benefit or the benefit of others, any information which in good
          faith and good conscience ought to be treated as confidential
          information including, without limitation, information relating to the
          software developed by Employer, information as to sources of, and
          arrangements for, hardware supplied to customers or clients of
          Employer, submission and proposal procedures of Employer, customer or
          contact lists or any other Confidential Information.
        </Text>

        {/* 11. Governing Law */}
        <SectionHeading number="11" title="GOVERNING LAW" />
        <Text style={s.justified}>
          The Agreement shall be construed in accordance with the Laws of
          Nigeria.
        </Text>

        {/* 12. Notice */}
        <SectionHeading number="12" title="NOTICE" />
        <Text style={s.justified}>
          Any notice to be given under this Agreement shall be sufficient if it
          is in writing and is sent by certified or registered mail to Employee
          at his residence address as the same appears on the books and records
          of Employer or to Employer at its principal office, attention of the
          Director, or otherwise as directed by Employer, from time to time.
        </Text>

        {/* 13. Survival */}
        <SectionHeading number="13" title="SURVIVAL" />
        <Text style={s.justified}>
          The provisions of this Agreement relating to confidentiality or
          non-competition shall survive the termination of employment, however
          caused.
        </Text>

        {/* 14. Execution */}
        <SectionHeading number="14" title="EXECUTION" />
        <Text style={[s.justified, { marginBottom: 14 }]}>
          IN WITNESS WHEREOF the undersigned parties hereto have caused this
          Agreement to be duly executed by their respective representatives duly
          authorized, as of the day and year first above written.
        </Text>

        {/* Employer seal */}
        <Text style={[s.bold, { marginBottom: 6 }]}>
          The Common Seal of Aspom Travel Agency Limited (Employer) is herein
          affixed
        </Text>
        <Text style={[s.text, { marginBottom: 14 }]}>IN THE PRESENCE OF</Text>

        {/* Secretary & Director — intentionally blank */}
        <View style={s.signatureRow}>
          <View style={s.signatureCol}>
            <View style={s.signatureLine} />
            <Text style={s.bold}>SECRETARY</Text>
          </View>
          <View style={s.signatureCol}>
            <View style={s.signatureLine} />
            <Text style={s.bold}>DIRECTOR</Text>
          </View>
        </View>

        {/* Employee signature */}
        <View style={{ marginTop: 24 }}>
          <Text style={[s.bold, { marginBottom: 14 }]}>THE EMPLOYEE</Text>

          <View style={{ marginBottom: 4, width: 200 }}>
            {signatureUrl ? (
              <Image
                src={signatureUrl}
                style={{
                  width: 150,
                  height: 50,
                  borderBottom: "1pt solid #000",
                }}
              />
            ) : (
              <View
                style={{
                  borderBottom: "1pt solid #000",
                  height: 40,
                  width: 200,
                }}
              />
            )}
          </View>
          <Text style={[s.bold, { marginBottom: 16 }]}>(Employee)</Text>

          <Text style={[s.text, { marginBottom: 12 }]}>
            IN THE PRESENCE OF:
          </Text>

          {/* Witness fields */}
          {[
            { label: "Name", value: "" },
            { label: "Address", value: "" },
            { label: "Occupation", value: "" },
            { label: "Signature", value: "" },
            { label: "Date", value: signatureDate || "" },
          ].map(({ label, value }) => (
            <View
              key={label}
              style={{
                flexDirection: "row",
                marginBottom: 12,
                alignItems: "flex-end",
              }}
            >
              <Text style={[s.text, { width: 70 }]}>{label}:</Text>
              <Text
                style={[
                  s.text,
                  { borderBottom: "1pt solid #000", flex: 1, paddingBottom: 1 },
                ]}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>

        {/* Blue footer bar */}
        <View style={s.blueBar} fixed />
      </Page>
    </Document>
  );
};
