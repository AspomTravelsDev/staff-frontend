"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Download,
  History,
  Banknote,
  CalendarDays,
  CreditCard,
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
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {  type PayrollEntry } from "@/lib/api/payroll";
import { PayslipDocument } from "./payslip-document";
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

  const stats = {
    lastNet: entries[0]?.net_amount || 0,
    totalYear: entries.reduce((acc, curr) => acc + Number(curr.net_amount), 0),
    count: entries.length
  };

  const handleDirectDownload = async (entry: PayrollEntry, formatType: "jpg" | "pdf") => {
    setSelectedEntry(entry);
    
    const toastId = toast.loading(`Preparing your payslip as ${formatType.toUpperCase()}...`);
    
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

      const monthName = format(new Date(entry.run?.payroll_month + "-01"), "MMM_yyyy");

      if (formatType === "jpg") {
        const link = document.createElement("a");
        link.download = `Payslip_${monthName}.jpg`;
        link.href = dataUrl;
        link.click();
      } else {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [element.offsetWidth, element.offsetHeight],
        });
        pdf.addImage(dataUrl, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);
        pdf.save(`Payslip_${monthName}.pdf`);
      }

      toast.success("Payslip downloaded successfully!", { id: toastId });
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Latest Net Pay"
          icon={Banknote}
          value={formatPrice(stats.lastNet)}
          description={`Period: ${entries[0]?.run?.payroll_month ? format(new Date(entries[0].run.payroll_month + "-01"), "MMMM yyyy") : 'Latest'}`}
          variant="dashboard"
          cardColor="green"
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
            <h2 className="text-lg font-bold tracking-tight text-foreground">Payroll History</h2>
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
                entries.map((entry) => (
                  <TableRow key={entry.id} className="group hover:bg-slate-50/80 transition-colors">
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
                    <TableCell className="text-center">
                      <Badge 
                        variant={entry.status === 'approved' ? 'default' : 'secondary'}
                        className={entry.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none px-3' : ''}
                      >
                        {entry.status === 'approved' ? 'Approved' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => handleDirectDownload(entry, "pdf")} className="cursor-pointer">
                              📄 PDF Format
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDirectDownload(entry, "jpg")} className="cursor-pointer">
                              🖼️ JPG Format
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  );
}
