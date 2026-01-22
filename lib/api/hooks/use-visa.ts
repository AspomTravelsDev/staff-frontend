"use client";

/**
 * React Query Hooks for Visa Applications
 *
 * Provides typed hooks for data fetching and mutations
 * with automatic cache management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getVisaApplications,
    getVisaApplication,
    updateApplicationStatus,
    assignApplication,
    getApplicationNotes,
    addApplicationNote,
    getApplicationDocuments,
    getApplicationAuditLog,
    getVisaStaff,
    type VisaApplicationFilters,
    type UpdateStatusRequest,
    type AssignApplicationRequest,
    type AddNoteRequest,
} from "../visa";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of visa applications
 */
export function useVisaApplications(filters: VisaApplicationFilters = {}) {
    return useQuery({
        queryKey: queryKeys.visa.applications.list(filters),
        queryFn: () => getVisaApplications(filters),
    });
}

/**
 * Fetch single visa application by ID
 */
export function useVisaApplication(id: string) {
    return useQuery({
        queryKey: queryKeys.visa.applications.detail(id),
        queryFn: () => getVisaApplication(id),
        enabled: !!id,
    });
}

/**
 * Fetch notes for an application
 */
export function useApplicationNotes(applicationId: string) {
    return useQuery({
        queryKey: queryKeys.visa.applications.notes(applicationId),
        queryFn: () => getApplicationNotes(applicationId),
        enabled: !!applicationId,
    });
}

/**
 * Fetch documents for an application
 */
export function useApplicationDocuments(applicationId: string) {
    return useQuery({
        queryKey: queryKeys.visa.applications.documents(applicationId),
        queryFn: () => getApplicationDocuments(applicationId),
        enabled: !!applicationId,
    });
}

/**
 * Fetch audit log for an application
 */
export function useApplicationAuditLog(applicationId: string) {
    return useQuery({
        queryKey: queryKeys.visa.applications.auditLog(applicationId),
        queryFn: () => getApplicationAuditLog(applicationId),
        enabled: !!applicationId,
    });
}

/**
 * Fetch staff members for assignment
 */
export function useVisaStaff() {
    return useQuery({
        queryKey: queryKeys.users.staff(),
        queryFn: () => getVisaStaff(),
        staleTime: 5 * 60 * 1000, // Staff list is relatively stable
    });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Update application status
 */
export function useUpdateApplicationStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: UpdateStatusRequest;
        }) => updateApplicationStatus(id, data),
        onSuccess: (updatedApp) => {
            // Update the detail cache
            queryClient.setQueryData(
                queryKeys.visa.applications.detail(updatedApp.id),
                updatedApp
            );
            // Invalidate lists to refetch
            queryClient.invalidateQueries({
                queryKey: queryKeys.visa.applications.lists(),
            });
            // Invalidate audit log as it has new entry
            queryClient.invalidateQueries({
                queryKey: queryKeys.visa.applications.auditLog(updatedApp.id),
            });
        },
    });
}

/**
 * Assign application to staff member
 */
export function useAssignApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: AssignApplicationRequest;
        }) => assignApplication(id, data),
        onSuccess: (updatedApp) => {
            // Update the detail cache
            queryClient.setQueryData(
                queryKeys.visa.applications.detail(updatedApp.id),
                updatedApp
            );
            // Invalidate lists to refetch
            queryClient.invalidateQueries({
                queryKey: queryKeys.visa.applications.lists(),
            });
            // Invalidate audit log
            queryClient.invalidateQueries({
                queryKey: queryKeys.visa.applications.auditLog(updatedApp.id),
            });
        },
    });
}

/**
 * Add note to application
 */
export function useAddApplicationNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            applicationId,
            data,
        }: {
            applicationId: string;
            data: AddNoteRequest;
        }) => addApplicationNote(applicationId, data),
        onSuccess: (_, variables) => {
            // Invalidate notes to refetch with new note
            queryClient.invalidateQueries({
                queryKey: queryKeys.visa.applications.notes(variables.applicationId),
            });
            // Also invalidate audit log
            queryClient.invalidateQueries({
                queryKey: queryKeys.visa.applications.auditLog(variables.applicationId),
            });
            // Update note count in detail
            queryClient.invalidateQueries({
                queryKey: queryKeys.visa.applications.detail(variables.applicationId),
            });
        },
    });
}
