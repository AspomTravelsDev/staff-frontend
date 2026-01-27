import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PersonalData = {
    title?: string
    firstName: string
    middleName?: string
    lastName: string
    dateOfBirth: string
    birthplace?: string
    gender: string
    religion?: string
    nationality: string
    maritalStatus: string
    languagesSpoken?: string[]
    identification?: {
        nationalIdOrVotersCardNo?: string
        passportNo?: string
        passportExpiryDate?: string
    }
    phoneNumber: string
    alternatePhoneNumber?: string
    email: string
    residentialAddress: {
        street: string
        busStop?: string
        city: string
        state: string
        country: string
    }
    nearestLandmark: string
    gateColor?: string
    houseColor?: string
    buildingDescription?: string
    emergencyContact: {
        name: string
        relationship: string
        phoneNumber: string
        address?: string
    }
}

export type EmploymentData = {
    educationLevel: string
    institution: string
    courseOfStudy: string
    graduationYear: string
    currentEmployer?: string
    currentRole?: string
    experienceYears: string
    skills: string[]
    linkedinUrl?: string
    expectations: string
}

export type LegalData = {
    hasCriminalRecord: boolean
    criminalRecordDetails?: string
    agreesToBackgroundCheck: boolean
    declaration: boolean
}

export type MediaData = {
    passportPhoto?: string
    signature?: string
    socialHandles?: Record<string, string>
}

export type ApplicantFormData = {
    personal: PersonalData
    employment: EmploymentData
    legal: LegalData
    guarantors: any[]
    referee: any
    media: MediaData
    documents: {
        cv?: string
        certificates?: string[]
    }
    signedDocuments: {
        guarantorForm?: string
    }
}

interface ApplicantState {
    currentStep: number
    completedSteps: number[]
    formData: Partial<ApplicantFormData>
    setStep: (step: number) => void
    completeStep: (step: number) => void
    updateFormData: (section: keyof ApplicantFormData, data: any) => void
    resetForm: () => void
}

export const useApplicantStore = create<ApplicantState>()(
    persist(
        (set) => ({
            currentStep: 1,
            completedSteps: [],
            formData: {},
            setStep: (step) => set({ currentStep: step }),
            completeStep: (step) =>
                set((state) => ({
                    completedSteps: Array.from(new Set([...state.completedSteps, step])),
                })),
            updateFormData: (section, data) =>
                set((state) => ({
                    formData: {
                        ...state.formData,
                        [section]: { ...state.formData[section], ...data },
                    },
                })),
            resetForm: () => set({ currentStep: 1, completedSteps: [], formData: {} }),
        }),
        {
            name: 'applicant-storage',
        }
    )
)
