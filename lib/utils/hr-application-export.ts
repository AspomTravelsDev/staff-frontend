import type { ExportColumn } from "@/lib/utils/export";
import type { OnboardingApplication } from "@/lib/types/hr";

function getPath(source: unknown, path: string): unknown {
    return path
        .split(".")
        .reduce<unknown>((acc, key) =>
            acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined,
            source);
}

function stringify(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
}

function yesNo(value: unknown): string {
    return Boolean(value) ? "Yes" : "No";
}

function joinAddress(parts: Array<unknown>): string {
    return parts
        .map((part) => stringify(part).trim())
        .filter(Boolean)
        .join(", ");
}

function listSummary<T>(arr: T[] | undefined, mapper: (item: T, index: number) => string): string {
    if (!arr || arr.length === 0) return "";
    return arr.map((item, index) => mapper(item, index)).filter(Boolean).join(" | ");
}

export const HR_APPLICATION_EXPORT_COLUMNS: ExportColumn<OnboardingApplication>[] = [
    { header: "Application ID", key: "application_id" },
    { header: "UUID", key: "id" },
    { header: "Applicant Name", key: (app) => app.applicant_name ?? "" },
    { header: "Applicant Email", key: "applicant_email" },
    { header: "Position Title", key: "position_title" },
    { header: "Status", key: (app) => app.status?.replaceAll("_", " ") ?? "" },
    { header: "Gross Salary", key: "salary_gross" },
    { header: "Invited At", key: (app) => app.invited_at ?? "" },
    { header: "Completed At", key: (app) => app.completed_at ?? "" },
    { header: "Created At", key: (app) => app.created_at ?? "" },
    { header: "Updated At", key: (app) => app.updated_at ?? "" },
    { header: "Last Updated", key: (app) => stringify(getPath(app.form_data, "lastUpdated")) },
    { header: "Submitted At", key: (app) => stringify(getPath(app.form_data, "submittedAt")) },

    { header: "Personal Title", key: (app) => stringify(getPath(app.form_data, "personal.title")) },
    { header: "Personal First Name", key: (app) => stringify(getPath(app.form_data, "personal.firstName")) },
    { header: "Personal Middle Name", key: (app) => stringify(getPath(app.form_data, "personal.middleName")) },
    { header: "Personal Last Name", key: (app) => stringify(getPath(app.form_data, "personal.lastName")) },
    { header: "Personal Gender", key: (app) => stringify(getPath(app.form_data, "personal.gender")) },
    { header: "Personal Date Of Birth", key: (app) => stringify(getPath(app.form_data, "personal.dateOfBirth")) },
    { header: "Personal Nationality", key: (app) => stringify(getPath(app.form_data, "personal.nationality")) },
    { header: "Personal Religion", key: (app) => stringify(getPath(app.form_data, "personal.religion")) },
    { header: "Personal Marital Status", key: (app) => stringify(getPath(app.form_data, "personal.maritalStatus")) },
    { header: "Personal Phone", key: (app) => stringify(getPath(app.form_data, "personal.phoneNumber")) },
    { header: "Personal Alternate Phone", key: (app) => stringify(getPath(app.form_data, "personal.alternatePhoneNumber")) },
    { header: "Personal Email", key: (app) => stringify(getPath(app.form_data, "personal.email")) },
    {
        header: "Personal Languages",
        key: (app) => {
            const languages = getPath(app.form_data, "personal.languagesSpoken");
            return Array.isArray(languages) ? languages.join("|") : "";
        },
    },
    {
        header: "Residential Address",
        key: (app) =>
            joinAddress([
                getPath(app.form_data, "personal.residentialAddress.houseNumber"),
                getPath(app.form_data, "personal.residentialAddress.address"),
                getPath(app.form_data, "personal.residentialAddress.city"),
                getPath(app.form_data, "personal.residentialAddress.state"),
                getPath(app.form_data, "personal.residentialAddress.country"),
            ]),
    },
    {
        header: "Address Verified",
        key: (app) =>
            yesNo(
                getPath(app.form_data, "address_verification.verified") ||
                getPath(app.form_data, "address_verified")
            ),
    },
    { header: "Nearest Landmark", key: (app) => stringify(getPath(app.form_data, "personal.nearestLandmark")) },
    { header: "Building Description", key: (app) => stringify(getPath(app.form_data, "personal.buildingDescription")) },
    { header: "ID Passport Number", key: (app) => stringify(getPath(app.form_data, "personal.identification.passportNo")) },
    { header: "ID Passport Expiry", key: (app) => stringify(getPath(app.form_data, "personal.identification.passportExpiryDate")) },
    {
        header: "ID National/Voters Card",
        key: (app) => stringify(getPath(app.form_data, "personal.identification.nationalIdOrVotersCardNo")),
    },
    { header: "Emergency Name", key: (app) => stringify(getPath(app.form_data, "personal.emergencyContact.name")) },
    {
        header: "Emergency Relationship",
        key: (app) => stringify(getPath(app.form_data, "personal.emergencyContact.relationship")),
    },
    { header: "Emergency Phone", key: (app) => stringify(getPath(app.form_data, "personal.emergencyContact.phoneNumber")) },
    { header: "Emergency Address", key: (app) => stringify(getPath(app.form_data, "personal.emergencyContact.address")) },

    { header: "Reporting To", key: (app) => stringify(getPath(app.form_data, "employment_terms.reporting_to")) },
    { header: "Effective Date", key: (app) => stringify(getPath(app.form_data, "employment_terms.effective_date")) },
    { header: "Employment Gross Salary", key: (app) => stringify(getPath(app.form_data, "employment_terms.gross_salary")) },
    { header: "Employment Net Salary", key: (app) => stringify(getPath(app.form_data, "employment_terms.net_salary")) },
    {
        header: "Statutory Tax Deduction",
        key: (app) => stringify(getPath(app.form_data, "employment_terms.statutory_tax_deduction")),
    },
    { header: "Bank Name", key: (app) => stringify(getPath(app.form_data, "employmentFinance.bankDetails.bankName")) },
    {
        header: "Bank Account Name",
        key: (app) => stringify(getPath(app.form_data, "employmentFinance.bankDetails.accountName")),
    },
    {
        header: "Bank Account Number",
        key: (app) => stringify(getPath(app.form_data, "employmentFinance.bankDetails.accountNumber")),
    },
    {
        header: "Education Summary",
        key: (app) => {
            const education = getPath(app.form_data, "employmentFinance.education");
            if (!Array.isArray(education)) return "";
            return listSummary(education as Array<Record<string, unknown>>, (item) => {
                const institution = stringify(item.institution);
                const qualification = stringify(item.qualification);
                const field = stringify(item.fieldOfStudy);
                const years = `${stringify(item.startYear)}-${stringify(item.endYear)}`;
                return [institution, qualification, field, years].filter(Boolean).join(" /");
            });
        },
    },

    { header: "Legal NDA Accepted", key: (app) => yesNo(getPath(app.form_data, "legal.ndaAccepted")) },
    { header: "Legal NDA Accepted At", key: (app) => stringify(getPath(app.form_data, "legal.ndaAcceptedAt")) },
    { header: "Legal Terms Accepted", key: (app) => yesNo(getPath(app.form_data, "legal.termsAccepted")) },
    { header: "Legal Terms Accepted At", key: (app) => stringify(getPath(app.form_data, "legal.termsAcceptedAt")) },
    {
        header: "Legal Non-Compete Accepted",
        key: (app) => yesNo(getPath(app.form_data, "legal.nonCompeteAccepted")),
    },
    {
        header: "Legal Non-Compete Accepted At",
        key: (app) => stringify(getPath(app.form_data, "legal.nonCompeteAcceptedAt")),
    },
    {
        header: "Legal Confidentiality Accepted",
        key: (app) => yesNo(getPath(app.form_data, "legal.confidentialityAccepted")),
    },
    {
        header: "Legal Confidentiality Accepted At",
        key: (app) => stringify(getPath(app.form_data, "legal.confidentialityAcceptedAt")),
    },

    { header: "Guarantor 1 Name", key: (app) => joinAddress([getPath(app.form_data, "guarantorReferee.guarantors.0.firstName"), getPath(app.form_data, "guarantorReferee.guarantors.0.middleName"), getPath(app.form_data, "guarantorReferee.guarantors.0.lastName")]) },
    { header: "Guarantor 1 Email", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.guarantors.0.email")) },
    { header: "Guarantor 1 Phone", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.guarantors.0.phoneNumber")) },
    { header: "Guarantor 1 Relationship", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.guarantors.0.relationship")) },
    { header: "Guarantor 2 Name", key: (app) => joinAddress([getPath(app.form_data, "guarantorReferee.guarantors.1.firstName"), getPath(app.form_data, "guarantorReferee.guarantors.1.middleName"), getPath(app.form_data, "guarantorReferee.guarantors.1.lastName")]) },
    { header: "Guarantor 2 Email", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.guarantors.1.email")) },
    { header: "Guarantor 2 Phone", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.guarantors.1.phoneNumber")) },
    { header: "Guarantor 2 Relationship", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.guarantors.1.relationship")) },

    { header: "Referee Name", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.referee.fullName")) },
    { header: "Referee Email", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.referee.emailAddress")) },
    { header: "Referee Phone", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.referee.phoneNumber")) },
    { header: "Referee Organization", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.referee.organization")) },
    { header: "Referee Position", key: (app) => stringify(getPath(app.form_data, "guarantorReferee.referee.position")) },

    {
        header: "Media Signature Uploaded",
        key: (app) => yesNo(getPath(app.form_data, "media.signature.storagePath")),
    },
    { header: "Media Signature Path", key: (app) => stringify(getPath(app.form_data, "media.signature.storagePath")) },
    {
        header: "Media Passport Uploaded",
        key: (app) => yesNo(getPath(app.form_data, "media.passportPhoto.storagePath")),
    },
    { header: "Media Passport Path", key: (app) => stringify(getPath(app.form_data, "media.passportPhoto.storagePath")) },

    {
        header: "Generated Offer Letter Path",
        key: (app) => stringify(getPath(app.form_data, "generatedPdfs.offerLetter.storagePath")),
    },
    { header: "Generated NDA Path", key: (app) => stringify(getPath(app.form_data, "generatedPdfs.nda.storagePath")) },
    {
        header: "Generated Indemnity Path",
        key: (app) => stringify(getPath(app.form_data, "generatedPdfs.indemnity.storagePath")),
    },

    {
        header: "Signed Guarantor 1 Path",
        key: (app) => stringify(getPath(app.form_data, "signedDocuments.guarantor1Signed.storagePath")),
    },
    {
        header: "Signed Guarantor 2 Path",
        key: (app) => stringify(getPath(app.form_data, "signedDocuments.guarantor2Signed.storagePath")),
    },
    {
        header: "Signed Referee Path",
        key: (app) => stringify(getPath(app.form_data, "signedDocuments.refereeSigned.storagePath")),
    },
    { header: "Signed NDA Path", key: (app) => stringify(getPath(app.form_data, "signedDocuments.ndaSigned.storagePath")) },
    {
        header: "Signed Indemnity Path",
        key: (app) => stringify(getPath(app.form_data, "signedDocuments.indemnitySigned.storagePath")),
    },
    {
        header: "Dress Code Acknowledged",
        key: (app) => yesNo(getPath(app.form_data, "documents.dressCodeAcknowledged")),
    },
    {
        header: "Dress Code Acknowledged At",
        key: (app) => stringify(getPath(app.form_data, "documents.dressCodeAcknowledgedAt")),
    },
    {
        header: "All Required Signed Docs Uploaded",
        key: (app) => {
            const signed = app.form_data?.signedDocuments;
            const allPresent = Boolean(
                signed?.guarantor1Signed?.storagePath &&
                signed?.guarantor2Signed?.storagePath &&
                signed?.refereeSigned?.storagePath &&
                signed?.ndaSigned?.storagePath
            );
            return allPresent ? "Yes" : "No";
        },
    },
];
