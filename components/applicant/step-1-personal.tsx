"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicantStore, PersonalData } from "@/lib/store/applicant-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function Step1Personal() {
  const router = useRouter();
  const { formData, updateFormData, setStep, completeStep, currentStep } =
    useApplicantStore();
  const initialData = formData.personal;
  const [isPending, setIsPending] = useState(false);

  // Helper to safely get nested values or defaults
  const getVal = (key: keyof PersonalData, defaultVal = "") => {
    return (initialData as any)?.[key] || defaultVal;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const form = new FormData(e.currentTarget);

    const personalData: PersonalData = {
      title: form.get("title") as string,
      firstName: form.get("firstName") as string,
      middleName: form.get("middleName") as string,
      lastName: form.get("lastName") as string,
      dateOfBirth: form.get("dateOfBirth") as string,
      birthplace: form.get("birthplace") as string,
      gender: form.get("gender") as string,
      religion: form.get("religion") as string,
      nationality: form.get("nationality") as string,
      maritalStatus: form.get("maritalStatus") as string,
      languagesSpoken: (form.get("languagesSpoken") as string)
        ?.split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      identification: {
        nationalIdOrVotersCardNo: form.get(
          "identification_nationalId",
        ) as string,
        passportNo: form.get("identification_passportNo") as string,
        passportExpiryDate: form.get("identification_passportExpiry") as string,
      },
      phoneNumber: form.get("phoneNumber") as string,
      alternatePhoneNumber: form.get("alternatePhoneNumber") as string,
      email: form.get("email") as string,
      residentialAddress: {
        street: form.get("street") as string,
        busStop: form.get("busStop") as string,
        city: form.get("city") as string,
        state: form.get("state") as string,
        country: form.get("country") as string,
      },
      nearestLandmark: form.get("nearestLandmark") as string,
      gateColor: form.get("gateColor") as string,
      houseColor: form.get("houseColor") as string,
      buildingDescription: form.get("buildingDescription") as string,
      emergencyContact: {
        name: form.get("emergencyContact_name") as string,
        relationship: form.get("emergencyContact_relationship") as string,
        phoneNumber: form.get("emergencyContact_phone") as string,
        address: form.get("emergencyContact_address") as string,
      },
    };

    // Simulate network delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    updateFormData("personal", personalData);
    completeStep(1);
    setStep(2);

    // We assume the [id] is effectively the 'session' we are in.
    // If we are in /applicant/demo/1, we go to /applicant/demo/2
    // We can extract the current ID from the URL or just push '2' relative.
    // simpler:
    const pathSegments = window.location.pathname.split("/");
    // e.g., /applicant/demo/1 -> segments ["", "applicant", "demo", "1"]
    // we want /applicant/demo/2
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "2";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/2`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <p className="text-sm text-muted-foreground">
          Step 1 of 8 - Please provide your personal details
        </p>
      </div>

      {/* Full Name Section */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Full Name</h4>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Select name="title" defaultValue={initialData?.title || ""}>
              <SelectTrigger id="title">
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr">Mr.</SelectItem>
                <SelectItem value="Mrs">Mrs.</SelectItem>
                <SelectItem value="Ms">Ms.</SelectItem>
                <SelectItem value="Dr">Dr.</SelectItem>
                <SelectItem value="Prof">Prof.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              name="firstName"
              required
              defaultValue={initialData?.firstName || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              name="middleName"
              defaultValue={initialData?.middleName || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              name="lastName"
              required
              defaultValue={initialData?.lastName || ""}
            />
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Basic Information</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              defaultValue={initialData?.dateOfBirth || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthplace">Birthplace</Label>
            <Input
              id="birthplace"
              name="birthplace"
              defaultValue={initialData?.birthplace || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select name="gender" defaultValue={initialData?.gender || ""}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status *</Label>
            <Select
              name="maritalStatus"
              defaultValue={initialData?.maritalStatus || ""}
            >
              <SelectTrigger id="maritalStatus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Select name="religion" defaultValue={initialData?.religion || ""}>
              <SelectTrigger id="religion">
                <SelectValue placeholder="Select religion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Christianity">Christianity</SelectItem>
                <SelectItem value="Islam">Islam</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality *</Label>
            <Input
              id="nationality"
              name="nationality"
              required
              defaultValue={initialData?.nationality || ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="languagesSpoken">Languages Spoken</Label>
            <Input
              id="languagesSpoken"
              name="languagesSpoken"
              placeholder="English, Yoruba (comma-separated)"
              defaultValue={initialData?.languagesSpoken?.join(", ") || ""}
            />
          </div>
        </div>
      </div>

      {/* Identification */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Identification</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="identification_nationalId">
              National ID / Voters Card No.
            </Label>
            <Input
              id="identification_nationalId"
              name="identification_nationalId"
              defaultValue={
                initialData?.identification?.nationalIdOrVotersCardNo || ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="identification_passportNo">Passport No.</Label>
            <Input
              id="identification_passportNo"
              name="identification_passportNo"
              defaultValue={initialData?.identification?.passportNo || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="identification_passportExpiry">
              Passport Expiry Date
            </Label>
            <Input
              id="identification_passportExpiry"
              name="identification_passportExpiry"
              type="date"
              defaultValue={
                initialData?.identification?.passportExpiryDate || ""
              }
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Contact Information</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={initialData?.email || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Primary Phone *</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              defaultValue={initialData?.phoneNumber || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alternatePhoneNumber">Alternate Phone</Label>
            <Input
              id="alternatePhoneNumber"
              name="alternatePhoneNumber"
              type="tel"
              defaultValue={initialData?.alternatePhoneNumber || ""}
            />
          </div>
        </div>
      </div>

      {/* Residential Address */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Residential Address</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              name="street"
              required
              defaultValue={initialData?.residentialAddress?.street || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="busStop">Bus Stop</Label>
            <Input
              id="busStop"
              name="busStop"
              defaultValue={initialData?.residentialAddress?.busStop || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              required
              defaultValue={initialData?.residentialAddress?.city || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              name="state"
              required
              defaultValue={initialData?.residentialAddress?.state || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              name="country"
              required
              defaultValue={initialData?.residentialAddress?.country || ""}
            />
          </div>
        </div>
      </div>

      {/* Physical Verification */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Physical Verification Data</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nearestLandmark">Nearest Landmark *</Label>
            <Input
              id="nearestLandmark"
              name="nearestLandmark"
              required
              defaultValue={initialData?.nearestLandmark || ""}
              placeholder="e.g., Agungi Gate"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gateColor">Gate Color</Label>
            <Input
              id="gateColor"
              name="gateColor"
              defaultValue={initialData?.gateColor || ""}
              placeholder="e.g., Black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="houseColor">House Color</Label>
            <Input
              id="houseColor"
              name="houseColor"
              defaultValue={initialData?.houseColor || ""}
              placeholder="e.g., White"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="buildingDescription">Building Description</Label>
            <Input
              id="buildingDescription"
              name="buildingDescription"
              defaultValue={initialData?.buildingDescription || ""}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Emergency Contact (Next of Kin)</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyContact_name">Name *</Label>
            <Input
              id="emergencyContact_name"
              name="emergencyContact_name"
              required
              defaultValue={initialData?.emergencyContact?.name || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact_relationship">
              Relationship *
            </Label>
            <Input
              id="emergencyContact_relationship"
              name="emergencyContact_relationship"
              required
              defaultValue={initialData?.emergencyContact?.relationship || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact_phone">Phone *</Label>
            <Input
              id="emergencyContact_phone"
              name="emergencyContact_phone"
              type="tel"
              required
              defaultValue={initialData?.emergencyContact?.phoneNumber || ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="emergencyContact_address">Address</Label>
            <Input
              id="emergencyContact_address"
              name="emergencyContact_address"
              defaultValue={initialData?.emergencyContact?.address || ""}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Separator />
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Next: Employment & Finance"}
        </Button>
      </div>
    </form>
  );
}
