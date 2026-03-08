import { z } from 'zod'

/**
 * Zod validation schemas for each form step
 * Ensures strict validation before storing in form_data JSONB
 */

// Step 1: KYC & Personal Data Schema
export const personalDataSchema = z.object({
    title: z.string().optional(),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    middleName: z.string().optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),

    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    birthplace: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']),
    religion: z.string().optional(),
    nationality: z.string().min(2, 'Nationality is required'),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    languagesSpoken: z.array(z.string()).optional(),

    // Identification
    identification: z.object({
        nationalIdOrVotersCardNo: z.string().optional(),
        passportNo: z.string().optional(),
        passportExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    }).optional(),

    phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
    alternatePhoneNumber: z.string().optional(),
    email: z.string().email('Invalid email address'),

    residentialAddress: z.object({
        street: z.string().min(5, 'Street address is required'),
        busStop: z.string().optional(),
        city: z.string().min(2, 'City is required'),
        state: z.string().min(2, 'State is required'),
        country: z.string().min(2, 'Country is required'),
        postalCode: z.string().optional(),
    }),

    nearestLandmark: z.string().min(5, 'Nearest landmark is required for verification'),
    gateColor: z.string().optional(),
    houseColor: z.string().optional(),
    buildingDescription: z.string().optional(),

    emergencyContact: z.object({
        name: z.string().min(2, 'Emergency contact name is required'),
        relationship: z.string().min(2, 'Relationship is required'),
        phoneNumber: z.string().min(10, 'Emergency contact phone is required'),
        address: z.string().optional(),
    }),
})

// Step 2: Employment & Finance Schema
export const employmentFinanceSchema = z.object({
    bankDetails: z.object({
        accountNumber: z.string().min(10, 'Valid account number is required'),
        accountName: z.string().optional(),
        bankName: z.string().min(2, 'Bank name is required'),
        branchName: z.string().optional(),
        sortCode: z.string().optional(),
    }),

    education: z.array(
        z.object({
            institution: z.string().min(2, 'Institution name is required'),
            degree: z.string().optional(),
            qualification: z.string().optional(),
            fieldOfStudy: z.string().optional(),
            startYear: z.string().regex(/^\d{4}$/, 'Valid year required (YYYY)'),
            endYear: z.string().regex(/^\d{4}$/, 'Valid year required (YYYY)'),
            grade: z.string().optional(),
        })
    ).min(1, 'At least one educational qualification is required'),

    previousEmployment: z.array(
        z.object({
            companyName: z.string().optional(),
            employer: z.string().optional(),
            position: z.string().min(2, 'Position is required'),
            startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
            endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
            year: z.string().optional(),
            reasonForLeaving: z.string().optional(),
        })
    ).optional(),

    certifications: z.array(
        z.object({
            name: z.string().min(2, 'Certification name is required'),
            issuingOrganization: z.string().min(2, 'Issuing organization is required'),
            issueDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
            expiryDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
        })
    ).optional(),
})

// Step 3: NDA & Legal Agreements Schema
export const legalAgreementsSchema = z.object({
    ndaAccepted: z.literal(true, {
        message: 'You must accept the NDA to proceed',
    }),
    ndaAcceptedAt: z.string().optional(),

    nonCompeteAccepted: z.literal(true, {
        message: 'You must accept the non-compete clause',
    }),
    nonCompeteAcceptedAt: z.string().optional(),

    confidentialityAccepted: z.literal(true, {
        message: 'You must accept the confidentiality agreement',
    }),
    confidentialityAcceptedAt: z.string().optional(),

    legalDeclaration: z.object({
        hasConvictions: z.boolean(),
        convictionDetails: z.string().optional(),
        hasMedicalConditions: z.boolean(),
        medicalConditionDetails: z.string().optional(),
    }).refine(
        (data) => {
            if (data.hasConvictions && !data.convictionDetails) return false
            if (data.hasMedicalConditions && !data.medicalConditionDetails) return false
            return true
        },
        { message: 'Please provide details when applicable' }
    ),

    termsAccepted: z.literal(true, {
        message: 'You must accept the terms and conditions',
    }),
    termsAcceptedAt: z.string().optional(),
})

