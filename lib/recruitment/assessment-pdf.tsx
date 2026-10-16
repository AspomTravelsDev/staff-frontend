import { Document, Image as PdfImage, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { assessmentSectionNames, type ApplicantAssessment, type AssessmentDefinition, type AssessmentSection } from "@/lib/types/applicant-assessment";

const styles = StyleSheet.create({
  page: { paddingTop: 94, paddingBottom: 48, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.45, color: "#17202a" },
  header: { position: "absolute", top: 24, left: 40, right: 40, flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#047857", paddingBottom: 10 },
  logo: { width: 70, height: 32, objectFit: "contain", marginRight: 14 },
  headerTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#047857" },
  small: { fontSize: 8, color: "#566573" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  metadata: { marginBottom: 15 },
  outcome: { flexDirection: "row", backgroundColor: "#f3f7f5", padding: 12, marginBottom: 12, borderRadius: 4 },
  outcomeText: { flexGrow: 1, flexBasis: 0, paddingRight: 12 },
  bold: { fontFamily: "Helvetica-Bold" },
  score: { width: 110, textAlign: "right", fontSize: 18, fontFamily: "Helvetica-Bold", color: "#047857" },
  heading: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#065f46", marginTop: 12, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#d5dbdb" },
  columns: { flexDirection: "row", gap: 18 },
  column: { flexGrow: 1, flexBasis: 0 },
  tableRow: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  label: { flexGrow: 1, flexBasis: 0, paddingRight: 6 },
  weight: { width: 36, textAlign: "right" },
  average: { width: 48, textAlign: "right" },
  paragraph: { marginBottom: 8 },
  question: { paddingBottom: 9, marginBottom: 10, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  questionTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  footer: { position: "absolute", bottom: 22, left: 40, width: 320, height: 12, fontSize: 8, lineHeight: 1.2, color: "#566573" },
  pageNumber: { position: "absolute", top: 807, right: 40, width: 120, textAlign: "right", fontSize: 8, lineHeight: 1.2, color: "#566573" },
});

interface AssessmentPdfProps {
  assessment: ApplicantAssessment;
  candidate: string;
  role: string;
  logoSource?: string;
}

function Heading({ children }: { children: string }) {
  return <Text style={styles.heading} minPresenceAhead={48}>{children}</Text>;
}

/** Native text flows across A4 pages, including answers longer than a page. */
export function AssessmentPdfDocument({ assessment, candidate, role, logoSource }: AssessmentPdfProps) {
  const plan = assessment.plan_snapshot;
  const results = assessment.results;
  const answers = new Map(assessment.answers.map(answer => [answer.question_id, answer]));
  return <Document title={`Applicant assessment - ${candidate}`} author="Aspom Travels">
    <Page size="A4" style={styles.page} wrap>
      <View style={styles.header} fixed>
        {logoSource && <PdfImage src={logoSource} style={styles.logo} />}
        <View><Text style={styles.headerTitle}>Recruitment assessment</Text><Text style={styles.small}>{candidate} | Revision {assessment.revision}</Text></View>
      </View>
      <Text style={styles.title}>{candidate}</Text>
      <View style={styles.metadata} wrap={false}>
        <Text>{role} | {plan.track.name}</Text>
        <Text style={styles.small}>Interviewer: {assessment.interviewer.name} | Interview date: {assessment.interview_date.slice(0, 10)}</Text>
        <Text style={styles.small}>Status: {assessment.state} | Question bank: {plan.bank_version}</Text>
      </View>
      <View style={styles.outcome} wrap={false}>
        <View style={styles.outcomeText}>
          <Text style={styles.bold}>{assessment.recommendation || "Assessment in progress"}</Text>
          <Text>{results.completed}/{results.total} scored questions completed</Text>
        </View>
        <View><Text style={styles.score}>{results.score_100 == null ? "Incomplete" : `${results.score_100.toFixed(2)}/100`}</Text>
          {results.overall != null && <Text style={[styles.small, { textAlign: "right" }]}>{results.overall.toFixed(2)}/5 weighted score</Text>}
        </View>
      </View>
      {assessment.submitted_by && <Text style={styles.small}>Submitted by {assessment.submitted_by.name}{assessment.submitted_at ? ` | ${new Date(assessment.submitted_at).toLocaleString("en-GB", {timeZone: "Africa/Lagos"})}` : ""}</Text>}
      <View style={styles.columns} wrap={false}>
        <View style={styles.column}>
          <Heading>Section scores</Heading>
          <View style={styles.tableRow}><Text style={[styles.label, styles.bold]}>Section</Text><Text style={[styles.weight, styles.bold]}>Weight</Text><Text style={[styles.average, styles.bold]}>Score /5</Text></View>
          {Object.entries(results.sections).map(([key, section]) => <View key={key} style={styles.tableRow}>
            <Text style={styles.label}>{assessmentSectionNames[key as AssessmentSection] || key}</Text>
            <Text style={styles.weight}>{section.weight}%</Text>
            <Text style={styles.average}>{section.average?.toFixed(2) ?? "N/A"}</Text>
          </View>)}
        </View>
        <View style={styles.column}>
          <Heading>Competency scores</Heading>
          <View style={styles.tableRow}><Text style={[styles.label, styles.bold]}>Competency</Text><Text style={[styles.average, styles.bold]}>Score /5</Text></View>
          {Object.entries(results.competencies).map(([key, competency]) => <View key={key} style={styles.tableRow}>
            <View style={styles.label}><Text>{competency.name}</Text><Text style={styles.small}>{competency.count} {competency.count === 1 ? "answer" : "answers"}</Text></View>
            <Text style={styles.average}>{competency.average?.toFixed(2) ?? "N/A"}</Text>
          </View>)}
        </View>
      </View>
      {!!plan.practical_modules?.length && <>
        <Heading>Practical task marks</Heading>
        {plan.practical_modules.map(task => <View key={task.id}>
          <Text style={styles.questionTitle} minPresenceAhead={36}>{task.name}</Text>
          {task.criteria.map(criterion => <View key={criterion.id} style={styles.tableRow} wrap={false}>
            <Text style={styles.label}>{criterion.label}{criterion.required ? ` (minimum ${criterion.minimum ?? 1})` : ""}</Text>
            <Text style={styles.average}>{assessment.practical_marks?.[criterion.id] ?? "N/A"}/{criterion.max}</Text>
          </View>)}
        </View>)}
      </>}
      {!!results.gates?.items.length && <>
        <Heading>Critical checks and hiring guidance</Heading>
        <Text>{results.decision_guidance || "Not calculated"}</Text>
        {results.gates.items.map(gate => <Text key={`${gate.type}-${gate.id}`}>{gate.label}: {gate.passed ? "Passed" : "Review required"} ({gate.actual?.toFixed(1) ?? "N/A"}; minimum {gate.minimum})</Text>)}
      </>}
      <Heading>Key strengths</Heading>
      <Text style={styles.paragraph} orphans={2} widows={2}>{assessment.strengths || "None recorded"}</Text>
      <Heading>Key concerns</Heading>
      <Text style={styles.paragraph} orphans={2} widows={2}>{assessment.concerns || "None recorded"}</Text>
      <Heading>Recommendation and rationale</Heading>
      <Text style={styles.bold} minPresenceAhead={30}>{assessment.recommendation || "No recommendation recorded"}</Text>
      <Text style={styles.paragraph} orphans={2} widows={2}>{assessment.rationale || "No rationale recorded"}</Text>
      <Heading>Interview evidence</Heading>
      {plan.questions.map((question, index) => {
        const answer = answers.get(question.id);
        const notes = question.scored ? answer?.notes || "No notes" : assessment.unscored_responses[question.id] || "Not recorded";
        const text = question.text + notes;
        // Keep short answers together, but let long or multiline answers span pages.
        const keepTogether = text.length <= 1200 && (text.match(/\n/g)?.length ?? 0) < 12;
        return <View key={question.id} style={styles.question} wrap={!keepTogether}>
          <Text style={styles.questionTitle} minPresenceAhead={40}>{index + 1}. {question.text}</Text>
          <Text style={styles.small} minPresenceAhead={24}>{assessmentSectionNames[question.section]} | {question.section === "practical" && plan.practical_module ? "Graded in practical task marks" : question.scored ? `Grade: ${answer?.score ?? "Unscored"}/5` : "Information only"}</Text>
          <Text orphans={2} widows={2}>{notes}</Text>
        </View>;
      })}
      <Text style={styles.footer} fixed>Aspom Travels | Recruitment assessment</Text>
      <Text style={styles.pageNumber} fixed render={({pageNumber, totalPages}) => `Page ${pageNumber} of ${totalPages}`} />
    </Page>
  </Document>;
}

export async function createAssessmentPdfBlob(props: AssessmentPdfProps): Promise<Blob> {
  return pdf(<AssessmentPdfDocument {...props} />).toBlob();
}

export function CandidatePracticalPdfDocument({plan}: {plan: AssessmentDefinition}) {
  return <Document title={`${plan.track.name} practical tasks`} author="Aspom Travels">
    <Page size="A4" style={{...styles.page, paddingTop:40}} wrap>
      <Text style={styles.title}>{plan.track.name} practical assessment</Text>
      <Text style={styles.paragraph}>Candidate: ____________________    Date: ____________________</Text>
      <Text style={styles.paragraph}>Use the fictional data provided. Show your workings, distinguish facts from assumptions, and state any missing evidence. You may clarify instructions with the assessor.</Text>
      {(plan.practical_modules ?? []).filter(task => task.duration_minutes > 0).map(task => <View key={task.id}>
        <Heading>{task.name}</Heading>
        <Text style={styles.small}>{task.duration_minutes} minutes</Text>
        <Text style={styles.paragraph}>{task.scenario}</Text>
        {task.tasks.map((item,i) => <Text key={item} style={styles.paragraph}>{i+1}. {item}</Text>)}
        <Text style={styles.paragraph}>Response / workings:</Text>
        <Text style={{marginBottom:50}}>____________________________________________________________</Text>
      </View>)}
      <Text style={styles.footer} fixed>Aspom Travels | Candidate tasks | Fictional data</Text>
    </Page>
  </Document>;
}

export async function createCandidateBriefPdfBlob(plan: AssessmentDefinition): Promise<Blob> {
  return pdf(<CandidatePracticalPdfDocument plan={plan} />).toBlob();
}
