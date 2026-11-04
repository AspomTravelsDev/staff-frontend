"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { Plus, Trash2, Loader2, ArrowLeft, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { informationCategoryLabel, informationDesk, initialInformationContent, type InformationCategory, type InformationEntry, type InformationInput, type InformationDeskKind } from "@/lib/information-desk";
import { createBirthServicesFile, createInformationEntry, updateBirthServicesFile, updateInformationEntry } from "@/lib/api/information-desk";
import { toast } from "sonner";

// Dynamically import react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

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
  infoRecord?: InformationEntry | null;
  desk?: InformationDeskKind;
}

export function ManageInfoForm({ infoRecord, desk = "visa" }: Props) {
  const config = informationDesk(desk);
  const categories = config.categories;
  const [initial] = useState(() => initialInformationContent(infoRecord));
  const inFlight = useRef(false);
  const router = useRouter();
  const isEditing = !!infoRecord;

  const [category, setCategory] = useState<InformationCategory>(
    infoRecord?.category ?? categories[0],
  );
  const [country, setCountry] = useState(infoRecord?.country ?? "");
  const [title, setTitle] = useState(infoRecord?.title ?? "");

  const [checklistItems, setChecklistItems] =
    useState<string[]>(initial.checklist);
  const [faqs, setFaqs] = useState<FAQItem[]>(initial.faqs);
  const [locations, setLocations] = useState<LocationItem[]>(initial.locations);
  const [notes, setNotes] = useState(initial.notes);
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (desk === "birth-services" && category === "Files" && !isEditing && !file)
      return "Choose a file to upload.";
    if (category === "Checklist" && !checklistItems.some((i) => i.trim()))
      return "Add at least one checklist item.";
    if (category === "FAQ" && !faqs.some((f) => f.question.trim()))
      return "Add at least one FAQ.";
    if (category === "FAQ" && faqs.some(f => f.question.trim() && !f.answer.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim())) return "Enter an answer for every FAQ.";
    if (
      (category === "Submission Info" || category === "Embassy Details") &&
      !locations.some((l) => l.name.trim())
    )
      return "Add at least one location.";
    return null;
  };

  const handleSubmit = async () => {
    if (inFlight.current) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);
    inFlight.current = true;

    const payload: InformationInput = {
      category,
      country: country.trim() || null,
      title: title.trim(),
      content: buildContent(),
    };

    const formData = new FormData();
    formData.set("title", title.trim());
    if (country.trim()) formData.set("country", country.trim());
    if (file) formData.set("file", file);
    const result = desk === "birth-services" && category === "Files"
      ? isEditing
        ? await updateBirthServicesFile(infoRecord!.id, formData)
        : await createBirthServicesFile(formData)
      : isEditing
        ? await updateInformationEntry(desk, infoRecord!.id, payload)
        : await createInformationEntry(desk, payload);

    setLoading(false);
    inFlight.current = false;

    if (result.success) {
      toast.success(
        `${category} ${isEditing ? "updated" : "created"} successfully`,
      );
      router.push(config.basePath);
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
          aria-label={`Back to ${config.title}`}
          variant="outline"
          size="icon"
          onClick={() => router.push(config.basePath)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            {isEditing ? `Edit ${config.subject} Information` : `Add ${config.subject} Information`}
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
            placeholder={desk === "visa" ? "e.g. UK Tourist Visa Checklist" : category === "Files" ? "e.g. Birth certificate application form" : "e.g. Registration processing times"}
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
          onValueChange={(v) => setCategory(v as InformationCategory)}
        >
          <TabsList style={{ height: "auto" }} className={`grid w-full grid-cols-2 ${desk === "visa" ? "lg:grid-cols-4" : ""}`}>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="h-8">
                {informationCategoryLabel(desk, cat)}
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
                    aria-label={`Checklist item ${idx + 1}`}
                    placeholder={desk === "visa" ? "e.g. Original Passport with 6 months validity" : "Enter a required document or step"}
                    value={item}
                    onChange={(e) => updateChecklistItem(idx, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive"
                    onClick={() => removeChecklistItem(idx)}
                    aria-label={`Remove checklist item ${idx + 1}`}
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
                    aria-label={`Remove FAQ ${idx + 1}`}
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

        {category === "Files" && desk === "birth-services" && (
          <div className="grid gap-3">
            <div>
              <Label htmlFor="birth-services-file" className="text-base">File {isEditing ? "replacement" : "upload"}{!isEditing && <span className="text-destructive"> *</span>}</Label>
              <p className="mt-1 text-sm text-muted-foreground">PDF, Word, Excel, PowerPoint, JPG, or PNG up to 10 MB.</p>
            </div>
            {isEditing && infoRecord?.file && !file && (
              <p className="text-sm text-muted-foreground">Current file: <span className="font-medium text-foreground">{infoRecord.file.name}</span></p>
            )}
            <Input
              id="birth-services-file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Upload className="h-4 w-4" />{file.name}</p>}
          </div>
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
                      placeholder={desk === "visa" ? "e.g. VFS Lagos" : "Service provider or office name"}
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
                    aria-label={`Remove location ${idx + 1}`}
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
          onClick={() => router.push(config.basePath)}
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
