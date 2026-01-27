"use server";

import { deleteApplication } from "@/lib/api/hr";
import { revalidatePath } from "next/cache";

export async function deleteApplicationAction(id: string) {
    await deleteApplication(id);
    revalidatePath("/hr/applications");
}
