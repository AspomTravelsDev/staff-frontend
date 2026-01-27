"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicantStore } from "@/lib/store/applicant-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function Step4Guarantors() {
  const router = useRouter();
  const { formData, updateFormData, setStep, completeStep } =
    useApplicantStore();
  const initialData = formData.guarantors || [{}, {}]; // Ensure mocked array
  const [isPending, setIsPending] = useState(false);

  const [guarantor1Preview, setGuarantor1Preview] = useState<string | null>(
    (initialData as any)?.[0]?.passportPhoto?.storagePath || null,
  );
  const [guarantor2Preview, setGuarantor2Preview] = useState<string | null>(
    (initialData as any)?.[1]?.passportPhoto?.storagePath || null,
  );

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (index === 0) setGuarantor1Preview(result);
        else setGuarantor2Preview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    setStep(3);
    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "3";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/3`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const form = new FormData(e.currentTarget);

    const guarantor1 = {
      firstName: form.get("guarantor1_firstName"),
      lastName: form.get("guarantor1_lastName"),
      phoneNumber: form.get("guarantor1_phoneNumber"),
      email: form.get("guarantor1_email"),
      address: {
        street: form.get("guarantor1_street"),
        city: form.get("guarantor1_city"),
      },
      occupation: form.get("guarantor1_occupation"),
      relationship: form.get("guarantor1_relationship"),
      passportPhoto: {
        storagePath: guarantor1Preview, // Mock storage
      },
    };

    const guarantor2 = {
      firstName: form.get("guarantor2_firstName"),
      lastName: form.get("guarantor2_lastName"),
      phoneNumber: form.get("guarantor2_phoneNumber"),
      email: form.get("guarantor2_email"),
      address: {
        street: form.get("guarantor2_street"),
        city: form.get("guarantor2_city"),
      },
      occupation: form.get("guarantor2_occupation"),
      relationship: form.get("guarantor2_relationship"),
      passportPhoto: {
        storagePath: guarantor2Preview,
      },
    };

    const data = [guarantor1, guarantor2];

    await new Promise((resolve) => setTimeout(resolve, 500));

    updateFormData("guarantors", data);
    completeStep(4);
    setStep(5);

    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "5";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/5`);
    }
  };

  const renderGuarantorSection = (index: number, title: string) => {
    const prefix = `guarantor${index + 1}_`;
    const data = (initialData as any)?.[index] || {};
    const preview = index === 0 ? guarantor1Preview : guarantor2Preview;

    return (
      <div className="space-y-4">
        {index > 0 && <Separator />}
        <h4 className="text-base font-semibold">{title}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}firstName`}>First Name *</Label>
            <Input
              id={`${prefix}firstName`}
              name={`${prefix}firstName`}
              required
              defaultValue={data.firstName || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}lastName`}>Last Name *</Label>
            <Input
              id={`${prefix}lastName`}
              name={`${prefix}lastName`}
              required
              defaultValue={data.lastName || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}phoneNumber`}>Phone Number *</Label>
            <Input
              id={`${prefix}phoneNumber`}
              name={`${prefix}phoneNumber`}
              required
              defaultValue={data.phoneNumber || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}email`}>Email</Label>
            <Input
              id={`${prefix}email`}
              name={`${prefix}email`}
              defaultValue={data.email || ""}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`${prefix}street`}>Address</Label>
          <Input
            id={`${prefix}street`}
            name={`${prefix}street`}
            defaultValue={data.address?.street || ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}occupation`}>Occupation</Label>
            <Input
              id={`${prefix}occupation`}
              name={`${prefix}occupation`}
              defaultValue={data.occupation || ""}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}relationship`}>Relationship</Label>
            <Input
              id={`${prefix}relationship`}
              name={`${prefix}relationship`}
              defaultValue={data.relationship || ""}
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div className="rounded-lg border p-4 bg-muted/30">
          <Label htmlFor={`${prefix}photo`} className="font-medium">
            Passport Photograph
          </Label>
          <input
            type="file"
            id={`${prefix}photo`}
            name={`${prefix}photo`}
            accept="image/*"
            onChange={(e) => handlePhotoChange(e, index)}
            className="block w-full text-sm mt-2"
          />
          {preview && (
            <img
              src={preview}
              alt="Passport preview"
              className="h-32 w-24 object-cover mt-2 rounded border"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Guarantors Details</h3>
        <p className="text-sm text-muted-foreground">
          step 4 of 8 - Details for two (2) guarantors
        </p>
      </div>

      {renderGuarantorSection(0, "Guarantor 1")}
      {renderGuarantorSection(1, "Guarantor 2")}

      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Next: Referee"}
        </Button>
      </div>
    </form>
  );
}
