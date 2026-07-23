"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDocx } from "@/lib/docx-generator";
import { toast } from "sonner";
import { Download, FileText, Loader2, User, Building, DollarSign, ShieldCheck } from "lucide-react";

export function ExplanationLetterForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [letterDate, setLetterDate] = useState<Date | undefined>(new Date());

  const [formData, setFormData] = useState({
    embassy_title: "The Visa Officer, High Commission of Canada",
    applicant_name: "",
    passport_number: "",
    sponsor_name: "",
    bank_name: "Guaranty Trust Bank (GTBank)",
    account_number_ending: "**** 4589",
    closing_balance: "NGN 14,500,000",
    source_of_funds:
      "Regular monthly salary deposits from employment as well as accumulated proceeds from verified investments over the past 3 years.",
    home_ties_summary:
      "Immediate family ties in Nigeria including spouse and children, as well as real estate property ownership in Lagos.",
    additional_notes:
      "All attached bank statements have been officially stamped and signed by the bank branch manager.",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicant_name.trim()) {
      toast.error("Applicant Full Name is required!");
      return;
    }
    if (!formData.passport_number.trim()) {
      toast.error("Passport Number is required!");
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        ...formData,
        document_date: letterDate ? format(letterDate, "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy"),
      };

      await generateDocx(
        "/templates/visa/explanation-letter-template.docx",
        payload,
        `Explanation_Letter_${formData.applicant_name.replace(/\s+/g, "_") || "Sample"}.docx`
      );
      toast.success("Explanation & Funds Letter Word (.docx) generated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate Explanation Letter template");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="size-5 text-primary" />
          Explanation & Funds Letter Sample Generator
        </CardTitle>
        <CardDescription>
          Generate a pre-formatted Microsoft Word (.docx) Explanation Letter for source of funds and financial proof.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <Building className="size-4" /> 1. Embassy Header & Date
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="embassy_title" className="text-xs font-medium">Embassy / Consulate Header *</Label>
                <Input
                  id="embassy_title"
                  name="embassy_title"
                  value={formData.embassy_title}
                  onChange={handleChange}
                  placeholder="e.g. The Visa Officer, High Commission of Canada"
                  className="h-9"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <User className="size-4" /> 2. Applicant & Sponsor Information
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
                <Label htmlFor="passport_number" className="text-xs font-medium">Passport Number *</Label>
                <Input
                  id="passport_number"
                  name="passport_number"
                  value={formData.passport_number}
                  onChange={handleChange}
                  placeholder="e.g. A12345678"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor_name" className="text-xs font-medium">Sponsor Name / Self-Sponsored</Label>
                <Input
                  id="sponsor_name"
                  name="sponsor_name"
                  value={formData.sponsor_name}
                  onChange={handleChange}
                  placeholder="e.g. JOHN DOE (Self-Sponsored)"
                  className="h-9"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <DollarSign className="size-4" /> 3. Financial & Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name" className="text-xs font-medium">Bank Name</Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  placeholder="e.g. Guaranty Trust Bank (GTBank)"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number_ending" className="text-xs font-medium">Account No. Ending</Label>
                <Input
                  id="account_number_ending"
                  name="account_number_ending"
                  value={formData.account_number_ending}
                  onChange={handleChange}
                  placeholder="e.g. **** 4589"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing_balance" className="text-xs font-medium">Closing Balance</Label>
                <Input
                  id="closing_balance"
                  name="closing_balance"
                  value={formData.closing_balance}
                  onChange={handleChange}
                  placeholder="e.g. NGN 14,500,000"
                  className="h-9"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="source_of_funds" className="text-xs font-medium">Explanation of Source of Funds</Label>
                <Textarea
                  id="source_of_funds"
                  name="source_of_funds"
                  rows={2}
                  value={formData.source_of_funds}
                  onChange={handleChange}
                  placeholder="Details of regular monthly salary deposits..."
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-primary border-b pb-2">
              <ShieldCheck className="size-4" /> 4. Ties to Home Country & Additional Notes
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home_ties_summary" className="text-xs font-medium">Summary of Home Country Ties</Label>
                <Textarea
                  id="home_ties_summary"
                  name="home_ties_summary"
                  rows={2}
                  value={formData.home_ties_summary}
                  onChange={handleChange}
                  placeholder="Details of family, employment, or property ties in Nigeria..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes" className="text-xs font-medium">Additional Notes / Stamped Documents</Label>
                <Textarea
                  id="additional_notes"
                  name="additional_notes"
                  rows={2}
                  value={formData.additional_notes}
                  onChange={handleChange}
                  placeholder="Notes regarding bank statements or supporting evidence..."
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isGenerating} size="lg" className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Generating Explanation Letter (.docx)...
                </>
              ) : (
                <>
                  <Download className="size-5" />
                  Download Explanation Letter (.docx)
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
