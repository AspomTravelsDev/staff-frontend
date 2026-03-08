'use server'

import { redirect } from 'next/navigation'
import { savePublicFormStep, submitPublicApplication, uploadPublicFile } from '@/lib/api/hr'

/**
 * Server Actions for applicant form submission
 */

type FormState = {
    error?: string
    success?: boolean
    nextStep?: number
}

// Ensure file uploads use the application_id if needed, but our uploadPublicFile handles it via uuid 
// Since our API upload File endpoint returns URL
export async function uploadPassportPhoto(
    uuid: string,
    fieldName: string,
    fileBase64: string,
    fileName: string
): Promise<{ url?: string; error?: string }> {
    try {
        // Convert base64 to File object
        const byteString = atob(fileBase64.split(',')[1])
        const ab = new ArrayBuffer(byteString.length)
        const view = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
            view[i] = byteString.charCodeAt(i)
        }

        // We use the mime type from the base64 prefix if needed, for now assume jpeg
        const file = new File([ab], fileName, { type: 'image/jpeg' })

        const result = await uploadPublicFile(uuid, file, fieldName)

        return { url: result.storagePath }
    } catch (error: any) {
        console.error('Unexpected error:', error)
        return { error: error.message || 'An unexpected error occurred during upload' }
    }
}

export async function saveFormStep(
    uuid: string,
    step: number,
    stepData: any
): Promise<FormState> {
    try {
        await savePublicFormStep(uuid, step, stepData)
    } catch (error: any) {
        console.error('Save error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }

    // Redirect outside try-catch to avoid catching NEXT_REDIRECT
    const nextStep = step + 1
    if (nextStep <= 8) {
        redirect(`/applicant/${uuid}/${nextStep}`)
    }

    return { success: true, nextStep: step + 1 }
}

export async function redirectToPreviousStep(
    uuid: string,
    currentStep: number
): Promise<void> {
    const previousStep = currentStep - 1
    if (previousStep >= 1) {
        redirect(`/applicant/${uuid}/${previousStep}`)
    }
}

export async function submitApplication(uuid: string, signedDocumentsData?: any): Promise<FormState> {
    let shouldRedirect = false

    try {
        await submitPublicApplication(uuid, signedDocumentsData)
        shouldRedirect = true
    } catch (error: any) {
        console.error('Submit error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }

    // Redirect outside try-catch to avoid catching NEXT_REDIRECT
    if (shouldRedirect) {
        redirect(`/applicant/${uuid}/complete`)
    }

    return { success: true }
}
