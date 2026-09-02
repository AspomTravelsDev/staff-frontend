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
    fontSize: 11,
    lineHeight: 1.4,
    color: "#0f172a",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 14,
  },
  logo: {
    width: 115,
    height: 44,
    objectFit: "contain",
    marginBottom: 6,
  },
  docTitle: {
    fontSize: 13.5,
    fontFamily: "Times-Bold",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  docSubtitle: {
    fontSize: 12,
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
    fontSize: 11,
    fontFamily: "Times-Bold",
    marginRight: 6,
  },
  fieldValue: {
    fontSize: 11,
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
    padding: "5 6",
  },
  colAssetHeader: { width: "30%", fontFamily: "Times-Bold", fontSize: 10.5 },
  colStaffHeader: { width: "16%", fontFamily: "Times-Bold", fontSize: 10.5, textAlign: "center" },
  colOfficerHeader: { width: "18%", fontFamily: "Times-Bold", fontSize: 10.5, textAlign: "center" },
  colCommentsHeader: { width: "36%", fontFamily: "Times-Bold", fontSize: 10.5 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    padding: "5 6",
    minHeight: 22,
    alignItems: "center",
  },
  colAssetCell: { width: "30%", fontSize: 10.5, fontFamily: "Times-Bold" },
  colStaffCell: { width: "16%", fontSize: 11, textAlign: "center", fontFamily: "Times-Bold" },
  colOfficerCell: { width: "18%", fontSize: 11, textAlign: "center", fontFamily: "Times-Bold" },
  colCommentsCell: { width: "36%", fontSize: 10 },
  sectionTitle: {
    fontSize: 11,
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
    height: 19,
    fontSize: 10.5,
    paddingLeft: 2,
  },
  sigGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 14,
    marginBottom: 10,
    width: "100%",
  },
  sigBlock: {
    width: "46%",
    alignItems: "center",
  },
  sigDottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    borderBottomStyle: "solid",
    width: "100%",
    minHeight: 22,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 9.5,
    fontFamily: "Times-Bold",
    color: "#334155",
    textAlign: "center",
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

  // Build dynamic checklist items strictly from assigned/returned devices
  const checklistRows = itemsToDisplay.map((item) => {
    const itemName = item.inventoryItem?.name || item.inventoryItem?.category || "Device";
    const serialStr = item.inventoryItem?.serialNumber ? ` (${item.inventoryItem.serialNumber})` : "";
    const assetDescription = `${itemName}${serialStr}`.toUpperCase();

    const isStaffChecked = !!item.staffDecision || !!item.staffNotes || !!item.staffConditionDetails || !!item.assignee;
    const isOfficerChecked = !!item.officerDecision || !!item.officerNotes || !!item.returnConditionRating;

    let commentText = "";
    if (item.returnConditionRating) {
      commentText += `Condition: ${item.returnConditionRating}`;
    } else if (item.inventoryItem?.conditionRating) {
      commentText += `Condition: ${item.inventoryItem.conditionRating}`;
    }

    if (item.damageAssessmentFee && item.damageAssessmentFee > 0) {
      if (commentText) commentText += " — ";
      commentText += `Damage Fee: ₦${item.damageAssessmentFee.toLocaleString()}`;
    }

    if (item.returnConditionDetails || item.officerNotes) {
      const notes = item.returnConditionDetails || item.officerNotes;
      if (commentText) commentText += " — ";
      commentText += notes;
    }

    return {
      assetDescription,
      staffCheck: isStaffChecked ? "✓" : "",
      officerCheck: isOfficerChecked ? "✓" : "",
      comments: commentText || "Device retrieved and recorded.",
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
          EMPLOYEE'S COMMENT ON THE CONDITION OF GADGET(S) WHEN ASSIGNED / RETURNED
        </Text>
        <View style={styles.commentBox}>
          {itemsToDisplay.map((item, idx) => {
            const devName = item.inventoryItem?.name || "Device";
            const comment = item.staffConditionDetails || item.staffNotes || item.initiateNotes || "No condition issues reported upon assignment.";
            return (
              <Text style={styles.commentLine} key={idx}>
                {itemsToDisplay.length > 1 ? `${devName}: ` : ""}{comment}
              </Text>
            );
          })}
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
          IT OFFICER'S COMMENT ON THE CONDITION OF GADGET(S) WHEN RETRIEVED
        </Text>
        <View style={styles.commentBox}>
          {itemsToDisplay.map((item, idx) => {
            const devName = item.inventoryItem?.name || "Device";
            const officerComment = item.officerNotes || item.returnConditionDetails || (item.returnConditionRating ? `Condition: ${item.returnConditionRating}` : "Retrieved and physically inspected.");
            const feeStr = (item.damageAssessmentFee && item.damageAssessmentFee > 0) ? ` (Fee: ₦${item.damageAssessmentFee.toLocaleString()})` : "";
            return (
              <Text style={styles.commentLine} key={idx}>
                {itemsToDisplay.length > 1 ? `${devName}: ` : ""}{officerComment}{feeStr}
              </Text>
            );
          })}
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

        {/* IT Officer & Compliance 2-Column Signatures */}
        <View style={styles.sigGrid}>
          <View style={styles.sigBlock}>
            <View style={styles.sigDottedLine}>
              <Text style={{ fontFamily: "Times-Bold" }}>{assignment.officer?.name || "IT Officer"}</Text>
            </View>
            <Text style={styles.sigLabel}>IT OFFICER NAME & SIGNATURE</Text>
            <Text style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{officerDateStr}</Text>
          </View>

          <View style={styles.sigBlock}>
            <View style={styles.sigDottedLine}>
              <Text style={{ fontFamily: "Times-Bold" }}>{assignment.complianceOfficer?.name || "Compliance Officer"}</Text>
            </View>
            <Text style={styles.sigLabel}>COMPLIANCE OFFICER NAME & SIGNATURE</Text>
            <Text style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{complianceDateStr}</Text>
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

