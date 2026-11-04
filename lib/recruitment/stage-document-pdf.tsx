import { Document, Image as PdfImage, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { StageDocument } from "./stage-document";

const styles = StyleSheet.create({
  page: { paddingTop: 100, paddingBottom: 55, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.5, color: "#17202a" },
  header: { position: "absolute", top: 24, left: 40, right: 40, flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#047857", paddingBottom: 10 },
  logo: { width: 70, height: 32, objectFit: "contain", marginRight: 14 },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 13, color: "#047857" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 18, marginBottom: 8 },
  small: { fontSize: 8, color: "#566573" },
  heading: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#065f46", marginTop: 14, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: "#d5dbdb" },
  line: { marginBottom: 5 },
  writing: { height: 18, borderBottomWidth: 0.5, borderBottomColor: "#d5dbdb" },
  footer: { position: "absolute", bottom: 23, left: 40, fontSize: 8, color: "#566573" },
  number: { position: "absolute", bottom: 23, right: 40, fontSize: 8, color: "#566573" },
});

export function StageDocumentPdf({ document, logoSource }: { document: StageDocument; logoSource?: string }) {
  return <Document title={`${document.title} - ${document.candidate}`} author="Aspom Travels">
    <Page size="A4" style={styles.page} wrap>
      <View style={styles.header} fixed>
        {logoSource && <PdfImage src={logoSource} style={styles.logo} />}
        <View><Text style={styles.brand}>Aspom Travels | Recruitment</Text><Text style={styles.small}>{document.candidate} | {document.role}</Text></View>
      </View>
      <Text style={styles.title}>{document.title}</Text>
      <Text>Candidate: {document.candidate}</Text><Text>Role: {document.role}</Text>
      <Text style={styles.small}>Reference: {document.reference}</Text><Text style={styles.small}>{document.status}</Text>
      {document.sections.map((section, index) => <View key={index} wrap={section.title.length + section.lines.join(" ").length > 1200}>
        <Text style={styles.heading} minPresenceAhead={60}>{section.title}</Text>
        {section.lines.map((line, i) => <Text key={i} style={styles.line} orphans={2} widows={2}>{line}</Text>)}
        {section.writingSpace && <View wrap={false}><View style={styles.writing} /><View style={styles.writing} /></View>}
      </View>)}
      <Text style={styles.footer} fixed>Aspom Travels | {document.status === "Candidate copy" ? "Candidate copy" : "Confidential - HR use only"}</Text>
      <Text style={styles.number} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </Page>
  </Document>;
}

export async function createStageDocumentPdf(document: StageDocument, logoSource?: string) {
  return pdf(<StageDocumentPdf document={document} logoSource={logoSource} />).toBlob();
}
