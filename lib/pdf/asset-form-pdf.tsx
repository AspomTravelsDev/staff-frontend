import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { InventoryAssignment } from "@/lib/api/inventory";
import { getRoleLabel } from "@/types/user-types";
import { format } from "date-fns";

const formatPdfDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm");
  } catch (e) {
    return String(dateStr);
  }
};

const COMPANY_LOGO_URL = "/aspom-logo.png";

const styles = StyleSheet.create({
  page: {
    padding: "16mm",
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.4,
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottom: "1.5pt solid #0f172a",
    paddingBottom: 8,
  },
  logo: {
    width: 90,
    height: 40,
    objectFit: "contain",
  },
  headerTitleContainer: {
    flex: 1,
    textAlign: "center",
    paddingRight: 30,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  declarationLine: {
    fontSize: 9.5,
    marginTop: 8,
    marginBottom: 12,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginBottom: 12,
    border: "0.8pt solid #64748b",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "0.8pt solid #64748b",
    padding: "5 4",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#0f172a",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #cbd5e1",
    padding: "5 4",
    fontSize: 8.5,
    alignItems: "center",
  },
  colSN: { width: "8%", textAlign: "center" },
  colAsset: { width: "22%" },
  colModel: { width: "32%" },
  colSerial: { width: "23%", fontFamily: "Helvetica-Bold" },
  colState: { width: "15%", textAlign: "center" },
  undertakingHeader: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 4,
    marginBottom: 2,
  },
  undertakingSubheader: {
    fontSize: 8.5,
    color: "#334155",
    marginBottom: 6,
  },
  termsList: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  termItem: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 8,
    color: "#1e293b",
    lineHeight: 1.35,
  },
  termNumber: {
    width: "4%",
    fontFamily: "Helvetica-Bold",
  },
  termText: {
    width: "96%",
  },
  acknowledgementText: {
    fontSize: 8,
    marginTop: 6,
    marginBottom: 6,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  declarationFooterText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 4,
    marginBottom: 14,
  },
  signaturesGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  sigCard: {
    flex: 1,
    border: "0.8pt solid #94a3b8",
    borderRadius: 2,
    padding: 8,
    backgroundColor: "#fafafa",
  },
  sigHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#0f172a",
    borderBottom: "0.5pt solid #cbd5e1",
    paddingBottom: 4,
    marginBottom: 6,
  },
  sigRow: {
    flexDirection: "row",
    marginBottom: 3,
    fontSize: 8,
  },
  sigLabel: {
    width: "35%",
    color: "#475569",
    fontFamily: "Helvetica-Bold",
  },
  sigVal: {
    width: "65%",
    color: "#0f172a",
  },
  sigStatusApproved: {
    color: "#166534",
    fontFamily: "Helvetica-Bold",
  },
  sigStatusPending: {
    color: "#b45309",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: "8mm",
    left: "16mm",
    right: "16mm",
    borderTop: "0.5pt solid #cbd5e1",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94a3b8",
  },
});

interface AssetFormPdfProps {
  assignment?: InventoryAssignment | null;
  assignments?: InventoryAssignment[];
  title?: string;
}

