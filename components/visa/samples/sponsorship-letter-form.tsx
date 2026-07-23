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
import { Download, FileText, Loader2, User, Building, MapPin, HeartHandshake } from "lucide-react";

export function SponsorshipLetterForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2026, 7, 15));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(2026, 7, 30));

  const [formData, setFormData] = useState({
    embassy_name: "High Commission of Canada",
    embassy_address: "Victoria Island, Lagos, Nigeria",
    sponsor_name: "",
    sponsor_id_number: "",
    sponsor_address: "",
    sponsor_profession: "",
    sponsor_business_name: "",
    sponsor_business_description: "",
    sponsor_designation: "",
    sponsor_phone: "",
    sponsor_email: "",
    applicant_name: "",
    applicant_passport: "",
    relationship_to_applicant: "Parent",
    home_country: "Nigeria",
    destination_country: "Canada",
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
    if (!formData.sponsor_name.trim()) {
      toast.error("Sponsor Full Name is required!");
      return;
    }
    if (!formData.applicant_name.trim()) {
      toast.error("Applicant Full Name is required!");
      return;
    }
    if (!formData.applicant_passport.trim()) {
      toast.error("Applicant Passport Number is required!");
      return;
    }

    setIsGenerating(true);
    try {
      const rawSponsorAddress = formData.sponsor_address.trim();
      const clean = rawSponsorAddress.replace(/\r\n/g, "\n");
      const parts = clean.split(/,|\n/).map((p) => p.trim()).filter(Boolean);
      const sponsorAddressHeader = parts.length > 1 ? parts.join(",\n") : rawSponsorAddress;
      const sponsorAddressInline = rawSponsorAddress.replace(/[\r\n]+/g, ", ").replace(/,\s*,/g, ", ").trim();

      const payload = {
        ...formData,
        applicant_name_upper: formData.applicant_name ? formData.applicant_name.toUpperCase() : "",
        sponsor_address_header: sponsorAddressHeader,
        sponsor_address_inline: sponsorAddressInline,
        document_date: format(new Date(), "MMMM d, yyyy"),
        travel_start_date: startDate ? format(startDate, "MMMM d, yyyy") : "August 15, 2026",
        travel_end_date: endDate ? format(endDate, "MMMM d, yyyy") : "August 30, 2026",
      };

      await generateDocx(
        "/templates/visa/sponsorship-letter-template.docx",
        payload,
        `Sponsorship_Letter_${formData.applicant_name.replace(/\s+/g, "_") || "Sample"}.docx`
      );
      toast.success("Sponsorship Letter Word (.docx) generated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate Sponsorship Letter template");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="size-5 text-primary" />
          Sponsorship Letter Sample Generator
        </CardTitle>
        <CardDescription>
          Generate a pre-formatted Microsoft Word (.docx) Sponsorship Letter for visa applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* SECTION 1: EMBASSY RECIPIENT HEADER */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <Building className="size-4" /> 1. Embassy Header
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="embassy_name" className="text-xs font-medium">Embassy / Consulate Name *</Label>
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
                <Label htmlFor="embassy_address" className="text-xs font-medium">Embassy Location / Address *</Label>
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

          {/* SECTION 2: SPONSOR INFORMATION */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <User className="size-4" /> 2. Sponsor Information & Business Background
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sponsor_name" className="text-xs font-medium">Sponsor Full Name *</Label>
                <Input
                  id="sponsor_name"
                  name="sponsor_name"
                  value={formData.sponsor_name}
                  onChange={handleChange}
                  placeholder="e.g. JOHN DOE"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor_id_number" className="text-xs font-medium">Sponsor Passport / ID Number *</Label>
                <Input
                  id="sponsor_id_number"
                  name="sponsor_id_number"
                  value={formData.sponsor_id_number}
                  onChange={handleChange}
                  placeholder="e.g. A98765432"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sponsor_address" className="text-xs font-medium">Sponsor Residential / Official Address *</Label>
                <Input
                  id="sponsor_address"
                  name="sponsor_address"
                  value={formData.sponsor_address}
                  onChange={handleChange}
                  placeholder="e.g. 123 Commercial Avenue, Victoria Island, Lagos State, Nigeria"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor_profession" className="text-xs font-medium">Sponsor Profession / Title *</Label>
                <Input
                  id="sponsor_profession"
                  name="sponsor_profession"
                  value={formData.sponsor_profession}
                  onChange={handleChange}
                  placeholder="e.g. CEO & Managing Director"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor_business_name" className="text-xs font-medium">Business / Company Name *</Label>
                <Input
                  id="sponsor_business_name"
                  name="sponsor_business_name"
                  value={formData.sponsor_business_name}
                  onChange={handleChange}
                  placeholder="e.g. Apex Global Investment Ltd"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sponsor_business_description" className="text-xs font-medium">Business Specialization / Description *</Label>
                <Textarea
                  id="sponsor_business_description"
                  name="sponsor_business_description"
                  rows={2}
                  value={formData.sponsor_business_description}
                  onChange={handleChange}
                  placeholder="e.g. real estate investment, luxury skincare cosmetics, and international logistics"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor_designation" className="text-xs font-medium">Sponsor Sign-off Designation</Label>
                <Input
                  id="sponsor_designation"
                  name="sponsor_designation"
                  value={formData.sponsor_designation}
                  onChange={handleChange}
                  placeholder="e.g. Managing Director / Business Owner"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor_phone" className="text-xs font-medium">Sponsor Phone Number *</Label>
                <Input
                  id="sponsor_phone"
                  name="sponsor_phone"
                  value={formData.sponsor_phone}
                  onChange={handleChange}
                  placeholder="e.g. +234 801 234 5678"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sponsor_email" className="text-xs font-medium">Sponsor Email Address *</Label>
                <Input
                  id="sponsor_email"
                  name="sponsor_email"
                  type="email"
                  value={formData.sponsor_email}
                  onChange={handleChange}
                  placeholder="e.g. sponsor@example.com"
                  className="h-9"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: APPLICANT & TRIP DETAILS */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <HeartHandshake className="size-4" /> 3. Applicant & Trip Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicant_name" className="text-xs font-medium">Applicant Full Name *</Label>
                <Input
                  id="applicant_name"
                  name="applicant_name"
                  value={formData.applicant_name}
                  onChange={handleChange}
                  placeholder="e.g. JANE DOE"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicant_passport" className="text-xs font-medium">Applicant Passport Number *</Label>
                <Input
                  id="applicant_passport"
                  name="applicant_passport"
                  value={formData.applicant_passport}
                  onChange={handleChange}
                  placeholder="e.g. B12345678"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Relationship to Applicant *</Label>
                <Select
                  value={formData.relationship_to_applicant}
                  onValueChange={(val) => handleSelectChange("relationship_to_applicant", val)}
                >
                  <SelectTrigger className="w-full !h-9 bg-background text-xs">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Employer">Employer</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Family Friend">Family Friend</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Business Partner">Business Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="home_country" className="text-xs font-medium">Applicant Home Country *</Label>
                <Input
                  id="home_country"
                  name="home_country"
                  value={formData.home_country}
                  onChange={handleChange}
                  placeholder="e.g. Nigeria"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
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

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isGenerating} size="lg" className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Generating Sponsorship Letter (.docx)...
                </>
              ) : (
                <>
                  <Download className="size-5" />
                  Download Sponsorship Letter (.docx)
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
