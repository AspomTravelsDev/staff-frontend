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
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch (e) {
    return String(dateStr);
  }
};

const COMPANY_LOGO_URL = "/aspom-logo.png";

const styles = StyleSheet.create({
  page: {
    padding: "12mm 16mm",
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.35,
    color: "#0f172a",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 14,
  },
  logo: {
    width: 110,
    height: 42,
    objectFit: "contain",
    marginBottom: 6,
  },
  docTitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  docSubtitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginTop: 2,
  },
  detailsBlock: {
    marginTop: 12,
    marginBottom: 14,
    gap: 6,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    marginRight: 6,
  },
  fieldValue: {
    fontSize: 10,
    fontFamily: "Times-Roman",
    borderBottomWidth: 0.8,
    borderBottomColor: "#64748b",
    borderBottomStyle: "dotted",
    flex: 1,
    paddingBottom: 1,
  },
  table: {
    marginBottom: 14,
    borderWidth: 0.8,
    borderColor: "#475569",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 0.8,
    borderBottomColor: "#475569",
    padding: "4 6",
  },
  colAssetHeader: { width: "32%", fontFamily: "Times-Bold", fontSize: 9.5 },
  colStaffHeader: { width: "16%", fontFamily: "Times-Bold", fontSize: 9.5, textAlign: "center" },
  colOfficerHeader: { width: "18%", fontFamily: "Times-Bold", fontSize: 9.5, textAlign: "center" },
  colCommentsHeader: { width: "34%", fontFamily: "Times-Bold", fontSize: 9.5 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    padding: "4 6",
    minHeight: 20,
    alignItems: "center",
  },
  colAssetCell: { width: "32%", fontSize: 9.5, fontFamily: "Times-Bold" },
  colStaffCell: { width: "16%", fontSize: 10, textAlign: "center", fontFamily: "Times-Bold" },
  colOfficerCell: { width: "18%", fontSize: 10, textAlign: "center", fontFamily: "Times-Bold" },
  colCommentsCell: { width: "34%", fontSize: 9 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    marginTop: 10,
    marginBottom: 4,
    color: "#0f172a",
  },
  commentBox: {
    minHeight: 48,
    marginBottom: 14,
    paddingTop: 2,
  },
  commentLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: "#94a3b8",
    borderBottomStyle: "dotted",
    height: 18,
    fontSize: 9.5,
    paddingLeft: 2,
  },
  sigGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 14,
  },
  sigBlock: {
    width: "44%",
  },
  sigDottedLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: "#64748b",
    borderBottomStyle: "dotted",
    minHeight: 14,
    marginBottom: 3,
    fontSize: 9.5,
  },
  sigLabel: {
    fontSize: 9,
    fontFamily: "Times-Bold",
  },
  clearanceGrid: {
    flexDirection: "row",
    borderWidth: 0.8,
    borderColor: "#475569",
    marginTop: 12,
    marginBottom: 16,
    height: 38,
  },
  clearanceCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clearanceColLeft: {
    borderRightWidth: 0.8,
    borderRightColor: "#475569",
  },
  clearanceTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
  },
  pageFooter: {
    position: "absolute",
    bottom: "8mm",
    left: "16mm",
    right: "16mm",
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
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
    allAssignments.length > 0 ? allAssignments : [assignment];

  const assigneeName = assignment.assignee?.name || "";
  const assigneeDept = assignment.assignee?.department || "";
  const createdDateStr = formatPdfDate(assignment.createdAt);
  const officerDateStr = formatPdfDate(assignment.officerDecidedAt);
  const complianceDateStr = formatPdfDate(assignment.complianceDecidedAt || assignment.updatedAt);

  const isCleared = assignment.status === "cleared" || assignment.complianceDecision === "approved";

  // Build standard checklist items with dynamic verification
  const defaultChecklist = [
    { name: "LAPTOP", catMatch: "Laptop" },
    { name: "PHONE", catMatch: "Phone" },
    { name: "MOUSE", catMatch: "Gadget" },
    { name: "SIM CARD", catMatch: "Gadget" },
    { name: "LAPTOP CHARGER", catMatch: "Laptop" },
    { name: "PHONE CHARGER", catMatch: "Phone" },
  ];

  const checklistRows = defaultChecklist.map((checkItem) => {
    // Find matching surrendered item if any
    const matched = itemsToDisplay.find(
      (item) =>
        item.inventoryItem?.category === checkItem.catMatch ||
        item.inventoryItem?.name?.toUpperCase().includes(checkItem.name)
    );

    const isStaffChecked = !!assignment.staffDecision || !!assignment.assignee;
    const isOfficerChecked = !!assignment.officerDecision;

    let commentText = "";
    if (matched?.inventoryItem) {
      commentText = `${matched.inventoryItem.name} (${matched.inventoryItem.serialNumber})`;
      if (matched.returnConditionRating) {
        commentText += ` — ${matched.returnConditionRating}`;
      }
      if (matched.damageAssessmentFee && matched.damageAssessmentFee > 0) {
        commentText += ` (Damage Fee: ₦${matched.damageAssessmentFee.toLocaleString()})`;
      }
    }

    return {
      assetDescription: checkItem.name,
      staffCheck: isStaffChecked ? "✓" : "",
      officerCheck: isOfficerChecked ? "✓" : "",
      comments: commentText,
    };
  });

  return (
    <Document title={`Employee Asset Clearance Checklist - ${assigneeName}`}>
      {/* Page 1 */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image src={COMPANY_LOGO_URL} style={styles.logo} />
          <Text style={styles.docTitle}>
            EMPLOYEE ASSET (GADGET) CLEARANCE CHECK-LIST
          </Text>
          <Text style={styles.docSubtitle}>(IT DEPARTMENT)</Text>
        </View>

        {/* Employee Details */}
        <View style={styles.detailsBlock}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>EMPLOYEE'S NAME:</Text>
            <Text style={styles.fieldValue}>{assigneeName}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>DEPARTMENT:</Text>
            <Text style={styles.fieldValue}>{assigneeDept}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>PHONE NOS:</Text>
            <Text style={styles.fieldValue}></Text>
          </View>
        </View>

        {/* Check-list Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colAssetHeader}>ASSET DESCRIPTION</Text>
            <Text style={styles.colStaffHeader}>STAFF ☑</Text>
            <Text style={styles.colOfficerHeader}>IT OFFICER ☑</Text>
            <Text style={styles.colCommentsHeader}>COMMENTS</Text>
          </View>

          {checklistRows.map((row, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.colAssetCell}>{row.assetDescription}</Text>
              <Text style={styles.colStaffCell}>{row.staffCheck}</Text>
              <Text style={styles.colOfficerCell}>{row.officerCheck}</Text>
              <Text style={styles.colCommentsCell}>{row.comments}</Text>
            </View>
          ))}
        </View>

        {/* Employee Comments */}
        <Text style={styles.sectionTitle}>
          EMPLOYEE'S COMMENT ON THE CONDITION OF THE GADGET WHEN ASSIGNED
        </Text>
        <View style={styles.commentBox}>
          <Text style={styles.commentLine}>
            {assignment.staffNotes || assignment.initiateNotes || ""}
          </Text>
          <Text style={styles.commentLine}></Text>
        </View>

        {/* Page 1 Signatures */}
        <View style={styles.sigGrid}>
          <View style={styles.sigBlock}>
            <View style={styles.sigDottedLine}>
              <Text>{assigneeName}</Text>
            </View>
            <Text style={styles.sigLabel}>EMPLOYEE NAME</Text>
          </View>

          <View style={styles.sigBlock}>
            <View style={styles.sigDottedLine}>
              <Text>{createdDateStr}</Text>
            </View>
            <Text style={styles.sigLabel}>SIGNATURE/DATE</Text>
          </View>
        </View>
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={styles.page}>
        {/* IT Officer Comments */}
        <Text style={styles.sectionTitle}>
          IT OFFICER'S COMMENT ON THE CONDITION OF THE GADGET WHEN RETRIEVED
        </Text>
        <View style={styles.commentBox}>
          <Text style={styles.commentLine}>
            {assignment.officerNotes || assignment.returnConditionDetails || ""}
          </Text>
          <Text style={styles.commentLine}></Text>
          <Text style={styles.commentLine}></Text>
          <Text style={styles.commentLine}></Text>
        </View>

        {/* Clearance Box */}
        <View style={styles.clearanceGrid}>
          <View style={[styles.clearanceCol, styles.clearanceColLeft]}>
            <Text style={styles.clearanceTitle}>
              {isCleared ? "[ ✓ ] CLEARED" : "CLEARED"}
            </Text>
          </View>
          <View style={styles.clearanceCol}>
            <Text style={styles.clearanceTitle}>
              {!isCleared ? "[ ✓ ] NOT CLEARED" : "NOT CLEARED"}
            </Text>
          </View>
        </View>

        {/* IT Officer Signatures */}
        <View style={styles.sigGrid}>
          <View style={styles.sigBlock}>
            <View style={styles.sigDottedLine}>
              <Text>{assignment.officer?.name || ""}</Text>
            </View>
            <Text style={styles.sigLabel}>IT OFFICER'S NAME</Text>
          </View>

          <View style={styles.sigBlock}>
            <View style={styles.sigDottedLine}>
              <Text>{officerDateStr}</Text>
            </View>
            <Text style={styles.sigLabel}>SIGNATURE/DATE</Text>
          </View>
        </View>

        {/* Compliance Signatures */}
        <View style={styles.sigGrid}>
          <View style={styles.sigBlock}>
            <View style={styles.sigDottedLine}>
              <Text>{assignment.complianceOfficer?.name || ""}</Text>
            </View>
            <Text style={styles.sigLabel}>COMPLIANCE'S NAME</Text>
          </View>

          <View style={styles.sigBlock}>
            <View style={styles.sigDottedLine}>
              <Text>{complianceDateStr}</Text>
            </View>
            <Text style={styles.sigLabel}>SIGNATURE/DATE</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.pageFooter}>
          <Text>ASPOM Travel Agency — Employee Asset (Gadget) Clearance Check-List</Text>
          <Text>Issued: {complianceDateStr}</Text>
        </View>
      </Page>
    </Document>
  );
}

