// Zustand store for visa application form state
// Persists form data to localStorage with application ID as key

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { VisaCountry, FormStep } from "@/lib/visa/fields"
import type { TimelineEntry, UploadedFile, AddressInput } from "@/lib/validations/visa"

// ==========================================
// TYPES
// ==========================================

export interface VisaFormData {
    // Identity & Nationality (Step 1)
    given_names?: string
    surname?: string
    dob?: string
    gender?: string
    marital_status?: string
    current_nationality?: string
    place_of_birth?: string
    country_of_birth?: string
    native_language?: string
    dual_citizenship?: string
    dual_citizenship_details?: string
    prior_names?: string

    // Residency & Contact (Step 2)
    current_address?: AddressInput
    email_address?: string
    phone_number?: string
    mailing_address_same?: string
    mailing_address?: AddressInput
    residence_permit?: string
    residence_permit_expiry?: string
    address_duration?: string
    address_ownership?: string
    phone_type?: string

    // Travel Documents (Step 3)
    passport_number?: string
    passport_issue_date?: string
    passport_expiry_date?: string
    passport_issue_authority?: string
    national_id_number?: string
    national_id_expiry?: string
    passport_bio_page?: UploadedFile[]
    passport_photo?: UploadedFile[]

    // Employment & Finance (Step 4)
    emp_status?: string
    job_title?: string
    employer_name?: string
    employer_address?: AddressInput
    employer_phone?: string
    emp_history_10yr?: TimelineEntry[]
    edu_history?: TimelineEntry[]
    annual_income?: string
    savings_amount?: string
    additional_income?: string
    financial_means?: string
    employment_letter?: UploadedFile[]
    bank_statements?: UploadedFile[]

    // Family & Relationships (Step 5)
    father_given_names?: string
    father_surname?: string
    father_dob?: string
    mother_given_names?: string
    mother_surname?: string
    mother_dob?: string
    father_country_of_residence?: string
    mother_country_of_residence?: string
    spouse_given_names?: string
    spouse_surname?: string
    spouse_dob?: string
    spouse_nationality?: string
    spouse_living_together?: string
    has_dependants?: string
    dependants_count?: string
    uk_family_member?: string
    uk_family_relationship?: string
    uk_family_status?: string
    has_children?: string
    children?: TimelineEntry[]
    eu_relation?: string
    eu_relation_details?: string

    // Trip Details (Step 6)
    arrival_date?: string
    departure_date?: string
    purpose_main?: string
    purpose_details?: string
    has_inviter?: string
    inviter_name?: string
    inviter_address?: AddressInput
    inviter_phone?: string
    inviter_email?: string
    inviter_relationship?: string
    trip_description?: string
    first_entry_state?: string
    entries_requested?: string
    accommodation_name?: string
    accommodation_address?: AddressInput
    flight_itinerary?: UploadedFile[]
    accommodation_booking?: UploadedFile[]
    invitation_letter?: UploadedFile[]

    // Travel & Immigration History (Step 7)
    has_refusal?: string
    refusal_details?: string
    travel_history_10y?: TimelineEntry[]
    criminal_record?: string
    criminal_details?: string
    security_concerns?: string
    immigration_breach?: string
    immigration_breach_details?: string
    five_eyes_travel?: string
    five_eyes_details?: string
    eea_travel?: string
    eea_travel_details?: string
    fingerprint_history?: string
    fingerprint_date?: string
    previous_schengen_visa?: string

    // Allow additional fields
    [key: string]: unknown
}

export interface VisaFormState {
    // Application metadata
    applicationId: string | null
    country: VisaCountry | null
    currentStep: number
    lastSavedAt: string | null
    isSubmitted: boolean

    // Form data
    formData: VisaFormData

    // Actions
    initializeApplication: (
        applicationId: string,
        country: VisaCountry,
        prefillData?: Partial<VisaFormData>
    ) => void
    setStep: (step: number) => void
    nextStep: () => void
    prevStep: () => void
    updateField: (name: string, value: unknown) => void
    updateFields: (fields: Partial<VisaFormData>) => void
    addTimelineEntry: (fieldName: string, entry: TimelineEntry) => void
    updateTimelineEntry: (
        fieldName: string,
        entryId: string,
        data: Partial<TimelineEntry>
    ) => void
    removeTimelineEntry: (fieldName: string, entryId: string) => void
    addFile: (fieldName: string, file: UploadedFile) => void
    removeFile: (fieldName: string, fileId: string) => void
    markAsSaved: () => void
    markAsSubmitted: () => void
    resetForm: () => void
    loadFromServer: (data: VisaFormData, step?: number) => void
}

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
    applicationId: null,
    country: null,
    currentStep: 1,
    lastSavedAt: null,
    isSubmitted: false,
    formData: {},
}

