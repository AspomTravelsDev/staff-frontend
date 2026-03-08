"use client";

import { useActionState } from "react";
import { saveFormStep } from "../actions";
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
import { PersonalData } from "@/lib/types/form-data";

type FormState = {
  error?: string;
  success?: boolean;
  nextStep?: number;
};

export function Step1Personal({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: PersonalData;
}) {
  const handleSubmitAction = async (
    _prevState: FormState | null,
    formData: FormData,
  ): Promise<FormState> => {
    const data = {
      personal: {
        title: formData.get("title"),
        firstName: formData.get("firstName"),
        middleName: formData.get("middleName"),
        lastName: formData.get("lastName"),
        dateOfBirth: formData.get("dateOfBirth"),
        birthplace: formData.get("birthplace"),
        gender: formData.get("gender"),
        religion: formData.get("religion"),
        nationality: formData.get("nationality"),
        maritalStatus: formData.get("maritalStatus"),
        languagesSpoken: (formData.get("languagesSpoken") as string)
          ?.split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        identification: {
          nationalIdOrVotersCardNo: formData.get("identification_nationalId"),
          passportNo: formData.get("identification_passportNo"),
          passportExpiryDate: formData.get("identification_passportExpiry"),
        },
        phoneNumber: formData.get("phoneNumber"),
        alternatePhoneNumber: formData.get("alternatePhoneNumber"),
        email: formData.get("email"),
        residentialAddress: {
          street: formData.get("street"),
          busStop: formData.get("busStop"),
          city: formData.get("city"),
          state: formData.get("state"),
          country: formData.get("country"),
        },
        nearestLandmark: formData.get("nearestLandmark"),
        gateColor: formData.get("gateColor"),
        houseColor: formData.get("houseColor"),
        buildingDescription: formData.get("buildingDescription"),
        emergencyContact: {
          name: formData.get("emergencyContact_name"),
          relationship: formData.get("emergencyContact_relationship"),
          phoneNumber: formData.get("emergencyContact_phone"),
          address: formData.get("emergencyContact_address"),
        },
      },
    };
    return saveFormStep(applicationId, 1, data);
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <p className="text-sm text-muted-foreground">
          Step 1 of 6 - Please provide your personal details
        </p>
      </div>

      {/* Full Name Section */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Full Name</h4>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Select
              defaultValue={initialData?.title || ""}
              onValueChange={(value) => {
                const input = document.querySelector(
                  'input[name="title"]',
                ) as HTMLInputElement;
                if (input) input.value = value;
              }}
            >
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
            <input
              type="hidden"
              name="title"
              defaultValue={initialData?.title || ""}
            />
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
            <Select
              defaultValue={initialData?.gender || ""}
              onValueChange={(value) => {
                const input = document.querySelector(
                  'input[name="gender"]',
                ) as HTMLInputElement;
                if (input) input.value = value;
              }}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="gender"
              defaultValue={initialData?.gender || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status *</Label>
            <Select
              defaultValue={initialData?.maritalStatus || ""}
              onValueChange={(value) => {
                const input = document.querySelector(
                  'input[name="maritalStatus"]',
                ) as HTMLInputElement;
                if (input) input.value = value;
              }}
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
            <input
              type="hidden"
              name="maritalStatus"
              defaultValue={initialData?.maritalStatus || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Select
              defaultValue={initialData?.religion || ""}
              onValueChange={(value) => {
                const input = document.querySelector(
                  'input[name="religion"]',
                ) as HTMLInputElement;
                if (input) input.value = value;
              }}
            >
              <SelectTrigger id="religion">
                <SelectValue placeholder="Select religion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Christianity">Christianity</SelectItem>
                <SelectItem value="Islam">Islam</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="religion"
              defaultValue={initialData?.religion || ""}
            />
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

      {/* Error Display */}
      {state?.error && (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

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
