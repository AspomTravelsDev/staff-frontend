"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy,
  Check,
  RefreshCw,
  Baby,
  Calendar,
  Globe2,
  Briefcase,
  FileText,
  ArrowRight,
} from "lucide-react";

const POPULAR_COUNTRIES = [
  "United Kingdom",
  "Canada",
  "United States",
  "Schengen Area (France)",
  "Schengen Area (Germany)",
  "Schengen Area (Italy)",
  "Schengen Area (Spain)",
  "Australia",
  "Turkey",
  "United Arab Emirates",
  "Brazil",
  "Japan",
  "China",
];

interface TravelPurposeGeneratorProps {
  initialCountry?: string;
  initialTravelType?: "tourism" | "business";
  initialStartDate?: string;
  initialEndDate?: string;
  onSelectPurpose?: (purpose: string) => void;
}

export function TravelPurposeGenerator({
  initialCountry = "United Kingdom",
  initialTravelType = "tourism",
  initialStartDate = "",
  initialEndDate = "",
  onSelectPurpose,
}: TravelPurposeGeneratorProps) {
  const [country, setCountry] = useState(initialCountry);
  const [travelType, setTravelType] = useState<"tourism" | "business">(initialTravelType);
  const [hasChildren, setHasChildren] = useState(false);
  const [travelDate, setTravelDate] = useState<string>(initialStartDate);
  const [returnDate, setReturnDate] = useState<string>(initialEndDate);

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async (forceRefresh = false) => {
    if (!country.trim()) {
      toast.error("Please enter or select a destination country");
      return;
    }

    setLoading(true);
    setCopiedIndex(null);

    try {
      const response = await fetch("/api/visa/sample-purposes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          travel_type: travelType,
          has_children: hasChildren,
          travel_date: travelDate,
          return_date: returnDate,
          force_refresh: forceRefresh,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate purpose options");
      }

      const data = await response.json();
      if (data.options && Array.isArray(data.options)) {
        setOptions(data.options);
        toast.success("Purpose options generated successfully");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate options");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base font-bold">Travel Info Generator</CardTitle>
            <CardDescription className="text-xs">
              Generate concise travel purpose options tailored to visa parameters (max 450 characters).
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* INPUT CONTROLS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/30 p-3.5 rounded-lg border">
          {/* Country Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Globe2 className="size-3.5 text-muted-foreground" />
              Destination Country
            </Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Travel Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Briefcase className="size-3.5 text-muted-foreground" />
              Category
            </Label>
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted rounded-md border h-9 items-center">
              <button
                type="button"
                onClick={() => setTravelType("tourism")}
                className={`text-xs py-1 px-2 rounded-sm font-medium transition-all ${
                  travelType === "tourism"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tourism
              </button>
              <button
                type="button"
                onClick={() => setTravelType("business")}
                className={`text-xs py-1 px-2 rounded-sm font-medium transition-all ${
                  travelType === "business"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Business
              </button>
            </div>
          </div>

          {/* Travelling with Children Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Baby className="size-3.5 text-muted-foreground" />
              Children
            </Label>
            <div
              onClick={() => setHasChildren(!hasChildren)}
              className="cursor-pointer h-9 px-3 rounded-md border bg-background flex items-center justify-between hover:bg-accent transition-colors"
            >
              <span className="text-xs font-medium">
                {hasChildren ? "With Children" : "No Children"}
              </span>
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  hasChildren ? "bg-primary border-primary text-primary-foreground" : "border-input"
                }`}
              >
                {hasChildren && <Check className="size-3" />}
              </div>
            </div>
          </div>

          {/* Travel Dates */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Calendar className="size-3.5 text-muted-foreground" />
              Travel Period (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-1">
              <Input
                type="date"
                className="h-9 text-[11px] px-2"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
              />
              <Input
                type="date"
                className="h-9 text-[11px] px-2"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-between gap-2">
          <Button
            onClick={() => handleGenerate(false)}
            disabled={loading}
            size="sm"
            className="text-xs font-semibold gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Purpose Options"
            )}
          </Button>

          {options.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate(true)}
              disabled={loading}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="size-3" />
              Re-generate
            </Button>
          )}
        </div>

        {/* GENERATED OPTIONS LIST */}
        {options.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Generated purpose options:</span>
              <span className="text-[11px]">Max 450 characters</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {options.map((opt, idx) => {
                const labels = [
                  "Concise",
                  "Itinerary Focused",
                  "Formal",
                  "Sightseeing & Heritage",
                  "Short Visit",
                ];
                const charCount = opt.length;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border bg-card hover:border-primary/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[11px] font-medium">
                        Option {idx + 1}: {labels[idx] || "Standard"}
                      </Badge>

                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {charCount} / 450 chars
                      </Badge>
                    </div>

                    <p className="text-xs leading-relaxed text-foreground font-sans">
                      {opt}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {onSelectPurpose && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onSelectPurpose(opt);
                            toast.success("Applied to form field");
                          }}
                          className="text-xs h-7 px-2.5 gap-1 text-primary hover:bg-primary/5"
                        >
                          <ArrowRight className="size-3" />
                          Apply to Form
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(opt, idx)}
                        className="text-xs h-7 px-3 gap-1.5"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="size-3.5 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 text-muted-foreground" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
