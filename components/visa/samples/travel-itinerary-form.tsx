"use client";

import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateDocx } from "@/lib/docx-generator";
import {
  CONSULAR_ADDRESSES,
  getConsularAddressFormatted,
} from "@/lib/visa/consular-addresses";
import {
  ITINERARY_PRESETS,
} from "@/lib/visa/itinerary-presets";
import { toast } from "sonner";
import {
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";

interface FamilyMember {
  relationship: string;
  name: string;
  passport_number: string;
  visa_details: string;
}

interface DaySchedule {
  day_title: string;
  morning_activity: string;
  afternoon_activity: string;
  evening_activity: string;
}

// Helper to format date with ordinal (e.g. August 22nd, 2026)
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

export function TravelItineraryForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showConsularEdit, setShowConsularEdit] = useState(false);

  // Country & Duration selection state
  const [selectedCountryKey, setSelectedCountryKey] = useState<string>("brazil");
  const [durationDays, setDurationDays] = useState<7 | 14>(14);

  // Date objects using DatePicker
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2026, 7, 22)); // Aug 22, 2026
  const [letterDate, setLetterDate] = useState<Date | undefined>(new Date()); // Today by default

  // Header info - blank defaults with clear placeholders
  const [applicantAddress, setApplicantAddress] = useState<string>("");
  const [consularAddress, setConsularAddress] = useState<string>(
    getConsularAddressFormatted("brazil")
  );

  // Applicant info - blank defaults with clear placeholders
  const [applicantInfo, setApplicantInfo] = useState({
    applicant_name: "",
    passport_number: "",
    origin_country: "Nigerian",
    visa_details: "",
    destination_country: "Brazil",
    arrival_city: "São Paulo",
    arrival_date: "August 22nd, 2026",
    departure_date: "September 2nd, 2026",
    purpose_of_visit: "a Tourist visa. I am writing to inform you of my planned itinerary for my upcoming tourist visit to São Paulo, Brazil",
    accommodation_name: "DOUBLETREE BY HILTON SAO PAULO ITAIM",
    accommodation_address: "Rua Manuel Guedes 320 - Itaim Bibi Sao Paulo, 04536-070 Brazil",
    activities_highlights:
      "exploring São Paulo Tourist iconic attractions such as Ibirapuera Park, São Paulo Cathedral, Botanical Garden of São Paulo, and Municipal Theatre, which offers spectacular seasonal activities.",
  });

  // Family members list
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Day-by-day itinerary schedule
  const [days, setDays] = useState<DaySchedule[]>([]);

  // Reload preset itinerary whenever country, duration, or start date changes
  useEffect(() => {
    if (!startDate) return;
    loadPresetItinerary(selectedCountryKey, durationDays, startDate);
  }, [selectedCountryKey, durationDays, startDate]);

  const loadPresetItinerary = (
    countryKey: string,
    duration: 7 | 14,
    start: Date
  ) => {
    const presetData = ITINERARY_PRESETS[countryKey] || ITINERARY_PRESETS["brazil"];
    const daysList = presetData.presets[duration] || presetData.presets[14];

    const arrivalDateFormatted = formatDateWithOrdinal(start);
    const departureDate = addDays(start, duration - 1);
    const departureDateFormatted = formatDateWithOrdinal(departureDate);

    const cleanDest = (presetData.countryName || "Canada")
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\b(general|winter|summer)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Update applicant and accommodation defaults
    setApplicantInfo((prev) => ({
      ...prev,
      destination_country: cleanDest,
      arrival_city: presetData.defaultCity,
      arrival_date: arrivalDateFormatted,
      departure_date: departureDateFormatted,
      accommodation_name: presetData.defaultAccommodationName,
      accommodation_address: presetData.defaultAccommodationAddress,
      activities_highlights: presetData.activitiesHighlights,
      purpose_of_visit: `a Tourist visa. I am writing to inform you of my planned itinerary for my upcoming tourist visit to ${presetData.defaultCity}, ${cleanDest}`,
    }));

    // Update consular address in background
    if (countryKey in CONSULAR_ADDRESSES) {
      setConsularAddress(getConsularAddressFormatted(countryKey));
    }

    // Build day-by-day array with calculated dates
    const computedDays: DaySchedule[] = daysList.map((d, index) => {
      const dayDate = addDays(start, index);
      const dateText = formatDateWithOrdinal(dayDate);
      return {
        day_title: `Day ${d.dayNumber}: ${dateText} -- ${d.title}`,
        morning_activity: d.morning || "",
        afternoon_activity: d.afternoon || "",
        evening_activity: d.evening || "",
      };
    });

    setDays(computedDays);
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountryKey(value);
  };

  const handleInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setApplicantInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Family member helpers
  const handleFamilyChange = (
    index: number,
    field: keyof FamilyMember,
    value: string
  ) => {
    setFamilyMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      { relationship: "Child", name: "", passport_number: "", visa_details: "" },
    ]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // Day schedule helpers
  const handleDayChange = (
    index: number,
    field: keyof DaySchedule,
    value: string
  ) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addDayRow = () => {
    const nextNum = days.length + 1;
    setDays((prev) => [
      ...prev,
      {
        day_title: `Day ${nextNum}: Date -- Activity Focus`,
        morning_activity: "",
        afternoon_activity: "",
        evening_activity: "",
      },
    ]);
  };

  const removeDayRow = (index: number) => {
    if (days.length <= 1) {
      toast.error("Itinerary must have at least one day!");
      return;
    }
    setDays((prev) => prev.filter((_, i) => i !== index));
  };

  // Format family members text for narrative paragraph
  const buildFamilyNarrative = () => {
    if (familyMembers.length === 0) return "";
    const memberStrings = familyMembers.map((m) => {
      const relPrefix = m.relationship
        ? `${m.relationship.toLowerCase() === "husband" ? "my husband, " : m.relationship.toLowerCase() === "wife" ? "my wife, " : "our " + m.relationship + " "}`
        : "";
      const passportStr = m.passport_number
        ? ` with ${applicantInfo.origin_country || "Nigerian"} passport number ${m.passport_number}`
        : "";
      const visaStr = m.visa_details ? ` and ${m.visa_details}` : "";
      return `${relPrefix}${m.name}${passportStr}${visaStr}`;
    });

    return ` together with my family: ${memberStrings.join(" and ")}`;
  };

  // Form Validation & Docx Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!applicantInfo.applicant_name.trim()) {
      toast.error("Primary Applicant Full Name is required!");
      return;
    }
    if (!applicantInfo.passport_number.trim()) {
      toast.error("Applicant Passport Number is required!");
      return;
    }
    if (!applicantAddress.trim()) {
      toast.error("Applicant Residential Address is required!");
      return;
    }
    if (!startDate) {
      toast.error("Please pick a valid Start Travel Date!");
      return;
    }
    if (!letterDate) {
      toast.error("Please pick a valid Date Letter Sent!");
      return;
    }

    setIsGenerating(true);
    try {
      const formattedLetterDate = formatDateWithOrdinal(letterDate);
      const formattedArrivalDate = formatDateWithOrdinal(startDate);
      const formattedDepartureDate = formatDateWithOrdinal(addDays(startDate, durationDays - 1));

      const cleanDestCountry = (applicantInfo.destination_country || "Canada")
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/\b(general|winter|summer)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      const cleanPurpose = (applicantInfo.purpose_of_visit || "")
        .replace(/\s*\((general|winter|summer)\)/gi, "")
        .replace(/\b(general|winter|summer)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Build docx payload matching template variables
      const payload = {
        applicant_address: applicantAddress,
        letter_date: formattedLetterDate,
        consular_address: consularAddress,
        destination_country_upper: cleanDestCountry.toUpperCase(),
        destination_country: cleanDestCountry,
        applicant_name: applicantInfo.applicant_name,
        applicant_passport: applicantInfo.passport_number,
        origin_country: applicantInfo.origin_country,
        applicant_visa_info: applicantInfo.visa_details
          ? ` and ${applicantInfo.visa_details}`
          : "",
        purpose_of_visit: cleanPurpose,
        has_family: familyMembers.length > 0,
        family_narrative: buildFamilyNarrative(),
        arrival_city: applicantInfo.arrival_city,
        arrival_date: formattedArrivalDate,
        departure_date: formattedDepartureDate,
        accommodation_name: applicantInfo.accommodation_name,
        accommodation_address: applicantInfo.accommodation_address,
        accommodation_full: `${applicantInfo.accommodation_name}, ${applicantInfo.accommodation_address}`,
        activities_highlights: applicantInfo.activities_highlights,
        days: days.map((d) => {
          const slots: Array<{ label: string; activity: string }> = [];
          if (d.morning_activity && d.morning_activity.trim()) {
            slots.push({ label: "Morning", activity: d.morning_activity.trim() });
          }
          if (d.afternoon_activity && d.afternoon_activity.trim()) {
            slots.push({ label: "Afternoon", activity: d.afternoon_activity.trim() });
          }
          if (d.evening_activity && d.evening_activity.trim()) {
            slots.push({ label: "Evening", activity: d.evening_activity.trim() });
          }
          return {
            day_title: d.day_title,
            slots,
            morning_activity: d.morning_activity || "",
            afternoon_activity: d.afternoon_activity || "",
            evening_activity: d.evening_activity || "",
          };
        }),
      };

      await generateDocx(
        "/templates/visa/travel-itinerary-template.docx",
        payload,
        `Travel_Itinerary_${applicantInfo.applicant_name.replace(/\s+/g, "_")}.docx`
      );
      toast.success("Travel Itinerary Word (.docx) document generated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate Travel Itinerary template");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="size-5 text-primary" />
          Travel Itinerary & Cover Letter Sample Generator
        </CardTitle>
        <CardDescription>
          Select destination country & duration to auto-generate complete 7-day or 14-day travel itineraries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-8">
          {/* TOP CONTROLS: Country, Duration, Start Date (ALL MATCHING H-9 HEIGHT) */}
          <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2 text-primary">
                 Preset Country & Duration Selector
              </h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 font-medium">
                <CheckCircle2 className="size-3.5" /> Auto-Prefill Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="country_select" className="font-medium text-xs">Destination Country</Label>
                <Select value={selectedCountryKey} onValueChange={handleCountryChange}>
                  <SelectTrigger className="w-full !h-9 bg-background text-xs">
                    <SelectValue placeholder="Select destination country" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONSULAR_ADDRESSES).map(([key, item]) => (
                      <SelectItem key={key} value={key}>
                        {item.countryName} ({item.embassyName})
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom / Other Country</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-xs">Trip Duration</Label>
                <div className="grid grid-cols-2 gap-2 h-9">
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

              <div className="space-y-2">
                <Label className="font-medium text-xs">Start Travel Date (Calendar Picker)</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Pick start travel date"
                  className="!h-9 w-full bg-background text-xs"
                  captionLayout="dropdown"
                />
              </div>
            </div>
          </div>

          {/* SECTION 1: Document Header Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <Building2 className="size-4" /> 1. Document Header & Address Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="applicantAddress">Applicant Residential Address (Top Right) *</Label>
                <Textarea
                  id="applicantAddress"
                  rows={3}
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  placeholder="e.g. 123 Sample Street, Victoria Island, Lagos State, Nigeria"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-xs">Date Letter Sent (Calendar Picker) *</Label>
                <DatePicker
                  value={letterDate}
                  onChange={setLetterDate}
                  placeholder="Pick date letter is sent"
                  className="!h-9 w-full bg-background"
                  captionLayout="dropdown"
                />
              </div>

              {/* Optional Consular Address Override Collapsible */}
              <div className="space-y-2 flex flex-col justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConsularEdit(!showConsularEdit)}
                  className="w-fit text-xs text-muted-foreground hover:text-foreground gap-1 p-0 h-9"
                >
                  {showConsularEdit ? (
                    <>
                      Hide Consular Address Override <ChevronUp className="size-3.5" />
                    </>
                  ) : (
                    <>
                      Override Consular Address (Auto-Filled) <ChevronDown className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>

              {showConsularEdit && (
                <div className="space-y-2 md:col-span-2 pt-2">
                  <Label htmlFor="consularAddress" className="text-xs">Consular Recipient Address Override</Label>
                  <Textarea
                    id="consularAddress"
                    rows={3}
                    value={consularAddress}
                    onChange={(e) => setConsularAddress(e.target.value)}
                    placeholder="Consular recipient address..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Primary Applicant & Family Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <User className="size-4" /> 2. Primary Applicant & Family Members
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicant_name">Primary Applicant Full Name *</Label>
                <Input
                  id="applicant_name"
                  name="applicant_name"
                  value={applicantInfo.applicant_name}
                  onChange={handleInfoChange}
                  placeholder="e.g. JOHN DOE"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passport_number">Applicant Passport Number *</Label>
                <Input
                  id="passport_number"
                  name="passport_number"
                  value={applicantInfo.passport_number}
                  onChange={handleInfoChange}
                  placeholder="e.g. A12345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin_country">Nationality / Home Country</Label>
                <Input
                  id="origin_country"
                  name="origin_country"
                  value={applicantInfo.origin_country}
                  onChange={handleInfoChange}
                  placeholder="e.g. Nigerian"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visa_details">Existing Visas (Optional)</Label>
                <Input
                  id="visa_details"
                  name="visa_details"
                  value={applicantInfo.visa_details}
                  onChange={handleInfoChange}
                  placeholder="e.g. U.S Non Immigrant visa with document number V1234567"
                />
              </div>
            </div>

            {/* Accompanying Family Members */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-sm flex items-center gap-1.5">
                  <Users className="size-4 text-muted-foreground" /> Accompanying Family Members (Optional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFamilyMember}
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" /> Add Family Member
                </Button>
              </div>

              {familyMembers.map((member, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 border rounded-lg bg-muted/20"
                >
                  <div className="md:col-span-3">
                    <Label className="text-xs md:hidden">Relationship</Label>
                    <Select
                      value={member.relationship}
                      onValueChange={(val) => handleFamilyChange(index, "relationship", val)}
                    >
                      <SelectTrigger className="w-full !h-8 bg-background text-xs">
                        <SelectValue placeholder="Relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Husband">Husband</SelectItem>
                        <SelectItem value="Wife">Wife</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Relative">Relative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-4">
                    <Label className="text-xs md:hidden">Full Name</Label>
                    <Input
                      className="h-8 text-xs"
                      value={member.name}
                      onChange={(e) => handleFamilyChange(index, "name", e.target.value)}
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs md:hidden">Passport No</Label>
                    <Input
                      className="h-8 text-xs"
                      value={member.passport_number}
                      onChange={(e) => handleFamilyChange(index, "passport_number", e.target.value)}
                      placeholder="Passport No"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs md:hidden">Existing Visas</Label>
                    <Input
                      className="h-8 text-xs"
                      value={member.visa_details}
                      onChange={(e) => handleFamilyChange(index, "visa_details", e.target.value)}
                      placeholder="e.g. U.S Visa V87654321"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => removeFamilyMember(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Accommodation Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <MapPin className="size-4" /> 3. Accommodation & Destination Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accommodation_name">Hotel / Lodging Name *</Label>
                <Input
                  id="accommodation_name"
                  name="accommodation_name"
                  value={applicantInfo.accommodation_name}
                  onChange={handleInfoChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accommodation_address">Hotel Address & Postal Code *</Label>
                <Input
                  id="accommodation_address"
                  name="accommodation_address"
                  value={applicantInfo.accommodation_address}
                  onChange={handleInfoChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Day-by-Day Schedule Customizer (Collapsible) */}
          <div className="space-y-4 pt-2 border-t">
            <div
              className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
              onClick={() => setShowCustomizer(!showCustomizer)}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-primary" />
                <div>
                  <h4 className="font-semibold text-sm">
                    Customize Day-by-Day Activities ({days.length} Days Pre-filled)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Activities are auto-generated for {applicantInfo.destination_country}. Click to inspect or manually edit day slots.
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" className="gap-1">
                {showCustomizer ? (
                  <>
                    Hide <ChevronUp className="size-4" />
                  </>
                ) : (
                  <>
                    Inspect / Custom Edit <ChevronDown className="size-4" />
                  </>
                )}
              </Button>
            </div>

            {showCustomizer && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    You can edit the titles or morning/afternoon/evening slots for any day below:
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDayRow}
                    className="gap-1 text-xs"
                  >
                    <Plus className="size-3.5" /> Add Day Slot
                  </Button>
                </div>

                <div className="space-y-4">
                  {days.map((d, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-xl bg-card space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b pb-2">
                        <Input
                          className="font-semibold text-sm h-9 max-w-xl"
                          value={d.day_title}
                          onChange={(e) => handleDayChange(index, "day_title", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 h-8 px-2"
                          onClick={() => removeDayRow(index)}
                        >
                          <Trash2 className="size-3.5 mr-1" /> Delete
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Morning Activity
                          </Label>
                          <Textarea
                            rows={2}
                            className="text-xs"
                            value={d.morning_activity}
                            onChange={(e) => handleDayChange(index, "morning_activity", e.target.value)}
                            placeholder="Morning plans..."
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Afternoon Activity
                          </Label>
                          <Textarea
                            rows={2}
                            className="text-xs"
                            value={d.afternoon_activity}
                            onChange={(e) => handleDayChange(index, "afternoon_activity", e.target.value)}
                            placeholder="Afternoon plans..."
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Evening Activity
                          </Label>
                          <Textarea
                            rows={2}
                            className="text-xs"
                            value={d.evening_activity}
                            onChange={(e) => handleDayChange(index, "evening_activity", e.target.value)}
                            placeholder="Evening plans..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isGenerating} size="lg" className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Generating Travel Itinerary (.docx)...
                </>
              ) : (
                <>
                  <Download className="size-5" />
                  Download Travel Itinerary Word (.docx)
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
