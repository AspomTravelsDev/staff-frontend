"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getClients } from "@/lib/api/crm";
import { createInvoice, updateInvoice, sendInvoiceEmail, type Invoice, type InvoiceItem } from "@/lib/api/invoices";
import { SendEmailDialog } from "./send-email-dialog";
import type { Client } from "@/lib/api/crm-constants";
import { InvoicePreview } from "./invoice-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Download, 
  Loader2, 
  Save, 
  Search, 
  X, 
  Sparkles,
  ChevronDown,
  Mail
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

// Preset Configurations for the Subsidiaries
const PRESETS = {
  aspom: {
    company_name: "Aspom Travel Agency LTD",
    company_email: "info@aspomtravels.com",
    company_website: "https://aspomtravels.com",
    company_phone: "+234 816 654 9711, +234 908 334 5178",
    company_address: "4th Floor Brasas’r Place, 69 Admiralty Way, Lekki Phase 1 100242, Lagos",
    bank_details: "",
    terms_conditions: "All flight ticket bookings are subject to airline rules and availability. Visa application fees are non-refundable once submitted to the embassy.\nRefund processing takes 14-21 working days in line with carrier guidelines.\n\nFor detailed terms of use, please visit https://aspomtravels.com/term-of-use/",
    membership_welcome_text: "WELCOME TO THE ASPOM CLUB!",
  },
  travelatal: {
    company_name: "TRAVELATAL LTD",
    company_email: "info@travelatal.com",
    company_website: "www.travelatal.com",
    company_phone: "",
    company_address: "",
    bank_details: "Sterling Bank\nAcct Name: Travelatal Ltd\nAcct Number: 1029384756",
    terms_conditions: "Visa Fee Payment is subject to change due to the exchange rate. Cancellation before 24hrs - All fees are refunded.\nCancellation after 24hrs - non-refundable. Cancellation due to Visa denial is non-refundable.\nApplication submission is subject to Embassy. Opening Available appointment date is subject to Embassy Opening.\n\nFor detailed terms, please visit https://travelatal.com/terms",
    membership_welcome_text: "WELCOME TO THE TRAVELATAL CLUB!",
  },
  abs: {
    company_name: "ASPOM Birth Services",
    company_email: "info@absbirthservices.com",
    company_website: "",
    company_phone: "+234 903 418 5096",
    company_address: "4th Floor Brasas’r Place, 69 Admiralty Way, Lekki Phase 1, Lagos\nSuite C7, 109 Plaza, Ademola Adetokunbo Crescent, Wuse 2, Abuja.",
    bank_details: "",
    terms_conditions: "All services are subject to agreement terms. For enquiries, please email info@absbirthservices.com.",
    membership_welcome_text: "WELCOME TO THE ABS CLUB!",
  }
};

interface InvoiceWorkspaceProps {
  initialInvoice: Invoice | null;
  clearInvoice: () => void;
  onSaveSuccess?: () => void;
}

