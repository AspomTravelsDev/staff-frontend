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
    fontFamily: "Times-Roman",
    fontSize: 10.5,
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
    width: 95,
    height: 42,
    objectFit: "contain",
  },
  headerTitleContainer: {
    flex: 1,
    textAlign: "center",
    paddingRight: 30,
  },
  headerTitle: {
    fontSize: 16.5,
    fontFamily: "Times-Bold",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  declarationLine: {
    fontSize: 11.5,
    marginTop: 8,
    marginBottom: 12,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  staffContactLine: {
    fontSize: 10,
    marginTop: -6,
    marginBottom: 10,
    color: "#334155",
  },
  bold: {
    fontFamily: "Times-Bold",
  },
  table: {
    marginBottom: 12,
    border: "0.8pt solid #64748b",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "0.8pt solid #64748b",
    padding: "6 4",
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    color: "#0f172a",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #cbd5e1",
    padding: "6 4",
    fontSize: 10.5,
    alignItems: "center",
  },
  colSN: { width: "6%", textAlign: "center" },
  colAsset: { width: "20%" },
  colModel: { width: "26%" },
  colSerial: { width: "24%", fontFamily: "Times-Bold" },
  colState: { width: "24%", textAlign: "left" },
  checklistSection: {
    border: "0.8pt solid #64748b",
    padding: 7,
    marginBottom: 12,
  },
  checklistTitle: {
    fontSize: 10.5,
    fontFamily: "Times-Bold",
    color: "#0f172a",
    marginBottom: 5,
  },
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  checklistEntry: {
    width: "50%",
    paddingRight: 6,
    paddingBottom: 3,
    fontSize: 9,
  },
  undertakingHeader: {
    fontSize: 11.5,
    fontFamily: "Times-Bold",
    color: "#0f172a",
    marginTop: 4,
    marginBottom: 2,
  },
  undertakingSubheader: {
    fontSize: 10.5,
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
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  termNumber: {
    width: "4%",
    fontFamily: "Times-Bold",
  },
  termText: {
    width: "96%",
  },
  acknowledgementText: {
    fontSize: 9,
    marginTop: 6,
    marginBottom: 6,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  declarationFooterText: {
    fontSize: 9.5,
    fontFamily: "Times-Bold",
    color: "#0f172a",
    marginTop: 4,
    marginBottom: 14,
  },
  sigGrid2Col: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 14,
    marginBottom: 8,
    width: "100%",
  },
  sigBlockCenter: {
    width: "46%",
    alignItems: "center",
  },
  sigUnderline: {
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
  sigNameText: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: "#0f172a",
    textAlign: "center",
  },
  sigTitleText: {
    fontSize: 9.5,
    fontFamily: "Times-Bold",
    color: "#334155",
    textAlign: "center",
    marginTop: 2,
  },
  sigDateText: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#64748b",
    textAlign: "center",
    marginTop: 1,
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
    fontSize: 8,
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
  const staffPhoneNumbers = [
    mainAssignment?.assignee?.phone?.trim(),
    mainAssignment?.assignee?.mobile_phone?.trim(),
  ].filter((phone, index, phones): phone is string => Boolean(phone) && phones.indexOf(phone) === index);
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
        <Text style={styles.staffContactLine}>
          Staff phone: {staffPhoneNumbers.length ? staffPhoneNumbers.join(" / ") : "—"}
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
                {item.staffConditionDetails ||
                  item.staffNotes ||
                  (item.staffConditionRating ? `${item.staffConditionRating}` : "") ||
                  item.inventoryItem?.conditionDetails ||
                  item.inventoryItem?.conditionRating ||
                  "Good"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.undertakingHeader}>Staff Device Checklist (Final Inspection)</Text>
        {displayItems.map((item, idx) => {
          const checklist = item.staffChecklist;
          const labels: Record<string, string> = {
            screen: "Screen & Display",
            charger: "Charger & Cables",
            buttons: "Buttons & Keyboard",
            battery: "Battery & Charging",
            ports: "Ports & Connectivity",
            cameraMic: "Camera, Mic & Speaker",
            overall: "Overall Body & Casing",
          };
          const entries = Object.entries(labels).filter(([key]) => checklist?.[key as keyof typeof checklist]?.trim());
          return (
            <View key={`staff-checklist-${item.id || idx}`} style={styles.checklistSection}>
              <Text style={styles.checklistTitle}>
                {item.inventoryItem?.name || "Device"} — S/N {item.inventoryItem?.serialNumber || "—"}
              </Text>
              {entries.length > 0 ? (
                <View style={styles.checklistGrid}>
                  {entries.map(([key, label]) => (
                    <Text key={key} style={styles.checklistEntry}>
                      <Text style={styles.bold}>{label}: </Text>
                      {checklist?.[key as keyof typeof checklist]}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.checklistEntry}>Staff checklist not recorded.</Text>
              )}
            </View>
          );
        })}

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

        {/* 2-Column Center-Aligned Signatures & Approvals */}
        <View style={styles.sigGrid2Col}>
          {/* Left Column: Employee */}
          <View style={styles.sigBlockCenter}>
            <View style={styles.sigUnderline}>
              <Text style={styles.sigNameText}>
                {mainAssignment?.staffDecidedAt ? assigneeName : ""}
              </Text>
            </View>
            <Text style={styles.sigTitleText}>EMPLOYEE SIGNATURE</Text>
            <Text style={styles.sigDateText}>
              {mainAssignment?.staffDecidedAt
                ? `Date: ${formatPdfDate(mainAssignment.staffDecidedAt)}`
                : "Date: ________________"}
            </Text>
          </View>

          {/* Right Column: IT / Admin Officer */}
          <View style={styles.sigBlockCenter}>
            <View style={styles.sigUnderline}>
              <Text style={styles.sigNameText}>
                {mainAssignment?.officerDecidedAt && mainAssignment?.officer?.name
                  ? mainAssignment.officer.name
                  : ""}
              </Text>
            </View>
            <Text style={styles.sigTitleText}>IN THE PRESENCE OF (IT / ADMIN OFFICER)</Text>
            <Text style={styles.sigDateText}>
              {mainAssignment?.officerDecidedAt
                ? `Date: ${formatPdfDate(mainAssignment.officerDecidedAt)}`
                : "Date: ________________"}
            </Text>
          </View>
        </View>

        {/* Compliance Signature Row */}
        <View style={{ width: "100%", alignItems: "center", marginTop: 8 }}>
          <View style={[styles.sigBlockCenter, { width: "50%" }]}>
            <View style={styles.sigUnderline}>
              <Text style={styles.sigNameText}>
                {mainAssignment?.complianceDecidedAt && mainAssignment?.complianceOfficer?.name
                  ? mainAssignment.complianceOfficer.name
                  : ""}
              </Text>
            </View>
            <Text style={styles.sigTitleText}>COMPLIANCE OFFICER VERIFICATION</Text>
            <Text style={styles.sigDateText}>
              {mainAssignment?.complianceDecidedAt
                ? `Date: ${formatPdfDate(mainAssignment.complianceDecidedAt)}`
                : "Date: ________________"}
            </Text>
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
