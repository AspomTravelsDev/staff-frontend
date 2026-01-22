// Dynamic Zod validation schemas for visa applications
// Generates country-specific validation based on field configuration

import { z } from "zod"
import {
    type VisaCountry,
    type FormStep,
    type FieldDefinition,
    getFieldsForStep,
    getFieldsForCountry,
    FORM_STEPS,
} from "@/lib/visa/fields"

// ==========================================
// BASE FIELD SCHEMAS
// ==========================================

// Address schema (reusable)
export const addressSchema = z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().min(1, "Country is required"),
})

export type AddressInput = z.infer<typeof addressSchema>

// Timeline entry schema (for employment/education/travel history)
export const timelineEntrySchema = z.object({
    id: z.string(),
    activity_type: z.string().optional(),
    organization: z.string().optional(),
    institution: z.string().optional(),
    position: z.string().optional(),
    field_of_study: z.string().optional(),
    degree: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    purpose: z.string().optional(),
    start_date: z.string().or(z.date()).optional(),
    end_date: z.string().or(z.date()).optional(),
    entry_date: z.string().or(z.date()).optional(),
    exit_date: z.string().or(z.date()).optional(),
    // Children fields
    child_name: z.string().optional(),
    child_dob: z.string().or(z.date()).optional(),
    child_country: z.string().optional(),
    child_relationship: z.string().optional(),
})

export type TimelineEntry = z.infer<typeof timelineEntrySchema>

// File upload schema
export const uploadedFileSchema = z.object({
    id: z.string(),
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string().optional(),
})

export type UploadedFile = z.infer<typeof uploadedFileSchema>

// ==========================================
// FIELD TYPE TO ZOD MAPPING
// ==========================================

function createFieldSchema(field: FieldDefinition): z.ZodTypeAny {
    let schema: z.ZodTypeAny

    switch (field.type) {
        case "text":
            schema = z.string()
            if (field.validation?.minLength) {
                schema = (schema as z.ZodString).min(
                    field.validation.minLength,
                    `Minimum ${field.validation.minLength} characters required`
                )
            }
            if (field.validation?.maxLength) {
                schema = (schema as z.ZodString).max(
                    field.validation.maxLength,
                    `Maximum ${field.validation.maxLength} characters allowed`
                )
            }
            if (field.validation?.pattern) {
                schema = (schema as z.ZodString).regex(
                    new RegExp(field.validation.pattern),
                    field.validation.patternMessage || "Invalid format"
                )
            }
            break

        case "email":
            schema = z.string().email("Please enter a valid email address")
            break

        case "tel":
            schema = z.string().min(1, "Phone number is required")
            break

        case "date":
            schema = z.string().or(z.date())
            break

        case "select":
        case "radio":
            if (field.options && field.options.length > 0) {
                const values = field.options.map((opt) => opt.value) as [string, ...string[]]
                schema = z.enum(values)
            } else {
                schema = z.string()
            }
            break

        case "checkbox":
            schema = z.boolean()
            break

        case "textarea":
            schema = z.string()
            if (field.validation?.minLength) {
                schema = (schema as z.ZodString).min(
                    field.validation.minLength,
                    `Minimum ${field.validation.minLength} characters required`
                )
            }
            break

        case "file":
            schema = z.array(uploadedFileSchema)
            break

        case "address":
            schema = addressSchema
            break

        case "timeline":
            schema = z.array(timelineEntrySchema)
            break

        default:
            schema = z.unknown()
    }

    // Make optional if not required
    if (!field.required) {
        schema = schema.optional().or(z.literal("")).or(z.null())
    }

    return schema
}

// ==========================================
// DYNAMIC SCHEMA GENERATORS
// ==========================================

/**
 * Generate Zod schema for a specific step and country
 */
export function createStepSchema(
    country: VisaCountry,
    step: FormStep
): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const fields = getFieldsForStep(country, step)
    const schemaShape: Record<string, z.ZodTypeAny> = {}

    for (const field of fields) {
        // Skip conditional fields in base schema - they'll be validated separately
        if (!field.conditions || field.conditions.length === 0) {
            schemaShape[field.name] = createFieldSchema(field)
        } else {
            // Make conditional fields always optional in base schema
            schemaShape[field.name] = createFieldSchema({ ...field, required: false })
        }
    }

    return z.object(schemaShape)
}

