// Visa Application Field Configuration System
// Defines all fields for Canada, UK, and Schengen visa applications

export type VisaCountry = "canada" | "uk" | "schengen"

export type FieldType =
    | "text"
    | "email"
    | "tel"
    | "date"
    | "select"
    | "radio"
    | "checkbox"
    | "textarea"
    | "file"
    | "address"
    | "timeline"

export type FormStep =
    | "identity"
    | "residency"
    | "documents"
    | "employment"
    | "family"
    | "trip"
    | "history"

export interface FieldOption {
    value: string
    label: string
}

export interface FieldCondition {
    field: string
    operator: "equals" | "notEquals" | "in" | "notIn" | "exists"
    value: string | string[] | boolean
}

export interface FieldDefinition {
    name: string
    label: string
    type: FieldType
    step: FormStep
    countries: VisaCountry[] | "all"
    required?: boolean
    prefillable?: boolean
    placeholder?: string
    description?: string
    options?: FieldOption[]
    conditions?: FieldCondition[]
    validation?: {
        min?: number
        max?: number
        minLength?: number
        maxLength?: number
        pattern?: string
        patternMessage?: string
    }
    // For timeline fields
    timelineConfig?: {
        minYears: number
        requireNoGaps: boolean
        fields: Omit<FieldDefinition, "step" | "countries" | "conditions">[]
    }
}

// Step definitions with labels and descriptions
export const FORM_STEPS: {
    id: FormStep
    label: string
    description: string
    order: number
}[] = [
        {
            id: "identity",
            label: "Identity & Nationality",
            description: "Personal identification details",
            order: 1,
        },
        {
            id: "residency",
            label: "Residency & Contact",
            description: "Address and contact information",
            order: 2,
        },
        {
            id: "documents",
            label: "Travel Documents",
            description: "Passport and ID details",
            order: 3,
        },
        {
            id: "employment",
            label: "Employment & Finance",
            description: "Work and financial information",
            order: 4,
        },
        {
            id: "family",
            label: "Family & Relationships",
            description: "Family members and dependents",
            order: 5,
        },
        {
            id: "trip",
            label: "Trip Details",
            description: "Travel plans and purpose",
            order: 6,
        },
        {
            id: "history",
            label: "Travel & Immigration History",
            description: "Previous visas and travel",
            order: 7,
        },
    ]

// Gender options
const GENDER_OPTIONS: FieldOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
]

// Marital status options
const MARITAL_STATUS_OPTIONS: FieldOption[] = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "divorced", label: "Divorced" },
    { value: "widowed", label: "Widowed" },
    { value: "separated", label: "Separated" },
    { value: "common_law", label: "Common Law Partner" },
]

// Employment status options
const EMPLOYMENT_STATUS_OPTIONS: FieldOption[] = [
    { value: "employed", label: "Employed" },
    { value: "self_employed", label: "Self-Employed" },
    { value: "unemployed", label: "Unemployed" },
    { value: "student", label: "Student" },
    { value: "retired", label: "Retired" },
    { value: "homemaker", label: "Homemaker" },
]

// Purpose of travel options
const PURPOSE_OPTIONS: FieldOption[] = [
    { value: "tourism", label: "Tourism" },
    { value: "business", label: "Business" },
    { value: "visit_family", label: "Visiting Family/Friends" },
    { value: "study", label: "Study" },
    { value: "medical", label: "Medical Treatment" },
    { value: "transit", label: "Transit" },
    { value: "conference", label: "Conference/Event" },
    { value: "other", label: "Other" },
]

// Address ownership options (UK)
const ADDRESS_OWNERSHIP_OPTIONS: FieldOption[] = [
    { value: "own", label: "Own" },
    { value: "rent", label: "Rent" },
    { value: "family", label: "Living with Family" },
    { value: "employer", label: "Employer Provided" },
    { value: "other", label: "Other" },
]

