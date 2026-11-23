/* eslint-disable react/no-unescaped-entities */
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const COMPANY_LOGO_URL =
  "https://aspomtravels.com/wp-content/uploads/2021/08/Aspom-logo.png";

type EducationEntry = { institution: string; year: string };
type WorkEntry = { employer: string; year: string };

type PersonalDataFormProps = {
  title?: string;
  lastName?: string;
  firstName?: string;
  middleNameInitials?: string;
  address?: string;
  city?: string;
  lga?: string;
  state?: string;
  country?: string;
  personalTelephone?: string;
  alternativeTelephone?: string;
  emailAddress?: string;
  gender?: string;
  maritalStatus?: string;
  education?: EducationEntry[];
  workExperience?: WorkEntry[];
  dateOfBirth?: string;
  birthplace?: string;
  religion?: string;
  languagesSpoken?: string;
  emergencyContact?: string;
  relationship?: string;
  emergencyAddress?: string;
  bankDetails?: string;
  signatureDate?: string;
  passportPhotoUrl?: string;
  signatureUrl?: string;
  companyLogoUrl?: string;
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    paddingTop: 24,
    paddingBottom: 50,
    paddingHorizontal: 36,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  photoBox: {
    width: 100,
    height: 90,
    border: "1pt solid #000",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  photoBoxText: {
    fontFamily: "Times-Roman",
    fontSize: 8,
    textAlign: "center",
    color: "#333",
  },
  logo: { width: 120, height: 60, objectFit: "contain" },
  pageTitle: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 6,
    borderBottom: "1.5pt solid #000",
    paddingBottom: 4,
  },
  outerBox: { border: "1pt solid #000", marginBottom: 6 },
  innerPad: { padding: 8 },
  sectionTitle: {
    fontFamily: "Times-Roman",
    fontSize: 9,
    textAlign: "center",
    marginBottom: 6,
    marginTop: 2,
    borderBottom: "0.5pt solid #000",
    paddingBottom: 3,
  },
  sectionTitleItalic: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 4,
    marginTop: 2,
  },
  fieldRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 11 },
  label: { fontFamily: "Times-Bold", fontSize: 9.5, marginRight: 5, paddingBottom: 1 },
  labelItalic: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    marginRight: 5,
    color: "#333",
  },
  underline: {
    borderBottom: "0.75pt solid #000",
    flex: 1,
    paddingBottom: 2,
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    minHeight: 15,
  },
  subUnderline: {
    borderBottom: "0.75pt solid #000",
    width: "100%",
    paddingBottom: 2,
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    minHeight: 15,
  },
  subLabel: {
    fontFamily: "Times-Roman",
    fontSize: 7.5,
    color: "#444",
    textAlign: "center",
    marginTop: 3,
  },
  halfRow: { flexDirection: "row", gap: 12, marginBottom: 11 },
  halfField: { flex: 1 },
  addrSubRow: { flexDirection: "row", gap: 8, marginTop: 2, marginBottom: 12 },
  addrSubField: { flex: 1 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #000",
    marginBottom: 4,
    paddingBottom: 2,
  },
  tableHeaderLeft: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    flex: 3,
    color: "#333",
  },
  tableHeaderRight: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    width: 60,
    textAlign: "right",
    color: "#333",
  },
  tableRow: { flexDirection: "row", marginBottom: 14 },
  tableCell: {
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    flex: 3,
    borderBottom: "0.5pt solid #aaa",
    minHeight: 16,
  },
  tableCellYear: {
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    width: 60,
    textAlign: "right",
    borderBottom: "0.5pt solid #aaa",
    minHeight: 16,
  },
  educNotice: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  blueBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: "#1a3c8f",
  },
  watermark: {
    position: "absolute",
    top: "35%",
    left: "20%",
    width: 260,
    height: 170,
    opacity: 0.05,
  },
  noteText: {
    fontFamily: "Times-Italic",
    fontSize: 8.5,
    textAlign: "center",
    marginTop: 6,
    color: "#333",
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const HalfField = ({ label, value = "", italic = false }: { label: string; value?: string; italic?: boolean }) => (
  <View style={s.halfField}>
    <View style={[s.fieldRow, { marginBottom: 0 }]}>
      <Text style={italic ? s.labelItalic : s.label}>{label}</Text>
      <Text style={s.underline}>{value}</Text>
    </View>
  </View>
);

const FullField = ({ label, value = "", italic = false }: { label: string; value?: string; italic?: boolean }) => (
  <View style={s.fieldRow}>
    <Text style={italic ? s.labelItalic : s.label}>{label}</Text>
    <Text style={s.underline}>{value}</Text>
  </View>
);

const SubField = ({ value = "", subLabel }: { value?: string; subLabel: string }) => (
  <View style={s.addrSubField}>
    <Text style={s.subUnderline}>{value}</Text>
    <Text style={s.subLabel}>{subLabel}</Text>
  </View>
);

const TableRow = ({ left = "", year = "" }: { left?: string; year?: string }) => (
  <View style={s.tableRow}>
    <Text style={s.tableCell}>{left}</Text>
    <Text style={s.tableCellYear}>{year}</Text>
  </View>
);

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {{ institution: string, year: string }} EducationEntry
 * @typedef {{ employer: string, year: string }} WorkEntry
 *
 * @typedef {Object} PersonalDataFormProps
 * @property {string}  [title]
 * @property {string}  [lastName]
 * @property {string}  [firstName]
 * @property {string}  [middleNameInitials]
 * @property {string}  [address]
 * @property {string}  [city]
 * @property {string}  [state]
 * @property {string}  [country]
 * @property {string}  [personalTelephone]
 * @property {string}  [alternativeTelephone]
 * @property {string}  [emailAddress]
 * @property {string}  [gender]
 * @property {string}  [maritalStatus]
 * @property {EducationEntry[]} [education]       - up to 4 rows
 * @property {WorkEntry[]}      [workExperience]  - up to 3 rows
 * @property {string}  [dateOfBirth]
 * @property {string}  [birthplace]
 * @property {string}  [religion]
 * @property {string}  [languagesSpoken]
 * @property {string}  [emergencyContact]
 * @property {string}  [relationship]
 * @property {string}  [emergencyAddress]
 * @property {string}  [bankDetails]
 * @property {string}  [signatureDate]
 * @property {string}  [passportPhotoUrl]
 * @property {string}  [signatureUrl]
 * @property {string}  [companyLogoUrl]
 */

export const PersonalDataFormPdf = ({
  title = "",
  lastName = "",
  firstName = "",
  middleNameInitials = "",
  address = "",
  city = "",
  lga = "",
  state = "",
  country = "",
  personalTelephone = "",
  alternativeTelephone = "",
  emailAddress = "",
  gender = "",
  maritalStatus = "",
  education = [],
  workExperience = [],
  dateOfBirth = "",
  birthplace = "",
  religion = "",
  languagesSpoken = "",
  emergencyContact = "",
  relationship = "",
  emergencyAddress = "",
  bankDetails = "",
  signatureDate = "",
  passportPhotoUrl,
  signatureUrl,
  companyLogoUrl = COMPANY_LOGO_URL,
}: PersonalDataFormProps) => {
  // Pad table rows
  const edRows: EducationEntry[] = [...education];
  while (edRows.length < 4) edRows.push({ institution: "", year: "" });
  const wkRows: WorkEntry[] = [...workExperience];
  while (wkRows.length < 3) wkRows.push({ employer: "", year: "" });

  return (
    <Document title="Personal Data Form">
      <Page size="A4" style={s.page}>
        {/* Watermark */}
        <Image src={companyLogoUrl} style={s.watermark} fixed />

        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.photoBox}>
            {passportPhotoUrl ? (
              <Image
                src={passportPhotoUrl}
                style={{ width: 90, height: 80, objectFit: "cover" }}
              />
            ) : (
              <Text style={s.photoBoxText}>
                Please attach a recent passport{"\n"}photograph
              </Text>
            )}
          </View>
          <Image src={companyLogoUrl} style={s.logo} />
        </View>

        <Text style={s.pageTitle}>PERSONAL DATA FORM</Text>

        {/* ── Main box ──────────────────────────────────── */}
        <View style={s.outerBox}>
          <Text style={[s.sectionTitle, { paddingTop: 3 }]}>
            Personal Information
          </Text>

          <View style={s.innerPad}>
            {/* Name */}
            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                }}
              >
                <Text style={[s.label, { paddingTop: 2 }]}>Name:</Text>
                <View style={{ flexDirection: "row", flex: 1, gap: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.subUnderline}>{title}</Text>
                    <Text style={s.subLabel}>(Title)</Text>
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text style={s.subUnderline}>{lastName}</Text>
                    <Text style={s.subLabel}>(Last)</Text>
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text style={s.subUnderline}>{firstName}</Text>
                    <Text style={s.subLabel}>(First)</Text>
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text style={s.subUnderline}>{middleNameInitials}</Text>
                    <Text style={s.subLabel}>(Middle Name/Initials)</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Address */}
            <FullField label="Address:" value={address} />
            <View style={s.addrSubRow}>
              <SubField value={city} subLabel="(City)" />
              <SubField value={lga} subLabel="(LGA)" />
              <SubField value={state} subLabel="(State)" />
              <SubField value={country} subLabel="(Country)" />
            </View>

            {/* Phones */}
            <View style={s.halfRow}>
              <HalfField
                label="Personal Telephone #:"
                value={personalTelephone}
              />
              <HalfField
                label="Alternative Telephone#:"
                value={alternativeTelephone}
              />
            </View>

            {/* Email */}
            <FullField label="Email Address:" value={emailAddress} />

            {/* Gender + Marital */}
            <View style={s.halfRow}>
              <HalfField label="Gender:" value={gender} />
              <HalfField label="Marital Status:" value={maritalStatus} />
            </View>
          </View>

          {/* ── Education ───────────────────────────────── */}
          <View
            style={{
              borderTop: "0.75pt solid #000",
              paddingHorizontal: 8,
              paddingTop: 6,
              paddingBottom: 4,
            }}
          >
            <Text style={s.educNotice}>
              Educational Information (use extra sheet if required) Please
              provide copies of your educational qualification and{" "}
              <Text style={{ textDecoration: "underline" }}>
                come with the originals for sighting during your assessment
                centre interview
              </Text>
            </Text>
            <View style={s.tableHeader}>
              <Text style={s.tableHeaderLeft}>
                Educational Qualification/Institution
              </Text>
              <Text style={s.tableHeaderRight}>Year</Text>
            </View>
            {edRows.map((row, i) => (
              <TableRow key={i} left={row.institution} year={row.year} />
            ))}
          </View>

          {/* ── Work Experience ──────────────────────────── */}
          <View
            style={{
              borderTop: "0.75pt solid #000",
              paddingHorizontal: 8,
              paddingTop: 6,
              paddingBottom: 4,
            }}
          >
            <Text style={s.sectionTitleItalic}>
              Work Experience (Use extra sheet if required)
            </Text>
            <View style={s.tableHeader}>
              <Text style={s.tableHeaderLeft}>Employer/Position</Text>
              <Text style={s.tableHeaderRight}>Year</Text>
            </View>
            {wkRows.map((row, i) => (
              <TableRow key={i} left={row.employer} year={row.year} />
            ))}
          </View>
        </View>

        {/* ── Other Information ──────────────────────────── */}
        <View style={s.outerBox}>
          <Text style={[s.sectionTitle, { paddingTop: 3 }]}>
            Other Information
          </Text>
          <View style={s.innerPad}>
            <View style={s.halfRow}>
              <HalfField label="Date of Birth:" value={dateOfBirth} />
              <HalfField label="Birthplace:" value={birthplace} />
            </View>
            <View style={s.halfRow}>
              <HalfField label="Religion:" value={religion} />
              <HalfField label="Languages Spoken:" value={languagesSpoken} />
            </View>
            <View style={s.halfRow}>
              <HalfField
                label="Emergency Contact Person:"
                value={emergencyContact}
              />
              <HalfField label="Relationship:" value={relationship} />
            </View>
            <FullField
              label="Address (if different from employee):"
              value={emergencyAddress}
            />
            {/* Extra blank line */}
            <View style={[s.fieldRow, { marginTop: 2, marginBottom: 6 }]}>
              <Text style={[s.underline, { flex: 1 }]}>{""}</Text>
            </View>

            <FullField label="Bank Details:" value={bankDetails} />

            <View style={{ height: 8 }} />

            {/* Signature + Date */}
            <View style={s.halfRow}>
              <View style={s.halfField}>
                {signatureUrl ? (
                  <Image
                    src={signatureUrl}
                    style={{
                      width: 130,
                      height: 40,
                      borderBottom: "0.75pt solid #000",
                    }}
                  />
                ) : (
                  <View style={s.fieldRow}>
                    <Text style={s.label}>Signature:</Text>
                    <Text style={s.underline}>{""}</Text>
                  </View>
                )}
              </View>
              <HalfField label="Date:" value={signatureDate} />
            </View>
          </View>
        </View>

        {/* Blue footer */}
        <View style={s.blueBar} fixed />
      </Page>
    </Document>
  );
};
