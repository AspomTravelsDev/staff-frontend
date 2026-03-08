'use server'

import { getPublicApplication } from '@/lib/api/hr'

/**
 * Data fetching functions for applicant portal
 * Server-side only - retrieves application data by UUID
 */

export async function getApplicationByUUID(uuid: string) {
    return await getPublicApplication(uuid)
}

export async function getApplicationProgress(uuid: string) {
    const data = await getPublicApplication(uuid)

    const formData = data?.form_data || {}
    const currentStep = (formData as any)?.currentStep || 1
    const completedSteps = (formData as any)?.completedSteps || []

    return {
        currentStep,
        completedSteps,
        status: data?.status,
    }
}
