"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Loader2, Check, Wand2, X, PlusCircle } from "lucide-react";

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

const SOURCE_OF_FUNDS_CATEGORIES = [
  { id: "salary", label: "Monthly Salary / Employment", icon: "💼" },
  { id: "business", label: "Business Operations / Sales", icon: "🏢" },
  { id: "investments", label: "Investments & Rental Yield", icon: "📈" },
  { id: "lump_sum", label: "Lump Sum / Asset Sale", icon: "💰" },
  { id: "mixed", label: "Mixed / Other Sources", icon: "🌐" },
];

const SOURCE_OF_FUNDS_TAGS: Record<string, string[]> = {
  salary: [
    "Monthly salary deposits",
    "3+ years personal savings",
    "Annual performance bonus",
    "Direct payroll remittance",
    "Pay slips & tax clearance attached",
  ],
  business: [
    "Registered business turnover",
    "Contract project disbursements",
    "Director dividends & retained profits",
    "CAC certificate attached",
  ],
  investments: [
    "Rental income from residential property",
    "Stock dividends & equity returns",
    "Mutual funds / Treasury bill yields",
    "Tenancy agreements attached",
  ],
  lump_sum: [
    "Sale of personal vehicle with deed",
    "Land liquidation proceeds",
    "Severance / gratuity payment",
    "Documented gift / inheritance",
  ],
  mixed: [
    "Salary savings + business turnover",
    "Consulting fees + payroll",
    "Rental income + employment savings",
  ],
};

const HOME_TIES_CATEGORIES = [
  { id: "employment", label: "Employment & Career", icon: "👔" },
  { id: "family", label: "Family & Dependents", icon: "👨‍👩‍👧‍👦" },
  { id: "property", label: "Property & Real Estate", icon: "🏡" },
  { id: "business", label: "Business Ownership", icon: "💼" },
  { id: "community", label: "Civic & Community", icon: "🤝" },
];

const HOME_TIES_TAGS: Record<string, string[]> = {
  employment: [
    "Key project lead / vital responsibilities",
    "Supervise team of staff in Nigeria",
    "Approved leave of absence with resumption date",
    "5+ years continuous tenure",
  ],
  family: [
    "Married with spouse residing in Nigeria",
    "Children enrolled in school in Nigeria",
    "Elderly parents / domestic care duties",
    "Primary household anchor in Nigeria",
  ],
  property: [
    "Homeowner of residential property",
    "Landed real estate with Deed of Assignment",
    "Active property construction ongoing",
  ],
  business: [
    "Managing Director of registered enterprise",
    "Physical business premises in Nigeria",
  ],
  community: [
    "Community board member",
    "Executive in civic / religious association",
  ],
};

const SPONSORSHIP_CATEGORIES = [
  { id: "family", label: "Spousal / Family Sponsor", icon: "👨‍👩‍👦" },
  { id: "corporate", label: "Company / Corporate Sponsor", icon: "🏢" },
  { id: "personal", label: "Personal Undertaking", icon: "🤝" },
];

