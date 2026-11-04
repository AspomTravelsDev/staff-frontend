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
  Briefcase,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Edit3,
  AlignLeft,
  CheckCircle2,
} from "lucide-react";

const POPULAR_ROLES = [
  "Software Engineer",
  "Accountant",
  "Human Resources Manager",
  "Administrative Officer",
  "Sales & Marketing Executive",
  "Civil Engineer",
  "Nurse / Medical Practitioner",
  "Teacher / Educator",
  "Business Owner / Managing Director",
  "Project Manager",
  "Legal Practitioner / Lawyer",
  "Data Analyst",
  "IT Support Specialist",
  "Bank Operations / Loan Officer",
  "Logistics & Supply Chain Coordinator",
];

const FOCUS_TAGS = [
  { title: "Option 1", badge: "Operations & Technical Focus", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  { title: "Option 2", badge: "Leadership & Team Focus", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
  { title: "Option 3", badge: "Client & Strategy Focus", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  { title: "Option 4", badge: "Compliance & Quality Focus", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  { title: "Option 5", badge: "Project & Performance Focus", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
  { title: "Option 6", badge: "Executive Summary Focus", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800" },
];

interface WorkDutiesGeneratorProps {
  initialRole?: string;
  onSelectDuties?: (duties: string) => void;
}

export function WorkDutiesGenerator({
  initialRole = "Software Engineer",
  onSelectDuties,
}: WorkDutiesGeneratorProps) {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [level, setLevel] = useState<"mid" | "senior" | "executive" | "owner">("mid");

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const activeRoleName = customRoleInput.trim() || selectedRole;

  const handleGenerate = async () => {
    if (!activeRoleName) {
      toast.error("Please select or enter a job role");
      return;
    }

    setLoading(true);
    setCopiedIndex(null);

    try {
      const response = await fetch("/api/visa/sample-duties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRoleName,
          level,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate work duties options");
      }

      const data = await response.json();
      if (data.options && Array.isArray(data.options)) {
        setOptions(data.options);
        toast.success(`Generated 6 paragraph options for ${activeRoleName}`);
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
    toast.success(`Option ${index + 1} copied to clipboard`);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="size-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold">Work Duties Generator (AI Powered)</CardTitle>
              <CardDescription className="text-xs">
                Generate 6 distinct, professional paragraph-style duty options tailored for DS-160, visa applications, and employment letters.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex gap-1 border-primary/30 text-primary">
             AI Generator
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* INPUT CONTROLS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border">
          {/* Select Preset Role */}
          <div className="space-y-1.5 md:col-span-1">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Briefcase className="size-3.5 text-muted-foreground" /> Job Role / Occupation
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(val) => {
                setSelectedRole(val);
                setCustomRoleInput("");
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Select job role" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Job Title Input */}
          <div className="space-y-1.5 md:col-span-1">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Edit3 className="size-3.5 text-muted-foreground" /> Or Type Custom Role
            </Label>
            <Input
              value={customRoleInput}
              onChange={(e) => setCustomRoleInput(e.target.value)}
              placeholder="e.g. Architect, Chef, Marketing Director..."
              className="h-9 text-xs bg-background"
            />
          </div>

          {/* Seniority Level */}
          <div className="space-y-1.5 md:col-span-1">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" /> Seniority Level
            </Label>
            <Select value={level} onValueChange={(val: any) => setLevel(val)}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mid" className="text-xs">Mid-Level / Officer</SelectItem>
                <SelectItem value="senior" className="text-xs">Senior / Lead</SelectItem>
                <SelectItem value="executive" className="text-xs">Manager / Executive</SelectItem>
                <SelectItem value="owner" className="text-xs">Director / Business Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* QUICK PRESET CHIPS */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Quick Select Roles:</Label>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_ROLES.slice(0, 8).map((roleName) => (
              <Badge
                key={roleName}
                variant={selectedRole === roleName && !customRoleInput ? "default" : "secondary"}
                onClick={() => {
                  setSelectedRole(roleName);
                  setCustomRoleInput("");
                }}
                className="cursor-pointer text-[11px] font-medium py-1 px-2.5 hover:bg-primary/80 transition-colors"
              >
                {roleName}
              </Badge>
            ))}
          </div>
        </div>

        {/* GENERATE ACTION BUTTON */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <AlignLeft className="size-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">
              Style: <strong>6 Paragraph Options</strong>
            </span>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 px-6"
          >
            {loading ? <RefreshCw className="size-3.5 animate-spin" /> : null}
            {options.length > 0 ? "Regenerate 6 Options" : "Generate 6 Paragraph Options"}
          </Button>
        </div>

        {/* 6 GENERATED PARAGRAPH OPTIONS DISPLAY */}
        {options.length > 0 && (
          <div className="space-y-4 pt-4 border-t animate-in fade-in-50 duration-300">
            <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs capitalize font-bold">
                  {activeRoleName}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  • 6 Paragraph Options ({level} level)
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Click any option to copy
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((optionText, idx) => {
                const focus = FOCUS_TAGS[idx] || FOCUS_TAGS[0];
                const wordCount = optionText.split(/\s+/).filter(Boolean).length;
                const charCount = optionText.length;
                const isCopied = copiedIndex === idx;

                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-bold ${focus.color}`}
                        >
                          {focus.title} • {focus.badge}
                        </Badge>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {wordCount} words / {charCount} chars
                        </span>
                      </div>

                      <p className="text-xs text-foreground leading-relaxed font-normal bg-muted/20 p-3 rounded-lg border border-muted/40 whitespace-pre-wrap">
                        {optionText}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-muted/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(optionText, idx)}
                        className="h-7 text-xs gap-1.5 font-semibold border-primary/30 text-primary hover:bg-primary/10"
                      >
                        {isCopied ? <CheckCircle2 className="size-3 text-green-500" /> : <Copy className="size-3" />}
                        {isCopied ? "Copied Paragraph" : "Copy Paragraph"}
                      </Button>

                      {onSelectDuties && (
                        <Button
                          size="sm"
                          onClick={() => onSelectDuties(optionText)}
                          className="h-7 text-xs gap-1 font-bold"
                        >
                          Use This Option
                        </Button>
                      )}
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
