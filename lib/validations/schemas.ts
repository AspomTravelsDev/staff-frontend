import { z } from 'zod'

/**
 * Schemas for the public new-staff onboarding payload in form_data.
 * Optional browser inputs are allowed to arrive as null or empty strings.
 * Unknown keys are preserved because HR adds correction and workflow metadata.
 */
const optionalText = z.string().nullish()
const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).nullish()
const yearMonthText = z.string().regex(/^\d{4}-\d{2}$/).or(z.literal('')).nullish()

const uploadedFileSchema = z.object({
    fileName: z.string().nullish(),
    storagePath: z.string().nullish(),
    uploadedAt: z.string().nullish(),
    fileSize: z.number().nonnegative().nullish(),
    base64: z.string().nullish(),
    fileId: z.string().nullish(),
}).passthrough()

// Step 1: personal information
export const personalDataSchema = z.object({
    title: optionalText,
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    middleName: optionalText,
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    birthplace: optionalText,
    gender: z.enum(['male', 'female', 'other']),
    religion: optionalText,
    nationality: z.string().min(2, 'Nationality is required'),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    languagesSpoken: z.array(z.string()).nullish(),
    identification: z.object({
        nationalIdOrVotersCardNo: optionalText,
        passportNo: optionalText,
        passportExpiryDate: dateText,
    }).passthrough().nullish(),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
    alternatePhoneNumber: optionalText,
    email: z.string().email('Invalid email address'),
    residentialAddress: z.object({
        houseNumber: z.string().min(1, 'House number is required'),
        address: z.string().min(5, 'Address is required'),
        busStop: optionalText,
        city: z.string().min(2, 'City is required'),
        lga: z.string().min(2, 'LGA (Local Government Area) is required'),
        state: z.string().min(2, 'State is required'),
        country: z.string().min(2, 'Country is required'),
        postalCode: optionalText,
    }).passthrough(),
    nearestLandmark: z.string().min(5, 'Nearest landmark is required for verification'),
    gateColor: optionalText,
    houseColor: optionalText,
    buildingDescription: optionalText,
    emergencyContact: z.object({
        name: z.string().min(2, 'Emergency contact name is required'),
        relationship: z.string().min(2, 'Relationship is required'),
        phoneNumber: z.string().min(10, 'Emergency contact phone is required'),
        address: optionalText,
    }).passthrough(),
}).passthrough()

