"use server";

import { revalidatePath } from "next/cache";
import { 
    createPaymentConfirmation, 
    approvePaymentConfirmation, 
    rejectPaymentConfirmation, 
    assignPaymentConfirmation 
} from "../api/payment-confirmations";

export async function createPaymentConfirmationAction(formData: FormData) {
    const result = await createPaymentConfirmation(formData);
    
    if (result.success) {
        revalidatePath("/my/payment");
        revalidatePath("/accounts/confirmation");
    }
    
    return result;
}

export async function approvePaymentConfirmationAction(id: string) {
    const result = await approvePaymentConfirmation(id);
    
    if (result.success) {
        revalidatePath("/my/payment");
        revalidatePath("/accounts/confirmation");
        revalidatePath("/accounts/outstanding");
    }
    
    return result;
}

export async function rejectPaymentConfirmationAction(id: string, reason: string) {
    const result = await rejectPaymentConfirmation(id, reason);
    
    if (result.success) {
        revalidatePath("/my/payment");
        revalidatePath("/accounts/confirmation");
    }
    
    return result;
}

export async function assignPaymentConfirmationAction(id: string, assignedTo: string) {
    const result = await assignPaymentConfirmation(id, assignedTo);
    
    if (result.success) {
        revalidatePath("/my/payment");
        revalidatePath("/accounts/confirmation");
        revalidatePath("/my/assigned-deals");
    }
    
    return result;
}
