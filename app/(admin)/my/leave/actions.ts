'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function requestLeave(prevState: any, formData: FormData) {

    // Get user ID from form data (passed from component)
    const userId = formData.get('userId') as string
    const type = formData.get('type') as string
    const days = Number(formData.get('days'))
    const startDate = formData.get('startDate') as string
    const reason = formData.get('reason') as string

    // Basic validation
    if (!userId || !type || !days || !startDate || !reason) {
        return { error: 'All fields are required' }
    }

    if (days < 1) {
        return { error: 'Number of days must be at least 1' }
    }

    // TODO: Replace with real Supabase insert
    // For now, just log and simulate success
    console.log('Leave request:', { userId, type, days, startDate, reason })

    // Simulate database insert
    // const { error } = await supabase
    //   .from('leave_requests')
    //   .insert({
    //     user_id: userId,
    //     type,
    //     days,
    //     start_date: startDate,
    //     reason,
    //     status: 'pending'
    //   })

    // if (error) {
    //   return { error: error.message }
    // }

    // Revalidate and redirect
    revalidatePath('/(admin)/my/leave')
    redirect('/(admin)/my/leave')
}