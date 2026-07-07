'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createLeaveRequest } from "@/lib/api/leave"

export async function requestLeave(prevState: any, formData: FormData) {

    const type = formData.get('type') as string
    const days = Number(formData.get('days'))
    const startDate = formData.get('startDate') as string
    const reason = formData.get('reason') as string

    if (!type || !days || !startDate || !reason) {
        return { error: 'All fields are required' }
    }

    if (days < 1) {
        return { error: 'Number of days must be at least 1' }
    }

    try {
        await createLeaveRequest({
            type,
            start_date: startDate,
            days,
            reason
        });
    } catch (error: any) {
        return { error: error.message || 'Failed to submit leave request' }
    }

    revalidatePath('/my/leave')
    redirect('/my/leave')
}