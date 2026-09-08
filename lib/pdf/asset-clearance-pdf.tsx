import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
  Svg,
  Path,
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

// Reusable vector checkmark that renders consistently across all PDF viewers
const CheckMark = ({ size = 11, color = "#0f172a" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    padding: "10mm 14mm 14mm 14mm",
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.35,
    color: "#0f172a",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 105,
    height: 38,
    objectFit: "contain",
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 13,
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
    marginTop: 8,
    marginBottom: 10,
    gap: 5,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    marginRight: 6,
  },
  fieldValue: {
    fontSize: 10.5,
    fontFamily: "Times-Roman",
    borderBottomWidth: 0.8,
    borderBottomColor: "#64748b",
    borderBottomStyle: "dotted",
    flex: 1,
    paddingBottom: 1,
  },
  table: {
    marginBottom: 10,
    borderWidth: 0.8,
    borderColor: "#475569",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 0.8,
    borderBottomColor: "#475569",
    padding: "4 5",
  },
  colAssetHeader: { width: "32%", fontFamily: "Times-Bold", fontSize: 10 },
  colStaffHeader: { width: "15%", fontFamily: "Times-Bold", fontSize: 10, textAlign: "center" },
  colOfficerHeader: { width: "17%", fontFamily: "Times-Bold", fontSize: 10, textAlign: "center" },
  colCommentsHeader: { width: "36%", fontFamily: "Times-Bold", fontSize: 10 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    padding: "4 5",
    minHeight: 20,
    alignItems: "center",
  },
  colAssetCell: { width: "32%", fontSize: 10, fontFamily: "Times-Bold" },
  colStaffCell: { width: "15%", alignItems: "center", justifyContent: "center" },
  colOfficerCell: { width: "17%", alignItems: "center", justifyContent: "center" },
  colCommentsCell: { width: "36%", fontSize: 9.5 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    marginTop: 6,
    marginBottom: 3,
    color: "#0f172a",
  },
  commentBox: {
    minHeight: 24,
    marginBottom: 8,
  },
  commentLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: "#94a3b8",
    borderBottomStyle: "dotted",
    minHeight: 17,
    fontSize: 10,
    paddingLeft: 2,
    paddingBottom: 2,
  },
  clearanceGrid: {
    flexDirection: "row",
    borderWidth: 0.8,
    borderColor: "#475569",
    marginTop: 8,
    marginBottom: 12,
    height: 32,
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
  clearanceColCleared: {
    backgroundColor: "#f0fdf4",
  },
  clearanceColNotCleared: {
    backgroundColor: "#fef2f2",
  },
  clearanceTitle: {
    fontSize: 10.5,
    fontFamily: "Times-Bold",
  },
  emptyCheckbox: {
    width: 11,
    height: 11,
    borderWidth: 0.8,
    borderColor: "#64748b",
    borderStyle: "solid",
  },
  sigGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 6,
    marginBottom: 6,
    width: "100%",
  },
  sigBlock: {
    width: "31%",
    alignItems: "center",
  },
  sigUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    borderBottomStyle: "solid",
    width: "100%",
    minHeight: 18,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    marginBottom: 3,
  },
  sigNameText: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#0f172a",
    textAlign: "center",
  },
  sigLabel: {
    fontSize: 8.5,
    fontFamily: "Times-Bold",
    color: "#334155",
    textAlign: "center",
  },
  sigDateText: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
  },
  pageFooter: {
    position: "absolute",
    bottom: "6mm",
    left: "14mm",
    right: "14mm",
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 3,
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
    allAssignments.length > 0 ? allAssignments : [assignment];

  const assigneeName = assignment.assignee?.name || "";
  const assigneeDept = assignment.assignee?.department || "";

  // Pull staff phone numbers (Office and Personal) or leave blank if none
  const phoneList: string[] = [];
  if (assignment.assignee?.phone?.trim()) {
    phoneList.push(`${assignment.assignee.phone.trim()} (Office)`);
  }
  if (
    assignment.assignee?.mobile_phone?.trim() &&
    assignment.assignee.mobile_phone.trim() !== assignment.assignee?.phone?.trim()
  ) {
    phoneList.push(`${assignment.assignee.mobile_phone.trim()} (Personal)`);
  }
  const staffPhoneStr = phoneList.join("  /  ");

  const staffDateStr = assignment.staffDecidedAt ? formatPdfDate(assignment.staffDecidedAt) : "";
  const officerDateStr = assignment.officerDecidedAt ? formatPdfDate(assignment.officerDecidedAt) : "";
  const complianceDateStr = assignment.complianceDecidedAt ? formatPdfDate(assignment.complianceDecidedAt) : "";

  const isCleared = assignment.status === "cleared" || assignment.complianceDecision === "approved";

  // Build dynamic checklist items strictly from assigned/returned devices
  const checklistRows = itemsToDisplay.map((item) => {
    const itemName = item.inventoryItem?.name || item.inventoryItem?.category || "Device";
    const serialStr = item.inventoryItem?.serialNumber ? ` (${item.inventoryItem.serialNumber})` : "";
    const assetDescription = `${itemName}${serialStr}`.toUpperCase();

    const isDeviceCleared = item.status === "cleared" || isCleared;

    // Add ticks for staff and IT officer for devices that have been cleared or reviewed
    const isStaffChecked =
      isDeviceCleared ||
      item.staffDecision === "approved" ||
      !!item.staffDecidedAt ||
      !!item.staffNotes ||
      !!item.staffConditionDetails ||
      item.status === "return_pending_inspection" ||
      item.status === "return_pending_compliance";

    const isOfficerChecked =
      isDeviceCleared ||
      item.officerDecision === "approved" ||
      !!item.officerDecidedAt ||
      !!item.officerNotes ||
      !!item.returnConditionRating;

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
      isStaffChecked,
      isOfficerChecked,
      comments: commentText || "Device retrieved and recorded.",
    };
  });

  return (
    <Document title={`Employee Asset Clearance Checklist - ${assigneeName}`}>
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
            <Text style={styles.fieldValue}>{staffPhoneStr}</Text>
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
              <View style={styles.colStaffCell}>
                {row.isStaffChecked && <CheckMark size={11} color="#0f172a" />}
              </View>
              <View style={styles.colOfficerCell}>
                {row.isOfficerChecked && <CheckMark size={11} color="#0f172a" />}
              </View>
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
            const condStr = item.staffConditionRating ? `[Condition: ${item.staffConditionRating}] ` : "";
            const detailsStr = [item.staffConditionDetails, item.staffNotes].filter(Boolean).join(" — ");
            const comment = condStr + (detailsStr || item.initiateNotes || "No condition issues reported upon handover.");
            return (
              <Text style={styles.commentLine} key={idx}>
                {itemsToDisplay.length > 1 ? `${devName}: ` : ""}{comment}
              </Text>
            );
          })}
        </View>

        {/* IT Officer Comments - Placed right under the rest instead of a new page */}
        <Text style={styles.sectionTitle}>
          IT OFFICER'S COMMENT ON THE CONDITION OF GADGET(S) WHEN RETRIEVED
        </Text>
        <View style={styles.commentBox}>
          {itemsToDisplay.map((item, idx) => {
            const devName = item.inventoryItem?.name || "Device";
            const officerComment =
              item.officerNotes ||
              item.returnConditionDetails ||
              (item.returnConditionRating
                ? `Condition: ${item.returnConditionRating}`
                : assignment.officerDecidedAt
                ? "Retrieved and physically inspected."
                : "Pending IT physical inspection.");
            const feeStr =
              item.damageAssessmentFee && item.damageAssessmentFee > 0
                ? ` (Fee: ₦${item.damageAssessmentFee.toLocaleString()})`
                : "";
            return (
              <Text style={styles.commentLine} key={idx}>
                {itemsToDisplay.length > 1 ? `${devName}: ` : ""}{officerComment}{feeStr}
              </Text>
            );
          })}
        </View>

        {/* Clearance Box with Checkmark if Cleared */}
        <View style={styles.clearanceGrid}>
          <View
            style={[
              styles.clearanceCol,
              styles.clearanceColLeft,
              isCleared ? styles.clearanceColCleared : {},
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {isCleared ? (
                <CheckMark size={13} color="#15803d" />
              ) : (
                <View style={styles.emptyCheckbox} />
              )}
              <Text
                style={[
                  styles.clearanceTitle,
                  isCleared ? { color: "#15803d" } : {},
                ]}
              >
                CLEARED
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.clearanceCol,
              !isCleared ? styles.clearanceColNotCleared : {},
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {!isCleared ? (
                <CheckMark size={13} color="#b91c1c" />
              ) : (
                <View style={styles.emptyCheckbox} />
              )}
              <Text
                style={[
                  styles.clearanceTitle,
                  !isCleared ? { color: "#b91c1c" } : {},
                ]}
              >
                NOT CLEARED
              </Text>
            </View>
          </View>
        </View>

        {/* Signatures: Employee, IT Officer, Compliance Officer */}
        <View style={styles.sigGrid}>
          {/* Employee */}
          <View style={styles.sigBlock}>
            <View style={styles.sigUnderline}>
              <Text style={styles.sigNameText}>
                {assignment.staffDecidedAt ? assigneeName : ""}
              </Text>
            </View>
            <Text style={styles.sigLabel}>EMPLOYEE SIGNATURE</Text>
            <Text style={styles.sigDateText}>
              {staffDateStr ? `Date: ${staffDateStr}` : "Date: ________________"}
            </Text>
          </View>

          {/* IT Officer */}
          <View style={styles.sigBlock}>
            <View style={styles.sigUnderline}>
              <Text style={styles.sigNameText}>
                {assignment.officerDecidedAt && assignment.officer?.name
                  ? assignment.officer.name
                  : ""}
              </Text>
            </View>
            <Text style={styles.sigLabel}>IT OFFICER SIGNATURE</Text>
            <Text style={styles.sigDateText}>
              {officerDateStr ? `Date: ${officerDateStr}` : "Date: ________________"}
            </Text>
          </View>

          {/* Compliance Officer */}
          <View style={styles.sigBlock}>
            <View style={styles.sigUnderline}>
              <Text style={styles.sigNameText}>
                {assignment.complianceDecidedAt && assignment.complianceOfficer?.name
                  ? assignment.complianceOfficer.name
                  : ""}
              </Text>
            </View>
            <Text style={styles.sigLabel}>COMPLIANCE SIGNATURE</Text>
            <Text style={styles.sigDateText}>
              {complianceDateStr ? `Date: ${complianceDateStr}` : "Date: ________________"}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.pageFooter}>
          <Text>ASPOM Travel Agency — Employee Asset (Gadget) Clearance Check-List</Text>
          <Text>{complianceDateStr ? `Issued: ${complianceDateStr}` : "ASPOM Staff Portal"}</Text>
        </View>
      </Page>
    </Document>
  );
}
