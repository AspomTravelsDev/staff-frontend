"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Download,
  History,
  Banknote,
  CalendarDays,
  CreditCard,
  Eye,
  AlertTriangle,
  X,
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type PayrollEntry } from "@/lib/api/payroll";
import { PayslipDocument } from "./payslip-document";
import { PayslipContent } from "./payslip-content";
import { StatsCard } from "@/components/stats-card";

interface PayrollHistoryProps {
  initialEntries: PayrollEntry[];
  user: any;
}

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

const formatPrice = (amount: number) => currencyFormatter.format(amount);

export function PayrollHistory({ initialEntries, user }: PayrollHistoryProps) {
  const [entries] = useState<PayrollEntry[]>(initialEntries);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<PayrollEntry | null>(null);

  const isEntryDraft = (entry: PayrollEntry) => {
    const runStatus = entry.run?.status || (entry as any).run_status;
    return runStatus !== "closed";
  };

  const hasDraftEntries = entries.some(isEntryDraft);
  const isLatestDraft = entries[0] ? isEntryDraft(entries[0]) : false;

  const stats = {
    lastNet: entries[0]?.net_amount || 0,
    totalYear: entries.reduce((acc, curr) => acc + Number(curr.net_amount), 0),
    count: entries.length,
  };

  const handleDirectDownload = async (entry: PayrollEntry, formatType: "jpg" | "pdf") => {
    setSelectedEntry(entry);
    const draft = isEntryDraft(entry);
    
    const toastId = toast.loading(
      `Preparing your ${draft ? "draft " : ""}payslip as ${formatType.toUpperCase()}...`
    );
    
    try {
      await new Promise(r => setTimeout(r, 500));
      const element = document.querySelector("#payslip-download-target #payslip-document") as HTMLElement;
      
      if (!element) {
        throw new Error("Download element not found");
      }

      const { toJpeg } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const dataUrl = await toJpeg(element, {
        quality: 1,
        backgroundColor: "#ffffff",
        style: {
          overflow: 'hidden',
          scrollbarWidth: 'none'
        }
      });

      const draftSuffix = draft ? "_DRAFT" : "";
      const monthName = format(new Date(entry.run?.payroll_month + "-01"), "MMM_yyyy");

      if (formatType === "jpg") {
        const link = document.createElement("a");
        link.download = `Payslip_${monthName}${draftSuffix}.jpg`;
        link.href = dataUrl;
        link.click();
      } else {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [element.offsetWidth, element.offsetHeight],
        });
        pdf.addImage(dataUrl, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);
        pdf.save(`Payslip_${monthName}${draftSuffix}.pdf`);
      }

      toast.success(
        `Payslip ${draft ? "(Draft) " : ""}downloaded successfully!`,
        { id: toastId }
      );
    } catch (err) {
      console.error(err);
      toast.error(`Failed to download payslip as ${formatType.toUpperCase()}`, { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      <div id="payslip-download-target" className="fixed -left-[2000px] top-0 opacity-0 pointer-events-none">
        {selectedEntry && (
          <div style={{ width: '800px' }}>
            <PayslipDocument entry={selectedEntry} user={user} />
          </div>
        )}
      </div>

      {/* Responsive Preview Dialog */}
      <Dialog open={!!viewingEntry} onOpenChange={(open) => !open && setViewingEntry(null)}>
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden gap-0 rounded-2xl border bg-background shadow-2xl"
        >
          <DialogTitle className="sr-only">Payslip Statement Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Preview monthly payslip statement and download as PDF or JPG
          </DialogDescription>

          {/* Clean Dialog Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b bg-muted/20 shrink-0 gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                  Payslip Statement
                </h2>
                {viewingEntry && isEntryDraft(viewingEntry) && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-300 font-bold text-[10px] px-2 py-0.5"
                  >
                    Draft
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {viewingEntry?.run?.payroll_month
                  ? format(new Date(viewingEntry.run.payroll_month + "-01"), "MMMM yyyy")
                  : "Monthly Statement"}
              </p>
            </div>

            {viewingEntry && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold px-2.5 sm:px-3 shadow-2xs"
                  onClick={() => handleDirectDownload(viewingEntry, "pdf")}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold px-2.5 sm:px-3 shadow-2xs"
                  onClick={() => handleDirectDownload(viewingEntry, "jpg")}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>JPG</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg ml-0.5"
                  onClick={() => setViewingEntry(null)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            )}
          </div>

          {/* Dialog Scrollable Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-6 bg-slate-100/60">
            <div className="max-w-3xl mx-auto w-full">
              {viewingEntry && (
                <PayslipContent
                  entry={viewingEntry}
                  user={user || viewingEntry.user}
                  fallbackMonth={viewingEntry.run?.payroll_month}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Latest Net Pay"
          icon={Banknote}
          value={formatPrice(stats.lastNet)}
          description={`Period: ${entries[0]?.run?.payroll_month ? format(new Date(entries[0].run.payroll_month + "-01"), "MMMM yyyy") : 'Latest'}${isLatestDraft ? ' • (Draft - In Review)' : ''}`}
          variant="dashboard"
          cardColor={isLatestDraft ? "yellow" : "green"}
        />

        <StatsCard
          title="Total Year-to-Date"
          icon={CalendarDays}
          value={formatPrice(stats.totalYear)}
          description={`${stats.count} Total Payslips`}
          variant="dashboard"
          cardColor="blue"
        />

        <StatsCard
          title="Bank Details"
          icon={CreditCard}
          value="Direct Deposit"
          description="Salary Account Verified"
          variant="dashboard"
          cardColor="purple"
        />
      </div>

      {/* History Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex flex-row items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Payroll History</h2>
              <p className="text-xs text-muted-foreground">Click any row or statement to preview details</p>
            </div>
          </div>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider pl-6">Period</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Gross Salary</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Tax (PAYE)</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Deductions</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Net Pay</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No payroll history found.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const draft = isEntryDraft(entry);
                  return (
                    <TableRow
                      key={entry.id}
                      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setViewingEntry(entry)}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {format(new Date(entry.run?.payroll_month + "-01"), "MMMM")}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                            {format(new Date(entry.run?.payroll_month + "-01"), "yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-600 tabular-nums">
                        {formatPrice(entry.gross_salary).replace("NGN", "")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-rose-600/80 tabular-nums">
                        ({formatPrice(entry.tax_amount).replace("NGN", "")})
                      </TableCell>
                      <TableCell className="text-right font-semibold text-rose-600/80 tabular-nums">
                        ({formatPrice(entry.deduction_amount).replace("NGN", "")})
                      </TableCell>
                      <TableCell className="text-right font-black text-primary tabular-nums text-base">
                        {formatPrice(entry.net_amount).replace("NGN", "")}
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {draft ? (
                          <Badge 
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-300 font-bold text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Draft
                          </Badge>
                        ) : (
                          <Badge 
                            variant="default"
                            className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-bold text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Approved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Preview Payslip"
                            onClick={() => setViewingEntry(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                title="Download Payslip"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => handleDirectDownload(entry, "pdf")} className="cursor-pointer">
                                📄 PDF Format {draft && "(Draft)"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDirectDownload(entry, "jpg")} className="cursor-pointer">
                                🖼️ JPG Format {draft && "(Draft)"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  );
}
