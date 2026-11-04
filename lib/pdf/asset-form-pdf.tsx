import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { InventoryAssignment } from "@/lib/api/inventory";
import { equipmentFormRows } from "@/lib/equipment-form";
import { getRoleLabel } from "@/types/user-types";
import { format } from "date-fns";

const formatPdfDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm");
  } catch {
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
  colModel: { width: "24%", paddingRight: 5 },
  colSerial: { width: "24%", paddingRight: 5, fontSize: 9, fontFamily: "Times-Bold" },
  colState: { width: "26%", textAlign: "left" },
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
  blank?: boolean;
  current?: boolean;
}

export function AssetFormPdfDocument({
  assignment,
  assignments,
  blank = false,
  current = false,
}: AssetFormPdfProps) {
  const itemsList: InventoryAssignment[] = assignments
    ? assignments
    : assignment
    ? [assignment]
    : [];

  const documentItems = itemsList.map((item) => ({ ...item, inventoryItem: current ? item.inventoryItem : item.assetSnapshot ?? item.inventoryItem }));
  const mainAssignment = { ...documentItems[0] };
  const sameStaff = documentItems.length > 0 && documentItems.every((item) => item.assignee?.id === documentItems[0].assignee?.id);
  const signature = (role: "staff" | "officer" | "compliance") => {
    const entries = documentItems.map((item) => ({
      name: role === "staff" ? item.assignee?.name : role === "officer" ? item.officer?.name : item.complianceOfficer?.name,
      date: role === "staff" ? item.staffDecidedAt : role === "officer" ? item.officerDecidedAt : item.complianceDecidedAt,
      decision: role === "staff" ? item.staffDecision : role === "officer" ? item.officerDecision : item.complianceDecision,
    }));
    const complete = sameStaff && entries.every((entry) => entry.name && entry.date && entry.decision === "approved");
    return {
      name: complete ? Array.from(new Set(entries.map((entry) => entry.name))).join(" / ") : "",
      dates: complete ? Array.from(new Set(entries.map((entry) => formatPdfDate(entry.date)))).join("; ") : "",
    };
  };
  const staffSignature = signature("staff");
  const officerSignature = signature("officer");
  const complianceSignature = signature("compliance");
  const assigneeName = mainAssignment?.assignee?.name || "________________________";
  const rawRole = mainAssignment?.assignee?.role;
  const assigneeRole = getRoleLabel(rawRole) || rawRole || "Staff Member";
  const assigneeDept = mainAssignment?.assignee?.department || "";
  const staffPhoneNumbers = [
    mainAssignment?.assignee?.phone?.trim(),
    mainAssignment?.assignee?.mobile_phone?.trim(),
  ].filter((phone, index, phones): phone is string => Boolean(phone) && phones.indexOf(phone) === index);

  const displayItems = documentItems;
  const formRows = equipmentFormRows(itemsList, current);

  return (
    <Document title={`Asset Declaration Undertaking - ${assigneeName}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- React PDF Image is not an HTML image. */}
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
            <Text style={styles.colAsset}>ASSET TYPE</Text>
            <Text style={styles.colModel}>MODEL</Text>
            <Text style={styles.colSerial}>SERIAL NUMBER</Text>
            <Text style={styles.colState}>STATE / COMMENT</Text>
          </View>

          {formRows.map((row, idx) => {
            const item = row.assignment;
            const asset = current ? item?.inventoryItem : item?.assetSnapshot ?? item?.inventoryItem;
            return <View key={item?.id || `slot-${idx}`} style={styles.tableRow} wrap={false}>
              <Text style={styles.colSN}>{idx + 1}</Text>
              <Text style={styles.colAsset}>{row.type}</Text>
              <Text style={styles.colModel}>{asset?.name || ""}</Text>
              <Text style={styles.colSerial}>{asset?.serialNumber || (asset?.assetTag ? `Asset ref: ${asset.assetTag}` : "")}</Text>
              <Text style={styles.colState}>{item ? (current ? asset?.conditionDetails || asset?.conditionRating : item.staffConditionDetails || item.staffConditionRating || asset?.conditionDetails || asset?.conditionRating) : blank ? "" : "Not issued"}</Text>
            </View>;
          })}
        </View>

        {!current && displayItems.some((item) => item.staffChecklist) && <Text style={styles.undertakingHeader}>Staff Device Checklist (Final Inspection)</Text>}
        {!current && displayItems.filter((item) => item.staffChecklist).map((item, idx) => {
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

        {current && <Text style={styles.acknowledgementText}>Current custody list. Names and dates below reflect recorded approvals for these items, not a new signing event. Multiple dates represent separate item acknowledgements. Unrecorded or incomplete approvals remain blank.</Text>}
        <>
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
                {staffSignature.name}
              </Text>
            </View>
            <Text style={styles.sigTitleText}>EMPLOYEE SIGNATURE</Text>
            <Text style={styles.sigDateText}>
              {staffSignature.dates ? `Date: ${staffSignature.dates}` : "Date: ________________"}
            </Text>
          </View>

          {/* Right Column: IT / Admin Officer */}
          <View style={styles.sigBlockCenter}>
            <View style={styles.sigUnderline}>
              <Text style={styles.sigNameText}>
                {officerSignature.name}
              </Text>
            </View>
            <Text style={styles.sigTitleText}>IN THE PRESENCE OF (IT / ADMIN OFFICER)</Text>
            <Text style={styles.sigDateText}>
              {officerSignature.dates ? `Date: ${officerSignature.dates}` : "Date: ________________"}
            </Text>
          </View>
        </View>

        {/* Compliance Signature Row */}
        <View style={{ width: "100%", alignItems: "center", marginTop: 8 }}>
          <View style={[styles.sigBlockCenter, { width: "50%" }]}>
            <View style={styles.sigUnderline}>
              <Text style={styles.sigNameText}>
                {complianceSignature.name}
              </Text>
            </View>
            <Text style={styles.sigTitleText}>COMPLIANCE OFFICER VERIFICATION</Text>
            <Text style={styles.sigDateText}>
              {complianceSignature.dates ? `Date: ${complianceSignature.dates}` : "Date: ________________"}
            </Text>
          </View>
        </View>

        </>
        {/* Footer */}
        <View style={styles.footer}>
          <Text>ASPOM Travel Agency — Official Asset Declaration Form</Text>
          <Text>System Generated Document — ASPOM Staff Portal</Text>
        </View>
      </Page>
    </Document>
  );
}