/**
 * Generate complete Zod schema for all steps of a country
 */
export function createFullApplicationSchema(
    country: VisaCountry
): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const fields = getFieldsForCountry(country)
    const schemaShape: Record<string, z.ZodTypeAny> = {}

    for (const field of fields) {
        if (!field.conditions || field.conditions.length === 0) {
            schemaShape[field.name] = createFieldSchema(field)
        } else {
            schemaShape[field.name] = createFieldSchema({ ...field, required: false })
        }
    }

    return z.object(schemaShape)
}

/**
 * Validate step data with conditional field awareness
 */
export function validateStepWithConditions(
    country: VisaCountry,
    step: FormStep,
    data: Record<string, unknown>,
    allFormData: Record<string, unknown>
) {
    const fields = getFieldsForStep(country, step)
    const schemaShape: Record<string, z.ZodTypeAny> = {}

    for (const field of fields) {
        // Check if field should be visible based on conditions
        const shouldShow = shouldFieldBeVisible(field, allFormData)

        if (shouldShow) {
            schemaShape[field.name] = createFieldSchema(field)
        } else {
            // Hidden fields are always optional
            schemaShape[field.name] = z.unknown().optional()
        }
    }

    const schema = z.object(schemaShape)
    return schema.safeParse(data)
}

/**
 * Helper to check if a field should be visible
 */
function shouldFieldBeVisible(
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
                return (
                    Array.isArray(condition.value) &&
                    condition.value.includes(fieldValue as string)
                )
            case "notIn":
                return (
                    Array.isArray(condition.value) &&
                    !condition.value.includes(fieldValue as string)
                )
            case "exists":
                return condition.value
                    ? fieldValue !== undefined && fieldValue !== null && fieldValue !== ""
                    : fieldValue === undefined || fieldValue === null || fieldValue === ""
            default:
                return true
        }
    })
}

// ==========================================
// PRE-DEFINED STEP SCHEMAS (for type inference)
// ==========================================

// Base application metadata schema
export const applicationMetaSchema = z.object({
    id: z.string().uuid(),
    country: z.enum(["canada", "uk", "schengen"]),
    status: z.enum(["draft", "submitted", "processing", "approved", "rejected"]),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    submitted_at: z.string().datetime().optional(),
})

export type ApplicationMeta = z.infer<typeof applicationMetaSchema>

// Draft save schema (partial data)
export const draftSaveSchema = z.object({
    application_id: z.string().uuid(),
    country: z.enum(["canada", "uk", "schengen"]),
    current_step: z.number().min(1).max(7),
    data: z.record(z.string(), z.unknown()),
    updated_at: z.string().datetime().optional(),
})

export type DraftSave = z.infer<typeof draftSaveSchema>

// Final submission schema
export const submissionSchema = z.object({
    application_id: z.string().uuid(),
    country: z.enum(["canada", "uk", "schengen"]),
    data: z.record(z.string(), z.unknown()),
    declaration_accepted: z.literal(true, { message: "You must accept the declaration" }),
})

export type Submission = z.infer<typeof submissionSchema>

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Get all validation errors for display
 */
export function formatValidationErrors(
    result: { success: boolean; error?: z.ZodError }
): Record<string, string> {
    if (result.success || !result.error) return {}

    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
        const path = issue.path.join(".")
        if (!errors[path]) {
            errors[path] = issue.message
        }
    }
    return errors
}

/**
 * Check if a step is complete (all required visible fields filled)
 */
export function isStepComplete(
    country: VisaCountry,
    step: FormStep,
    formData: Record<string, unknown>
): boolean {
    const result = validateStepWithConditions(country, step, formData, formData)
    return result.success
}

/**
 * Get completion percentage for an application
 */
export function getCompletionPercentage(
    country: VisaCountry,
    formData: Record<string, unknown>
): number {
    const steps = FORM_STEPS
    let completedSteps = 0

    for (const step of steps) {
        if (isStepComplete(country, step.id, formData)) {
            completedSteps++
        }
    }

    return Math.round((completedSteps / steps.length) * 100)
}
