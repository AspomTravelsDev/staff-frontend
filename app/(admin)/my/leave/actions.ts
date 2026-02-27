'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function requestLeave(prevState: any, formData: FormData) {

    const userId = formData.get('userId') as string
    const type = formData.get('type') as string
    const days = Number(formData.get('days'))
    const startDate = formData.get('startDate') as string
    const reason = formData.get('reason') as string

    if (!userId || !type || !days || !startDate || !reason) {
        return { error: 'All fields are required' }
    }

    if (days < 1) {
        return { error: 'Number of days must be at least 1' }
    }



    revalidatePath('/my/leave')
    redirect('/my/leave')
}