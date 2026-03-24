import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ── Aspom logo URL (same as NDA) ─────────────────────────────────────────────
const COMPANY_LOGO_URL =
  "https://aspomtravels.com/wp-content/uploads/2021/08/Aspom-logo.png";

type StaffDetailsPdfProps = {
  title?: string;
  surname?: string;
  firstName?: string;
  middleNameInitials?: string;
  address?: string;
  busStop?: string;
  city?: string;
  state?: string;
  country?: string;
  nearestLandmark?: string;
  colourOfHouseGate?: string;
  colourOfGate?: string;
  personalTelephone?: string;
  alternativeTelephone?: string;
  emailAddress?: string;
  gender?: string;
  maritalStatus?: string;
  staffDesignation?: string;
  nationalIdOrVoterCardNo?: string;
  passportNo?: string;
  passportExpiryDate?: string;
  dateOfBirth?: string;
  birthplace?: string;
  religion?: string;
  languagesSpoken?: string;
  nextOfKin?: string;
  relationship?: string;
  nextOfKinAddress?: string;
  signatureUrl?: string;
  signatureDate?: string;
  reviewPerson?: string;
  staffId?: string;
  officialSignatureUrl?: string;
  officialDate?: string;
  passportPhotoUrl?: string;
  companyLogoUrl?: string;
};

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    paddingTop: 28,
    paddingBottom: 50,
    paddingHorizontal: 36,
    backgroundColor: "#fff",
  },
  // ── header ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  photoBox: {
    width: 90,
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
  logo: {
    width: 120,
    height: 60,
    objectFit: "contain",
  },
  pageTitle: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 6,
    borderBottom: "1.5pt solid #000",
    paddingBottom: 4,
  },
  // ── outer box ──
  outerBox: {
    border: "1pt solid #000",
    marginBottom: 6,
    padding: 8,
  },
  // ── section divider ──
  sectionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 6,
    marginTop: 4,
  },
  // ── field rows ──
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  label: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
    marginRight: 4,
    whiteSpace: "nowrap",
  },
  underline: {
    borderBottom: "0.75pt solid #000",
    flex: 1,
    paddingBottom: 1,
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    minHeight: 14,
  },
  subLabel: {
    fontFamily: "Times-Roman",
    fontSize: 8,
    color: "#444",
    textAlign: "center",
    marginTop: 1,
  },
  // ── name sub-fields ──
  nameBlock: {
    flexDirection: "row",
    flex: 1,
    gap: 6,
  },
  nameField: {
    flex: 1,
  },
  // ── two-col row ──
  halfRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  halfField: {
    flex: 1,
  },
  // ── address sub-row ──
  addrSubRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  addrSubField: {
    flex: 1,
  },
  // ── blue footer bar ──
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
    width: 280,
    height: 180,
    opacity: 0.05,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const Field = ({
  label,
  value = "",
  flex = 1,
  subLabel = "",
}: {
  label?: string;
  value?: string;
  flex?: number;
  subLabel?: string;
}) => (
  <View style={[s.nameField, { flex }]}>
    <View style={s.fieldRow}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <Text style={s.underline}>{value}</Text>
    </View>
    {subLabel ? <Text style={s.subLabel}>{subLabel}</Text> : null}
  </View>
);

const HalfField = ({
  label,
  value = "",
  subLabel = "",
}: {
  label: string;
  value?: string;
  subLabel?: string;
}) => (
  <View style={s.halfField}>
    <View style={s.fieldRow}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.underline}>{value}</Text>
    </View>
    {subLabel ? <Text style={s.subLabel}>{subLabel}</Text> : null}
  </View>
);

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StaffDetailsProps
 * @property {string} [title]            - e.g. "Mr", "Mrs"
 * @property {string} [surname]
 * @property {string} [firstName]
 * @property {string} [middleNameInitials]
 * @property {string} [address]
 * @property {string} [busStop]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [country]
 * @property {string} [nearestLandmark]
 * @property {string} [colourOfHouseGate]
 * @property {string} [colourOfGate]
 * @property {string} [personalTelephone]
 * @property {string} [alternativeTelephone]
 * @property {string} [emailAddress]
 * @property {string} [gender]
 * @property {string} [maritalStatus]
 * @property {string} [staffDesignation]
 * @property {string} [nationalIdOrVoterCardNo]
 * @property {string} [passportNo]
 * @property {string} [passportExpiryDate]
 * @property {string} [dateOfBirth]
 * @property {string} [birthplace]
 * @property {string} [religion]
 * @property {string} [languagesSpoken]
 * @property {string} [nextOfKin]
 * @property {string} [relationship]
 * @property {string} [nextOfKinAddress]
 * @property {string} [signatureUrl]
 * @property {string} [signatureDate]
 * @property {string} [reviewPerson]
 * @property {string} [staffId]
 * @property {string} [officialSignatureUrl]
 * @property {string} [officialDate]
 * @property {string} [passportPhotoUrl]
 * @property {string} [companyLogoUrl]
 */

