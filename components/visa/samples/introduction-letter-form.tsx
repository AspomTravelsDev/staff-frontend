"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDocx } from "@/lib/docx-generator";
import { toast } from "sonner";
import { Download, FileText, Loader2, User, Building, MapPin, Briefcase, Building2, UserCheck } from "lucide-react";

export function IntroductionLetterForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [employmentType, setEmploymentType] = useState<"employed" | "self_employed">("employed");
  const [gender, setGender] = useState<"male" | "female">("male");

  // Dates
  const [letterDate, setLetterDate] = useState<Date | undefined>(new Date());
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(new Date(2022, 0, 15)); // Jan 15, 2022
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2026, 7, 15));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(2026, 7, 30));

  // Common & Specific Form Data
  const [formData, setFormData] = useState({
    embassy_name: "High Commission of Canada",
    embassy_address: "Victoria Island, Lagos, Nigeria",
    applicant_name: "",
    destination_country: "Canada",

    // Employed specific
    company_name: "Aspom Travels Limited",
    job_title: "Senior Software Engineer",
    signatory_name: "Nancy O. Peters",
    signatory_designation: "HR Manager",
    signatory_contact_info: "Aspom Travels Limited | +234 801 234 5678 | hr@aspomtravels.com",

    // Self-Employed specific
    business_name: "",
    business_nature: "premium skincare cosmetics and beauty retail",
    registration_number: "RC 1234567",
    self_signatory_name: "",
    self_signatory_designation: "Company Secretary",
    self_signatory_address: "123 Commercial Avenue, Victoria Island, Lagos, Nigeria",
    self_signatory_phone: "+234 801 234 5678",
    self_signatory_email: "contact@example.com",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.applicant_name.trim()) {
      toast.error("Applicant Full Name is required!");
      return;
    }

    if (employmentType === "employed" && !formData.company_name.trim()) {
      toast.error("Company Name is required!");
      return;
    }

    if (employmentType === "self_employed" && !formData.business_name.trim()) {
      toast.error("Business Name is required!");
      return;
    }

    setIsGenerating(true);
    try {
      // Derive applicant last name for natural phrasing (e.g., "Mr. Doe" or "Doe")
      const nameParts = formData.applicant_name.trim().split(" ");
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : formData.applicant_name;

      // Pronoun helpers
      const pronounSubject = gender === "female" ? "she" : "he";
      const pronounSubjectCap = gender === "female" ? "She" : "He";
      const pronounPossessive = gender === "female" ? "her" : "his";

      const formattedLetterDate = letterDate ? format(letterDate, "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy");
      const formattedStartDate = startDate ? format(startDate, "MMMM d, yyyy") : "August 15, 2026";
      const formattedEndDate = endDate ? format(endDate, "MMMM d, yyyy") : "August 30, 2026";

      if (employmentType === "employed") {
        const formattedEmpStart = employmentStartDate ? format(employmentStartDate, "MMMM d, yyyy") : "January 15, 2022";

        const payload = {
          document_date: formattedLetterDate,
          embassy_name: formData.embassy_name,
          embassy_address: formData.embassy_address,
          applicant_name: formData.applicant_name,
          applicant_name_upper: formData.applicant_name ? formData.applicant_name.toUpperCase() : "",
          applicant_last_name: lastName,
          company_name: formData.company_name,
          job_title: formData.job_title,
          employment_start_date: formattedEmpStart,
          destination_country: formData.destination_country,
          travel_start_date: formattedStartDate,
          travel_end_date: formattedEndDate,
          pronoun_subject: pronounSubject,
          pronoun_possessive: pronounPossessive,
          signatory_name: formData.signatory_name,
          signatory_designation: formData.signatory_designation,
          signatory_contact_info: formData.signatory_contact_info,
        };

        await generateDocx(
          "/templates/visa/introduction-letter-employed-template.docx",
          payload,
          `Introduction_Letter_Employed_${formData.applicant_name.replace(/\s+/g, "_")}.docx`
        );
      } else {
        const payload = {
          document_date: formattedLetterDate,
          embassy_name: formData.embassy_name,
          embassy_address: formData.embassy_address,
          applicant_name: formData.applicant_name,
          applicant_name_upper: formData.applicant_name ? formData.applicant_name.toUpperCase() : "",
          applicant_last_name: lastName,
          business_name: formData.business_name,
          business_nature: formData.business_nature,
          registration_number: formData.registration_number,
          registration_phrase: formData.registration_number && formData.registration_number.trim() ? `, registered in Nigeria under ${formData.registration_number.trim()}.` : `, registered in Nigeria.`,
          destination_country: formData.destination_country,
          travel_start_date: formattedStartDate,
          travel_end_date: formattedEndDate,
          pronoun_subject_cap: pronounSubjectCap,
          pronoun_possessive: pronounPossessive,
          signatory_name: formData.self_signatory_name || "Authorized Representative",
          signatory_designation: formData.self_signatory_designation,
          signatory_address: formData.self_signatory_address,
          signatory_phone: formData.self_signatory_phone,
          signatory_email: formData.self_signatory_email,
        };

        await generateDocx(
          "/templates/visa/introduction-letter-self-employed-template.docx",
          payload,
          `Introduction_Letter_SelfEmployed_${formData.applicant_name.replace(/\s+/g, "_")}.docx`
        );
      }

      toast.success(`Introduction Letter (${employmentType === "employed" ? "Employed" : "Self-Employed"}) generated successfully!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate Introduction Letter template");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="size-5 text-primary" />
          Introduction Letter Sample Generator
        </CardTitle>
        <CardDescription>
          Generate a pre-formatted Microsoft Word (.docx) Introduction Letter tailored for Employed or Self-Employed applicants.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* EMPLOYMENT TYPE SELECTOR TOGGLE */}
          <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-3">
            <Label className="font-semibold text-xs text-primary uppercase tracking-wider block">
              Select Employment Type
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant={employmentType === "employed" ? "default" : "outline"}
                className="h-10 text-xs font-medium justify-start gap-2"
                onClick={() => setEmploymentType("employed")}
              >
                <Briefcase className="size-4" />
                Employed (Company Staff)
              </Button>

              <Button
                type="button"
                variant={employmentType === "self_employed" ? "default" : "outline"}
                className="h-10 text-xs font-medium justify-start gap-2"
                onClick={() => setEmploymentType("self_employed")}
              >
                <Building2 className="size-4" />
                Self-Employed (Business Owner / CEO)
              </Button>
            </div>
          </div>

          {/* SECTION 1: EMBASSY HEADER */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <Building className="size-4" /> 1. Embassy Header & Date
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Date Letter Sent (Calendar Picker) *</Label>
                <DatePicker
                  value={letterDate}
                  onChange={setLetterDate}
                  className="!h-9 w-full bg-background"
                  captionLayout="dropdown"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="embassy_name" className="text-xs font-medium">Embassy / Consulate Header *</Label>
                <Input
                  id="embassy_name"
                  name="embassy_name"
                  value={formData.embassy_name}
                  onChange={handleChange}
                  placeholder="e.g. High Commission of Canada"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="embassy_address" className="text-xs font-medium">Embassy Address / City *</Label>
                <Input
                  id="embassy_address"
                  name="embassy_address"
                  value={formData.embassy_address}
                  onChange={handleChange}
                  placeholder="e.g. Victoria Island, Lagos, Nigeria"
                  className="h-9"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: APPLICANT DETAILS */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <User className="size-4" /> 2. Applicant & {employmentType === "employed" ? "Employment" : "Business"} Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicant_name" className="text-xs font-medium">Applicant Full Name *</Label>
                <Input
                  id="applicant_name"
                  name="applicant_name"
                  value={formData.applicant_name}
                  onChange={handleChange}
                  placeholder="e.g. JOHN DOE"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Gender (for letter pronouns) *</Label>
                <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                  <SelectTrigger className="w-full !h-9 bg-background text-xs">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male (He / His)</SelectItem>
                    <SelectItem value="female">Female (She / Her)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {employmentType === "employed" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="text-xs font-medium">Job Position / Title *</Label>
                    <Input
                      id="job_title"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleChange}
                      placeholder="e.g. Senior Software Engineer"
                      className="h-9"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-xs font-medium">Employer / Company Name *</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="e.g. Aspom Travels Limited"
                      className="h-9"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-medium">Employment Start Date *</Label>
                    <DatePicker
                      value={employmentStartDate}
                      onChange={setEmploymentStartDate}
                      className="!h-9 w-full bg-background"
                      captionLayout="dropdown"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="text-xs font-medium">Registered Business Name *</Label>
                    <Input
                      id="business_name"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder="e.g. Apex Skincare & Beauty Ltd"
                      className="h-9"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="business_nature" className="text-xs font-medium">Nature of Business / Industry *</Label>
                    <Input
                      id="business_nature"
                      name="business_nature"
                      value={formData.business_nature}
                      onChange={handleChange}
                      placeholder="e.g. premium skincare cosmetics and luxury beauty retail"
                      className="h-9"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_number" className="text-xs font-medium">CAC Registration Number *</Label>
                    <Input
                      id="registration_number"
                      name="registration_number"
                      value={formData.registration_number}
                      onChange={handleChange}
                      placeholder="e.g. RC 1234567"
                      className="h-9"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 3: TRIP & DESTINATION */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <MapPin className="size-4" /> 3. Destination & Vacation Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination_country" className="text-xs font-medium">Destination Country *</Label>
                <Input
                  id="destination_country"
                  name="destination_country"
                  value={formData.destination_country}
                  onChange={handleChange}
                  placeholder="e.g. Canada"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Travel Start Date (Calendar Picker)</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  className="!h-9 w-full bg-background"
                  captionLayout="dropdown"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Travel Return Date (Calendar Picker)</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  className="!h-9 w-full bg-background"
                  captionLayout="dropdown"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: SIGNATORY / REPRESENTATIVE */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <UserCheck className="size-4" /> 4. {employmentType === "employed" ? "Authorized Employer Signatory" : "Representative Signatory (PA / Secretary / HR)"}
            </h3>

            {employmentType === "employed" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signatory_name" className="text-xs font-medium">Signatory Full Name *</Label>
                  <Input
                    id="signatory_name"
                    name="signatory_name"
                    value={formData.signatory_name}
                    onChange={handleChange}
                    placeholder="e.g. NANCY PETERS"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signatory_designation" className="text-xs font-medium">Signatory Position *</Label>
                  <Input
                    id="signatory_designation"
                    name="signatory_designation"
                    value={formData.signatory_designation}
                    onChange={handleChange}
                    placeholder="e.g. HR Manager / Head of People"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="signatory_contact_info" className="text-xs font-medium">Signatory Contact Information *</Label>
                  <Input
                    id="signatory_contact_info"
                    name="signatory_contact_info"
                    value={formData.signatory_contact_info}
                    onChange={handleChange}
                    placeholder="e.g. Aspom Travels Limited | +234 801 234 5678 | hr@aspomtravels.com"
                    className="h-9"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="self_signatory_name" className="text-xs font-medium">Representative Full Name *</Label>
                  <Input
                    id="self_signatory_name"
                    name="self_signatory_name"
                    value={formData.self_signatory_name}
                    onChange={handleChange}
                    placeholder="e.g. MICHAEL ADEBAYO"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="self_signatory_designation" className="text-xs font-medium">Representative Role / Capacity *</Label>
                  <Select
                    value={formData.self_signatory_designation}
                    onValueChange={(val) => handleSelectChange("self_signatory_designation", val)}
                  >
                    <SelectTrigger className="w-full !h-9 bg-background text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Company Secretary">Company Secretary</SelectItem>
                      <SelectItem value="Personal Assistant">Personal Assistant</SelectItem>
                      <SelectItem value="HR Manager">HR Manager</SelectItem>
                      <SelectItem value="Legal Counsel">Legal Counsel</SelectItem>
                      <SelectItem value="Administrative Manager">Administrative Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="self_signatory_address" className="text-xs font-medium">Business / Office Address *</Label>
                  <Input
                    id="self_signatory_address"
                    name="self_signatory_address"
                    value={formData.self_signatory_address}
                    onChange={handleChange}
                    placeholder="e.g. 123 Commercial Avenue, Victoria Island, Lagos State, Nigeria"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="self_signatory_phone" className="text-xs font-medium">Representative Phone Number *</Label>
                  <Input
                    id="self_signatory_phone"
                    name="self_signatory_phone"
                    value={formData.self_signatory_phone}
                    onChange={handleChange}
                    placeholder="e.g. +234 801 234 5678"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="self_signatory_email" className="text-xs font-medium">Representative Email Address *</Label>
                  <Input
                    id="self_signatory_email"
                    name="self_signatory_email"
                    type="email"
                    value={formData.self_signatory_email}
                    onChange={handleChange}
                    placeholder="e.g. contact@example.com"
                    className="h-9"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isGenerating} size="lg" className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Generating Introduction Letter (.docx)...
                </>
              ) : (
                <>
                  <Download className="size-5" />
                  Download Introduction Letter (.docx)
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
