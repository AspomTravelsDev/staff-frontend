"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSubmitSelfAppraisal } from "@/lib/api/hooks/use-performance-appraisal";
import { useUser } from "@/providers/user-provider";
import type { KRAScores } from "@/lib/api/performance-appraisal";
import { KRA_CONFIG, formSchema, type FormValues } from "./schema";

export function useSelfAppraisal() {
    const router = useRouter();
    const user = useUser();
    const submitMutation = useSubmitSelfAppraisal();
    const [expandedKRAs, setExpandedKRAs] = useState<Record<string, boolean>>({});

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_name: user?.user?.name,
            designation: user?.user?.is_supervisor ? "SUPERVISOR" : "TEAM MEMBER",
            department: user?.user?.role.toUpperCase(),
            appraisal_type: "",
            period_start: "",
            period_end: "",
            ...Object.fromEntries(
                KRA_CONFIG.map((kra) => [
                    kra.name,
                    Array(kra.indicators.length).fill(3),
                ])
            ),
            job_achievements: "",
            new_innovations: "",
        },
    });

    const toggleKRA = (kraName: string) => {
        setExpandedKRAs((prev) => ({ ...prev, [kraName]: !prev[kraName] }));
    };

    const onSubmit = async (data: FormValues) => {
        try {
            const scores = Object.fromEntries(
                KRA_CONFIG.map((kra) => [
                    kra.name,
                    data[kra.name as keyof FormValues] as unknown as number[],
                ])
            ) as unknown as KRAScores;

            await submitMutation.mutateAsync({
                ...data,
                self_scores: scores,
            });

            toast.success("Self-appraisal submitted successfully!");
            router.push("/my/performance");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to submit appraisal"
            );
        }
    };

    return {
        form,
        expandedKRAs,
        toggleKRA,
        onSubmit,
        isSubmitting: submitMutation.isPending,
    };
}
