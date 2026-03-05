"use server";

import { api } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function uploadProfileImage(formData: FormData) {
    const user = await getCurrentUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const file = formData.get("file");

    if (!file) {
        return { error: "No file provided" };
    }

    // 1. Upload file
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("model_type", "App\\Models\\User");
    uploadFormData.append("model_id", String(user.id));

    // Note: api.post automatically handles Content-Type for FormData?
    // Actually, we usually need to let the browser/fetch set it for multipart.
    // But our api client sets Content-Type: application/json by default.
    // We need to bypass that.
    // Let's use a custom fetch here to be safe and simple since the api client is strict.

    try {
        const token = await import("@/lib/auth/session").then(m => m.getAuthToken());

        // Upload endpoint
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/files/upload/image`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
        });

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error("Upload failed:", errorText);
            return { error: `Upload endpoint failed (${uploadRes.status}): ${errorText}` };
        }

        const uploadData = await uploadRes.json();
        const downloadUrl = uploadData.data?.download_url || uploadData.download_url;

        if (!downloadUrl) {
            return { error: "Upload successful but no download URL returned. Response: " + JSON.stringify(uploadData) };
        }

        // 2. Update user profile
        const updateRes = await api.patch(`/api/users/${user.id}`, {
            image_url: downloadUrl,
        });

        if (!updateRes.success) {
            return { error: `Failed to update user profile: ${updateRes.error.error} (${updateRes.error.code})` };
        }

        revalidatePath("/my/profile");
        revalidatePath("/", "layout");
        return { success: true, url: downloadUrl };

    } catch (error) {
        console.error("Profile upload error:", error);
        return { error: "Something went wrong" };
    }
}

export interface ProfileFormValues {
    name: string;
    email: string;
    staff_id: string | null;
    phone: string | null;
    dob: string | null;
    date_joined: string | null;
    contract_type: string | null;
}

export async function updateProfile(data: ProfileFormValues) {
    const user = await getCurrentUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    try {
        const updateRes = await api.patch(`/api/users/${user.id}`, {
            name: data.name,
            staff_id: data.staff_id,
            phone: data.phone,
            dob: data.dob,
            date_joined: data.date_joined,
        });

        if (!updateRes.success) {
            return { error: `Failed to update profile: ${updateRes.error.error}` };
        }

        revalidatePath("/my/profile");
        return { success: true };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Something went wrong" };
    }
}
