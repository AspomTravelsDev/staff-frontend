"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicantStore } from "@/lib/store/applicant-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function Step5Referee() {
  const router = useRouter();
  const { formData, updateFormData, setStep, completeStep } =
    useApplicantStore();
  const initialData = formData.referee || {};
  const [isPending, setIsPending] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    (initialData as any)?.passportPhoto?.storagePath || null,
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) =>
        setPhotoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    setStep(4);
    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "4";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/4`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const form = new FormData(e.currentTarget);

    const refereeData = {
      fullName: form.get("referee_fullName"),
      phoneNumber: form.get("referee_phoneNumber"),
      emailAddress: form.get("referee_emailAddress"),
      organization: form.get("referee_organization"),
      address: form.get("referee_address"),
      occupation: form.get("referee_occupation"),
      relationshipType: form.get("referee_relationshipType"),
      yearsKnown: form.get("referee_yearsKnown"),
      passportPhoto: {
        storagePath: photoPreview,
      },
    };

    await new Promise((resolve) => setTimeout(resolve, 500));

    updateFormData("referee", refereeData);
    completeStep(5);
    setStep(6);

    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "6";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/6`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Referee Details</h3>
        <p className="text-sm text-muted-foreground">
          Step 5 of 8 - Provide details for one (1) referee
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="referee_fullName">Full Name *</Label>
          <Input
            id="referee_fullName"
            name="referee_fullName"
            required
            defaultValue={initialData.fullName || ""}
          />
        </div>
        <div>
          <Label htmlFor="referee_phoneNumber">Phone Number *</Label>
          <Input
            id="referee_phoneNumber"
            name="referee_phoneNumber"
            required
            defaultValue={initialData.phoneNumber || ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="referee_emailAddress">Email Address</Label>
          <Input
            id="referee_emailAddress"
            name="referee_emailAddress"
            type="email"
            defaultValue={initialData.emailAddress || ""}
          />
        </div>
        <div>
          <Label htmlFor="referee_organization">Organization</Label>
          <Input
            id="referee_organization"
            name="referee_organization"
            defaultValue={initialData.organization || ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="referee_address">Address</Label>
        <Input
          id="referee_address"
          name="referee_address"
          defaultValue={initialData.address || ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="referee_occupation">Occupation</Label>
          <Input
            id="referee_occupation"
            name="referee_occupation"
            defaultValue={initialData.occupation || ""}
          />
        </div>
        <div>
          <Label htmlFor="referee_yearsKnown">Years Known</Label>
          <Input
            id="referee_yearsKnown"
            name="referee_yearsKnown"
            type="number"
            defaultValue={initialData.yearsKnown || ""}
          />
        </div>
      </div>

      {/* Photo Upload */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <Label htmlFor="referee_photo" className="font-medium">
          Passport Photograph
        </Label>
        <input
          type="file"
          id="referee_photo"
          name="referee_photo"
          accept="image/*"
          onChange={handlePhotoChange}
          className="block w-full text-sm mt-2"
        />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Referee preview"
            className="h-32 w-24 object-cover mt-2 rounded border"
          />
        )}
      </div>

      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Next: Media"}
        </Button>
      </div>
    </form>
  );
}
