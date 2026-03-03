"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  VisaInformationCategory,
  VisaInformation,
  CreateVisaInformationRequest,
} from "@/lib/api/visa";
import {
  createVisaInformationAction,
  updateVisaInformationAction,
} from "../actions";
import { toast } from "sonner";

// Dynamically import react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const CATEGORIES: VisaInformationCategory[] = [
  "Checklist",
  "Submission Info",
  "Embassy Details",
  "FAQ",
];

interface FAQItem {
  question: string;
  answer: string;
}

interface LocationItem {
  name: string;
  address: string;
  timings: string;
}

interface Props {
  infoRecord?: VisaInformation | null;
}

const DEFAULT_CHECKLIST: string[] = [""];
const DEFAULT_FAQS: FAQItem[] = [{ question: "", answer: "" }];
const DEFAULT_LOCATIONS: LocationItem[] = [
  { name: "", address: "", timings: "" },
];

export function ManageInfoForm({ infoRecord }: Props) {
  const router = useRouter();
  const isEditing = !!infoRecord;

  const [category, setCategory] = useState<VisaInformationCategory>(
    infoRecord?.category ?? "Checklist",
  );
  const [country, setCountry] = useState(infoRecord?.country ?? "");
  const [title, setTitle] = useState(infoRecord?.title ?? "");

  const [checklistItems, setChecklistItems] =
    useState<string[]>(DEFAULT_CHECKLIST);
  const [faqs, setFaqs] = useState<FAQItem[]>(DEFAULT_FAQS);
  const [locations, setLocations] = useState<LocationItem[]>(DEFAULT_LOCATIONS);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (!infoRecord) return;
    setCategory(infoRecord.category);
    setCountry(infoRecord.country ?? "");
    setTitle(infoRecord.title);
    try {
      const parsed = JSON.parse(infoRecord.content);
      if (parsed.type === "checklist" && Array.isArray(parsed.items)) {
        setChecklistItems(
          parsed.items.length ? parsed.items : DEFAULT_CHECKLIST,
        );
      } else if (parsed.type === "faq" && Array.isArray(parsed.faqs)) {
        setFaqs(parsed.faqs.length ? parsed.faqs : DEFAULT_FAQS);
      } else if (
        parsed.type === "locations" &&
        Array.isArray(parsed.locations)
      ) {
        setLocations(
          parsed.locations.length ? parsed.locations : DEFAULT_LOCATIONS,
        );
        setNotes(parsed.notes ?? "");
      }
    } catch {
      // legacy plain text — no special handling needed, form will start fresh
    }
  }, [infoRecord]);

  const buildContent = (): string => {
    switch (category) {
      case "Checklist":
        return JSON.stringify({
          type: "checklist",
          items: checklistItems.filter((i) => i.trim()),
        });
      case "FAQ":
        return JSON.stringify({
          type: "faq",
          faqs: faqs.filter((f) => f.question.trim()),
        });
      case "Submission Info":
      case "Embassy Details":
        return JSON.stringify({
          type: "locations",
          locations: locations.filter((l) => l.name.trim()),
          notes,
        });
      default:
        return "";
    }
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required.";
    if (category === "Checklist" && !checklistItems.some((i) => i.trim()))
      return "Add at least one checklist item.";
    if (category === "FAQ" && !faqs.some((f) => f.question.trim()))
      return "Add at least one FAQ.";
    if (
      (category === "Submission Info" || category === "Embassy Details") &&
      !locations.some((l) => l.name.trim())
    )
      return "Add at least one location.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    const payload: CreateVisaInformationRequest = {
      category,
      country: country.trim() || null,
      title: title.trim(),
      content: buildContent(),
    };

    const result = isEditing
      ? await updateVisaInformationAction(infoRecord!.id, payload)
      : await createVisaInformationAction(payload);

    setLoading(false);

    if (result.success) {
      toast.success(
        `${category} ${isEditing ? "updated" : "created"} successfully`,
      );
      router.push("/visa/information-desk");
      router.refresh();
    } else {
      const errorMsg = result.error ?? "Failed to save. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // ─── Checklist helpers ────────────────────────────────────────────────────
  const updateChecklistItem = (index: number, value: string) =>
    setChecklistItems((prev) => prev.map((v, i) => (i === index ? value : v)));
  const removeChecklistItem = (index: number) =>
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));

  // ─── FAQ helpers ──────────────────────────────────────────────────────────
  const updateFaq = (index: number, field: keyof FAQItem, value: string) =>
    setFaqs((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    );
  const removeFaq = (index: number) =>
    setFaqs((prev) => prev.filter((_, i) => i !== index));

  // ─── Location helpers ─────────────────────────────────────────────────────
  const updateLocation = (
    index: number,
    field: keyof LocationItem,
    value: string,
  ) =>
    setLocations((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  const removeLocation = (index: number) =>
    setLocations((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="space-y-8 bg-card border rounded-lg p-6 lg:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/visa/information-desk")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            {isEditing ? "Edit Visa Information" : "Add Visa Information"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill in the details below for the Information Desk.
          </p>
        </div>
      </div>

      {/* Title + Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g. UK Tourist Visa Checklist"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="country">Country (optional)</Label>
          <Input
            id="country"
            placeholder="e.g. UK, Canada"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="grid gap-2">
        <Label>
          Category <span className="text-destructive">*</span>
        </Label>
        <Tabs
          value={category}
          onValueChange={(v) => setCategory(v as VisaInformationCategory)}
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Dynamic content area */}
      <div className="border rounded-md p-4 lg:p-6 bg-muted/5 min-h-[260px] space-y-4">
        {/* ── Checklist ─────────────────────────────────────── */}
        {category === "Checklist" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-base">Checklist Items</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChecklistItems((p) => [...p, ""])}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="e.g. Original Passport with 6 months validity"
                    value={item}
                    onChange={(e) => updateChecklistItem(idx, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive"
                    onClick={() => removeChecklistItem(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {checklistItems.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                  No items yet. Click &quot;Add Item&quot; to begin.
                </p>
              )}
            </div>
          </>
        )}

        {/* ── FAQ ───────────────────────────────────────────── */}
        {category === "FAQ" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-base">Frequently Asked Questions</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFaqs((p) => [...p, { question: "", answer: "" }])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add FAQ
              </Button>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="relative p-4 border rounded-md bg-background shadow-sm space-y-3"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-destructive"
                    onClick={() => removeFaq(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <div className="grid gap-1.5 pr-8">
                    <Label className="text-xs">Question</Label>
                    <Input
                      placeholder="e.g. How long is the processing time?"
                      value={faq.question}
                      onChange={(e) =>
                        updateFaq(idx, "question", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Answer (Rich Text)</Label>
                    <div className="bg-background">
                      <ReactQuill
                        theme="snow"
                        value={faq.answer}
                        onChange={(val) => updateFaq(idx, "answer", val)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {faqs.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                  No FAQs yet. Click &quot;Add FAQ&quot; to begin.
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Submission Info / Embassy Details ─────────────── */}
        {(category === "Submission Info" || category === "Embassy Details") && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-base">Locations / Offices</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setLocations((p) => [
                    ...p,
                    { name: "", address: "", timings: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add Location
              </Button>
            </div>
            <div className="space-y-3">
              {locations.map((loc, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 p-3 border rounded-md bg-background items-end"
                >
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="e.g. VFS Lagos"
                      value={loc.name}
                      onChange={(e) =>
                        updateLocation(idx, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Address</Label>
                    <Input
                      placeholder="e.g. Lekki Phase 1"
                      value={loc.address}
                      onChange={(e) =>
                        updateLocation(idx, "address", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Timings</Label>
                    <Input
                      placeholder="e.g. 8 AM – 4 PM"
                      value={loc.timings}
                      onChange={(e) =>
                        updateLocation(idx, "timings", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-9 w-9"
                    onClick={() => removeLocation(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {locations.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                  No locations yet. Click &quot;Add Location&quot; to begin.
                </p>
              )}
            </div>

            <div className="grid gap-1.5 pt-2 border-t mt-2">
              <Label className="text-sm font-medium">Additional Notes</Label>
              <div className="bg-background">
                <ReactQuill theme="snow" value={notes} onChange={setNotes} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t">
        <Button
          variant="outline"
          onClick={() => router.push("/visa/information-desk")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="min-w-[130px]"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Save Information"}
        </Button>
      </div>
    </div>
  );
}