// ==========================================
// STORE
// ==========================================

export const useVisaFormStore = create<VisaFormState>()(
    persist(
        immer((set) => ({
            ...initialState,

            initializeApplication: (applicationId, country, prefillData) => {
                set((state) => {
                    state.applicationId = applicationId
                    state.country = country
                    state.currentStep = 1
                    state.isSubmitted = false
                    state.formData = prefillData || {}
                })
            },

            setStep: (step) => {
                set((state) => {
                    state.currentStep = Math.max(1, Math.min(7, step))
                })
            },

            nextStep: () => {
                set((state) => {
                    if (state.currentStep < 7) {
                        state.currentStep += 1
                    }
                })
            },

            prevStep: () => {
                set((state) => {
                    if (state.currentStep > 1) {
                        state.currentStep -= 1
                    }
                })
            },

            updateField: (name, value) => {
                set((state) => {
                    state.formData[name] = value
                })
            },

            updateFields: (fields) => {
                set((state) => {
                    Object.assign(state.formData, fields)
                })
            },

            addTimelineEntry: (fieldName, entry) => {
                set((state) => {
                    const current = (state.formData[fieldName] as TimelineEntry[]) || []
                    state.formData[fieldName] = [...current, entry]
                })
            },

            updateTimelineEntry: (fieldName, entryId, data) => {
                set((state) => {
                    const entries = state.formData[fieldName] as TimelineEntry[] | undefined
                    if (entries) {
                        const index = entries.findIndex((e) => e.id === entryId)
                        if (index !== -1) {
                            entries[index] = { ...entries[index], ...data }
                        }
                    }
                })
            },

            removeTimelineEntry: (fieldName, entryId) => {
                set((state) => {
                    const entries = state.formData[fieldName] as TimelineEntry[] | undefined
                    if (entries) {
                        state.formData[fieldName] = entries.filter((e) => e.id !== entryId)
                    }
                })
            },

            addFile: (fieldName, file) => {
                set((state) => {
                    const current = (state.formData[fieldName] as UploadedFile[]) || []
                    state.formData[fieldName] = [...current, file]
                })
            },

            removeFile: (fieldName, fileId) => {
                set((state) => {
                    const files = state.formData[fieldName] as UploadedFile[] | undefined
                    if (files) {
                        state.formData[fieldName] = files.filter((f) => f.id !== fileId)
                    }
                })
            },

            markAsSaved: () => {
                set((state) => {
                    state.lastSavedAt = new Date().toISOString()
                })
            },

            markAsSubmitted: () => {
                set((state) => {
                    state.isSubmitted = true
                })
            },

            resetForm: () => {
                set(() => ({ ...initialState }))
            },

            loadFromServer: (data, step) => {
                set((state) => {
                    state.formData = data
                    if (step) {
                        state.currentStep = step
                    }
                })
            },
        })),
        {
            name: "visa-form-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                applicationId: state.applicationId,
                country: state.country,
                currentStep: state.currentStep,
                lastSavedAt: state.lastSavedAt,
                formData: state.formData,
                isSubmitted: state.isSubmitted,
            }),
        }
    )
)

// ==========================================
// SELECTORS
// ==========================================

/**
 * Get form data for a specific step
 */
export function useStepData(_step: FormStep) {
    const formData = useVisaFormStore((state) => state.formData)
    return formData
}

/**
 * Check if current application matches the URL params
 */
export function useIsApplicationLoaded(applicationId: string, country: VisaCountry) {
    const storeId = useVisaFormStore((state) => state.applicationId)
    const storeCountry = useVisaFormStore((state) => state.country)
    return storeId === applicationId && storeCountry === country
}

/**
 * Get progress percentage
 */
export function useProgressPercentage() {
    const currentStep = useVisaFormStore((state) => state.currentStep)
    return Math.round((currentStep / 7) * 100)
}
