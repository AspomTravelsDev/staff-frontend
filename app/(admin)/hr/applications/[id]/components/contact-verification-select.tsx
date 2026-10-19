"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleAlert, CircleDashed, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateContactVerificationAction } from "../../actions";
import type { ContactVerificationStatus } from "@/lib/types/form-data";
import { VerificationProofDialog } from "./verification-proof-dialog";

interface ContactVerificationSelectProps {
  applicationId: string;
  contact: "guarantor" | "referee";
  index?: number;
  initialStatus?: ContactVerificationStatus;
  initialProof?: { storagePath?: string; fileName?: string };
}

const statusLabels: Record<ContactVerificationStatus, string> = {
  unverified: "Unverified",
  unreachable: "Unreachable",
  verified: "Verified",
};

export function ContactVerificationSelect({
  applicationId,
  contact,
  index,
  initialStatus = "unverified",
  initialProof,
}: ContactVerificationSelectProps) {
  const [status, setStatus] =
    useState<ContactVerificationStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ContactVerificationStatus | null>(null);
  const [proof, setProof] = useState(initialProof);

  const handleChange = (nextStatus: ContactVerificationStatus) => {
    if (nextStatus === "verified") {
      setPendingStatus(nextStatus);
      setProofDialogOpen(true);
      return;
    }
    const previousStatus = status;
    setStatus(nextStatus);

    startTransition(async () => {
      try {
        await updateContactVerificationAction(applicationId, {
          contact,
          index,
          status: nextStatus,
        });
        toast.success(
          `${contact === "guarantor" ? "Guarantor" : "Referee"} marked as ${statusLabels[nextStatus].toLowerCase()}.`,
        );
      } catch (error) {
        setStatus(previousStatus);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update verification status",
        );
      }
    });
  };

  const verifyWithProof = (proof: Record<string, unknown>) => {
    const previousStatus = status;
    setStatus("verified");
    setProof(proof as { storagePath?: string; fileName?: string });
    startTransition(async () => {
      try {
        await updateContactVerificationAction(applicationId, {
          contact,
          index,
          status: "verified",
          proof,
        });
        toast.success(`${contact === "guarantor" ? "Guarantor" : "Referee"} marked as verified.`);
      } catch (error) {
        setStatus(previousStatus);
        toast.error(error instanceof Error ? error.message : "Failed to update verification status");
      }
    });
  };

  const Icon =
    status === "verified"
      ? CheckCircle2
      : status === "unreachable"
        ? CircleAlert
        : CircleDashed;
  const colorClass =
    status === "verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      : status === "unreachable"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        : "border-border bg-muted/70 text-muted-foreground";

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
    <label
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${colorClass}`}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">Verification status:</span>
      <select
        aria-label={`${contact === "guarantor" ? "Guarantor" : "Referee"} verification status`}
        value={status}
        disabled={isPending}
        onChange={(event) =>
          handleChange(event.target.value as ContactVerificationStatus)
        }
        className="cursor-pointer appearance-none bg-transparent pr-0 text-xs font-medium outline-none disabled:cursor-not-allowed"
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
    {proof?.storagePath && (
      <a
        href={proof.storagePath}
        aria-label={contact === "guarantor" ? `View guarantor ${(index ?? 0) + 1} verification proof` : "View referee verification proof"}
        target="_blank"
        rel="noreferrer"
        className="block whitespace-nowrap text-xs text-primary underline underline-offset-2"
      >
        View proof
      </a>
    )}
    <VerificationProofDialog
      open={proofDialogOpen}
      onOpenChange={(open) => {
        setProofDialogOpen(open);
        if (!open) setPendingStatus(null);
      }}
      applicationId={applicationId}
      title={`${contact === "guarantor" ? "guarantor" : "referee"} verification`}
      fieldName={`${contact}_verification_proof${index !== undefined ? `_${index + 1}` : ""}`}
      onUploaded={(proof) => {
        if (pendingStatus === "verified") verifyWithProof(proof);
      }}
    />
    </div>
  );
}
