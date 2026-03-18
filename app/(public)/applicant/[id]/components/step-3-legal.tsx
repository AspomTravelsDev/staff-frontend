"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveFormStep, redirectToPreviousStep } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LegalAgreements } from "@/lib/types/form-data";

type FormState = {
  error?: string;
  success?: boolean;
  nextStep?: number;
  submittedData?: Record<string, string>;
};

export function Step3Legal({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: LegalAgreements;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const toSubmittedData = (formData: FormData) =>
    Object.fromEntries(
      Array.from(formData.entries()).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );

  const handleSubmitAction = async (
    _prevState: FormState | null,
    formData: FormData,
  ): Promise<FormState> => {
    const ndaAccepted = formData.get("ndaAccepted") === "on";
    const nonCompeteAccepted = formData.get("nonCompeteAccepted") === "on";
    const confidentialityAccepted =
      formData.get("confidentialityAccepted") === "on";
    const termsAccepted = formData.get("termsAccepted") === "on";

    if (
      !ndaAccepted ||
      !nonCompeteAccepted ||
      !confidentialityAccepted ||
      !termsAccepted
    ) {
      return {
        error: "You must accept all required legal agreements to continue.",
        submittedData: toSubmittedData(formData),
      };
    }

    const data = {
      legal: {
        ndaAccepted,
        ndaAcceptedAt: new Date().toISOString(),
        nonCompeteAccepted,
        nonCompeteAcceptedAt: new Date().toISOString(),
        confidentialityAccepted,
        confidentialityAcceptedAt: new Date().toISOString(),
        termsAccepted,
        termsAcceptedAt: new Date().toISOString(),
      },
    };
    return saveFormStep(applicationId, 3, data);
  };

  const handleBack = async () => {
    await redirectToPreviousStep(applicationId, 3);
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  useEffect(() => {
    if (!state?.error || !state.submittedData || !formRef.current) return;

    for (const [name, value] of Object.entries(state.submittedData)) {
      const elements = formRef.current.querySelectorAll(`[name="${name}"]`);
      elements.forEach((element) => {
        if (element instanceof HTMLInputElement) {
          if (element.type === "checkbox") {
            element.checked = value === "on";
          } else if (element.type !== "file") {
            element.value = value;
          }
        }
      });
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          Legal Documents & Acknowledgments
        </h3>
        <p className="text-sm text-muted-foreground">
          Step 3 of 6 - Please confirm you have read and accept the legal
          documents sent to your email
        </p>
      </div>

      {/* NDA */}
      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="font-medium">Non-Disclosure Agreement (NDA)</h4>
          <p className="text-sm text-muted-foreground">
            I agree to maintain strict confidentiality regarding all company
            information, trade secrets, and client data. This agreement extends
            beyond the term of my employment.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ndaAccepted"
              name="ndaAccepted"
              defaultChecked={initialData?.ndaAccepted}
              required
            />
            <Label htmlFor="ndaAccepted" className="font-normal">
              I accept the NDA *
            </Label>
          </div>
        </div>
      </div>

      {/* Non-Compete */}
      <div className="space-y-4">
        <Separator />
        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="font-medium">Non-Compete Clause</h4>
          <p className="text-sm text-muted-foreground">
            I agree not to engage in any business activities that compete with
            Aspom Travels for a period of two (2) years following termination of
            employment.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="nonCompeteAccepted"
              name="nonCompeteAccepted"
              defaultChecked={initialData?.nonCompeteAccepted}
              required
            />
            <Label htmlFor="nonCompeteAccepted" className="font-normal">
              I accept the Non-Compete Clause *
            </Label>
          </div>
        </div>
      </div>

      {/* Confidentiality */}
      <div className="space-y-4">
        <Separator />
        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="font-medium">Confidentiality Agreement</h4>
          <p className="text-sm text-muted-foreground">
            I acknowledge that I may have access to sensitive and confidential
            information. I agree to keep this information confidential and not
            disclose it to any third party without authorization.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="confidentialityAccepted"
              name="confidentialityAccepted"
              defaultChecked={initialData?.confidentialityAccepted}
              required
            />
            <Label htmlFor="confidentialityAccepted" className="font-normal">
              I accept the Confidentiality Agreement *
            </Label>
          </div>
        </div>
      </div>

      {/* Legal Declaration */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Terms & Conditions</h4>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              defaultChecked={initialData?.termsAccepted}
              required
            />
            <Label htmlFor="termsAccepted" className="font-normal">
              I have read, understood, and agree to abide by all company
              policies and procedures *
            </Label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {state?.error && (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Next: Guarantor & Referee"}
        </Button>
      </div>
    </form>
  );
}
