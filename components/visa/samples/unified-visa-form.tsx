"use client";

import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CONSULAR_ADDRESSES,
  getConsularAddressFormatted,
} from "@/lib/visa/consular-addresses";
import { ITINERARY_PRESETS } from "@/lib/visa/itinerary-presets";
import {
  UnifiedVisaProfileData,
  generateSingleDocument,
  generateVisaPackageZip,
} from "@/lib/visa/unified-visa-generator";
import { toast } from "sonner";
import {
  Building2,
  Check,
  Compass,
  DollarSign,
  Download,
  FileArchive,
  FileText,
  HeartHandshake,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  User,
  Users,
  Briefcase,
  Sliders,
} from "lucide-react";

function formatDateWithOrdinal(date: Date): string {
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const monthStr = format(date, "MMMM");
  const dayStr = getOrdinal(date.getDate());
  const yearStr = format(date, "yyyy");
  return `${monthStr} ${dayStr}, ${yearStr}`;
}

export function UnifiedVisaForm() {
  const [isGenerating, setIsGenerating] = useState<string | false>(false);
  const [showConsularEdit, setShowConsularEdit] = useState(false);

  // Country & Duration selection
  const [selectedCountryKey, setSelectedCountryKey] = useState<string>("canada");
  const [durationDays, setDurationDays] = useState<7 | 14>(14);

  // Dates
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2026, 7, 22));
  const [letterDate, setLetterDate] = useState<Date | undefined>(new Date());
  const [employmentStartDate, setEmploymentStartDate] = useState<Date | undefined>(new Date(2021, 0, 15));

  // Master Unified Profile State (Empty user fields with clear placeholders)
  const [profile, setProfile] = useState<UnifiedVisaProfileData>({
    applicant_name: "",
    applicant_passport: "",
    nationality: "",
    applicant_address: "",
    gender: "male",

    letter_date: new Date(),
    selected_country_key: "canada",
    embassy_name: "Canadian Deputy High Commission",
    embassy_address: "Victoria Island, Lagos State",
    consular_address: getConsularAddressFormatted("canada"),

    destination_country: "Canada",
    arrival_city: "Toronto",
    travel_start_date: new Date(2026, 7, 22),
    travel_end_date: new Date(2026, 8, 4),
    duration_days: 14,
    accommodation_name: "DOUBLETREE BY HILTON HOTEL TORONTO DOWNTOWN",
    accommodation_address: "108 Chestnut Street, Toronto, Ontario, M5G1R3",
    purpose_of_visit: "a Tourist visa. I am writing to inform you of my planned itinerary for my upcoming tourist visit to Toronto, Canada",
    activities_highlights: "exploring iconic landmarks, cultural centers, parks, and downtown attractions",

    familyMembers: [],
    days: [],

    employment_type: "employed",
    job_title: "",
    company_name: "",
    employment_start_date: new Date(2022, 0, 15),
    business_name: "",
    business_nature: "",
    registration_number: "",
    signatory_name: "",
    signatory_designation: "",
    signatory_contact_info: "",
    self_signatory_name: "",
    self_signatory_designation: "Company Secretary",
    self_signatory_address: "",
    self_signatory_phone: "",
    self_signatory_email: "",

    bank_name: "",
    account_number_ending: "",
    closing_balance: "",
    source_of_funds: "",
    home_ties_summary: "",
    additional_notes: "",

    sponsor_name: "",
    sponsor_id_number: "",
    sponsor_address: "",
    sponsor_profession: "",
    sponsor_business_name: "",
    sponsor_business_description: "",
    sponsor_designation: "",
    sponsor_phone: "",
    sponsor_email: "",
    relationship_to_applicant: "Parent",
  });

  useEffect(() => {
    if (!startDate) return;
    loadPresetItinerary(selectedCountryKey, durationDays, startDate);
  }, [selectedCountryKey, durationDays, startDate]);

  const loadPresetItinerary = (
    countryKey: string,
    duration: 7 | 14,
    start: Date
  ) => {
    let effectiveKey = countryKey;
    if (countryKey === "canada") {
      const month = start.getMonth(); // 0-indexed (11 = Dec, 0 = Jan, 1 = Feb, 10 = Nov)
      const isWinter = [10, 11, 0, 1, 2].includes(month);
      effectiveKey = isWinter ? "canada_winter" : "canada_summer";
    }

    const presetData = ITINERARY_PRESETS[effectiveKey] || ITINERARY_PRESETS[countryKey] || ITINERARY_PRESETS["brazil"];
    const daysList = presetData.presets[duration] || presetData.presets[14];

    const endDateCalculated = addDays(start, duration - 1);
    const consularFormatted = effectiveKey in CONSULAR_ADDRESSES ? getConsularAddressFormatted(effectiveKey) : (countryKey in CONSULAR_ADDRESSES ? getConsularAddressFormatted(countryKey) : profile.consular_address);

    const computedDays = daysList.map((d, index) => {
      const dayDate = addDays(start, index);
      const dateText = formatDateWithOrdinal(dayDate);
      return {
        day_title: `Day ${d.dayNumber}: ${dateText} -- ${d.title}`,
        morning_activity: d.morning || "",
        afternoon_activity: d.afternoon || "",
        evening_activity: d.evening || "",
      };
    });

    setProfile((prev) => ({
      ...prev,
      selected_country_key: countryKey,
      destination_country: "Canada",
      embassy_name: CONSULAR_ADDRESSES[effectiveKey]?.embassyName || CONSULAR_ADDRESSES[countryKey]?.embassyName || `Embassy of ${presetData.countryName}`,
      embassy_address: CONSULAR_ADDRESSES[effectiveKey]?.addressLines ? CONSULAR_ADDRESSES[effectiveKey].addressLines.slice(-2).join(", ") : "Lagos, Nigeria",
      consular_address: consularFormatted,
      arrival_city: presetData.defaultCity,
      travel_start_date: start,
      travel_end_date: endDateCalculated,
      duration_days: duration,
      accommodation_name: presetData.defaultAccommodationName,
      accommodation_address: presetData.defaultAccommodationAddress,
      activities_highlights: presetData.activitiesHighlights,
      days: computedDays,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof UnifiedVisaProfileData, value: any) => {
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Family member helpers
  const handleFamilyChange = (index: number, field: string, value: string) => {
    setProfile((prev) => {
      const updated = [...prev.familyMembers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, familyMembers: updated };
    });
  };

  const addFamilyMember = () => {
    setProfile((prev) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        { relationship: "Child", name: "", passport_number: "", visa_details: "" },
      ],
    }));
  };

  const removeFamilyMember = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index),
    }));
  };

  // Validation
  const validateCore = () => {
    if (!profile.applicant_name.trim()) {
      toast.error("Applicant Full Name is required!");
      return false;
    }
    if (!profile.applicant_passport.trim()) {
      toast.error("Applicant Passport Number is required!");
      return false;
    }
    if (!profile.applicant_address.trim()) {
      toast.error("Applicant Residential Address is required!");
      return false;
    }
    return true;
  };

  // Export handlers
  const handleExportSingle = async (docType: "itinerary" | "intro" | "explanation" | "sponsorship") => {
    if (!validateCore()) return;
    setIsGenerating(docType);
    try {
      const currentProfile = {
        ...profile,
        letter_date: letterDate || new Date(),
        travel_start_date: startDate || new Date(),
        travel_end_date: addDays(startDate || new Date(), durationDays - 1),
        employment_start_date: employmentStartDate || new Date(),
      };
      await generateSingleDocument(docType, currentProfile);
      toast.success("Document downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportZip = async () => {
    if (!validateCore()) return;
    setIsGenerating("zip");
    try {
      const currentProfile = {
        ...profile,
        letter_date: letterDate || new Date(),
        travel_start_date: startDate || new Date(),
        travel_end_date: addDays(startDate || new Date(), durationDays - 1),
        employment_start_date: employmentStartDate || new Date(),
      };
      await generateVisaPackageZip(currentProfile);
      toast.success("Complete Visa Package (.zip) downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate zip package");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: CLEAN FORM WORKSPACE (lg:col-span-8) */}
      <div className="w-full min-w-0 lg:col-span-8 space-y-6">
        {/* TOP CONTROL STRIP */}
        <Card className="shadow-2xs border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="country_select" className="text-xs font-semibold">Destination Country</Label>
                <Select value={selectedCountryKey} onValueChange={(val) => setSelectedCountryKey(val)}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONSULAR_ADDRESSES).map(([key, item]) => (
                      <SelectItem key={key} value={key}>
                        {item.countryName}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Country</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Trip Duration</Label>
                <div className="grid grid-cols-2 gap-1 h-9">
                  <Button
                    type="button"
                    variant={durationDays === 7 ? "default" : "outline"}
                    className="w-full h-9 text-xs font-medium"
                    onClick={() => setDurationDays(7)}
                  >
                    7 Days
                  </Button>
                  <Button
                    type="button"
                    variant={durationDays === 14 ? "default" : "outline"}
                    className="w-full h-9 text-xs font-medium"
                    onClick={() => setDurationDays(14)}
                  >
                    14 Days
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Travel Date</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  className="h-9 w-full text-xs"
                  captionLayout="dropdown"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date Letter Sent</Label>
                <DatePicker
                  value={letterDate}
                  onChange={setLetterDate}
                  className="h-9 w-full text-xs"
                  captionLayout="dropdown"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 1: APPLICANT PROFILE */}
        <Card className="shadow-2xs border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="size-4 text-primary" /> 1. Primary Applicant Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="applicant_name" className="text-xs font-medium">Full Name *</Label>
                <Input
                  id="applicant_name"
                  name="applicant_name"
                  value={profile.applicant_name}
                  onChange={handleInputChange}
                  placeholder="e.g. JOHN DOE"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="applicant_passport" className="text-xs font-medium">Passport Number *</Label>
                <Input
                  id="applicant_passport"
                  name="applicant_passport"
                  value={profile.applicant_passport}
                  onChange={handleInputChange}
                  placeholder="e.g. A12345678"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nationality" className="text-xs font-medium">Nationality / Home Country *</Label>
                <Input
                  id="nationality"
                  name="nationality"
                  value={profile.nationality}
                  onChange={handleInputChange}
                  placeholder="e.g. Nigerian"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Gender (for pronouns) *</Label>
                <Select value={profile.gender} onValueChange={(val) => handleSelectChange("gender", val)}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male (He / His)</SelectItem>
                    <SelectItem value="female">Female (She / Her)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="applicant_address" className="text-xs font-medium">Residential Address *</Label>
                <Textarea
                  id="applicant_address"
                  name="applicant_address"
                  rows={2}
                  value={profile.applicant_address}
                  onChange={handleInputChange}
                  placeholder="e.g. 123 Sample Street, Victoria Island, Lagos State, Nigeria"
                  className="text-xs"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: DESTINATION & LODGING */}
        <Card className="shadow-2xs border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> 2. Destination & Accommodation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="arrival_city" className="text-xs font-medium">Destination City *</Label>
                <Input
                  id="arrival_city"
                  name="arrival_city"
                  value={profile.arrival_city}
                  onChange={handleInputChange}
                  placeholder="e.g. Toronto / São Paulo"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accommodation_name" className="text-xs font-medium">Hotel / Accommodation Name *</Label>
                <Input
                  id="accommodation_name"
                  name="accommodation_name"
                  value={profile.accommodation_name}
                  onChange={handleInputChange}
                  placeholder="e.g. DOUBLETREE BY HILTON HOTEL"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="accommodation_address" className="text-xs font-medium">Hotel Address & Postal Code *</Label>
                <Input
                  id="accommodation_address"
                  name="accommodation_address"
                  value={profile.accommodation_address}
                  onChange={handleInputChange}
                  placeholder="e.g. 108 Chestnut Street, Toronto, Ontario, M5G1R3"
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Optional Embassy Address Override Link */}
            <div className="pt-1 flex flex-col items-start">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConsularEdit(!showConsularEdit)}
                className="text-xs text-muted-foreground hover:text-foreground h-7 p-0"
              >
                {showConsularEdit ? "Hide Embassy Override" : "Override Embassy / Consular Address"}
              </Button>

              {showConsularEdit && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="embassy_name" className="text-xs">Embassy / Consulate Name</Label>
                    <Input id="embassy_name" name="embassy_name" value={profile.embassy_name} onChange={handleInputChange} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="embassy_address" className="text-xs">Embassy Address</Label>
                    <Input id="embassy_address" name="embassy_address" value={profile.embassy_address} onChange={handleInputChange} className="h-8 text-xs" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: DOCUMENT FINE-TUNING */}
        <Card className="shadow-2xs border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sliders className="size-4 text-primary" /> 3. Document Fine-Tuning
            </CardTitle>
            <CardDescription className="text-xs">
              Optional settings for Introduction Letter, Financial Proof, and Sponsorship.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="intro" className="w-full space-y-4">
              <TabsList className="bg-muted/60 p-1 rounded-lg inline-flex w-full sm:w-auto h-auto gap-1">
                <TabsTrigger value="intro" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <Briefcase className="size-3.5" />
                  Intro Letter
                </TabsTrigger>
                <TabsTrigger value="explanation" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <DollarSign className="size-3.5" />
                  Financial Proof
                </TabsTrigger>
                <TabsTrigger value="sponsorship" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <HeartHandshake className="size-3.5" />
                  Sponsorship
                </TabsTrigger>
                <TabsTrigger value="family" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
                  <Users className="size-3.5" />
                  Family ({profile.familyMembers.length})
                </TabsTrigger>
              </TabsList>

              {/* INTRO LETTER TAB */}
              <TabsContent value="intro" className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Employment Status</Label>
                    <Select value={profile.employment_type} onValueChange={(val: any) => handleSelectChange("employment_type",val)}>
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed (Company Staff)</SelectItem>
                        <SelectItem value="self_employed">Self-Employed (Business Owner / CEO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {profile.employment_type === "employed" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="job_title" className="text-xs font-medium">Job Position / Title</Label>
                        <Input id="job_title" name="job_title" value={profile.job_title} onChange={handleInputChange} placeholder="e.g. Senior Software Engineer" className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="company_name" className="text-xs font-medium">Company / Employer Name</Label>
                        <Input id="company_name" name="company_name" value={profile.company_name} onChange={handleInputChange} placeholder="e.g. Aspom Travels Ltd" className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Employment Start Date</Label>
                        <DatePicker
                          value={employmentStartDate}
                          onChange={setEmploymentStartDate}
                          className="h-9 w-full text-xs"
                          captionLayout="dropdown"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signatory_name" className="text-xs font-medium">Employer Signatory Name</Label>
                        <Input id="signatory_name" name="signatory_name" value={profile.signatory_name} onChange={handleInputChange} placeholder="e.g. NANCY PETERS" className="h-9 text-xs" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="business_name" className="text-xs font-medium">Registered Business Name</Label>
                        <Input id="business_name" name="business_name" value={profile.business_name || profile.company_name} onChange={handleInputChange} placeholder="e.g. Apex Skincare & Beauty Ltd" className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="business_nature" className="text-xs font-medium">Nature of Business / Industry</Label>
                        <Input id="business_nature" name="business_nature" value={profile.business_nature} onChange={handleInputChange} placeholder="e.g. premium skincare cosmetics and retail" className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="registration_number" className="text-xs font-medium">RC / Registration Number (Optional)</Label>
                        <Input id="registration_number" name="registration_number" value={profile.registration_number} onChange={handleInputChange} placeholder="e.g. RC 123456" className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="self_signatory_name" className="text-xs font-medium">Representative Signatory Name</Label>
                        <Input id="self_signatory_name" name="self_signatory_name" value={profile.self_signatory_name} onChange={handleInputChange} placeholder="e.g. KEMI ADEBAYO" className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="self_signatory_designation" className="text-xs font-medium">Signatory Designation</Label>
                        <Input id="self_signatory_designation" name="self_signatory_designation" value={profile.self_signatory_designation} onChange={handleInputChange} placeholder="e.g. Company Secretary / Personal Assistant" className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="self_signatory_phone" className="text-xs font-medium">Representative Phone Number</Label>
                        <Input id="self_signatory_phone" name="self_signatory_phone" value={profile.self_signatory_phone} onChange={handleInputChange} placeholder="e.g. +234 802 345 6789" className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="self_signatory_email" className="text-xs font-medium">Representative Email Address</Label>
                        <Input id="self_signatory_email" name="self_signatory_email" type="email" value={profile.self_signatory_email} onChange={handleInputChange} placeholder="e.g. secretary@company.com" className="h-9 text-xs" />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* FINANCIAL PROOF TAB */}
              <TabsContent value="explanation" className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank_name" className="text-xs font-medium">Bank Name</Label>
                    <Input id="bank_name" name="bank_name" value={profile.bank_name} onChange={handleInputChange} placeholder="e.g. Guaranty Trust Bank (GTBank)" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="account_number_ending" className="text-xs font-medium">Account Ending</Label>
                    <Input id="account_number_ending" name="account_number_ending" value={profile.account_number_ending} onChange={handleInputChange} placeholder="e.g. **** 4589" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="closing_balance" className="text-xs font-medium">Closing Balance</Label>
                    <Input id="closing_balance" name="closing_balance" value={profile.closing_balance} onChange={handleInputChange} placeholder="e.g. NGN 15,000,000" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5 md:col-span-3">
                    <Label htmlFor="source_of_funds" className="text-xs font-medium">Source of Funds Explanation</Label>
                    <Textarea id="source_of_funds" name="source_of_funds" rows={2} value={profile.source_of_funds} onChange={handleInputChange} placeholder="e.g. Monthly salary deposits and investment proceeds over the past 3 years." className="text-xs" />
                  </div>
                </div>
              </TabsContent>

              {/* SPONSORSHIP TAB */}
              <TabsContent value="sponsorship" className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sponsor_name" className="text-xs font-medium">Sponsor Full Name</Label>
                    <Input id="sponsor_name" name="sponsor_name" value={profile.sponsor_name} onChange={handleInputChange} placeholder="e.g. JANE DOE" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sponsor_id_number" className="text-xs font-medium">Sponsor Passport / ID No.</Label>
                    <Input id="sponsor_id_number" name="sponsor_id_number" value={profile.sponsor_id_number} onChange={handleInputChange} placeholder="e.g. A98765432" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sponsor_profession" className="text-xs font-medium">Sponsor Occupation / Profession</Label>
                    <Input id="sponsor_profession" name="sponsor_profession" value={profile.sponsor_profession || ""} onChange={handleInputChange} placeholder="e.g. Chief Executive Officer" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sponsor_business_name" className="text-xs font-medium">Sponsor Business / Company Name</Label>
                    <Input id="sponsor_business_name" name="sponsor_business_name" value={profile.sponsor_business_name || ""} onChange={handleInputChange} placeholder="e.g. Apex Global Trading Ltd" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="sponsor_business_description" className="text-xs font-medium">Sponsor Business / Field Specialization</Label>
                    <Input id="sponsor_business_description" name="sponsor_business_description" value={profile.sponsor_business_description || ""} onChange={handleInputChange} placeholder="e.g. international logistics and supply chain management" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="sponsor_address" className="text-xs font-medium">Sponsor Address</Label>
                    <Input id="sponsor_address" name="sponsor_address" value={profile.sponsor_address} onChange={handleInputChange} placeholder="e.g. 45 Commercial Avenue, Victoria Island, Lagos, Nigeria" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Relationship to Applicant</Label>
                    <Select value={profile.relationship_to_applicant} onValueChange={(val) => handleSelectChange("relationship_to_applicant", val)}>
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Employer">Employer</SelectItem>
                        <SelectItem value="Family Friend">Family Friend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sponsor_phone" className="text-xs font-medium">Sponsor Phone Number</Label>
                    <Input id="sponsor_phone" name="sponsor_phone" value={profile.sponsor_phone} onChange={handleInputChange} placeholder="e.g. +234 801 234 5678" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sponsor_email" className="text-xs font-medium">Sponsor Email Address</Label>
                    <Input id="sponsor_email" name="sponsor_email" type="email" value={profile.sponsor_email} onChange={handleInputChange} placeholder="e.g. sponsor@example.com" className="h-9 text-xs" />
                  </div>
                </div>
              </TabsContent>

              {/* FAMILY MEMBERS TAB */}
              <TabsContent value="family" className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Accompanying Family Members</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFamilyMember} className="gap-1 text-xs h-7">
                    <Plus className="size-3" /> Add Family Member
                  </Button>
                </div>

                {profile.familyMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No family members added. (Applicant traveling solo).</p>
                ) : (
                  profile.familyMembers.map((member, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2 border rounded-lg">
                      <div className="sm:col-span-3">
                        <Select value={member.relationship} onValueChange={(val) => handleFamilyChange(index, "relationship", val)}>
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Husband">Husband</SelectItem>
                            <SelectItem value="Wife">Wife</SelectItem>
                            <SelectItem value="Child">Child</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-4">
                        <Input className="h-8 text-xs" value={member.name} onChange={(e) => handleFamilyChange(index, "name", e.target.value)} placeholder="Full Name" />
                      </div>
                      <div className="sm:col-span-4">
                        <Input className="h-8 text-xs" value={member.passport_number} onChange={(e) => handleFamilyChange(index, "passport_number", e.target.value)} placeholder="Passport Number" />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => removeFamilyMember(index)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: STICKY LIVE EXPORT PANEL (lg:col-span-4) */}
      <div className="w-full min-w-0 lg:col-span-4 lg:sticky lg:top-20 space-y-4">
        <Card className="shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileArchive className="size-4 text-primary" /> Generated Documents
              </span>
              <span className="text-xs font-normal text-muted-foreground">4 Ready</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {/* 1. Travel Itinerary */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <Compass className="size-4 text-primary shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-medium truncate">Travel Itinerary</p>
                  <p className="text-[11px] text-muted-foreground">{durationDays} Days · {profile.destination_country}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!!isGenerating}
                onClick={() => handleExportSingle("itinerary")}
                className="h-7 text-xs gap-1 shrink-0"
              >
                {isGenerating === "itinerary" ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3 text-primary" />}
                docx
              </Button>
            </div>

            {/* 2. Introduction Letter */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="size-4 text-primary shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-medium truncate">Introduction Letter</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{profile.employment_type.replace("_", " ")}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!!isGenerating}
                onClick={() => handleExportSingle("intro")}
                className="h-7 text-xs gap-1 shrink-0"
              >
                {isGenerating === "intro" ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3 text-primary" />}
                docx
              </Button>
            </div>

            {/* 3. Explanation Letter */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <DollarSign className="size-4 text-primary shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-medium truncate">Explanation & Funds</p>
                  <p className="text-[11px] text-muted-foreground">{profile.bank_name || "Financial Proof"}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!!isGenerating}
                onClick={() => handleExportSingle("explanation")}
                className="h-7 text-xs gap-1 shrink-0"
              >
                {isGenerating === "explanation" ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3 text-primary" />}
                docx
              </Button>
            </div>

            {/* 4. Sponsorship Letter */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <HeartHandshake className="size-4 text-primary shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-medium truncate">Sponsorship Letter</p>
                  <p className="text-[11px] text-muted-foreground">{profile.relationship_to_applicant || "Sponsor"}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!!isGenerating}
                onClick={() => handleExportSingle("sponsorship")}
                className="h-7 text-xs gap-1 shrink-0"
              >
                {isGenerating === "sponsorship" ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3 text-primary" />}
                docx
              </Button>
            </div>

            {/* PRIMARY BATCH DOWNLOAD ZIP BUTTON */}
            <div className="pt-3 border-t space-y-2">
              <Button
                type="button"
                variant="default"
                size="lg"
                disabled={!!isGenerating}
                onClick={handleExportZip}
                className="w-full h-10 text-xs font-semibold gap-2 shadow-xs"
              >
                {isGenerating === "zip" ? <Loader2 className="size-4 animate-spin" /> : <FileArchive className="size-4" />}
                Download Full Visa Package (.zip)
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Exports all 4 .docx files in a single zip archive.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