// Step 2: these fields match the object built by the live employment form.
export const employmentFinanceSchema = z.object({
    bankDetails: z.object({
        accountNumber: z.string().min(10, 'Valid account number is required'),
        accountName: optionalText,
        bankName: z.string().min(2, 'Bank name is required'),
    }).passthrough(),
    education: z.array(z.object({
        institution: z.string().min(2, 'Institution name is required'),
        qualification: optionalText,
        fieldOfStudy: optionalText,
        startYear: z.string().regex(/^\d{4}$/, 'Valid year required (YYYY)'),
        endYear: z.string().regex(/^\d{4}$/, 'Valid year required (YYYY)'),
        grade: optionalText,
    }).passthrough()).min(1, 'At least one educational qualification is required'),
    previousEmployment: z.array(z.object({
        employer: optionalText,
        position: optionalText,
        startDate: yearMonthText,
        endDate: yearMonthText,
        year: optionalText,
        reasonForLeaving: optionalText,
    }).passthrough()).optional(),
    certifications: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough()

// Step 3: the live form saves only these four agreements and timestamps.
export const legalAgreementsSchema = z.object({
    ndaAccepted: z.literal(true, { message: 'You must accept the NDA to proceed' }),
    ndaAcceptedAt: optionalText,
    nonCompeteAccepted: z.literal(true, { message: 'You must accept the non-compete clause' }),
    nonCompeteAcceptedAt: optionalText,
    confidentialityAccepted: z.literal(true, { message: 'You must accept the confidentiality agreement' }),
    confidentialityAcceptedAt: optionalText,
    termsAccepted: z.literal(true, { message: 'You must accept the terms and conditions' }),
    termsAcceptedAt: optionalText,
}).passthrough()

const guarantorSchema = z.object({
    firstName: z.string().min(1),
    middleName: optionalText,
    lastName: z.string().min(1),
    ageDob: dateText,
    phoneNumber: z.string().min(10, 'Valid phone number is required'),
    alternatePhoneNumber: optionalText,
    email: z.string().email('Valid email is required').or(z.literal('')).nullish(),
    address: z.object({
        street: optionalText,
        homeAddress: optionalText,
        city: optionalText,
        state: optionalText,
        country: optionalText,
    }).passthrough().nullish(),
    occupation: optionalText,
    employerName: optionalText,
    employerAddress: optionalText,
    relationship: z.string().min(2, 'Relationship is required'),
    yearsKnown: z.number().min(0).nullish(),
    characterAssessment: optionalText,
    liabilityAccepted: z.boolean(),
    liabilityAcceptedAt: optionalText,
    passportPhoto: uploadedFileSchema.nullish(),
    signature: optionalText,
    witness: z.object({
        name: optionalText,
        occupation: optionalText,
        phone: optionalText,
        address: optionalText,
        signature: optionalText,
    }).passthrough().nullish(),
    verification: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

const refereeAssessmentSchema = z.object({
    howLongKnown: optionalText,
    capacity: optionalText,
    lastContact: optionalText,
    abilityToGetAlong: optionalText,
    primarySkills: optionalText,
    areasToImprove: optionalText,
    collaborationComfort: optionalText,
    characterOpinion: optionalText,
    trustworthyWithConfidentialInfo: z.boolean().nullish(),
    observedIllegalActivity: optionalText,
    recommendForPosition: optionalText,
}).passthrough()

const refereeSchema = z.object({
    fullName: z.string().min(2, 'Referee full name is required'),
    nameOfReferee: optionalText,
    phoneNumber: z.string().min(10, 'Valid phone number is required'),
    phoneNumberAlternate: optionalText,
    emailAddress: z.string().email('Valid email is required').or(z.literal('')).nullish(),
    organization: z.string().min(1, 'Organization is required'),
    address: z.string().min(1, 'Address is required'),
    occupation: z.string().min(1, 'Occupation is required'),
    position: optionalText,
    relationshipType: z.enum(['professional', 'academic']),
    yearsKnown: z.number().min(0).nullish(),
    howLongKnown: z.string().min(1, 'How long you have known the applicant is required'),
    professionalAssessment: optionalText,
    assessment: refereeAssessmentSchema.optional(),
    signature: optionalText,
    passportPhoto: uploadedFileSchema.nullish(),
    verification: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

// Step 4 and 5 are saved together under guarantorReferee.
export const guarantorRefereeSchema = z.object({
    guarantors: z.array(guarantorSchema).length(2, 'Two guarantors are required'),
    referee: refereeSchema,
}).passthrough()

// Step 6: all uploaded assets saved by the live form.
export const mediaDataSchema = z.object({
    passportPhoto: uploadedFileSchema.nullish(),
    signature: uploadedFileSchema.nullish(),
    validId: uploadedFileSchema.nullish(),
    oLevelResults: uploadedFileSchema.nullish(),
    nyscCertificate: uploadedFileSchema.nullish(),
    universityCertificate: uploadedFileSchema.nullish(),
    birthCertificate: uploadedFileSchema.nullish(),
    resumeCv: uploadedFileSchema.nullish(),
    utilityBill: uploadedFileSchema.nullish(),
    ndaWitnessSignature: uploadedFileSchema.nullish(),
}).passthrough()

const documentsSchema = z.object({
    formsDownloaded: z.boolean(),
    downloadedAt: optionalText,
    dressCodeAcknowledged: z.boolean(),
    dressCodeAcknowledgedAt: optionalText,
}).passthrough()

const signedDocumentsSchema = z.object({
    guarantor1Signed: uploadedFileSchema.optional(),
    guarantor2Signed: uploadedFileSchema.optional(),
    refereeSigned: uploadedFileSchema.optional(),
    ndaSigned: uploadedFileSchema.optional(),
}).catchall(uploadedFileSchema)

const generatedPdfSchema = z.object({
    storagePath: z.string(),
    generatedAt: z.string(),
    fileSize: z.number().nonnegative(),
    fileId: z.string().optional(),
}).passthrough()

// Full public onboarding payload. HR-owned workflow data is explicitly kept
// permissive so parsing applicant sections never drops it during corrections.
export const completeFormDataSchema = z.object({
    personal: personalDataSchema,
    employmentFinance: employmentFinanceSchema,
    legal: legalAgreementsSchema,
    guarantorReferee: guarantorRefereeSchema,
    media: mediaDataSchema.refine(
        (data) => Boolean(
            data.passportPhoto?.storagePath &&
            data.signature?.storagePath &&
            data.validId?.storagePath &&
            data.oLevelResults?.storagePath &&
            data.nyscCertificate?.storagePath &&
            data.universityCertificate?.storagePath &&
            data.birthCertificate?.storagePath &&
            data.resumeCv?.storagePath &&
            data.utilityBill?.storagePath
        ),
        { message: 'All required applicant documents must be uploaded' }
    ),
    documents: documentsSchema.refine(
        (data) => data.formsDownloaded && data.dressCodeAcknowledged,
        { message: 'Required onboarding documents must be acknowledged' }
    ),
    signedDocuments: signedDocumentsSchema.refine(
        (data) => Boolean(
            data.guarantor1Signed?.storagePath &&
            data.guarantor2Signed?.storagePath &&
            data.refereeSigned?.storagePath &&
            data.ndaSigned?.storagePath
        ),
        { message: 'All required signed documents must be uploaded' }
    ),
    generatedPdfs: z.record(z.string(), z.union([generatedPdfSchema, z.string()])).optional(),
    currentStep: z.number().int().min(1).max(8),
    completedSteps: z.array(z.number().int().min(1).max(8)),
    lastUpdated: z.string().optional(),
    submittedAt: optionalText,
    employment_terms: z.record(z.string(), z.unknown()).optional(),
    recruitment_offer: z.record(z.string(), z.unknown()).optional(),
    review: z.record(z.string(), z.unknown()).optional(),
    reviewHistory: z.array(z.record(z.string(), z.unknown())).optional(),
    address_verification: z.record(z.string(), z.unknown()).optional(),
    address_verified: z.boolean().optional(),
    verificationHistory: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough()

// Export types inferred from schemas
export type PersonalDataInput = z.infer<typeof personalDataSchema>
export type EmploymentFinanceInput = z.infer<typeof employmentFinanceSchema>
export type LegalAgreementsInput = z.infer<typeof legalAgreementsSchema>
export type GuarantorRefereeInput = z.infer<typeof guarantorRefereeSchema>
export type MediaDataInput = z.infer<typeof mediaDataSchema>
export type CompleteFormDataInput = z.infer<typeof completeFormDataSchema>
