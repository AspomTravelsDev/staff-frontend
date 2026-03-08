export interface PersonalData {
    title?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    birthplace?: string;
    gender: 'male' | 'female' | 'other';
    religion?: string;
    nationality: string;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    languagesSpoken?: string[];
    identification?: {
        nationalIdOrVotersCardNo?: string;
        passportNo?: string;
        passportExpiryDate?: string;
    };
    phoneNumber: string;
    alternatePhoneNumber?: string;
    email: string;
    residentialAddress: {
        street: string;
        busStop?: string;
        city: string;
        state: string;
        country: string;
        postalCode?: string;
    };
    nearestLandmark: string;
    gateColor?: string;
    houseColor?: string;
    buildingDescription?: string;
    emergencyContact: {
        name: string;
        relationship: string;
        phoneNumber: string;
        address?: string;
    };
}

export interface EmploymentFinanceData {
    bankDetails: {
        accountNumber: string;
        accountName?: string;
        bankName: string;
    };
    education: Array<{
        institution: string;
        degree?: string;
        qualification?: string;
        fieldOfStudy?: string;
        startYear: string;
        endYear: string;
        grade?: string;
    }>;
    previousEmployment?: Array<{
        companyName: string;
        employer?: string;
        position: string;
        startDate?: string;
        endDate?: string;
        year?: string;
        reasonForLeaving?: string;
    }>;
    certifications?: Array<{
        name: string;
        issuingOrganization: string;
        issueDate?: string;
        expiryDate?: string;
    }>;
}

export interface LegalAgreements {
    ndaAccepted: boolean;
    ndaAcceptedAt?: string;
    nonCompeteAccepted: boolean;
    nonCompeteAcceptedAt?: string;
    confidentialityAccepted: boolean;
    confidentialityAcceptedAt?: string;
    termsAccepted: boolean;
    termsAcceptedAt?: string;
    legalDeclaration: {
        hasConvictions: boolean;
        convictionDetails?: string;
        hasMedicalConditions: boolean;
        medicalConditionDetails?: string;
    };
}

export interface GuarantorRefereeData {
    guarantors: Array<{
        firstName: string;
        middleName?: string;
        lastName: string;
        fullName: string;
        ageDob?: string;
        phoneNumber: string;
        alternatePhoneNumber?: string;
        email?: string;
        address?: {
            street?: string;
            homeAddress?: string;
            city?: string;
            state?: string;
            country?: string;
        };
        occupation?: string;
        position?: string;
        employerName?: string;
        employerAddress?: string;
        relationship?: string;
        yearsKnown?: number;
        characterAssessment?: string;
        liabilityAccepted?: boolean;
        liabilityAcceptedAt?: string;
        signature?: string;
        passportPhoto?: {
            fileName?: string;
            storagePath?: string;
            uploadedAt?: string;
        };
        witness?: {
            name?: string;
            occupation?: string;
            phone?: string;
            address?: string;
            signature?: string;
        };
    }>;
    referee: {
        fullName: string;
        nameOfReferee?: string;
        phoneNumber: string;
        phoneNumberAlternate?: string;
        emailAddress?: string;
        organization?: string;
        address?: string;
        occupation?: string;
        position?: string;
        relationshipType?: 'professional' | 'academic' | 'personal';
        yearsKnown?: number;
        howLongKnown?: string;
        professionalAssessment?: string;
        assessment?: {
            howLongKnown?: string;
            capacity?: string;
            lastContact?: string;
            abilityToGetAlong?: string;
            primarySkills?: string;
            areasToImprove?: string;
            collaborationComfort?: string;
            characterOpinion?: string;
            trustworthyWithConfidentialInfo?: boolean;
            observedIllegalActivity?: string;
            recommendForPosition?: string;
        };
        signature?: string;
        passportPhoto?: {
            fileName?: string;
            storagePath?: string;
            uploadedAt?: string;
        };
    };
}

export interface MediaData {
    passportPhoto?: {
        fileName?: string;
        storagePath?: string;
        uploadedAt?: string;
        fileSize?: number;
        base64?: string;
    };
    signature?: {
        fileName?: string;
        storagePath?: string;
        uploadedAt?: string;
        fileSize?: number;
        base64?: string;
    };
    ndaWitnessSignature?: {
        fileName?: string;
        storagePath?: string;
        uploadedAt?: string;
        fileSize?: number;
        base64?: string;
    };
}

export interface ApplicationFormData {
    personal: PersonalData;
    employmentFinance: EmploymentFinanceData;
    legal: LegalAgreements;
    guarantorReferee: GuarantorRefereeData;
    media: MediaData;
    currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    completedSteps: number[];
    lastUpdated: string;
    submittedAt?: string;
    generatedPdfs?: {
        [key: string]: any;
    };
    signedDocuments?: {
        [key: string]: any;
    };
}