const PURPOSE_CATEGORIES = [
  { id: "leisure", label: "Tourism & Leisure Vacation", icon: "🏖️" },
  { id: "cultural", label: "Cultural Sightseeing", icon: "🏛️" },
  { id: "family_visit", label: "Family Holiday", icon: "👨‍👩‍👧" },
];

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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<AiTextOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Sync initialText when modal opens
  useEffect(() => {
    if (isOpen) {
      setRawText(initialText || "");
      setSelectedIdx(null);
      setOptions([]);

      // Auto-detect default category
      if (type === "source_of_funds") {
        const lower = (initialText || "").toLowerCase();
        if (/business|turnover|contract/i.test(lower)) setSelectedCategory("business");
        else if (/lump|sale|sold|car|land/i.test(lower)) setSelectedCategory("lump_sum");
        else if (/rent|shares|dividends/i.test(lower)) setSelectedCategory("investments");
        else setSelectedCategory("salary");
      } else if (type === "home_ties") {
        const lower = (initialText || "").toLowerCase();
        if (/married|spouse|children|kids/i.test(lower)) setSelectedCategory("family");
        else if (/property|house|land/i.test(lower)) setSelectedCategory("property");
        else setSelectedCategory("employment");
      } else if (type === "sponsorship") {
        setSelectedCategory("family");
      } else {
        setSelectedCategory("leisure");
      }
    }
  }, [isOpen, initialText, type]);

  if (!isOpen) return null;

  const handleTagClick = (tag: string) => {
    if (!rawText.trim()) {
      setRawText(tag);
    } else if (!rawText.includes(tag)) {
      setRawText(`${rawText.trim()}, ${tag}`);
    }
  };

  const handleGenerate = async () => {
    if (!rawText.trim()) {
      toast.error("Please enter a few brief points or select quick cues first.");
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
          category: selectedCategory,
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
        toast.success("Generated 3 tailored consular paragraph options!");
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

  // Resolve categories & tags for current type
  let categories: Array<{ id: string; label: string; icon: string }> = [];
  let availableTags: string[] = [];

  if (type === "source_of_funds") {
    categories = SOURCE_OF_FUNDS_CATEGORIES;
    availableTags = SOURCE_OF_FUNDS_TAGS[selectedCategory] || SOURCE_OF_FUNDS_TAGS.salary;
  } else if (type === "home_ties") {
    categories = HOME_TIES_CATEGORIES;
    availableTags = HOME_TIES_TAGS[selectedCategory] || HOME_TIES_TAGS.employment;
  } else if (type === "sponsorship") {
    categories = SPONSORSHIP_CATEGORIES;
  } else {
    categories = PURPOSE_CATEGORIES;
  }

  // Dynamic placeholder
  const getPlaceholder = () => {
    if (type === "source_of_funds") {
      if (selectedCategory === "salary") {
        return "e.g. Monthly net salary of NGN 850,000 from current employer, plus personal savings accrued over the past 3 years and annual bonuses.";
      }
      if (selectedCategory === "business") {
        return "e.g. Monthly commercial turnover of NGN 4.5M from registered logistics firm, alongside regular director dividend payouts.";
      }
      if (selectedCategory === "lump_sum") {
        return "e.g. NGN 7,500,000 received in November from the verified sale of personal vehicle, supported by deed of sale.";
      }
      if (selectedCategory === "investments") {
        return "e.g. Annual rental yield of NGN 6M from 2 residential units in Lekki plus dividends from equity investments.";
      }
      return "e.g. Combined regular salary savings and verified investment returns over 4 years.";
    }
    if (type === "home_ties") {
      if (selectedCategory === "family") {
        return "e.g. Married with 2 children enrolled in primary school in Lagos, spouse resides in Nigeria, and domestic family commitments.";
      }
      if (selectedCategory === "property") {
        return "e.g. Homeowner of a 4-bedroom detached duplex in Lekki, Lagos, with registered Deed of Assignment.";
      }
      if (selectedCategory === "employment") {
        return "e.g. Senior Manager leading Q3 project deliverables, managing 12 staff, with 2-week approved leave of absence.";
      }
      return "e.g. Married with school-age kids in Lagos, homeowner in Lekki, and senior corporate role with approved leave.";
    }
    return "e.g. Enter brief points or key facts you want AI to expand into a formal consular explanation.";
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
              <p className="text-[11px] text-muted-foreground">
                State your specific facts (e.g. monthly salary, business profits, family ties) and let AI expand them into consular-grade paragraphs.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* CATEGORY SELECTOR PILLS */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">
                {type === "source_of_funds"
                  ? "Select Primary Source Type:"
                  : type === "home_ties"
                  ? "Select Primary Tie Category:"
                  : "Select Focus Category:"}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isCatSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCatSelected
                          ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                          : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUICK CUE TAGS */}
          {availableTags.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10.5px] font-medium text-muted-foreground flex items-center gap-1">
                <PlusCircle className="size-3 text-primary" /> Click to add quick details:
              </Label>
              <div className="flex flex-wrap gap-1">
                {availableTags.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 hover:bg-primary/15 text-primary border border-primary/20 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* USER ROUGH POINTS TEXTAREA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">
                {type === "source_of_funds"
                  ? "State Your Source of Funds Details:"
                  : type === "home_ties"
                  ? "State Your Home & Economic Ties Facts:"
                  : "Your Rough Points / Brief Notes:"}
              </Label>
              <span className="text-[10.5px] text-muted-foreground">Be as brief or detailed as you like</span>
            </div>
            <Textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={getPlaceholder()}
              className="text-xs resize-none"
            />
          </div>

          {/* GENERATE BUTTON */}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !rawText.trim()}
            className="w-full gap-2 text-xs font-medium"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            {loading ? "Expanding with AI..." : "Expand & Generate 3 Consular Options"}
          </Button>

          {/* AI GENERATED OPTIONS */}
          {options.length > 0 && (
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> 3 AI-Expanded Options (Click &quot;Use This Text&quot;)
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
                          className="h-6 text-[11px] gap-1 px-2 cursor-pointer"
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
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

