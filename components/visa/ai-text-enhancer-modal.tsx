"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Loader2, Check, Copy, Wand2, X } from "lucide-react";

interface AiTextOption {
  label: string;
  badge: string;
  text: string;
}

interface AiTextEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (enhancedText: string) => void;
  title: string;
  type: "home_ties" | "source_of_funds" | "purpose_narrative" | "sponsorship";
  initialText?: string;
  applicantName?: string;
  jobTitle?: string;
  companyName?: string;
  destinationCountry?: string;
}

export function AiTextEnhancerModal({
  isOpen,
  onClose,
  onApply,
  title,
  type,
  initialText = "",
  applicantName = "",
  jobTitle = "",
  companyName = "",
  destinationCountry = "",
}: AiTextEnhancerModalProps) {
  const [rawText, setRawText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<AiTextOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!rawText.trim()) {
      toast.error("Please enter a few brief points or notes first.");
      return;
    }

    setLoading(true);
    setSelectedIdx(null);

    try {
      const res = await fetch("/api/visa/enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          raw_text: rawText,
          applicant_name: applicantName,
          job_title: jobTitle,
          company_name: companyName,
          destination_country: destinationCountry,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate AI enhancements.");
      }

      const data = await res.json();
      if (data.options && Array.isArray(data.options)) {
        setOptions(data.options);
        toast.success("Generated 3 AI-enhanced paragraph options!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate AI text");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOption = (text: string) => {
    onApply(text);
    toast.success("AI enhanced text applied to form!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-background border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-[11px] text-muted-foreground">Type brief notes and let AI expand them into formal consular paragraphs.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Your Rough Points / Brief Notes</Label>
            <Textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Program Manager at Advokc for 4 years, led promise tracker project with 174k users, supervise 15 staff, 300 advocates across 15 states."
              className="text-xs"
            />
          </div>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !rawText.trim()}
            className="w-full gap-2 text-xs font-medium"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            {loading ? "Generating AI Options..." : "Generate AI-Enhanced Paragraphs"}
          </Button>

          {/* AI GENERATED OPTIONS */}
          {options.length > 0 && (
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> 3 AI-Enhanced Options (Click to Select)
              </Label>

              <div className="space-y-2.5">
                {options.map((opt, index) => {
                  const isSelected = selectedIdx === index;
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedIdx(index)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "bg-muted/20 hover:bg-muted/40 border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{opt.label}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {opt.badge}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className="h-6 text-[11px] gap-1 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyOption(opt.text);
                          }}
                        >
                          <Check className="size-3" /> Use This Text
                        </Button>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[11.5px]">{opt.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 border-t bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
