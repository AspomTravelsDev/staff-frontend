"use client";

import React, { useRef, useState } from "react";
import {
  BookingConfirmationData,
  SAMPLE_BOOKING_DATA,
  EMPTY_BOOKING_DATA,
  generateBookingConfirmationCode,
} from "@/types/booking-confirmation";
import { BookingPreviewDocument } from "./booking-preview-document";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import {
  Download,
  Printer,
  Copy,
  RotateCcw,
  FileText,
  Check,
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Hash,
  Eye,
  Dice5,
  Image as ImageIcon,
  CalendarDays,
} from "lucide-react";
import { IconBrandAirbnb, IconBrandBooking } from "@tabler/icons-react";

export function BookingConfirmationGenerator() {
  const [formData, setFormData] = useState<BookingConfirmationData>(SAMPLE_BOOKING_DATA);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const updateField = <K extends keyof BookingConfirmationData>(
    field: K,
    value: BookingConfirmationData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRandomizeCode = () => {
    const newCode = generateBookingConfirmationCode("HM", 10);
    updateField("confirmationCode", newCode);
    toast.success(`Generated new confirmation code: ${newCode}`);
  };

  const handleSelectDate = (field: "checkInDate" | "checkOutDate", selected: Date | undefined) => {
    if (!selected) return;
    try {
      const formatted = format(selected, "EEE, MMM d");
      updateField(field, formatted);
    } catch (e) {
      // fallback
    }
  };

  const handleLoadSample = (sampleType: "barbados" | "london" | "dubai") => {
    if (sampleType === "barbados") {
      setFormData(SAMPLE_BOOKING_DATA);
      toast.success("Loaded Barbados Airbnb booking sample");
    } else if (sampleType === "london") {
      setFormData({
        platform: "airbnb",
        listingTitle: "Cozy Kensington Studio near Hyde Park & Metro",
        checkInDate: "Mon, Dec 14",
        checkInTime: "3:00 PM",
        checkOutDate: "Sun, Dec 20",
        checkOutTime: "10:00 AM",
        hostPhone: "+44 20 7946 0912",
        guestCountText: "2 guests",
        guestNames: "David Chukwuemeka\nGrace Chukwuemeka",
        confirmationCode: generateBookingConfirmationCode("HM", 10),
        location: "Kensington, London, United Kingdom",
        hostName: "Oliver & Charlotte",
      });
      toast.success("Loaded London Airbnb booking sample");
    } else if (sampleType === "dubai") {
      setFormData({
        platform: "airbnb",
        listingTitle: "Modern Waterfront Suite with Panoramic Marina View",
        checkInDate: "Thu, Nov 12",
        checkInTime: "2:00 PM",
        checkOutDate: "Wed, Nov 18",
        checkOutTime: "11:00 AM",
        hostPhone: "+971 50 123 4567",
        guestCountText: "1 guest",
        guestNames: "Faith Adebayo",
        confirmationCode: generateBookingConfirmationCode("HM", 10),
        location: "Dubai Marina, Dubai, United Arab Emirates",
        hostName: "Rashid",
      });
      toast.success("Loaded Dubai Airbnb booking sample");
    }
  };

  const handleClear = () => {
    setFormData(EMPTY_BOOKING_DATA);
    toast.info("Form cleared");
  };

  const handleCopyText = async () => {
    const summary = `BOOKING CONFIRMATION
Listing: ${formData.listingTitle}
Check-in: ${formData.checkInDate} at ${formData.checkInTime}
Checkout: ${formData.checkOutDate} at ${formData.checkOutTime}
Host Phone: ${formData.hostPhone}
Guests: ${formData.guestCountText} (${formData.guestNames})
Confirmation Code: ${formData.confirmationCode}
Location: ${formData.location}
Hosted by: ${formData.hostName}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Booking details copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Failed to copy details");
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current) {
      toast.error("Document template not found");
      return;
    }

    setIsGeneratingPdf(true);
    const toastId = toast.loading("Generating high-resolution PDF...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = previewRef.current;
      const dataUrl = await toJpeg(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        style: {
          transform: "none",
          transformOrigin: "top left",
          boxShadow: "none",
          borderRadius: "0",
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(dataUrl);
      const renderWidth = pageWidth;
      const renderHeight = (imgProps.height * renderWidth) / imgProps.width;

      pdf.addImage(dataUrl, "JPEG", 0, 0, renderWidth, Math.min(renderHeight, pageHeight));

      const safeCode = (formData.confirmationCode || "reservation").replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`Booking_Confirmation_${safeCode}.pdf`);

      toast.success("PDF generated & downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!previewRef.current) {
      toast.error("Document template not found");
      return;
    }

    setIsExportingImage(true);
    const toastId = toast.loading("Generating PNG image...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = previewRef.current;
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        style: {
          transform: "none",
          transformOrigin: "top left",
          boxShadow: "none",
          borderRadius: "0",
        },
      });

      const link = document.createElement("a");
      const safeCode = (formData.confirmationCode || "reservation").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `Booking_Confirmation_${safeCode}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PNG image exported successfully!", { id: toastId });
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error("Failed to export image", { id: toastId });
    } finally {
      setIsExportingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6">
      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #222222 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header,
          aside,
          nav,
          .site-header,
          button,
          [role="tablist"],
          [data-sidebar],
          .no-print {
            display: none !important;
          }
          #booking-document-root {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            border: none !important;
            box-shadow: none !important;
            padding: 16mm 20mm !important;
            z-index: 9999 !important;
            visibility: visible !important;
          }
        }
      `}</style>

      {/* HEADER & QUICK TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b no-print">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            Social Media & Travel Tools
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5 mt-1">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FileText className="size-6" />
            </span>
            Booking Confirmation Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in the details below to generate and export official booking confirmation PDFs.
          </p>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Samples Dropdown */}
          <Select onValueChange={(val) => handleLoadSample(val as "barbados" | "london" | "dubai")}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <SelectValue placeholder="Load Sample" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="barbados">Barbados (Default)</SelectItem>
              <SelectItem value="london">London Studio</SelectItem>
              <SelectItem value="dubai">Dubai Marina</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="h-9 text-xs gap-1.5"
          >
            {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Details"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewModalOpen(true)}
            className="h-9 text-xs gap-1.5"
            title="Preview formatted document"
          >
            <Eye className="size-3.5" />
            Preview
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-9 text-xs gap-1.5 font-medium shadow-sm"
          >
            {isGeneratingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Generate PDF
          </Button>
        </div>
      </div>

      {/* FORM CARDS CONTAINER */}
      <div className="space-y-6 no-print">
        {/* Card 1: Branding & Platform */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3.5">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" /> Platform & Style
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3 mr-1" /> Clear All
              </Button>
            </CardTitle>
            <CardDescription className="text-xs">
              Layout is optimized for Airbnb booking confirmation receipts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                type="button"
                variant="default"
                className="h-11 flex items-center gap-2 justify-center text-xs bg-[#FF385C] hover:bg-[#e0314f] text-white border-transparent"
                onClick={() => updateField("platform", "airbnb")}
              >
                <IconBrandAirbnb size={18} stroke={2.2} /> Airbnb
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled
                className="h-11 flex items-center gap-2 justify-center text-xs opacity-50 cursor-not-allowed"
                title="Only Airbnb platform is currently active"
              >
                <IconBrandBooking size={18} stroke={2.2} /> Booking.com
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled
                className="h-11 flex items-center gap-2 justify-center text-xs opacity-50 cursor-not-allowed"
                title="Only Airbnb platform is currently active"
              >
                Vrbo
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled
                className="h-11 flex items-center gap-2 justify-center text-xs opacity-50 cursor-not-allowed"
                title="Only Airbnb platform is currently active"
              >
                ASPOM Direct
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Property & Host Information */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3.5">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> Listing & Host Information
            </CardTitle>
            <CardDescription className="text-xs">
              Property title, address, host name, and contact phone number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Listing Title */}
            <div className="space-y-1.5">
              <Label htmlFor="listingTitle" className="text-xs font-semibold">
                Property / Listing Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="listingTitle"
                value={formData.listingTitle}
                onChange={(e) => updateField("listingTitle", e.target.value)}
                placeholder="e.g. Berecah Apartment on Government Hill, St. Michael"
                className="h-9 text-sm"
              />
            </div>

            {/* Location Address */}
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold">
                Location / Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g. Bridgetown, Saint Michael, Barbados"
                className="h-9 text-sm"
              />
            </div>

            {/* Host Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="hostName" className="text-xs font-semibold flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" /> Host Name
                </Label>
                <Input
                  id="hostName"
                  value={formData.hostName}
                  onChange={(e) => updateField("hostName", e.target.value)}
                  placeholder="e.g. Zahra"
                  className="h-9 text-sm"
                />
                <span className="text-[11px] text-muted-foreground">
                  Displays as &quot;Hosted by {formData.hostName || "..."}&quot;
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hostPhone" className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" /> Host Phone Number
                </Label>
                <Input
                  id="hostPhone"
                  value={formData.hostPhone}
                  onChange={(e) => updateField("hostPhone", e.target.value)}
                  placeholder="e.g. +1 246-231-9028"
                  className="h-9 text-sm"
                />
                <span className="text-[11px] text-muted-foreground">
                  Displays as &quot;Call host: {formData.hostPhone || "..."}&quot;
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Check-in & Checkout Times */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3.5">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-4 text-primary" /> Stay Schedule
            </CardTitle>
            <CardDescription className="text-xs">
              Check-in and checkout dates and timeframes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Check-in Group */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" /> Check-in Details
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkInDate" className="text-[11px] text-muted-foreground">
                    Check-in Date (e.g. Fri, Oct 30)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="checkInDate"
                      value={formData.checkInDate}
                      onChange={(e) => updateField("checkInDate", e.target.value)}
                      placeholder="e.g. Fri, Oct 30"
                      className="h-8 text-xs bg-background flex-1"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                          <CalendarDays className="size-3.5 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                          mode="single"
                          onSelect={(date) => handleSelectDate("checkInDate", date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkInTime" className="text-[11px] text-muted-foreground">
                    Check-in Time
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="checkInTime"
                      value={formData.checkInTime}
                      onChange={(e) => updateField("checkInTime", e.target.value)}
                      placeholder="2:00 PM"
                      className="h-8 text-xs bg-background flex-1"
                    />
                    <Select onValueChange={(val) => updateField("checkInTime", val)}>
                      <SelectTrigger className="h-8 w-24 text-[11px]">
                        <SelectValue placeholder="Preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                        <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                        <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                        <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                        <SelectItem value="Flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Checkout Group */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" /> Checkout Details
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkOutDate" className="text-[11px] text-muted-foreground">
                    Checkout Date (e.g. Sun, Nov 29)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="checkOutDate"
                      value={formData.checkOutDate}
                      onChange={(e) => updateField("checkOutDate", e.target.value)}
                      placeholder="e.g. Sun, Nov 29"
                      className="h-8 text-xs bg-background flex-1"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                          <CalendarDays className="size-3.5 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                          mode="single"
                          onSelect={(date) => handleSelectDate("checkOutDate", date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkOutTime" className="text-[11px] text-muted-foreground">
                    Checkout Time
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="checkOutTime"
                      value={formData.checkOutTime}
                      onChange={(e) => updateField("checkOutTime", e.target.value)}
                      placeholder="11:00 AM"
                      className="h-8 text-xs bg-background flex-1"
                    />
                    <Select onValueChange={(val) => updateField("checkOutTime", val)}>
                      <SelectTrigger className="h-8 w-24 text-[11px]">
                        <SelectValue placeholder="Preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                        <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                        <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                        <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Guests & Confirmation Code */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3.5">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="size-4 text-primary" /> Guests & Reservation Code
            </CardTitle>
            <CardDescription className="text-xs">
              Guest count, full traveler names, and official confirmation code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="guestCountText" className="text-xs font-semibold">
                  Guest Count
                </Label>
                <Select
                  value={formData.guestCountText}
                  onValueChange={(val) => updateField("guestCountText", val)}
                >
                  <SelectTrigger id="guestCountText" className="h-9 text-xs">
                    <SelectValue placeholder="Select guests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 guest">1 guest</SelectItem>
                    <SelectItem value="2 guests">2 guests</SelectItem>
                    <SelectItem value="3 guests">3 guests</SelectItem>
                    <SelectItem value="4 guests">4 guests</SelectItem>
                    <SelectItem value="5 guests">5 guests</SelectItem>
                    <SelectItem value="6 guests">6 guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="confirmationCode" className="text-xs font-semibold flex items-center justify-between">
                  <span>Confirmation Code</span>
                  <button
                    type="button"
                    onClick={handleRandomizeCode}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-normal cursor-pointer"
                  >
                    <Dice5 className="size-3" /> Randomize
                  </button>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="confirmationCode"
                    value={formData.confirmationCode}
                    onChange={(e) => updateField("confirmationCode", e.target.value.toUpperCase())}
                    placeholder="e.g. HMSE4A3T3B"
                    className="h-9 text-sm font-mono tracking-wider uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRandomizeCode}
                    className="h-9 px-3 text-xs"
                    title="Generate new confirmation code"
                  >
                    <Dice5 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Guest Names */}
            <div className="space-y-1.5">
              <Label htmlFor="guestNames" className="text-xs font-semibold">
                Who&apos;s Coming (Guest Name / Names)
              </Label>
              <Textarea
                id="guestNames"
                value={formData.guestNames}
                onChange={(e) => updateField("guestNames", e.target.value)}
                placeholder="e.g. Adibe Chiamaka Loveline (or one name per line for multiple guests)"
                rows={2}
                className="text-sm resize-none"
              />
              <span className="text-[11px] text-muted-foreground">
                Type the guest&apos;s name as it appears on their passport/ID.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-8 border-t">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs text-muted-foreground"
            >
              <RotateCcw className="size-3.5 mr-1" /> Reset Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewModalOpen(true)}
              className="text-xs gap-1.5"
            >
              <Eye className="size-3.5" /> Preview Document
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 text-xs gap-1.5"
            >
              <Printer className="size-3.5" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              disabled={isExportingImage}
              className="h-9 text-xs gap-1.5"
            >
              {isExportingImage ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImageIcon className="size-3.5 text-blue-600" />
              )}
              Export PNG
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="h-9 text-xs gap-1.5 font-semibold px-4"
            >
              {isGeneratingPdf ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Generate & Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* OFF-SCREEN DOCUMENT FOR SILENT HIGH-RES PDF & IMAGE GENERATION */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "620px",
          height: "auto",
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <BookingPreviewDocument ref={previewRef} data={formData} />
      </div>

      {/* OPTIONAL PREVIEW MODAL */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-[850px] w-[95vw] max-h-[92vh] overflow-y-auto p-6 flex flex-col items-center">
          <DialogHeader className="w-full text-left pb-2">
            <DialogTitle className="text-lg">Document Preview</DialogTitle>
            <DialogDescription className="text-xs">
              Formatted booking confirmation receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto w-full flex justify-center p-4 bg-muted/30 rounded border">
            <BookingPreviewDocument data={formData} className="w-[640px] min-h-[905px] p-12" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
