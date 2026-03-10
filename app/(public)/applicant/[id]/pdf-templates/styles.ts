import { StyleSheet } from "@react-pdf/renderer";

export const COMPANY_LOGO_URL = "/aspom-logo.png";

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
        padding: "15mm",
        fontFamily: "Times-Roman",
        fontSize: 11,
        lineHeight: 1.4,
    },
    text: {
        fontSize: 11,
        marginBottom: 4,
    },

    // Header with logo, company info, and photo
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        borderBottom: "1pt solid #000",
        paddingBottom: 10,
    },
    logoContainer: {
        width: "25%",
    },
    logo: {
        width: 100,
        height: 50,
        objectFit: "contain",
    },
    companyInfo: {
        width: "50%",
        textAlign: "center",
    },
    companyName: {
        fontSize: 14,
        fontFamily: "Times-Bold",
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 8,
        marginBottom: 1,
    },

    // Passport photo box
    photoBox: {
        width: 100,
        height: 100,
    },
    headerRight: {
        width: "25%",
        textAlign: "right",
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
        objectPosition: "top",
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
        objectPosition: "top",
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
        fontSize: 13,
        fontFamily: "Times-Bold",
        textDecoration: "underline",
        marginTop: 15,
        marginBottom: 20,
    },

    // Section titles
    sectionTitle: {
        fontSize: 11,
        fontFamily: "Times-Bold",
        textDecoration: "underline",
        marginTop: 15,
        marginBottom: 8,
        textTransform: "uppercase",
    },

    // Field groups
    fieldGroup: {
        marginBottom: 10,
    },
    fieldLabel: {
        fontSize: 10,
        marginBottom: 2,
    },
    fieldLabelItalic: {
        fontSize: 10,
        marginBottom: 2,
        fontFamily: "Times-Italic",
    },
    fieldLine: {
        borderBottom: "0.5pt solid #000",
        minHeight: 18,
        fontSize: 10,
        paddingLeft: 2,
        paddingTop: 4,
    },
    fieldRow: {
        flexDirection: "row",
        gap: 15,
        marginBottom: 10,
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
        justifyContent: "space-between",
        marginTop: 30,
        gap: 30,
    },
    signatureBlock: {
        width: "45%",
    },
    signatureField: {
        flex: 1,
    },
    signatureLine: {
        borderBottom: "0.5pt solid #000",
        minHeight: 40,
        marginBottom: 5,
        justifyContent: "flex-end",
        alignItems: "center",
    },
    signatureText: {
        fontSize: 9,
        textAlign: "center",
    },
    signatureImage: {
        width: 120,
        height: 50,
        objectFit: "contain",
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

    // Letter Styles
    paragraph: {
        fontSize: 10,
        marginBottom: 8,
        textAlign: "justify",
        lineHeight: 1.4,
    },
    bold: {
        fontFamily: "Times-Bold",
    },
    underline: {
        textDecoration: "underline",
    },
    list: {
        marginTop: 5,
        marginBottom: 10,
    },
    listItem: {
        flexDirection: "row",
        marginBottom: 6,
        paddingLeft: 10,
    },
    listNumber: {
        width: 20,
        fontSize: 10,
        fontFamily: "Times-Bold",
    },
    listContent: {
        flex: 1,
        fontSize: 10,
        textAlign: "justify",
    },
    salaryTable: {
        marginTop: 10,
        marginBottom: 10,
        borderTop: "0.5pt solid #000",
        borderLeft: "0.5pt solid #000",
        borderRight: "0.5pt solid #000",
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "0.5pt solid #000",
        minHeight: 18,
        alignItems: "center",
    },
    tableHeaderRow: {
        backgroundColor: "#f5f5f5",
        fontFamily: "Times-Bold",
    },
    tableCellLabel: {
        flex: 3,
        paddingLeft: 8,
        fontSize: 9,
        borderRight: "0.5pt solid #000",
        height: "100%",
        justifyContent: "center",
    },
    tableCellValue: {
        flex: 1,
        textAlign: "right",
        paddingRight: 8,
        fontSize: 9,
        fontFamily: "Times-Bold",
        height: "100%",
        justifyContent: "center",
    },
    noBorder: {
        borderBottom: "none" as any,
    },
    footerContainer: {
        marginTop: 30,
        borderTop: "1pt solid #000",
        paddingTop: 10,
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