// Financial means options (Schengen)
const FINANCIAL_MEANS_OPTIONS: FieldOption[] = [
    { value: "cash", label: "Cash" },
    { value: "credit_card", label: "Credit Card" },
    { value: "traveller_cheques", label: "Traveller's Cheques" },
    { value: "prepaid_accommodation", label: "Pre-paid Accommodation" },
    { value: "prepaid_transport", label: "Pre-paid Transport" },
    { value: "sponsor", label: "Sponsor (host, company, organisation)" },
    { value: "other", label: "Other" },
]

// Entry type options (Schengen)
const ENTRY_TYPE_OPTIONS: FieldOption[] = [
    { value: "single", label: "Single Entry" },
    { value: "double", label: "Double Entry" },
    { value: "multiple", label: "Multiple Entries" },
]

// All field definitions
export const VISA_FIELDS: FieldDefinition[] = [
    // ==========================================
    // STEP 1: IDENTITY & NATIONALITY
    // ==========================================

    // Universal fields
    {
        name: "given_names",
        label: "Given Names",
        type: "text",
        step: "identity",
        countries: "all",
        required: true,
        prefillable: true,
        placeholder: "As shown in passport",
        description: "Enter all given names exactly as they appear in your passport",
    },
    {
        name: "surname",
        label: "Surname / Family Name",
        type: "text",
        step: "identity",
        countries: "all",
        required: true,
        prefillable: true,
        placeholder: "As shown in passport",
    },
    {
        name: "dob",
        label: "Date of Birth",
        type: "date",
        step: "identity",
        countries: "all",
        required: true,
        prefillable: true,
    },
    {
        name: "gender",
        label: "Gender",
        type: "select",
        step: "identity",
        countries: "all",
        required: true,
        options: GENDER_OPTIONS,
    },
    {
        name: "marital_status",
        label: "Marital Status",
        type: "select",
        step: "identity",
        countries: "all",
        required: true,
        options: MARITAL_STATUS_OPTIONS,
    },
    {
        name: "current_nationality",
        label: "Current Nationality / Citizenship",
        type: "text",
        step: "identity",
        countries: "all",
        required: true,
        prefillable: true,
        placeholder: "e.g., Nigerian",
    },

    // Canada + Schengen: Place of birth
    {
        name: "place_of_birth",
        label: "Place of Birth",
        type: "text",
        step: "identity",
        countries: ["canada", "uk", "schengen"],
        required: true,
        placeholder: "City/Town",
    },
    {
        name: "country_of_birth",
        label: "Country of Birth",
        type: "text",
        step: "identity",
        countries: ["canada", "uk", "schengen"],
        required: true,
    },

    // Canada-only: Native language
    {
        name: "native_language",
        label: "Native Language / Mother Tongue",
        type: "text",
        step: "identity",
        countries: ["canada"],
        required: true,
        placeholder: "e.g., English, Yoruba, French",
    },

    // Shared: Dual citizenship (Canada + UK)
    {
        name: "dual_citizenship",
        label: "Do you hold citizenship of any other country?",
        type: "radio",
        step: "identity",
        countries: ["canada", "uk"],
        required: true,
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "dual_citizenship_details",
        label: "Other Citizenship Details",
        type: "text",
        step: "identity",
        countries: ["canada", "uk"],
        placeholder: "Country and passport number",
        conditions: [{ field: "dual_citizenship", operator: "equals", value: "yes" }],
    },

    // UK + Schengen: Prior names
    {
        name: "prior_names",
        label: "Previous Names (if any)",
        type: "text",
        step: "identity",
        countries: ["uk", "schengen"],
        placeholder: "Maiden name, previous married name, etc.",
        description: "Include surname at birth if different from current surname",
    },

    // ==========================================
    // STEP 2: RESIDENCY & CONTACT
    // ==========================================

    // Universal fields
    {
        name: "current_address",
        label: "Current Residential Address",
        type: "address",
        step: "residency",
        countries: "all",
        required: true,
    },
    {
        name: "email_address",
        label: "Email Address",
        type: "email",
        step: "residency",
        countries: "all",
        required: true,
        prefillable: true,
    },
    {
        name: "phone_number",
        label: "Phone Number",
        type: "tel",
        step: "residency",
        countries: "all",
        required: true,
        prefillable: true,
    },

    // Shared: Mailing address (Canada + UK)
    {
        name: "mailing_address_same",
        label: "Is your mailing address the same as residential?",
        type: "radio",
        step: "residency",
        countries: ["canada", "uk"],
        required: true,
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "mailing_address",
        label: "Mailing Address",
        type: "address",
        step: "residency",
        countries: ["canada", "uk"],
        conditions: [{ field: "mailing_address_same", operator: "equals", value: "no" }],
    },

    // Shared: Residence permit (if not citizen of residence country)
    {
        name: "residence_permit",
        label: "Residence Permit / Visa in Current Country",
        type: "text",
        step: "residency",
        countries: "all",
        placeholder: "Permit type and number",
        description: "If you are not a citizen of the country you currently reside in",
    },
    {
        name: "residence_permit_expiry",
        label: "Residence Permit Expiry Date",
        type: "date",
        step: "residency",
        countries: "all",
        conditions: [{ field: "residence_permit", operator: "exists", value: true }],
    },

    // UK-only: Address details
    {
        name: "address_duration",
        label: "How long have you lived at this address?",
        type: "text",
        step: "residency",
        countries: ["uk"],
        required: true,
        placeholder: "e.g., 2 years 3 months",
    },
    {
        name: "address_ownership",
        label: "Do you own or rent this property?",
        type: "select",
        step: "residency",
        countries: ["uk"],
        required: true,
        options: ADDRESS_OWNERSHIP_OPTIONS,
    },

    // UK-only: Phone usage
    {
        name: "phone_type",
        label: "Is this a mobile or landline?",
        type: "radio",
        step: "residency",
        countries: ["uk"],
        options: [
            { value: "mobile", label: "Mobile" },
            { value: "landline", label: "Landline" },
        ],
    },

    // ==========================================
    // STEP 3: TRAVEL DOCUMENTS
    // ==========================================

    // Universal passport fields
    {
        name: "passport_number",
        label: "Passport Number",
        type: "text",
        step: "documents",
        countries: "all",
        required: true,
        prefillable: true,
    },
    {
        name: "passport_issue_date",
        label: "Passport Issue Date",
        type: "date",
        step: "documents",
        countries: "all",
        required: true,
    },
    {
        name: "passport_expiry_date",
        label: "Passport Expiry Date",
        type: "date",
        step: "documents",
        countries: "all",
        required: true,
        description: "Must be valid for at least 6 months beyond your intended stay",
    },

    // UK-only: Issue authority
    {
        name: "passport_issue_authority",
        label: "Passport Issuing Authority",
        type: "text",
        step: "documents",
        countries: ["uk"],
        required: true,
        placeholder: "e.g., Nigerian Immigration Service",
    },

    // Shared: National ID (UK + Schengen)
    {
        name: "national_id_number",
        label: "National ID Number",
        type: "text",
        step: "documents",
        countries: ["uk", "schengen"],
        placeholder: "If applicable",
    },
    {
        name: "national_id_expiry",
        label: "National ID Expiry Date",
        type: "date",
        step: "documents",
        countries: ["uk", "schengen"],
        conditions: [{ field: "national_id_number", operator: "exists", value: true }],
    },

    // Document uploads
    {
        name: "passport_bio_page",
        label: "Passport Bio Page (Scan/Photo)",
        type: "file",
        step: "documents",
        countries: "all",
        required: true,
        description: "Clear scan or photo of the bio-data page of your passport",
    },
    {
        name: "passport_photo",
        label: "Passport-size Photograph",
        type: "file",
        step: "documents",
        countries: "all",
        required: true,
        description: "Recent passport-size photo with white background",
    },

    // ==========================================
    // STEP 4: EMPLOYMENT & FINANCE
    // ==========================================

    // Universal employment fields
    {
        name: "emp_status",
        label: "Current Employment Status",
        type: "select",
        step: "employment",
        countries: "all",
        required: true,
        options: EMPLOYMENT_STATUS_OPTIONS,
    },
    {
        name: "job_title",
        label: "Job Title / Occupation",
        type: "text",
        step: "employment",
        countries: "all",
        conditions: [
            { field: "emp_status", operator: "in", value: ["employed", "self_employed"] },
        ],
    },
    {
        name: "employer_name",
        label: "Employer Name",
        type: "text",
        step: "employment",
        countries: "all",
        conditions: [{ field: "emp_status", operator: "equals", value: "employed" }],
    },
    {
        name: "employer_address",
        label: "Employer Address",
        type: "address",
        step: "employment",
        countries: "all",
        conditions: [{ field: "emp_status", operator: "equals", value: "employed" }],
    },
    {
        name: "employer_phone",
        label: "Employer Phone Number",
        type: "tel",
        step: "employment",
        countries: "all",
        conditions: [{ field: "emp_status", operator: "equals", value: "employed" }],
    },

    // Canada-only: 10-year employment history
    {
        name: "emp_history_10yr",
        label: "Employment History (Last 10 Years)",
        type: "timeline",
        step: "employment",
        countries: ["canada"],
        required: true,
        description: "List all employment, education, and gaps for the past 10 years. No gaps allowed.",
        timelineConfig: {
            minYears: 10,
            requireNoGaps: true,
            fields: [
                {
                    name: "activity_type",
                    label: "Activity Type",
                    type: "select",
                    options: [
                        { value: "employed", label: "Employed" },
                        { value: "self_employed", label: "Self-Employed" },
                        { value: "unemployed", label: "Unemployed" },
                        { value: "student", label: "Student" },
                        { value: "retired", label: "Retired" },
                    ],
                },
                { name: "organization", label: "Organization/School Name", type: "text" },
                { name: "position", label: "Position/Program", type: "text" },
                { name: "city", label: "City", type: "text" },
                { name: "country", label: "Country", type: "text" },
                { name: "start_date", label: "Start Date", type: "date" },
                { name: "end_date", label: "End Date", type: "date" },
            ],
        },
    },

    // Canada-only: Education history
    {
        name: "edu_history",
        label: "Education History (Post-Secondary)",
        type: "timeline",
        step: "employment",
        countries: ["canada"],
        description: "List all post-secondary education",
        timelineConfig: {
            minYears: 0,
            requireNoGaps: false,
            fields: [
                { name: "institution", label: "Institution Name", type: "text" },
                { name: "field_of_study", label: "Field of Study", type: "text" },
                { name: "degree", label: "Degree/Diploma", type: "text" },
                { name: "city", label: "City", type: "text" },
                { name: "country", label: "Country", type: "text" },
                { name: "start_date", label: "Start Date", type: "date" },
                { name: "end_date", label: "End Date", type: "date" },
            ],
        },
    },

    // UK-only: Financial details
    {
        name: "annual_income",
        label: "Total Annual Income",
        type: "text",
        step: "employment",
        countries: ["uk"],
        required: true,
        placeholder: "Amount in your local currency",
        description: "Your total yearly earnings from all sources",
    },
    {
        name: "savings_amount",
        label: "Total Savings",
        type: "text",
        step: "employment",
        countries: ["uk"],
        required: true,
        placeholder: "Amount in your local currency",
        description: "Total funds available in bank accounts",
    },
    {
        name: "additional_income",
        label: "Additional Income Sources",
        type: "textarea",
        step: "employment",
        countries: ["uk"],
        placeholder: "Pensions, investments, rental income, etc.",
    },

    // Schengen-only: Means of support
    {
        name: "financial_means",
        label: "Means of Financial Support During Trip",
        type: "select",
        step: "employment",
        countries: ["schengen"],
        required: true,
        options: FINANCIAL_MEANS_OPTIONS,
    },

    // Document uploads
    {
        name: "employment_letter",
        label: "Employment Letter",
        type: "file",
        step: "employment",
        countries: "all",
        description: "Letter from employer confirming position and leave approval",
        conditions: [{ field: "emp_status", operator: "equals", value: "employed" }],
    },
    {
        name: "bank_statements",
        label: "Bank Statements (Last 3-6 Months)",
        type: "file",
        step: "employment",
        countries: "all",
        required: true,
        description: "Recent bank statements showing financial standing",
    },

    // ==========================================
    // STEP 5: FAMILY & RELATIONSHIPS
    // ==========================================

    // Universal: Parent information
    {
        name: "father_given_names",
        label: "Father's Given Names",
        type: "text",
        step: "family",
        countries: "all",
        required: true,
    },
    {
        name: "father_surname",
        label: "Father's Surname",
        type: "text",
        step: "family",
        countries: "all",
        required: true,
    },
    {
        name: "father_dob",
        label: "Father's Date of Birth",
        type: "date",
        step: "family",
        countries: "all",
    },
    {
        name: "mother_given_names",
        label: "Mother's Given Names",
        type: "text",
        step: "family",
        countries: "all",
        required: true,
    },
    {
        name: "mother_surname",
        label: "Mother's Surname (Maiden Name)",
        type: "text",
        step: "family",
        countries: "all",
        required: true,
    },
    {
        name: "mother_dob",
        label: "Mother's Date of Birth",
        type: "date",
        step: "family",
        countries: "all",
    },

    // Shared: Parent residency (Canada + UK)
    {
        name: "father_country_of_residence",
        label: "Father's Country of Residence",
        type: "text",
        step: "family",
        countries: ["canada", "uk"],
    },
    {
        name: "mother_country_of_residence",
        label: "Mother's Country of Residence",
        type: "text",
        step: "family",
        countries: ["canada", "uk"],
    },

    // Universal: Spouse details (conditional on marital status)
    {
        name: "spouse_given_names",
        label: "Spouse's Given Names",
        type: "text",
        step: "family",
        countries: "all",
        conditions: [
            { field: "marital_status", operator: "in", value: ["married", "common_law"] },
        ],
    },
    {
        name: "spouse_surname",
        label: "Spouse's Surname",
        type: "text",
        step: "family",
        countries: "all",
        conditions: [
            { field: "marital_status", operator: "in", value: ["married", "common_law"] },
        ],
    },
    {
        name: "spouse_dob",
        label: "Spouse's Date of Birth",
        type: "date",
        step: "family",
        countries: "all",
        conditions: [
            { field: "marital_status", operator: "in", value: ["married", "common_law"] },
        ],
    },
    {
        name: "spouse_nationality",
        label: "Spouse's Nationality",
        type: "text",
        step: "family",
        countries: "all",
        conditions: [
            { field: "marital_status", operator: "in", value: ["married", "common_law"] },
        ],
    },

    // UK-only: Spouse living together
    {
        name: "spouse_living_together",
        label: "Does your spouse live with you?",
        type: "radio",
        step: "family",
        countries: ["uk"],
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
        conditions: [
            { field: "marital_status", operator: "in", value: ["married", "common_law"] },
        ],
    },

    // UK-only: Dependants
    {
        name: "has_dependants",
        label: "Do you have any dependants?",
        type: "radio",
        step: "family",
        countries: ["uk"],
        required: true,
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "dependants_count",
        label: "Number of Dependants",
        type: "text",
        step: "family",
        countries: ["uk"],
        conditions: [{ field: "has_dependants", operator: "equals", value: "yes" }],
    },

    // UK-only: Family in UK
    {
        name: "uk_family_member",
        label: "Do you have family members in the UK?",
        type: "radio",
        step: "family",
        countries: ["uk"],
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "uk_family_relationship",
        label: "Relationship to UK Family Member",
        type: "text",
        step: "family",
        countries: ["uk"],
        conditions: [{ field: "uk_family_member", operator: "equals", value: "yes" }],
    },
    {
        name: "uk_family_status",
        label: "UK Family Member's Immigration Status",
        type: "text",
        step: "family",
        countries: ["uk"],
        placeholder: "e.g., British Citizen, ILR holder, Student visa",
        conditions: [{ field: "uk_family_member", operator: "equals", value: "yes" }],
    },

    // Canada-only: Children
    {
        name: "has_children",
        label: "Do you have children?",
        type: "radio",
        step: "family",
        countries: ["canada"],
        required: true,
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "children",
        label: "Children Details",
        type: "timeline",
        step: "family",
        countries: ["canada"],
        conditions: [{ field: "has_children", operator: "equals", value: "yes" }],
        timelineConfig: {
            minYears: 0,
            requireNoGaps: false,
            fields: [
                { name: "child_name", label: "Full Name", type: "text" },
                { name: "child_dob", label: "Date of Birth", type: "date" },
                { name: "child_country", label: "Country of Residence", type: "text" },
                {
                    name: "child_relationship",
                    label: "Relationship",
                    type: "select",
                    options: [
                        { value: "biological", label: "Biological Child" },
                        { value: "adopted", label: "Adopted Child" },
                        { value: "step", label: "Step Child" },
                    ],
                },
            ],
        },
    },

    // Schengen-only: EU/EEA relation
    {
        name: "eu_relation",
        label: "Are you a family member of an EU/EEA citizen?",
        type: "radio",
        step: "family",
        countries: ["schengen"],
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "eu_relation_details",
        label: "EU/EEA Family Member Details",
        type: "textarea",
        step: "family",
        countries: ["schengen"],
        placeholder: "Name, nationality, relationship, and their passport/ID number",
        conditions: [{ field: "eu_relation", operator: "equals", value: "yes" }],
    },

    // ==========================================
    // STEP 6: TRIP DETAILS
    // ==========================================

    // Universal fields
    {
        name: "arrival_date",
        label: "Intended Arrival Date",
        type: "date",
        step: "trip",
        countries: "all",
        required: true,
    },
    {
        name: "departure_date",
        label: "Intended Departure Date",
        type: "date",
        step: "trip",
        countries: "all",
        required: true,
    },
    {
        name: "purpose_main",
        label: "Main Purpose of Travel",
        type: "select",
        step: "trip",
        countries: "all",
        required: true,
        options: PURPOSE_OPTIONS,
    },
    {
        name: "purpose_details",
        label: "Purpose Details",
        type: "textarea",
        step: "trip",
        countries: "all",
        placeholder: "Provide more details about the purpose of your trip",
    },

    // Universal: Host/Inviter information
    {
        name: "has_inviter",
        label: "Do you have an inviter/host?",
        type: "radio",
        step: "trip",
        countries: "all",
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "inviter_name",
        label: "Inviter/Host Full Name",
        type: "text",
        step: "trip",
        countries: "all",
        conditions: [{ field: "has_inviter", operator: "equals", value: "yes" }],
    },
    {
        name: "inviter_address",
        label: "Inviter/Host Address",
        type: "address",
        step: "trip",
        countries: "all",
        conditions: [{ field: "has_inviter", operator: "equals", value: "yes" }],
    },
    {
        name: "inviter_phone",
        label: "Inviter/Host Phone Number",
        type: "tel",
        step: "trip",
        countries: "all",
        conditions: [{ field: "has_inviter", operator: "equals", value: "yes" }],
    },
    {
        name: "inviter_email",
        label: "Inviter/Host Email",
        type: "email",
        step: "trip",
        countries: "all",
        conditions: [{ field: "has_inviter", operator: "equals", value: "yes" }],
    },
    {
        name: "inviter_relationship",
        label: "Relationship to Inviter/Host",
        type: "text",
        step: "trip",
        countries: "all",
        conditions: [{ field: "has_inviter", operator: "equals", value: "yes" }],
    },

    // UK-only: Trip description
    {
        name: "trip_description",
        label: "Detailed Trip Description",
        type: "textarea",
        step: "trip",
        countries: ["uk"],
        required: true,
        description: "Describe your planned activities during the visit",
        validation: { minLength: 50 },
    },

    // Schengen-only: Entry details
    {
        name: "first_entry_state",
        label: "Member State of First Entry",
        type: "text",
        step: "trip",
        countries: ["schengen"],
        required: true,
        placeholder: "e.g., Germany, France, Netherlands",
    },
    {
        name: "entries_requested",
        label: "Number of Entries Requested",
        type: "select",
        step: "trip",
        countries: ["schengen"],
        required: true,
        options: ENTRY_TYPE_OPTIONS,
    },

    // Accommodation details
    {
        name: "accommodation_name",
        label: "Accommodation Name",
        type: "text",
        step: "trip",
        countries: "all",
        placeholder: "Hotel name or host's residence",
    },
    {
        name: "accommodation_address",
        label: "Accommodation Address",
        type: "address",
        step: "trip",
        countries: "all",
    },

    // Document uploads
    {
        name: "flight_itinerary",
        label: "Flight Itinerary",
        type: "file",
        step: "trip",
        countries: "all",
        description: "Flight booking or itinerary (does not need to be paid)",
    },
    {
        name: "accommodation_booking",
        label: "Accommodation Booking",
        type: "file",
        step: "trip",
        countries: "all",
        description: "Hotel booking confirmation or invitation letter from host",
    },
    {
        name: "invitation_letter",
        label: "Invitation Letter",
        type: "file",
        step: "trip",
        countries: "all",
        conditions: [{ field: "has_inviter", operator: "equals", value: "yes" }],
    },

    // ==========================================
    // STEP 7: TRAVEL & IMMIGRATION HISTORY
    // ==========================================

    // Universal: Refusal history
    {
        name: "has_refusal",
        label: "Have you ever been refused a visa to any country?",
        type: "radio",
        step: "history",
        countries: "all",
        required: true,
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "refusal_details",
        label: "Visa Refusal Details",
        type: "textarea",
        step: "history",
        countries: "all",
        conditions: [{ field: "has_refusal", operator: "equals", value: "yes" }],
        description: "Provide details: country, date, and reason if known",
    },

    // Shared: 10-year travel history (Canada + UK)
    {
        name: "travel_history_10y",
        label: "Travel History (Last 10 Years)",
        type: "timeline",
        step: "history",
        countries: ["canada", "uk"],
        description: "List all countries visited in the past 10 years",
        timelineConfig: {
            minYears: 10,
            requireNoGaps: false,
            fields: [
                { name: "country", label: "Country", type: "text" },
                { name: "purpose", label: "Purpose of Visit", type: "text" },
                { name: "entry_date", label: "Entry Date", type: "date" },
                { name: "exit_date", label: "Exit Date", type: "date" },
            ],
        },
    },

    // Shared: Security questions (Canada + UK)
    {
        name: "criminal_record",
        label: "Have you ever been convicted of a criminal offence?",
        type: "radio",
        step: "history",
        countries: ["canada", "uk"],
        required: true,
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "criminal_details",
        label: "Criminal Record Details",
        type: "textarea",
        step: "history",
        countries: ["canada", "uk"],
        conditions: [{ field: "criminal_record", operator: "equals", value: "yes" }],
    },
    {
        name: "security_concerns",
        label: "Have you ever been involved in terrorism, war crimes, or human rights violations?",
        type: "radio",
        step: "history",
        countries: ["canada", "uk"],
        required: true,
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },

    // UK-only: Immigration breaches
    {
        name: "immigration_breach",
        label: "Have you ever breached immigration laws?",
        type: "radio",
        step: "history",
        countries: ["uk"],
        required: true,
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
        description: "Including overstays, deportations, or removal from any country",
    },
    {
        name: "immigration_breach_details",
        label: "Immigration Breach Details",
        type: "textarea",
        step: "history",
        countries: ["uk"],
        conditions: [{ field: "immigration_breach", operator: "equals", value: "yes" }],
    },

    // UK-only: Five Eyes travel
    {
        name: "five_eyes_travel",
        label: "Have you travelled to US, Canada, Australia, or New Zealand in the last 10 years?",
        type: "radio",
        step: "history",
        countries: ["uk"],
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "five_eyes_details",
        label: "Five Eyes Countries Travel Details",
        type: "textarea",
        step: "history",
        countries: ["uk"],
        conditions: [{ field: "five_eyes_travel", operator: "equals", value: "yes" }],
        placeholder: "Country, dates, purpose of each visit",
    },

    // Shared: EEA travel (UK + Schengen)
    {
        name: "eea_travel",
        label: "Have you travelled to any EU/EEA country in the last 10 years?",
        type: "radio",
        step: "history",
        countries: ["uk", "schengen"],
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "eea_travel_details",
        label: "EU/EEA Travel Details",
        type: "textarea",
        step: "history",
        countries: ["uk", "schengen"],
        conditions: [{ field: "eea_travel", operator: "equals", value: "yes" }],
        placeholder: "Countries, dates, purpose of each visit",
    },

    // Schengen-only: Fingerprint history
    {
        name: "fingerprint_history",
        label: "Have you previously provided fingerprints for a Schengen visa?",
        type: "radio",
        step: "history",
        countries: ["schengen"],
        options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ],
    },
    {
        name: "fingerprint_date",
        label: "Date of Previous Fingerprint Collection",
        type: "date",
        step: "history",
        countries: ["schengen"],
        conditions: [{ field: "fingerprint_history", operator: "equals", value: "yes" }],
    },
    {
        name: "previous_schengen_visa",
        label: "Previous Schengen Visa Number (if known)",
        type: "text",
        step: "history",
        countries: ["schengen"],
        conditions: [{ field: "fingerprint_history", operator: "equals", value: "yes" }],
    },
]

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get all fields for a specific country
 */
