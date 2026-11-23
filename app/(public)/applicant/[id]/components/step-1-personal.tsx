"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  submittedData?: Record<string, string>;
};

export function Step1Personal({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: PersonalData;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const [title, setTitle] = useState<string>(initialData?.title || "");
  const [gender, setGender] = useState<string>(initialData?.gender || "");
  const [maritalStatus, setMaritalStatus] = useState<string>(
    initialData?.maritalStatus || "",
  );
  const [religion, setReligion] = useState<string>(initialData?.religion || "");
  const [emergencyRelationship, setEmergencyRelationship] = useState<string>(
    initialData?.emergencyContact?.relationship || "",
  );

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
    const requiredFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "maritalStatus",
      "nationality",
      "email",
      "phoneNumber",
      "houseNumber",
      "address",
      "city",
      "lga",
      "state",
      "country",
      "nearestLandmark",
      "emergencyContact_name",
      "emergencyContact_relationship",
      "emergencyContact_phone",
    ];

    const fieldLabels: Record<string, string> = {
      firstName: "First Name",
      lastName: "Last Name",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      maritalStatus: "Marital Status",
      nationality: "Nationality",
      email: "Email Address",
      phoneNumber: "Primary Phone",
      houseNumber: "House Number",
      address: "Address",
      city: "City",
      lga: "LGA (Local Government Area)",
      state: "State",
      country: "Country",
      nearestLandmark: "Nearest Landmark",
      emergencyContact_name: "Emergency Contact Name",
      emergencyContact_relationship: "Emergency Contact Relationship",
      emergencyContact_phone: "Emergency Contact Phone",
    };

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      const value = String(formData.get(field) || "").trim();
      if (!value) {
        missingFields.push(fieldLabels[field] || field);
      }
    }

    if (missingFields.length > 0) {
      return {
        error: `Please complete the following required fields: ${missingFields.join(", ")}`,
        submittedData: toSubmittedData(formData),
      };
    }

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
          houseNumber: formData.get("houseNumber"),
          address: formData.get("address"),
          busStop: formData.get("busStop"),
          city: formData.get("city"),
          lga: formData.get("lga"),
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
        } else if (
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          element.value = value;
        }
      });
      if (name === "title") setTitle(value);
      if (name === "gender") setGender(value);
      if (name === "maritalStatus") setMaritalStatus(value);
      if (name === "religion") setReligion(value);
      if (name === "emergencyContact_relationship") setEmergencyRelationship(value);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
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
              value={title}
              onValueChange={setTitle}
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
              value={title}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name <span className="text-destructive font-semibold ml-1">*</span></Label>
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
            <Label htmlFor="lastName">Last Name <span className="text-destructive font-semibold ml-1">*</span></Label>
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
            <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive font-semibold ml-1">*</span></Label>
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
            <Label htmlFor="gender">Gender <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Select
              value={gender}
              onValueChange={setGender}
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
              value={gender}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Select
              value={maritalStatus}
              onValueChange={setMaritalStatus}
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
              value={maritalStatus}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Select
              value={religion}
              onValueChange={setReligion}
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
              value={religion}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality <span className="text-destructive font-semibold ml-1">*</span></Label>
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
            <Label htmlFor="email">Email Address <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={initialData?.email || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Primary Phone <span className="text-destructive font-semibold ml-1">*</span></Label>
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
          <div className="space-y-2">
            <Label htmlFor="houseNumber">House Number <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="houseNumber"
              name="houseNumber"
              required
              defaultValue={initialData?.residentialAddress?.houseNumber || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="address"
              name="address"
              required
              defaultValue={initialData?.residentialAddress?.address || ""}
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
            <Label htmlFor="city">City <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="city"
              name="city"
              required
              defaultValue={initialData?.residentialAddress?.city || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lga">LGA (Local Government Area) <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="lga"
              name="lga"
              required
              placeholder="e.g., Ado-Odo/Ota, Eti-Osa"
              defaultValue={initialData?.residentialAddress?.lga || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="state"
              name="state"
              required
              defaultValue={initialData?.residentialAddress?.state || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country <span className="text-destructive font-semibold ml-1">*</span></Label>
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
            <Label htmlFor="nearestLandmark">Nearest Landmark <span className="text-destructive font-semibold ml-1">*</span></Label>
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
            <Label htmlFor="emergencyContact_name">Name <span className="text-destructive font-semibold ml-1">*</span></Label>
            <Input
              id="emergencyContact_name"
              name="emergencyContact_name"
              required
              defaultValue={initialData?.emergencyContact?.name || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact_relationship">
              Relationship <span className="text-destructive font-semibold ml-1">*</span>
            </Label>
            <Select
              value={emergencyRelationship}
              onValueChange={setEmergencyRelationship}
            >
              <SelectTrigger id="emergencyContact_relationship">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Father">Father</SelectItem>
                <SelectItem value="Brother">Brother</SelectItem>
                <SelectItem value="Sister">Sister</SelectItem>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Friend">Friend</SelectItem>
                <SelectItem value="Colleague">Colleague</SelectItem>
                <SelectItem value="Relative">Relative</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="emergencyContact_relationship"
              value={emergencyRelationship}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact_phone">Phone <span className="text-destructive font-semibold ml-1">*</span></Label>
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
