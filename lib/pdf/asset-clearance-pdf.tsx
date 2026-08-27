import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { InventoryAssignment } from "@/lib/api/inventory";
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
  colSN: { width: "6%", textAlign: "center" },
  colAsset: { width: "20%" },
  colModel: { width: "26%" },
  colSerial: { width: "20%", fontFamily: "Helvetica-Bold" },
  colState: { width: "14%", textAlign: "center" },
  colFee: { width: "14%", textAlign: "right", fontFamily: "Helvetica-Bold" },
  undertakingHeader: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 6,
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
  signaturesGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
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
    marginBottom: 4,
    borderBottom: "0.5pt solid #cbd5e1",
    paddingBottom: 2,
  },
  sigRow: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 7.5,
  },
  sigLabel: {
    width: "40%",
    color: "#64748b",
  },
  sigVal: {
    width: "60%",
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  approvedBadge: {
    marginTop: 4,
    padding: "2 4",
    backgroundColor: "#dcfce7",
    border: "0.5pt solid #16a34a",
    borderRadius: 2,
  },
  approvedText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    textAlign: "center",
  },
  pageFooter: {
    position: "absolute",
    bottom: "10mm",
    left: "16mm",
    right: "16mm",
    borderTop: "0.5pt solid #cbd5e1",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#64748b",
  },
});

interface AssetClearancePdfProps {
  assignment: InventoryAssignment;
  allAssignments?: InventoryAssignment[];
}

export function AssetClearancePdfDocument({
  assignment,
  allAssignments = [],
}: AssetClearancePdfProps) {
  const itemsToDisplay =
    allAssignments.length > 0
      ? allAssignments
      : [assignment];

  const assigneeName = assignment.assignee?.name || "Staff Member";
  const assigneeDept = assignment.assignee?.department || "General";
  const clearanceDate = formatPdfDate(assignment.complianceDecidedAt || assignment.updatedAt);

  const totalDamageFee = itemsToDisplay.reduce(
    (acc, curr) => acc + (curr.damageAssessmentFee || 0),
    0
  );

  return (
    <Document title={`Asset Clearance Certificate - ${assigneeName}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={COMPANY_LOGO_URL} style={styles.logo} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>OFFICIAL ASSET CLEARANCE CERTIFICATE</Text>
          </View>
        </View>

        {/* Declaration Line */}
        <Text style={styles.declarationLine}>
          This is to certify that <Text style={styles.bold}>{assigneeName}</Text> (Department:{" "}
          <Text style={styles.bold}>{assigneeDept}</Text>) has surrendered the assigned company asset(s) listed below.
        </Text>

        {/* Table of Returned Assets */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colSN}>S/N</Text>
            <Text style={styles.colAsset}>ASSET</Text>
            <Text style={styles.colModel}>BRAND / MODEL</Text>
            <Text style={styles.colSerial}>SERIAL NO.</Text>
            <Text style={styles.colState}>RETURN STATE</Text>
            <Text style={styles.colFee}>DAMAGE FEE</Text>
          </View>

          {itemsToDisplay.map((item, index) => (
            <View style={styles.tableRow} key={item.id || index}>
              <Text style={styles.colSN}>{index + 1}</Text>
              <Text style={styles.colAsset}>
                {item.inventoryItem?.category || "Gadget"}
              </Text>
              <Text style={styles.colModel}>{item.inventoryItem?.name || "—"}</Text>
              <Text style={styles.colSerial}>
                {item.inventoryItem?.serialNumber || "—"}
              </Text>
              <Text style={styles.colState}>
                {item.returnConditionRating || item.inventoryItem?.conditionRating || "Good"}
              </Text>
              <Text style={styles.colFee}>
                {item.damageAssessmentFee && item.damageAssessmentFee > 0
                  ? `₦${item.damageAssessmentFee.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                  : "₦0.00"}
              </Text>
            </View>
          ))}
        </View>

        {/* Undertaking Rules */}
        <Text style={styles.undertakingHeader}>Clearance Conditions & Discharge</Text>
        <Text style={styles.undertakingSubheader}>
          The asset clearance is completed under the following verified conditions:
        </Text>

        <View style={styles.termsList}>
          <View style={styles.termItem}>
            <Text style={styles.termNumber}>1.</Text>
            <Text style={styles.termText}>
              All listed equipment, accessories, and peripherals have been physically returned to the IT Department in verifiable working order.
            </Text>
          </View>
          <View style={styles.termItem}>
            <Text style={styles.termNumber}>2.</Text>
            <Text style={styles.termText}>
              Any assessed damage or missing component fee (Total: ₦{totalDamageFee.toLocaleString("en-NG", { minimumFractionDigits: 2 })}) is logged for HR/Accounts offboarding settlement.
            </Text>
          </View>
          <View style={styles.termItem}>
            <Text style={styles.termNumber}>3.</Text>
            <Text style={styles.termText}>
              Upon final Compliance approval, the staff member is discharged from custody liabilities for the returned devices.
            </Text>
          </View>
        </View>

        {/* Signatures 3-tier */}
        <Text style={styles.undertakingHeader}>Verification & Sign-off Audit</Text>
        <View style={styles.signaturesGrid}>
          {/* Employee */}
          <View style={styles.sigCard}>
            <Text style={styles.sigHeader}>1. Staff Surrender</Text>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Name:</Text>
              <Text style={styles.sigVal}>{assigneeName}</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Date:</Text>
              <Text style={styles.sigVal}>{formatPdfDate(assignment.createdAt)}</Text>
            </View>
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>SURRENDERED</Text>
            </View>
          </View>

          {/* IT Officer */}
          <View style={styles.sigCard}>
            <Text style={styles.sigHeader}>2. IT Physical Inspection</Text>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Inspector:</Text>
              <Text style={styles.sigVal}>{assignment.officer?.name || "IT Inspector"}</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Date:</Text>
              <Text style={styles.sigVal}>{formatPdfDate(assignment.officerDecidedAt)}</Text>
            </View>
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>INSPECTED & VERIFIED</Text>
            </View>
          </View>

          {/* Compliance */}
          <View style={styles.sigCard}>
            <Text style={styles.sigHeader}>3. Compliance Clearance Audit</Text>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Auditor:</Text>
              <Text style={styles.sigVal}>{assignment.complianceOfficer?.name || "Compliance Officer"}</Text>
            </View>
            <View style={styles.sigRow}>
              <Text style={styles.sigLabel}>Date:</Text>
              <Text style={styles.sigVal}>{clearanceDate}</Text>
            </View>
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>FINAL CLEARANCE APPROVED</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.pageFooter}>
          <Text>ASPOM Travel Agency — Official Asset Clearance Certificate</Text>
          <Text>Issued: {clearanceDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