export function InvoiceWorkspace({ initialInvoice, clearInvoice, onSaveSuccess }: InvoiceWorkspaceProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Email States
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Subsidiary
  const [subsidiary, setSubsidiary] = useState<keyof typeof PRESETS>("aspom");

  // Company Details
  const [companyName, setCompanyName] = useState(PRESETS.aspom.company_name);
  const [companyEmail, setCompanyEmail] = useState(PRESETS.aspom.company_email);
  const [companyWebsite, setCompanyWebsite] = useState(PRESETS.aspom.company_website);
  const [companyPhone, setCompanyPhone] = useState(PRESETS.aspom.company_phone);
  const [companyAddress, setCompanyAddress] = useState(PRESETS.aspom.company_address);
  const [bankDetails, setBankDetails] = useState(PRESETS.aspom.bank_details);
  const [termsConditions, setTermsConditions] = useState(PRESETS.aspom.terms_conditions);

  // Metadata
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("BANK TRANSFER");
  const [status, setStatus] = useState<"paid" | "unpaid" | "partially_paid">("unpaid");

  // CRM Search
  const [crmClientId, setCrmClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Client Details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Club / Membership
  const [hasMembership, setHasMembership] = useState(true);
  const [membershipWelcomeText, setMembershipWelcomeText] = useState(PRESETS.aspom.membership_welcome_text);
  const [membershipNumber, setMembershipNumber] = useState("");
  const [membershipPoints, setMembershipPoints] = useState("");

  // Financials / Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      date: new Date().toISOString().split("T")[0],
      description: "Local Flight",
      qty: 1,
      rate: 0,
      amount: 0
    }
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);

  // Apply subsidiary presets
  const applyPreset = useCallback((key: keyof typeof PRESETS) => {
    const p = PRESETS[key];
    setCompanyName(p.company_name);
    setCompanyEmail(p.company_email);
    setCompanyWebsite(p.company_website);
    setCompanyPhone(p.company_phone);
    setCompanyAddress(p.company_address);
    setBankDetails(p.bank_details);
    setTermsConditions(p.terms_conditions);
    setMembershipWelcomeText(p.membership_welcome_text);
  }, []);

  // Sync loaded invoice from edit triggers
  useEffect(() => {
    setActiveTab("details");
    if (initialInvoice) {
      setSubsidiary(initialInvoice.subsidiary as keyof typeof PRESETS);
      setCompanyName(initialInvoice.company_name);
      setCompanyEmail(initialInvoice.company_email || "");
      setCompanyWebsite(initialInvoice.company_website || "");
      setCompanyPhone(initialInvoice.company_phone || "");
      setCompanyAddress(initialInvoice.company_address || "");
      setBankDetails(initialInvoice.bank_details || "");
      setTermsConditions(initialInvoice.terms_conditions || "");
      setInvoiceNumber(initialInvoice.invoice_number);
      setIssueDate(initialInvoice.issue_date);
      setDueDate(initialInvoice.due_date);
      setPaymentMethod(initialInvoice.payment_method);
      setStatus(initialInvoice.status);
      setCrmClientId(initialInvoice.crm_client_id);
      setClientName(initialInvoice.client_name);
      setClientEmail(initialInvoice.client_email || "");
      setClientPhone(initialInvoice.client_phone || "");
      setClientAddress(initialInvoice.client_address || "");
      
      if (initialInvoice.membership_number) {
        setHasMembership(true);
        setMembershipNumber(initialInvoice.membership_number);
        setMembershipPoints(initialInvoice.membership_points || "");
        setMembershipWelcomeText(initialInvoice.membership_welcome_text || "");
      } else {
        setHasMembership(false);
        setMembershipNumber("");
        setMembershipPoints("");
      }

      setItems(initialInvoice.items || []);
      setDeposit(Number(initialInvoice.deposit));
    } else {
      // Clear form back to defaults
      setSubsidiary("aspom");
      setCompanyName(PRESETS.aspom.company_name);
      setCompanyEmail(PRESETS.aspom.company_email);
      setCompanyWebsite(PRESETS.aspom.company_website);
      setCompanyPhone(PRESETS.aspom.company_phone);
      setCompanyAddress(PRESETS.aspom.company_address);
      setBankDetails(PRESETS.aspom.bank_details);
      setTermsConditions(PRESETS.aspom.terms_conditions);
      setMembershipWelcomeText(PRESETS.aspom.membership_welcome_text);

      setIssueDate(new Date().toISOString().split("T")[0]);
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
      setPaymentMethod("BANK TRANSFER");
      setStatus("unpaid");

      setCrmClientId(null);
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setClientAddress("");
      setClientSearch("");
      
      setHasMembership(true);
      setMembershipNumber("");
      setMembershipPoints("");
      
      setItems([
        {
          date: new Date().toISOString().split("T")[0],
          description: "Local Flight",
          qty: 1,
          rate: 0,
          amount: 0
        }
      ]);
      setDeposit(0);
      setInvoiceNumber("");
    }
  }, [initialInvoice]);

  // Generate a random invoice number if empty
  useEffect(() => {
    if (!invoiceNumber && !initialInvoice) {
      const date = new Date();
      const month = date.toLocaleString("default", { month: "short" }).toUpperCase();
      const code = Math.floor(100 + Math.random() * 900);
      const year = date.getFullYear();
      setInvoiceNumber(`${month}${code}/${year}`);
    }
  }, [invoiceNumber, initialInvoice]);

  // Financial auto-calculations
  useEffect(() => {
    let sum = 0;
    const computedItems = items.map((item) => {
      const amt = Number(item.qty || 0) * Number(item.rate || 0);
      sum += amt;
      return { ...item, amount: amt };
    });

    setSubtotal(sum);
    const bal = sum - Number(deposit);
    setBalanceDue(bal);

    if (bal <= 0 && sum > 0) {
      setStatus("paid");
    }
  }, [items, deposit]);

  // Fetch all clients in the background on load
  useEffect(() => {
    const loadAllClients = async () => {
      setIsSearching(true);
      try {
        const resp = await getClients({ limit: 100 });
        const items = resp.items || [];
        setAllClients(items);
        setSearchResults(items.slice(0, 10));
      } catch (err) {
        console.error("Failed to prefetch clients:", err);
      } finally {
        setIsSearching(false);
      }
    };
    loadAllClients();
  }, []);

  // Filter clients locally when typing
  useEffect(() => {
    if (!clientSearch.trim()) {
      setSearchResults(allClients.slice(0, 10));
      return;
    }
    const query = clientSearch.toLowerCase();
    const filtered = allClients.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.toLowerCase().includes(query))
    );
    setSearchResults(filtered.slice(0, 10));
  }, [clientSearch, allClients]);

  const handleClientSearchChange = (val: string) => {
    setClientSearch(val);
    setCrmClientId(null);
    setShowDropdown(true);
  };

  const handleSelectClient = (client: Client) => {
    setCrmClientId(client.id);
    setClientName(client.name);
    setClientEmail(client.email || "");
    setClientPhone(client.phone || "");
    setClientSearch(client.name);
    setShowDropdown(false);
    
    if (subsidiary === "travelatal" || subsidiary === "aspom" || subsidiary === "abs") {
      const loyaltyPoints = Math.floor(Math.random() * 30 + 5).toString().padStart(3, "0");
      const memberCode = `ASPLC${Math.floor(100 + Math.random() * 900)}`;
      setMembershipNumber(memberCode);
      setMembershipPoints(loyaltyPoints);
    }
    toast.info(`Filled details for client ${client.name}`);
  };

  // Add Item to breakdown
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        date: new Date().toISOString().split("T")[0],
        description: "",
        qty: 1,
        rate: 0,
        amount: 0
      }
    ]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning("Invoices must have at least one item");
      return;
    }
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Update Item field
  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === "qty" || field === "rate") {
      item.amount = Number(item.qty || 0) * Number(item.rate || 0);
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  // Save invoice details to DB
  const handleSaveToHistory = async () => {
    if (!invoiceNumber.trim()) {
      toast.error("Invoice number is required");
      return;
    }
    if (!clientName.trim()) {
      toast.error("Client name is required");
      return;
    }

    setIsSaving(true);
    try {
      const postData = {
        invoice_number: invoiceNumber,
        subsidiary,
        company_name: companyName,
        company_email: companyEmail || null,
        company_website: companyWebsite || null,
        company_phone: companyPhone || null,
        company_address: companyAddress || null,
        bank_details: bankDetails || null,
        crm_client_id: crmClientId,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        client_address: clientAddress || null,
        issue_date: issueDate,
        due_date: dueDate,
        payment_method: paymentMethod,
        membership_number: hasMembership && membershipNumber ? membershipNumber : null,
        membership_points: hasMembership && membershipPoints ? membershipPoints : null,
        membership_welcome_text: hasMembership && membershipWelcomeText ? membershipWelcomeText : null,
        items,
        subtotal,
        deposit,
        balance_due: balanceDue,
        status,
        terms_conditions: termsConditions || null,
      };

      let response;
      if (initialInvoice && initialInvoice.id) {
        response = await updateInvoice(initialInvoice.id, postData);
      } else {
        response = await createInvoice(postData);
      }

      if (response.success) {
        toast.success(`Invoice ${invoiceNumber} saved successfully!`);
        onSaveSuccess?.();
      } else {
        toast.error(response.error || "Failed to save invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save invoice record");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Base64 PDF in the background
  const generatePdfBase64 = async (): Promise<string | null> => {
    const element = document.getElementById("invoice-document");
    if (!element) {
      toast.error("Invoice document element not found");
      return null;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const dataUrl = await toJpeg(element, {
        quality: 0.98,
        backgroundColor: "#ffffff",
        style: {
          borderRadius: "0",
          boxShadow: "none",
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [element.offsetWidth, element.offsetHeight],
      });
      pdf.addImage(dataUrl, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);
      return pdf.output("datauristring");
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Failed to generate PDF for attachment");
      return null;
    }
  };

  const handleSendEmailClick = () => {
    if (!initialInvoice || !initialInvoice.id) {
      toast.error("Please save the invoice to history first before emailing");
      return;
    }
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async (recipient: string, customNote: string) => {
    if (!initialInvoice || !initialInvoice.id) return;

    setIsSendingEmail(true);
    try {
      const pdfBase64 = await generatePdfBase64();
      if (!pdfBase64) {
        setIsSendingEmail(false);
        return;
      }

      const response = await sendInvoiceEmail(initialInvoice.id, {
        pdfBase64,
        to: recipient,
        customNote,
      });

      if (response.success) {
        toast.success(`Invoice sent successfully to ${recipient}!`);
        setEmailDialogOpen(false);
        onSaveSuccess?.();
      } else {
        toast.error(response.error || "Failed to send invoice email");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send invoice email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Export PDF or JPG
  const handleExport = async (format: "jpg" | "pdf") => {
    const element = document.getElementById("invoice-document");
    if (!element) {
      toast.error("Invoice document element not found");
      return;
    }

    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const dataUrl = await toJpeg(element, {
        quality: 0.98,
        backgroundColor: "#ffffff",
        style: {
          borderRadius: "0",
          boxShadow: "none",
        },
      });

      const name = invoiceNumber.replace("/", "_");

      if (format === "jpg") {
        const link = document.createElement("a");
        link.download = `Invoice_${name}.jpg`;
        link.href = dataUrl;
        link.click();
        toast.success("Invoice exported as JPG successfully");
      } else {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [element.offsetWidth, element.offsetHeight],
        });
        pdf.addImage(dataUrl, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);
        pdf.save(`Invoice_${name}.pdf`);
        toast.success("Invoice exported as PDF successfully");
      }
    } catch (err) {
      console.error("Export failed", err);
      toast.error(`Failed to export invoice as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
      {/* Top Action Bar inside the Sheet */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-3.5 rounded-xl border gap-4">
        <TabsList className="bg-muted/60 p-1 rounded-lg inline-flex w-full sm:w-auto h-auto gap-1">
          <TabsTrigger value="details" className="gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer">
            Details Form
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer">
            Document Preview
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Save to History */}
          <Button
            variant="outline"
            disabled={isSaving || isExporting || isSendingEmail}
            onClick={handleSaveToHistory}
            className="bg-background transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer h-9 text-xs"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save History"}
          </Button>

          {/* Send via Email (Temporarily disabled pending SMTP configuration) */}
          <Button
            variant="outline"
            disabled={true}
            title="Awaiting SMTP configuration"
            className="bg-background opacity-65 flex items-center gap-1.5 cursor-not-allowed h-9 text-xs"
          >
            <Mail className="h-4 w-4 text-slate-400" />
            Send Email
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-1 cursor-pointer h-9 text-xs"
                disabled={isExporting || isSaving}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {isExporting ? "Exporting..." : "Export Invoice"}
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => handleExport("pdf")} className="cursor-pointer text-xs">
                📄 Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("jpg")} className="cursor-pointer text-xs">
                🖼️ Export as JPG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab: Form Details */}
      <TabsContent value="details" className="space-y-6 pt-1 outline-none mt-0 pb-12">
        {/* Subsidiary Preset Selector */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">
              Subsidiary & Branding Presets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Select Subsidiary Brand</Label>
              <Select
                value={subsidiary}
                onValueChange={(val) => {
                  const key = val as keyof typeof PRESETS;
                  setSubsidiary(key);
                  applyPreset(key);
                  toast.success(`Applied preset for ${PRESETS[key].company_name}`);
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aspom">Aspom Travel Agency LTD</SelectItem>
                  <SelectItem value="travelatal">Travelatal Ltd</SelectItem>
                  <SelectItem value="abs">ASPOM Birth Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom company branding override parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Website</Label>
                <Input
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Email Address</Label>
                <Input
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Phone</Label>
                <Input
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Office Address</Label>
                <Textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="text-xs h-16 min-h-16"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Metadata */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. JUL021/2026"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Payment Method</Label>
              <Input
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="e.g. BANK TRANSFER"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Issue Date</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* CRM Customer Autocomplete */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">
              Client & Bill To Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search CRM client block */}
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Sparkles className="size-3.5 text-primary animate-pulse" />
                Prefetch from CRM Client Database
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type client name to lookup..."
                  value={clientSearch}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  className="pl-9 pr-8"
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Autocomplete dropdown overlay list */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-popover text-popover-foreground border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1 divide-y divide-border">
                  {searchResults.map((client) => (
                    <div
                      key={client.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectClient(client);
                      }}
                      className="px-4 py-2 text-xs hover:bg-muted cursor-pointer flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-slate-800">{client.name}</span>
                      {client.email && (
                        <span className="text-[10px] text-muted-foreground">{client.email}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Editable Bill To Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-bold text-slate-600">Client Name</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Full name of client"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Client Email</Label>
                <Input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. client@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Client Phone</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. +234..."
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-bold text-slate-600">Client Address</Label>
                <Textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Client billing address"
                  className="h-16 min-h-16"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice items dynamic builder table */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">
              Invoice Items Breakdown
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs gap-1 cursor-pointer h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Add Row
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 pb-4 border-b last:border-b-0 items-end">
                  <div className="col-span-3 space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-500">Date</Label>
                    <Input
                      type="date"
                      value={item.date}
                      onChange={(e) => handleUpdateItem(index, "date", e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-500">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleUpdateItem(index, "description", e.target.value)}
                      placeholder="e.g. Flight Booking"
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-500 text-center">Qty</Label>
                    <Input
                      type="number"
                      value={item.qty}
                      min="1"
                      onChange={(e) => handleUpdateItem(index, "qty", parseInt(e.target.value) || 1)}
                      className="text-xs h-9 text-center tabular-nums"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-500 text-right">Rate</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      min="0"
                      onChange={(e) => handleUpdateItem(index, "rate", parseFloat(e.target.value) || 0)}
                      className="text-xs h-9 text-right tabular-nums"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Membership Info */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">
              Travel Club / Loyalty Program
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="membership-toggle" className="text-xs cursor-pointer select-none font-medium">
                Include in Invoice
              </Label>
              <input
                id="membership-toggle"
                type="checkbox"
                checked={hasMembership}
                onChange={(e) => setHasMembership(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
            </div>
          </CardHeader>
          {hasMembership && (
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
              <div className="space-y-1 md:col-span-3">
                <Label className="text-xs font-bold text-slate-600">Welcome Text</Label>
                <Input
                  value={membershipWelcomeText}
                  onChange={(e) => setMembershipWelcomeText(e.target.value)}
                  placeholder="e.g. WELCOME TO THE TRAVELATAL CLUB!"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Member Number</Label>
                <Input
                  value={membershipNumber}
                  onChange={(e) => setMembershipNumber(e.target.value)}
                  placeholder="e.g. ASPLC843"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Loyalty Points</Label>
                <Input
                  value={membershipPoints}
                  onChange={(e) => setMembershipPoints(e.target.value)}
                  placeholder="e.g. 010"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Totals, Payments and Bank details config */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">
              Financial Status & Bank Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Deposit Paid (NGN)</Label>
                <Input
                  type="number"
                  value={deposit}
                  min="0"
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  className="tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Invoice Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as any)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 text-right flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold text-slate-400">Balance Due</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  NGN {balanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Bank Account Details (Preset)</Label>
                <Textarea
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="text-xs h-16 min-h-16 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Terms & Conditions</Label>
                <Textarea
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  className="text-xs h-24 min-h-24 leading-relaxed"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab: Preview Sheet */}
      <div className={activeTab === "preview" ? "space-y-6 pt-1 outline-none mt-0 flex justify-center pb-12 animate-in fade-in" : "absolute -left-[9999px] -top-[9999px] pointer-events-none"}>
        <InvoicePreview
          invoice={{
            invoice_number: invoiceNumber,
            subsidiary,
            company_name: companyName,
            company_email: companyEmail || null,
            company_website: companyWebsite || null,
            company_phone: companyPhone || null,
            company_address: companyAddress || null,
            bank_details: bankDetails || null,
            crm_client_id: crmClientId,
            client_name: clientName,
            client_email: clientEmail || null,
            client_phone: clientPhone || null,
            client_address: clientAddress || null,
            issue_date: issueDate,
            due_date: dueDate,
            payment_method: paymentMethod,
            membership_number: hasMembership && membershipNumber ? membershipNumber : null,
            membership_points: hasMembership && membershipPoints ? membershipPoints : null,
            membership_welcome_text: hasMembership && membershipWelcomeText ? membershipWelcomeText : null,
            items,
            subtotal,
            deposit,
            balance_due: balanceDue,
            status,
            terms_conditions: termsConditions || null,
          }}
          ref={previewRef}
        />
      </div>

      <SendEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        defaultRecipientEmail={clientEmail}
        subsidiaryEmail={PRESETS[subsidiary]?.company_email || ""}
        subsidiaryName={PRESETS[subsidiary]?.company_name || ""}
        onSend={handleSendEmail}
        isSending={isSendingEmail}
      />
    </Tabs>
  );
}