export const StaffDetailsPdf = ({
  title = "",
  surname = "",
  firstName = "",
  middleNameInitials = "",
  address = "",
  busStop = "",
  city = "",
  state = "",
  country = "",
  nearestLandmark = "",
  colourOfHouseGate = "",
  colourOfGate = "",
  personalTelephone = "",
  alternativeTelephone = "",
  emailAddress = "",
  gender = "",
  maritalStatus = "",
  staffDesignation = "",
  nationalIdOrVoterCardNo = "",
  passportNo = "",
  passportExpiryDate = "",
  dateOfBirth = "",
  birthplace = "",
  religion = "",
  languagesSpoken = "",
  nextOfKin = "",
  relationship = "",
  nextOfKinAddress = "",
  signatureUrl,
  signatureDate = "",
  reviewPerson = "",
  staffId = "",
  officialSignatureUrl,
  officialDate = "",
  passportPhotoUrl,
  companyLogoUrl = COMPANY_LOGO_URL,
}: StaffDetailsPdfProps) => (
  <Document title="Staff Details Form">
    <Page size="A4" style={s.page}>
      {/* Watermark */}
      <Image src={companyLogoUrl} style={s.watermark} fixed />

      {/* Header */}
      <View style={s.headerRow}>
        {/* Passport photo box */}
        <View style={s.photoBox}>
          {passportPhotoUrl ? (
            <Image
              src={passportPhotoUrl}
              style={{ width: 80, height: 80, objectFit: "cover" }}
            />
          ) : (
            <Text style={s.photoBoxText}>
              Please attach a recent{"\n"}passport photograph
            </Text>
          )}
        </View>

        {/* Logo */}
        <Image src={companyLogoUrl} style={s.logo} />
      </View>

      {/* Page title */}
      <Text style={s.pageTitle}>STAFF DETAILS</Text>

      {/* ── Main section ────────────────────────────────── */}
      <View style={s.outerBox}>
        {/* Name row */}
        <View style={[s.fieldRow, { marginBottom: 2 }]}>
          <Text style={s.label}>Name:</Text>
          <View style={s.nameBlock}>
            <View style={s.nameField}>
              <Text style={s.underline}>{title}</Text>
              <Text style={s.subLabel}>(Title)</Text>
            </View>
            <View style={s.nameField}>
              <Text style={s.underline}>{surname}</Text>
              <Text style={s.subLabel}>(Surname / Last Name)</Text>
            </View>
            <View style={s.nameField}>
              <Text style={s.underline}>{firstName}</Text>
              <Text style={s.subLabel}>(First Name)</Text>
            </View>
            <View style={s.nameField}>
              <Text style={s.underline}>{middleNameInitials}</Text>
              <Text style={s.subLabel}>(Middle Name/Initials)</Text>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={[s.fieldRow, { marginTop: 8, marginBottom: 2 }]}>
          <Text style={s.label}>Address:</Text>
          <Text style={s.underline}>{address}</Text>
        </View>

        {/* Address sub-row */}
        <View style={s.addrSubRow}>
          <View style={s.addrSubField}>
            <Text style={s.underline}>{busStop}</Text>
            <Text style={s.subLabel}>(Bus stop)</Text>
          </View>
          <View style={s.addrSubField}>
            <Text style={s.underline}>{city}</Text>
            <Text style={s.subLabel}>(City)</Text>
          </View>
          <View style={s.addrSubField}>
            <Text style={s.underline}>{state}</Text>
            <Text style={s.subLabel}>(State)</Text>
          </View>
          <View style={s.addrSubField}>
            <Text style={s.underline}>{country}</Text>
            <Text style={s.subLabel}>(Country)</Text>
          </View>
        </View>

        {/* Landmark + Colour of House */}
        <View style={s.halfRow}>
          <HalfField label="Nearest Landmark:" value={nearestLandmark} />
          <HalfField
            label="Colour of the House (Gate):"
            value={colourOfHouseGate}
          />
        </View>

        {/* Colour of Gate */}
        <View style={[s.fieldRow, { width: "50%" }]}>
          <Text style={s.label}>Colour of the Gate:</Text>
          <Text style={s.underline}>{colourOfGate}</Text>
        </View>

        {/* Phone numbers */}
        <View style={s.halfRow}>
          <HalfField label="Personal Telephone #:" value={personalTelephone} />
          <HalfField
            label="Alternative Telephone #:"
            value={alternativeTelephone}
          />
        </View>

        {/* Email */}
        <View style={s.fieldRow}>
          <Text style={s.label}>Email Address:</Text>
          <Text style={s.underline}>{emailAddress}</Text>
        </View>

        {/* Gender + Marital Status */}
        <View style={s.halfRow}>
          <HalfField label="Gender:" value={gender} />
          <HalfField label="Marital Status:" value={maritalStatus} />
        </View>

        {/* Staff Designation */}
        <View style={[s.fieldRow, { width: "70%" }]}>
          <Text style={s.label}>Staff Designation:</Text>
          <Text style={s.underline}>{staffDesignation}</Text>
        </View>

        {/* National ID */}
        <View style={s.fieldRow}>
          <Text style={s.label}>National ID or Voter&apos;s Card No:</Text>
          <Text style={s.underline}>{nationalIdOrVoterCardNo}</Text>
        </View>

        {/* Passport */}
        <View style={s.halfRow}>
          <HalfField label="Passport No:" value={passportNo} />
          <HalfField label="Passport Expiry Date:" value={passportExpiryDate} />
        </View>

        {/* ── Other Information ─────────────────────────── */}
        <Text style={s.sectionTitle}>Other Information</Text>

        {/* DOB + Birthplace */}
        <View style={s.halfRow}>
          <HalfField label="Date of Birth:" value={dateOfBirth} />
          <HalfField label="Birthplace:" value={birthplace} />
        </View>

        {/* Religion + Languages */}
        <View style={s.halfRow}>
          <HalfField label="Religion:" value={religion} />
          <HalfField label="Languages Spoken:" value={languagesSpoken} />
        </View>

        {/* Spacer */}
        <View style={{ height: 6 }} />

        {/* Next of Kin + Relationship */}
        <View style={s.halfRow}>
          <HalfField label="Next of Kin:" value={nextOfKin} />
          <HalfField label="Relationship:" value={relationship} />
        </View>

        {/* NOK Address */}
        <View style={s.fieldRow}>
          <Text style={s.label}>Address:</Text>
          <Text style={s.underline}>{nextOfKinAddress}</Text>
        </View>

        {/* Extra blank address lines */}
        <View style={[s.fieldRow, { marginTop: 2 }]}>
          <Text style={[s.underline, { flex: 1 }]}>{""}</Text>
        </View>
        <View style={[s.fieldRow, { marginTop: 2, marginBottom: 8 }]}>
          <Text style={[s.underline, { flex: 1 }]}>{""}</Text>
        </View>

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
            {signatureUrl && <Text style={s.label}>Signature</Text>}
          </View>
          <HalfField label="Date:" value={signatureDate} />
        </View>
      </View>

      {/* ── For Official Use ─────────────────────────────── */}
      <View style={s.outerBox}>
        <Text style={s.sectionTitle}>FOR OFFICIAL USE</Text>
        <View style={s.halfRow}>
          <HalfField label="Review Person:" value={reviewPerson} />
          <HalfField label="Staff ID:" value={staffId} />
        </View>
        <View style={s.halfRow}>
          <View style={s.halfField}>
            {officialSignatureUrl ? (
              <Image
                src={officialSignatureUrl}
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
          <HalfField label="Date:" value={officialDate} />
        </View>
      </View>

      {/* Blue footer */}
      <View style={s.blueBar} fixed />
    </Page>
  </Document>
);