export function getFieldsForCountry(country: VisaCountry): FieldDefinition[] {
    return VISA_FIELDS.filter(
        (field) => field.countries === "all" || field.countries.includes(country)
    )
}

/**
 * Get fields for a specific step and country
 */
export function getFieldsForStep(
    country: VisaCountry,
    step: FormStep
): FieldDefinition[] {
    return getFieldsForCountry(country).filter((field) => field.step === step)
}

/**
 * Get all prefillable fields
 */
export function getPrefillableFields(): FieldDefinition[] {
    return VISA_FIELDS.filter((field) => field.prefillable)
}

/**
 * Get steps available for a country (only steps with fields)
 */
export function getStepsForCountry(country: VisaCountry): typeof FORM_STEPS {
    const countryFields = getFieldsForCountry(country)
    const stepsWithFields = new Set(countryFields.map((f) => f.step))
    return FORM_STEPS.filter((step) => stepsWithFields.has(step.id))
}

/**
 * Check if a field should be visible based on conditions and form values
 */
export function shouldShowField(
    field: FieldDefinition,
    formValues: Record<string, unknown>
): boolean {
    if (!field.conditions || field.conditions.length === 0) {
        return true
    }

    return field.conditions.every((condition) => {
        const fieldValue = formValues[condition.field]

        switch (condition.operator) {
            case "equals":
                return fieldValue === condition.value
            case "notEquals":
                return fieldValue !== condition.value
            case "in":
                return Array.isArray(condition.value) && condition.value.includes(fieldValue as string)
            case "notIn":
                return Array.isArray(condition.value) && !condition.value.includes(fieldValue as string)
            case "exists":
                return condition.value
                    ? fieldValue !== undefined && fieldValue !== null && fieldValue !== ""
                    : fieldValue === undefined || fieldValue === null || fieldValue === ""
            default:
                return true
        }
    })
}

/**
 * Get field by name
 */
export function getFieldByName(name: string): FieldDefinition | undefined {
    return VISA_FIELDS.find((field) => field.name === name)
}

/**
 * Get required fields for a country and step
 */
export function getRequiredFieldsForStep(
    country: VisaCountry,
    step: FormStep
): FieldDefinition[] {
    return getFieldsForStep(country, step).filter((field) => field.required)
}
