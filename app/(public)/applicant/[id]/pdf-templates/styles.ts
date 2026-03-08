import { StyleSheet } from "@react-pdf/renderer";

// Company Logo URL
// Uses the locally downloaded public image to avoid React-PDF server-side Fetch/CORS rendering issues
export const COMPANY_LOGO_URL = "/aspom-logo.webp";

// Company Address Lines
export const COMPANY_ADDRESSES = {
    head: "Head Office: 69 Admiralty Way, Lekki Phase 1, Lagos Nigeria",
    abuja: "Abuja Office: 109 Plaza, Suite C7 Ademola Adetokunbo Crescent Wuse 2, Abuja.",
    ikeja: "Ikeja Office: Pentagon Plaza, 23, Opebi Road, Ikeja, Lagos, Nigeria",
};

// Shared PDF Styles - Formal Times-Roman design
export const pdfStyles = StyleSheet.create({
    // Page
    page: {
        padding: "20mm",
        fontFamily: "Times-Roman",
        fontSize: 11,
        lineHeight: 1.5,
    },
    text: {
        fontSize: 11,
        marginBottom: 5,
    },

    // Header with logo, company info, and photo
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
        borderBottom: "2pt solid #000",
        paddingBottom: 10,
    },
    logoContainer: {
        width: 100,
    },
    logo: {
        width: 100,
        height: 60,
        marginRight: 15,
    },
    companyInfo: {
        flex: 1,
        textAlign: "center",
    },
    companyName: {
        fontSize: 16,
        fontFamily: "Times-Bold",
        marginBottom: 3,
    },
    companyAddress: {
        fontSize: 9,
        marginBottom: 2,
    },

    // Passport photo box
    photoBox: {
        width: 170, // Increased to fit two photos if needed
        height: 100,
    },
    headerRight: {
        width: 170,
    },
    photoContainer: {
        border: "1pt solid #000",
        padding: 5,
        height: 100,
        justifyContent: "center",
    },
    photo: {
        width: 70,
        height: 80,
        objectFit: "cover",
    },
    photoPlaceholder: {
        width: 70,
        height: 80,
        border: "1pt dashed #ccc",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9f9f9",
    },
    photoPlaceholderText: {
        fontSize: 7,
        color: "#999",
        textAlign: "center",
    },
    passportPhoto: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },

    // Metadata
    metadata: {
        fontSize: 9,
        color: "#666",
        textAlign: "right",
        marginBottom: 10,
    },

    // Form title
    formTitle: {
        textAlign: "center",
        fontSize: 14,
        fontFamily: "Times-Bold",
        textDecoration: "underline",
        marginTop: 20,
        marginBottom: 15,
    },

    // Section titles
    sectionTitle: {
        fontSize: 11,
        fontFamily: "Times-Bold",
        textDecoration: "underline",
        marginTop: 15,
        marginBottom: 10,
    },

    // Field groups
    fieldGroup: {
        marginBottom: 12,
    },
    fieldLabel: {
        fontSize: 11,
        marginBottom: 3,
    },
    fieldLabelItalic: {
        fontSize: 11,
        marginBottom: 3,
        fontFamily: "Times-Italic",
    },
    fieldLine: {
        borderBottom: "1pt solid #000",
        minHeight: 20,
        fontSize: 11,
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 2,
    },
    fieldRow: {
        flexDirection: "row",
        gap: 20,
        marginBottom: 12,
    },
    fieldColumn: {
        flex: 1,
    },

    // Declaration section
    declarationSection: {
        marginTop: 20,
    },
    declarationText: {
        fontSize: 10,
        textAlign: "justify",
        marginBottom: 10,
        lineHeight: 1.5,
    },
    declarationFill: {
        fontFamily: "Times-Bold",
        textDecoration: "underline",
    },

    // Signature row
    signatureRow: {
        flexDirection: "row",
        gap: 40,
        marginTop: 20,
    },
    signatureBox: {
        flex: 1,
        marginTop: 10,
    },
    signatureField: {
        flex: 1,
    },
    signatureLine: {
        borderBottom: "1pt solid #000",
        minHeight: 30,
        marginBottom: 5,
    },
    signatureLabel: {
        fontSize: 9,
        textAlign: "center",
    },
    signatureImage: {
        width: 100,
        height: 40,
        objectFit: "contain",
        marginBottom: 5,
        alignSelf: "center",
    },

    // Witness section
    witnessSection: {
        marginTop: 30,
        paddingTop: 15,
        borderTop: "1pt solid #ccc",
    },
    witnessTitle: {
        fontSize: 11,
        fontFamily: "Times-Bold",
        marginBottom: 15,
    },

    // Confidential banner (for referee form)
    confidentialBanner: {
        textAlign: "center",
        fontSize: 14,
        fontFamily: "Times-Bold",
        marginBottom: 15,
        padding: 5,
        border: "1pt solid #000",
    },

    // Two-column header (for referee form)
    twoColumnHeader: {
        flexDirection: "row",
        marginBottom: 20,
    },
    headerColumnLeft: {
        flex: 1,
        paddingRight: 20,
    },
    headerColumnRight: {
        flex: 1,
        paddingLeft: 20,
    },

    // Questions (for referee form)
    questionGroup: {
        marginBottom: 10,
    },
    questionText: {
        fontSize: 10,
        marginBottom: 3,
    },
    answerLine: {
        borderBottom: "1pt solid #000",
        minHeight: 18,
        fontSize: 10,
        paddingLeft: 3,
        paddingTop: 2,
    },
    answerLineMulti: {
        borderBottom: "1pt solid #000",
        minHeight: 14,
        fontSize: 10,
        paddingLeft: 3,
        marginBottom: 3,
    },
});

// Legacy styles export for backward compatibility
export const colors = {
    primary: "#1a365d",
    secondary: "#2d3748",
    accent: "#3182ce",
    muted: "#718096",
    border: "#e2e8f0",
    background: "#f7fafc",
    white: "#ffffff",
    black: "#000000",
};

export const styles = pdfStyles;
