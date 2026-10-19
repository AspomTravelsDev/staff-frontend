"use client";

import { useState, useTransition } from "react";
import { Check, CheckCircle2, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { toggleAddressVerificationAction } from "../../actions";
import { VerificationProofDialog } from "./verification-proof-dialog";

interface AddressVerificationToggleProps {
  applicationId: string;
  addressText?: string | null;
  landmark?: string | null;
  initialVerified?: boolean;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
  verificationProof?: { storagePath?: string; fileName?: string };
  mode?: "full" | "inline";
}

export function AddressVerificationToggle({
  applicationId,
  addressText,
  landmark,
  initialVerified = false,
  verifiedAt,
  verifiedByName,
  verificationProof,
  mode = "full",
}: AddressVerificationToggleProps) {
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [verifiedDate, setVerifiedDate] = useState<string | null>(verifiedAt || null);
  const [verifierName, setVerifierName] = useState<string | null>(verifiedByName || null);
  const [proof, setProof] = useState(verificationProof);
  const [isPending, startTransition] = useTransition();
  const [proofDialogOpen, setProofDialogOpen] = useState(false);

  const hasAddress = Boolean(addressText && addressText.trim());

  const handleToggle = () => {
    if (!hasAddress) {
      toast.error("Applicant has not provided an address yet.");
      return;
    }

    const nextState = !isVerified;
    if (nextState) {
      setProofDialogOpen(true);
      return;
    }
    const previousState = isVerified;
    const previousDate = verifiedDate;
    const previousVerifier = verifierName;

    // Optimistic update
    setIsVerified(nextState);
    if (nextState) {
      setVerifiedDate(new Date().toISOString());
    } else {
      setVerifiedDate(null);
      setVerifierName(null);
    }

    startTransition(async () => {
      try {
        const updated = await toggleAddressVerificationAction(applicationId, nextState);
        const verification = updated?.form_data?.address_verification;
        if (verification) {
          setIsVerified(Boolean(verification.verified));
          setVerifiedDate(verification.verified_at || null);
          setVerifierName(verification.verified_by?.name || null);
        }
        toast.success(
          nextState
            ? "Applicant address marked as verified."
            : "Applicant address marked as unverified."
        );
      } catch (err: unknown) {
        // Rollback
        setIsVerified(previousState);
        setVerifiedDate(previousDate);
        setVerifierName(previousVerifier);
        const message = err instanceof Error ? err.message : "Failed to update verification";
        toast.error(message);
      }
    });
  };

  const verifyWithProof = (proof: Record<string, unknown>) => {
    const previousState = isVerified;
    setIsVerified(true);
    setProof(proof as { storagePath?: string; fileName?: string });
    startTransition(async () => {
      try {
        const updated = await toggleAddressVerificationAction(applicationId, true, proof);
        const verification = updated?.form_data?.address_verification;
        if (verification) {
          setVerifiedDate(verification.verified_at || null);
          setVerifierName(verification.verified_by?.name || null);
        }
        toast.success("Applicant address marked as verified.");
      } catch (err: unknown) {
        setIsVerified(previousState);
        toast.error(err instanceof Error ? err.message : "Failed to update address verification");
      }
    });
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const verificationBadge = (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleToggle}
            disabled={!hasAddress || isPending}
            className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
              isVerified
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-muted/70 text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
            }`}
            title={
              !hasAddress
                ? "Address not provided yet"
                : isVerified
                ? "Click to unverify address"
                : "Click to verify address"
            }
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : isVerified ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <div className="w-3.5 h-3.5 rounded border border-muted-foreground/40 flex items-center justify-center group-hover:border-foreground transition-colors">
                <Check className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
              </div>
            )}
            <span>{isVerified ? "Address Verified" : "Verify Address"}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-xs">
          {!hasAddress ? (
            <p>Applicant has not submitted their residential address yet.</p>
          ) : isVerified ? (
            <p>
              Verified
              {verifierName ? ` by ${verifierName}` : ""}
              {verifiedDate ? ` on ${formatDate(verifiedDate)}` : ""}. Click to toggle unverify.
            </p>
          ) : (
            <p>Click to mark this applicant&apos;s address as verified.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (mode === "inline") {
    return verificationBadge;
  }

  return (
    <>
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">Residential Address</p>
        {verificationBadge}
      </div>
      <div>
        <p className="text-sm font-medium">
          {addressText || "Not provided yet"}
        </p>
        {landmark && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Landmark: {landmark}
          </p>
        )}
        {isVerified && (verifiedDate || verifierName) && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>
              Verified{verifierName ? ` by ${verifierName}` : ""}
              {verifiedDate ? ` (${formatDate(verifiedDate)})` : ""}
            </span>
          </p>
        )}
      </div>
      {proof?.storagePath && (
        <a
          href={proof.storagePath}
          aria-label="View address verification proof"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-xs text-primary underline underline-offset-2"
        >
          View proof
        </a>
      )}
    </div>
    <VerificationProofDialog
      open={proofDialogOpen}
      onOpenChange={setProofDialogOpen}
      applicationId={applicationId}
      title="address verification"
      fieldName="address_verification_proof"
      onUploaded={verifyWithProof}
    />
    </>
  );
}
