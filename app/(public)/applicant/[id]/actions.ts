'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { savePublicFormStep, submitPublicApplication, uploadPublicFile } from '@/lib/api/hr'
import { downloadPdfFormsAction } from './pdf-actions'

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
    fileBase64OrUrl: string,
    fileName: string
): Promise<{ url?: string; error?: string }> {
    try {
        // If it's already a URL (starts with http or /), just return it
        if (fileBase64OrUrl.startsWith('http') || fileBase64OrUrl.startsWith('/')) {
            return { url: fileBase64OrUrl }
        }

        // Check if it's a valid data URL
        if (!fileBase64OrUrl.includes(',')) {
            return { error: 'Invalid image data format' }
        }

        // Convert base64 to File object
        const parts = fileBase64OrUrl.split(',')
        const byteString = atob(parts[1])
        const ab = new ArrayBuffer(byteString.length)
        const view = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
            view[i] = byteString.charCodeAt(i)
        }

        // Determine mime type
        const mimeMatch = parts[0].match(/:(.*?);/)
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

        const file = new File([ab], fileName, { type: mimeType })

        const result = await uploadPublicFile(uuid, file, fieldName)

        return { url: result.storagePath }
    } catch (error: any) {
        console.error('Unexpected error in uploadPassportPhoto:', error)
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

    // Revalidate and Redirect
    const nextStep = step + 1
    if (nextStep <= 8) {
        revalidatePath(`/applicant/${uuid}/${nextStep}`)
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
        revalidatePath(`/applicant/${uuid}/${previousStep}`)
        redirect(`/applicant/${uuid}/${previousStep}`)
    }
}

export async function submitApplication(uuid: string, signedDocumentsData?: any): Promise<FormState> {
    let shouldRedirect = false

    try {
        console.log(`submitApplication: Starting submission for uuid: ${uuid}`);
        await submitPublicApplication(uuid, signedDocumentsData)
        console.log(`submitApplication: Backend submission successful for uuid: ${uuid}`);

        // Regenerate ALL PDFs (this will now include signatures and dates)
        // This effectively upserts the offer letter and other forms with final data
        console.log(`submitApplication: Regenerating PDFs for uuid: ${uuid}`);
        await downloadPdfFormsAction(uuid)
        console.log(`submitApplication: PDF regeneration complete for uuid: ${uuid}`);

        shouldRedirect = true
    } catch (error: any) {
        console.error(`submitApplication: Error during submission for uuid: ${uuid}:`, error);
        return { error: error.message || 'An unexpected error occurred during submission' }
    }

    // Redirect outside try-catch to avoid catching NEXT_REDIRECT
    if (shouldRedirect) {
        revalidatePath(`/applicant/${uuid}/complete`)
        redirect(`/applicant/${uuid}/complete`)
    }

    return { success: true }
}