export function AssetFormPdfDocument({
  assignment,
  assignments,
}: AssetFormPdfProps) {
  const itemsList: InventoryAssignment[] = assignments
    ? assignments
    : assignment
    ? [assignment]
    : [];

  const mainAssignment = itemsList[0];
  const assigneeName = mainAssignment?.assignee?.name || "________________________";
  const rawRole = mainAssignment?.assignee?.role;
  const assigneeRole = getRoleLabel(rawRole) || rawRole || "Staff Member";
  const assigneeDept = mainAssignment?.assignee?.department || "";
  const formattedDate = formatPdfDate(mainAssignment?.createdAt || new Date());

  const displayItems = [...itemsList];

  return (
    <Document title={`Asset Declaration Undertaking - ${assigneeName}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={COMPANY_LOGO_URL} style={styles.logo} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>ASSET DECLARATION UNDERTAKING</Text>
          </View>
        </View>

        {/* Declaration sentence */}
        <Text style={styles.declarationLine}>
          I, <Text style={styles.bold}>{assigneeName}</Text> working as{" "}
          <Text style={styles.bold}>
            {assigneeRole}
            {assigneeDept && assigneeDept.toLowerCase() !== assigneeRole.toLowerCase()
              ? ` (${assigneeDept})`
              : ""}
          </Text>{" "}
          has been allotted the following asset to work.
        </Text>

        {/* Assets Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colSN}>S/N</Text>
            <Text style={styles.colAsset}>ASSET</Text>
            <Text style={styles.colModel}>MODEL</Text>
            <Text style={styles.colSerial}>SERIAL NUMBER</Text>
            <Text style={styles.colState}>CURRENT STATE</Text>
          </View>

          {displayItems.map((item, idx) => (
            <View key={item.id || idx} style={styles.tableRow}>
              <Text style={styles.colSN}>{idx + 1}</Text>
              <Text style={styles.colAsset}>
                {item.inventoryItem?.category || "Gadget"}
              </Text>
              <Text style={styles.colModel}>
                {item.inventoryItem?.name || "Equipment"}
              </Text>
              <Text style={styles.colSerial}>
                {item.inventoryItem?.serialNumber || "—"}
              </Text>
              <Text style={styles.colState}>
                {item.staffConditionRating ||
                  item.inventoryItem?.conditionRating ||
                  "Good"}
              </Text>
            </View>
          ))}
        </View>

        {/* Undertaking Heading */}
        <Text style={styles.undertakingHeader}>List of Asset Allotted</Text>
        <Text style={styles.undertakingSubheader}>
          The above assets are issued to the individual with below undertaking:
        </Text>

        {/* 6 Terms List */}
        <View style={styles.termsList}>
          <View style={styles.termItem}>
            <Text style={styles.termNumber}>1.</Text>
            <Text style={styles.termText}>
              The above asset issue is solely for the official purpose and will
              continue to remain ASPOM TRAVELS property.
            </Text>
          </View>

          <View style={styles.termItem}>
            <Text style={styles.termNumber}>2.</Text>
            <Text style={styles.termText}>
              The employee will be fully accountable for theft, damage or loss
              of the property and if such event occurs will be liable to pay
              equivalent amount or company retains right to deduct it from
              salary.
            </Text>
          </View>

          <View style={styles.termItem}>
            <Text style={styles.termNumber}>3.</Text>
            <Text style={styles.termText}>
              Employee has performed the necessary check before owning the
              possession of above asset and if in case future malfunctioning
              employee will inform the company by sending a mail to{" "}
              <Text style={styles.bold}>hr@aspomtravels.com</Text> within 24
              hours of the issue arising. Failure to do so will result in a
              daily penalty charge (Company’s Discretion) until asset is
              returned.
            </Text>
          </View>

          <View style={styles.termItem}>
            <Text style={styles.termNumber}>4.</Text>
            <Text style={styles.termText}>
              Unless permitted in writing, employee will not take asset for
              repair to outside vendor.
            </Text>
          </View>

          <View style={styles.termItem}>
            <Text style={styles.termNumber}>5.</Text>
            <Text style={styles.termText}>
              Staff have 24 hours to confirm gadget assigned and return filled
              asset form.
            </Text>
          </View>

          <View style={styles.termItem}>
            <Text style={styles.termNumber}>6.</Text>
            <Text style={styles.termText}>
              New staff not up to 1 month cannot take gadget except approval is
              given.
            </Text>
          </View>
        </View>

        {/* Final Paycheck / Offboarding Clause */}
        <Text style={styles.acknowledgementText}>
          In addition, I acknowledge that I will not receive my last pay check
          unless I return the above mentioned assets. Should final pay check
          not cover expenses, Aspomtravels retains the right to file for
          reimbursement through court proceedings.
        </Text>

        <Text style={styles.declarationFooterText}>
          I have read and understood the terms and conditions laid and declare
          to abide by them.
        </Text>

        {/* Signatures & Approvals */}
        <View style={styles.signaturesGrid}>
          {/* Employee Signature Card */}
          <View style={styles.sigCard}>
            <Text style={styles.sigHeader}>(Employee)</Text>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Name:</Text>
              <Text style={styles.sigVal}>{assigneeName}</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Designation:</Text>
              <Text style={styles.sigVal}>
                {assigneeRole}
                {assigneeDept && assigneeDept.toLowerCase() !== assigneeRole.toLowerCase()
                  ? ` (${assigneeDept})`
                  : ""}
              </Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Signature:</Text>
              <Text
                style={
                  mainAssignment?.staffDecision === "approved"
                    ? styles.sigStatusApproved
                    : styles.sigStatusPending
                }
              >
                {mainAssignment?.staffDecision === "approved"
                  ? "[ACCEPTED DIGITALLY]"
                  : "________________________"}
              </Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Date:</Text>
              <Text style={styles.sigVal}>
                {mainAssignment?.staffDecidedAt
                  ? formatPdfDate(mainAssignment.staffDecidedAt)
                  : formattedDate}
              </Text>
            </View>
          </View>

          {/* Admin Officer (In The Presence Of) Signature Card */}
          <View style={styles.sigCard}>
            <Text style={styles.sigHeader}>IN THE PRESENCE OF:</Text>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Name:</Text>
              <Text style={styles.sigVal}>
                {mainAssignment?.officer?.name ||
                  mainAssignment?.initiator?.name ||
                  "Admin Officer"}
              </Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Designation:</Text>
              <Text style={styles.sigVal}>Admin / IT Officer</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Signature:</Text>
              <Text
                style={
                  mainAssignment?.officerDecision === "approved"
                    ? styles.sigStatusApproved
                    : styles.sigStatusPending
                }
              >
                {mainAssignment?.officerDecision === "approved"
                  ? "[VERIFIED DIGITALLY]"
                  : "________________________"}
              </Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Date:</Text>
              <Text style={styles.sigVal}>
                {mainAssignment?.officerDecidedAt
                  ? formatPdfDate(mainAssignment.officerDecidedAt)
                  : "________________________"}
              </Text>
            </View>
          </View>

          {/* Compliance Officer Signature Card */}
          <View style={styles.sigCard}>
            <Text style={styles.sigHeader}>COMPLIANCE'S NAME:</Text>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Name:</Text>
              <Text style={styles.sigVal}>
                {mainAssignment?.complianceOfficer?.name ||
                  "Compliance Officer"}
              </Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Designation:</Text>
              <Text style={styles.sigVal}>Compliance Auditor</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Signature:</Text>
              <Text
                style={
                  mainAssignment?.status === "completed" ||
                  mainAssignment?.complianceDecision === "approved"
                    ? styles.sigStatusApproved
                    : styles.sigStatusPending
                }
              >
                {mainAssignment?.status === "completed" ||
                mainAssignment?.complianceDecision === "approved"
                  ? "[AUDITED DIGITALLY]"
                  : "________________________"}
              </Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Date:</Text>
              <Text style={styles.sigVal}>
                {mainAssignment?.complianceDecidedAt
                  ? formatPdfDate(mainAssignment.complianceDecidedAt)
                  : "________________________"}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>ASPOM Travel Agency — Official Asset Declaration Form</Text>
          <Text>System Generated Document — ASPOM Staff Portal</Text>
        </View>
      </Page>
    </Document>
  );
}
