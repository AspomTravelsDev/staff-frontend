"use client";

import { useState } from "react";
import { checkAdCompliance, ComplianceReport } from "@/lib/api/advertising-compliance";
import { toast } from "sonner";
import {
  ShieldCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  FileText,
  Eye,
  Loader2,
  RefreshCw,
  Info,
  Type,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdvertisingCompliancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !caption.trim()) {
      toast.error("Please upload a graphic design or enter ad copy caption.");
      return;
    }

    setLoading(true);
    setReport(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("graphic", file);
      }
      if (caption.trim()) {
        formData.append("caption", caption);
      }

      const result = await checkAdCompliance(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setReport(result.data);
      toast.success("Compliance audit completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete compliance audit.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Reworded copy copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const uppercaseStatus = status.toUpperCase();
    if (uppercaseStatus === "COMPLIANT") {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs gap-1 font-semibold">
          <CheckCircle2 className="size-3.5" /> Fully Compliant
        </Badge>
      );
    }
    if (uppercaseStatus === "NEEDS_REVISION") {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 text-xs gap-1 font-semibold">
          <AlertTriangle className="size-3.5" /> Needs Revision
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 px-3 py-1 text-xs gap-1 font-semibold">
        <XCircle className="size-3.5" /> High Risk Claim Detected
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 65) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-red-500 border-red-500/30 bg-red-500/10";
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Consistent Admin Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
           Social Media Department Tools
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AI Advertising & Graphic Compliance Checker</h1>
        <p className="text-muted-foreground">
          Audit promotional graphics, flyers, and ad captions for regulatory compliance, misleading/unclear claims, misinformation, false guarantees, and missing disclaimers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Upload Media & Copy
              </CardTitle>
              <CardDescription>
                Upload your social media banner/flyer graphic or paste accompanying ad copy text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="space-y-4">
                {/* Graphic File Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Graphic Design Image (Optional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img
                          src={previewUrl}
                          alt="Ad Graphic Preview"
                          className="max-h-48 mx-auto rounded border object-contain"
                        />
                        <p className="text-xs text-muted-foreground truncate">{file?.name}</p>
                        <p className="text-[10px] text-blue-500 font-medium">Click or drag to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2 py-4">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                          <Upload className="size-5" />
                        </div>
                        <p className="text-xs font-medium">Drop graphic here or click to browse</p>
                        <p className="text-[10px] text-muted-foreground">Supports PNG, JPG, WEBP (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad Caption Textarea */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Ad Caption / Copy (Optional)</Label>
                  <Textarea
                    placeholder="Paste your promotional post caption or headline copy here..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    className="text-xs"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full gap-2 font-semibold">
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Auditing Compliance...
                    </>
                  ) : (
                    <>
                       Audit Advertising Compliance
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Audit Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {!report && !loading && (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[380px] border-dashed">
              <div className="size-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-base font-semibold">Ready for Compliance Audit</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Upload a marketing graphic or enter ad copy on the left to scan for regulatory compliance, unclear claims, misinformation, absolute guarantees, and missing disclaimers.
              </p>
            </Card>
          )}

          {loading && (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[380px]">
              <Loader2 className="size-10 text-primary animate-spin mb-4" />
              <h3 className="text-base font-semibold">Scanning Marketing Graphic & Text...</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Gemini Vision AI is extracting text, checking advertising regulations, catching unclear claims, detecting misinformation, and generating compliant rewordings.
              </p>
            </Card>
          )}

          {report && (
            <div className="space-y-6">
              {/* Score & Status Summary Banner */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`size-16 rounded-2xl border-2 flex flex-col items-center justify-center font-bold ${getScoreColor(report.overall_score)}`}>
                        <span className="text-xl leading-none">{report.overall_score}%</span>
                        <span className="text-[9px] uppercase font-semibold mt-0.5 opacity-80">Score</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">Compliance Status</h3>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md">
                          {report.summary}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setReport(null)} className="gap-1.5 text-xs">
                      <RefreshCw className="size-3.5" /> Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Breakdown Tabs */}
              <Tabs defaultValue="claims" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="claims" className="text-xs gap-1">
                    <ShieldAlert className="size-3.5 text-red-500" />
                    Claims ({report.flagged_claims.length})
                  </TabsTrigger>
                  <TabsTrigger value="grammar" className="text-xs gap-1">
                    <Type className="size-3.5 text-blue-500" />
                    Grammar ({report.grammar_and_spelling.length})
                  </TabsTrigger>
                  <TabsTrigger value="visual" className="text-xs gap-1">
                    <Eye className="size-3.5 text-purple-500" />
                    Visual Quality
                  </TabsTrigger>
                  <TabsTrigger value="ocr" className="text-xs gap-1">
                    <FileText className="size-3.5 text-gray-500" />
                    Extracted Text
                  </TabsTrigger>
                </TabsList>

                {/* Flagged Claims Tab */}
                <TabsContent value="claims" className="space-y-3 pt-3">
                  {report.flagged_claims.length === 0 ? (
                    <Card className="p-6 text-center">
                      <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                      <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        No Misleading or Non-Compliant Claims Detected!
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your ad copy and graphic statements comply with travel advertising and legal guidelines.
                      </p>
                    </Card>
                  ) : (
                    report.flagged_claims.map((claim, idx) => (
                      <Card key={idx} className="border-l-4 border-l-red-500 overflow-hidden">
                        <CardHeader className="p-3 bg-red-500/5 border-b pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="destructive" className="text-[10px]">
                                {claim.risk_level} RISK
                              </Badge>
                              {claim.category && (
                                <Badge variant="outline" className="text-[10px] bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300 font-mono">
                                  {claim.category.replace(/_/g, " ")}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">Issue #{idx + 1}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 md:p-4 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original Text</p>
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 mt-1">
                              "{claim.original_text}"
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Info className="size-3 text-amber-500" /> Regulatory Risk / Reason
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{claim.reason}</p>
                          </div>

                          <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                 Compliant Rewording Recommendation
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] gap-1 px-2 border-emerald-500/30 hover:bg-emerald-500/10"
                                onClick={() => handleCopyText(claim.suggested_rewording, idx)}
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="size-3 text-emerald-500" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" /> Copy Alternative
                                  </>
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-foreground font-medium whitespace-pre-wrap">
                              "{claim.suggested_rewording}"
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Grammar Tab */}
                <TabsContent value="grammar" className="space-y-3 pt-3">
                  {report.grammar_and_spelling.length === 0 ? (
                    <Card className="p-6 text-center">
                      <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                      <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        No Spelling or Grammar Issues Found!
                      </h4>
                    </Card>
                  ) : (
                    report.grammar_and_spelling.map((g, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] mb-1">
                              {g.error_type}
                            </Badge>
                            <p className="text-xs line-through text-red-500">{g.original}</p>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{g.corrected}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Visual Quality Tab */}
                <TabsContent value="visual" className="space-y-3 pt-3">
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-semibold">Visual Legibility Score</span>
                      <Badge variant="outline" className="text-xs font-bold">
                        {report.visual_quality.score} / 100
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Readability Assessment</p>
                      <p className="text-xs text-foreground mt-0.5">{report.visual_quality.readability_feedback}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Background Contrast & Colors</p>
                      <p className="text-xs text-foreground mt-0.5">{report.visual_quality.contrast_feedback}</p>
                    </div>
                  </Card>
                </TabsContent>

                {/* OCR Text Tab */}
                <TabsContent value="ocr" className="space-y-3 pt-3">
                  <Card className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Text Extracted From Image & Caption
                    </p>
                    <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-3 rounded border text-muted-foreground max-h-60 overflow-y-auto">
                      {report.detected_text || "No text detected."}
                    </pre>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
