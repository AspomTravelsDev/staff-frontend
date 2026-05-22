export interface SalaryBreakdown {
    basic: number;
    rent_housing: number;
    transport: number;
    medical: number;
    furniture: number;
    utility: number;
    entertainment: number;
    meal_subsidy: number;
    clothing: number;
    passages: number;
    statutory_tax_deduction: number;
    net_salary: number;
}

export type ApplicationStatus = 'pending' | 'invited' | 'in_progress' | 'completed';

export interface UploadedFile {
    fileName: string;
    uploadedAt: string;
    storagePath: string;
    fileId?: string;
}

export interface RequiredSignedAssetDocument {
    key: string;
    label: string;
    description?: string;
    filename: string;
    assetUrl: string;
}

export interface GeneratedPdfFile {
    storagePath: string;
    generatedAt: string;
    fileSize: number;
    fileId?: string;
}

export interface PersonalInfo {
    email: string;
    title: string;
    gender: string;
    lastName: string;
    religion?: string;
    firstName: string;
    gateColor?: string;
    birthplace?: string;
    houseColor?: string;
    middleName?: string;
    dateOfBirth: string;
    nationality: string;
    phoneNumber: string;
    maritalStatus: string;
    identification: {
        passportNo?: string;
        passportExpiryDate?: string;
        nationalIdOrVotersCardNo?: string;
    };
    languagesSpoken: string[];
    nearestLandmark?: string;
    emergencyContact: {
        name: string;
        address: string;
        phoneNumber: string;
        relationship: string;
    };
    residentialAddress: {
        city: string;
        state: string;
        street: string;
        busStop?: string;
        country: string;
    };
    buildingDescription?: string;
    alternatePhoneNumber?: string;
}

export interface Education {
    grade?: string;
    degree?: string;
    endYear: string;
    startYear: string;
    institution: string;
    fieldOfStudy: string;
    qualification?: string;
}

export interface BankDetails {
    bankName: string;
    accountName: string;
    accountNumber: string;
}

export interface EmploymentFinance {
    education: Education[];
    bankDetails: BankDetails;
}

export interface EmploymentTerms {
    net_salary: number;
    gross_salary: number;
    is_intern: boolean;
    reporting_to: string;
    effective_date: string;
    salary_breakdown: SalaryBreakdown;
    staff_designation: string;
    statutory_tax_deduction: number;
}

export interface Referee {
    address: string;
    fullName: string;
    position: string;
    assessment: {
        capacity: string | null;
        lastContact: string | null;
        howLongKnown: string;
        primarySkills: string | null;
        areasToImprove: string | null;
        characterOpinion: string | null;
        abilityToGetAlong: string | null;
        collaborationComfort: string | null;
        recommendForPosition: string | null;
        observedIllegalActivity: string | null;
    };
    occupation: string;
    yearsKnown: number | null;
    phoneNumber: string;
    emailAddress: string;
    howLongKnown: string;
    organization: string;
    nameOfReferee: string | null;
    passportPhoto?: UploadedFile;
    relationshipType: string;
    phoneNumberAlternate: string;
    professionalAssessment: string | null;
}

export interface Guarantor {
    email: string;
    ageDob: string;
    address: {
        city: string;
        state: string;
        street: string;
        country: string;
        homeAddress: string | null;
    };
    lastName: string;
    position: string;
    firstName: string;
    middleName: string;
    occupation: string;
    yearsKnown: number | null;
    phoneNumber: string;
    employerName: string;
    relationship: string;
    passportPhoto?: UploadedFile;
    employerAddress: string;
    liabilityAccepted: boolean;
    characterAssessment: string;
    liabilityAcceptedAt: string;
    alternatePhoneNumber: string;
}

export interface GuarantorReferee {
    referee: Referee;
    guarantors: Guarantor[];
}

export interface OnboardingFormData {
    legal: {
        ndaAccepted: boolean;
        ndaAcceptedAt?: string;
        termsAccepted: boolean;
        termsAcceptedAt?: string;
        nonCompeteAccepted: boolean;
        nonCompeteAcceptedAt?: string;
        confidentialityAccepted: boolean;
        confidentialityAcceptedAt?: string;
    };
    media: {
        signature?: UploadedFile;
        passportPhoto?: UploadedFile;
    };
    personal: PersonalInfo;
    documents: {
        downloadedAt?: string;
        formsDownloaded: boolean;
        dressCodeAcknowledged?: boolean;
        dressCodeAcknowledgedAt?: string;
    };
    currentStep: number;
    lastUpdated?: string;
    submittedAt?: string;
    completedSteps: number[];
    signedDocuments: {
        refereeSigned?: UploadedFile;
        guarantor1Signed?: UploadedFile;
        guarantor2Signed?: UploadedFile;
        ndaSigned?: UploadedFile;
        [key: string]: UploadedFile | undefined;
    };
    generatedPdfs: {
        guarantor1?: GeneratedPdfFile;
        guarantor2?: GeneratedPdfFile;
        referee?: GeneratedPdfFile;
        offerLetter?: GeneratedPdfFile;
        nda?: GeneratedPdfFile;
        personalForm?: GeneratedPdfFile;
        kyc?: GeneratedPdfFile;
    };
    employment_terms: EmploymentTerms;
    guarantorReferee: GuarantorReferee;
    employmentFinance: EmploymentFinance;
}

export interface OnboardingApplication {
    id: string; // uuid
    application_id: string; // unique reference e.g. ASPOM-IT OFFICER-2026-000001

    // Core columns
    applicant_name: string | null;
    applicant_email: string;
    position_title: string;
    salary_gross: number;
    status: ApplicationStatus;

    // The main data blob (all form steps + employment_terms)
    form_data: Partial<OnboardingFormData> & {
        employment_terms?: {
            staff_designation: string;
            reporting_to: string;
            effective_date: string;
            gross_salary: number;
            is_intern: boolean;
            salary_breakdown: SalaryBreakdown;
            statutory_tax_deduction: number;
            net_salary: number;
        };
        [key: string]: unknown;
    };

    // Metadata
    invited_at: string;
    completed_at?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
    required_signed_assets?: RequiredSignedAssetDocument[];
}

export interface CreateApplicationRequest {
    applicant_name?: string;
    applicant_email: string;
    position_title: string;
    is_intern: boolean;
    reporting_to: string;
    effective_date: string;
    salary_gross: number;
    salary_breakdown: SalaryBreakdown;
}