// Step 4: Guarantor & Referee Schema
export const guarantorRefereeSchema = z.object({
    guarantor: z.object({
        firstName: z.string().optional(),
        middleName: z.string().optional(),
        lastName: z.string().optional(),
        fullName: z.string().min(2, 'Guarantor full name is required'),
        ageDob: z.string().optional(),

        phoneNumber: z.string().min(10, 'Valid phone number is required'),
        alternatePhoneNumber: z.string().optional(),
        email: z.string().email('Valid email is required').optional().or(z.literal('')),

        address: z.object({
            street: z.string().optional(),
            homeAddress: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            country: z.string().optional(),
        }).optional(),

        occupation: z.string().min(2, 'Occupation is required'),
        position: z.string().optional(),
        employerName: z.string().optional(),
        employerAddress: z.string().optional(),

        relationship: z.string().min(2, 'Relationship is required'),
        yearsKnown: z.number().min(0).optional(),

        characterAssessment: z.string().optional(),

        liabilityAccepted: z.literal(true, {
            message: 'Guarantor must accept liability declaration',
        }),
        liabilityAcceptedAt: z.string().optional(),

        signature: z.string().optional(),

        witness: z.object({
            name: z.string().optional(),
            occupation: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            signature: z.string().optional(),
        }).optional(),
    }),

    referee: z.object({
        fullName: z.string().optional(),
        nameOfReferee: z.string().min(2, 'Referee full name is required'),

        phoneNumber: z.string().min(10, 'Valid phone number is required'),
        phoneNumberAlternate: z.string().optional(),
        emailAddress: z.string().email('Valid email is required').optional().or(z.literal('')),

        organization: z.string().optional(),
        address: z.string().optional(),
        occupation: z.string().min(2, 'Occupation is required'),
        position: z.string().optional(),

        relationshipType: z.enum(['professional', 'academic', 'personal']).optional(),
        yearsKnown: z.number().min(0).optional(),
        howLongKnown: z.string().optional(),

        professionalAssessment: z.string().optional(),
        assessment: z.object({
            howLongKnown: z.string().optional(),
            capacity: z.string().optional(),
            lastContact: z.string().optional(),
            abilityToGetAlong: z.string().optional(),
            primarySkills: z.string().optional(),
            areasToImprove: z.string().optional(),
            collaborationComfort: z.string().optional(),
            characterOpinion: z.string().optional(),
            trustworthyWithConfidentialInfo: z.boolean().optional(),
            observedIllegalActivity: z.string().optional(),
            recommendForPosition: z.string().optional(),
        }).optional(),

        signature: z.string().optional(),
    }),
})

// Step 5: Media Upload Schema
export const mediaDataSchema = z.object({
    passportPhoto: z.object({
        fileName: z.string().optional(),
        storagePath: z.string().optional(),
        uploadedAt: z.string().optional(),
        fileSize: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB').optional(),
        base64: z.string().optional(),
    }).optional(),

    signature: z.object({
        fileName: z.string().optional(),
        storagePath: z.string().optional(),
        uploadedAt: z.string().optional(),
        fileSize: z.number().max(2 * 1024 * 1024, 'Signature size must be less than 2MB').optional(),
        base64: z.string().optional(),
    }).optional(),

    ndaWitnessSignature: z.object({
        fileName: z.string().optional(),
        storagePath: z.string().optional(),
        uploadedAt: z.string().optional(),
        fileSize: z.number().max(2 * 1024 * 1024, 'Signature size must be less than 2MB').optional(),
        base64: z.string().optional(),
    }).optional(),
})

// Complete Form Schema (for final submission validation)
export const completeFormDataSchema = z.object({
    personal: personalDataSchema,
    employmentFinance: employmentFinanceSchema,
    legal: legalAgreementsSchema,
    guarantorReferee: guarantorRefereeSchema,
    media: mediaDataSchema.refine(
        (data) => data.passportPhoto && data.signature,
        { message: 'Both passport photo and signature are required' }
    ),

    currentStep: z.number().min(1).max(5),
    completedSteps: z.array(z.number()),
    lastUpdated: z.string(),
    submittedAt: z.string().optional(),
})

// Export types inferred from schemas
export type PersonalDataInput = z.infer<typeof personalDataSchema>
export type EmploymentFinanceInput = z.infer<typeof employmentFinanceSchema>
export type LegalAgreementsInput = z.infer<typeof legalAgreementsSchema>
export type GuarantorRefereeInput = z.infer<typeof guarantorRefereeSchema>
export type MediaDataInput = z.infer<typeof mediaDataSchema>
export type CompleteFormDataInput = z.infer<typeof completeFormDataSchema>
