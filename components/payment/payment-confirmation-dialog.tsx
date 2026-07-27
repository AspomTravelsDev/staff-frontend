"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, User, UserPlus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileUpload, type UploadedFile } from "@/components/ui/file-upload";

import { getClients } from "@/lib/api/crm";
import {
  PAYMENT_PRODUCTS,
  PAYMENT_BANKS,
} from "./payment-confirmation-constants";
import type { Client } from "@/lib/api/crm-constants";
import type { OutstandingPayment } from "@/lib/api/payment-confirmations";

// We use FormData for multipart upload with files
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PaymentConfirmationDialogProps {
  outstandingPayments?: OutstandingPayment[];
}

export function PaymentConfirmationDialog({
  outstandingPayments = [],
}: PaymentConfirmationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client selection mode
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [clientSearch, setClientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // New client fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientDob, setClientDob] = useState("");

  // Payment fields
  const [payerName, setPayerName] = useState("");
  const [product, setProduct] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [amountExpected, setAmountExpected] = useState("");
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [outstandingPaymentId, setOutstandingPaymentId] = useState("");

  // Files
  const [datapageFiles, setDatapageFiles] = useState<UploadedFile[]>([]);
  const [proofFiles, setProofFiles] = useState<UploadedFile[]>([]);
  const [datapageRawFile, setDatapageRawFile] = useState<File | null>(null);
  const [proofRawFile, setProofRawFile] = useState<File | null>(null);

  // Trigger search when input changes, with debounce and race-condition safety
  useEffect(() => {
    if (!clientSearch.trim()) {
      setSearchResults([]);
      return;
    }

    let active = true;

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await getClients({ search: clientSearch, limit: 10, lookup: true });
        if (active) {
          setSearchResults(resp.items ?? []);
        }
      } catch (err) {
        if (active) {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 350); // 350ms debounce delay

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [clientSearch]);

  const getClientDob = (client: Client): string => {
    const clientWithAltDob = client as Client & {
      date_of_birth?: string | null;
      dob?: string | null;
    };

    return (
      client.dateOfBirth ||
      clientWithAltDob.date_of_birth ||
      clientWithAltDob.dob ||
      ""
    );
  };

  const handleClientSearchChange = (val: string) => {
    setClientSearch(val);
    setSelectedClient(null);
    setShowDropdown(true);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowDropdown(false);
    // Auto-populate client fields
    const parts = client.name.split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setClientEmail(client.email || "");
    setClientPhone(client.phone || "");
    setClientDob(getClientDob(client));
  };

  const handleOutstandingPaymentChange = (value: string) => {
    const nextOutstandingId = value === "__none__" ? "" : value;
    setOutstandingPaymentId(nextOutstandingId);

    if (!nextOutstandingId) {
      return;
    }

    const selectedOutstanding = pendingOutstanding.find(
      (item) => item.id === nextOutstandingId,
    );

    if (!selectedOutstanding?.client) {
      return;
    }

    setClientMode("existing");
    handleSelectClient(selectedOutstanding.client);

    const originalProduct = selectedOutstanding.original_confirmation?.product;
    const fallbackProduct = selectedOutstanding.client.service;
    const originalAmountBilled =
      selectedOutstanding.original_confirmation?.amount_expected;

    setProduct(originalProduct || fallbackProduct || "");
    if (selectedOutstanding.original_confirmation?.service_description) {
      setServiceDescription(
        selectedOutstanding.original_confirmation.service_description,
      );
    }
    setAmountExpected(
      String(originalAmountBilled ?? selectedOutstanding.total_expected_amount),
    );
  };

  function resetForm() {
    setClientMode("existing");
    setClientSearch("");
    setSelectedClient(null);
    setSearchResults([]);
    setFirstName("");
    setLastName("");
    setClientEmail("");
    setClientPhone("");
    setClientDob("");
    setPayerName("");
    setProduct("");
    setServiceDescription("");
    setAmountExpected("");
    setDiscount("");
    setAmountPaid("");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("");
    setOutstandingPaymentId("");
    setDatapageFiles([]);
    setProofFiles([]);
    setDatapageRawFile(null);
    setProofRawFile(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (clientMode === "existing" && !selectedClient) {
      toast.error("Please select or search for an existing client.");
      return;
    }

    const expected = Number(amountExpected);
    const disc = Number(discount || 0);
    if (disc > expected) {
      toast.error("Discount cannot be greater than the amount expected.");
      return;
    }

    if (!outstandingPaymentId && !datapageRawFile) {
      toast.error("Please upload the client's DataPage.");
      return;
    }

    if (!proofRawFile) {
      toast.error("Please upload the Proof of Payment.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build form data for multipart upload
      const formData = new FormData();

      if (clientMode === "existing" && selectedClient) {
        formData.append("client_id", selectedClient.id);
      } else {
        formData.append("client_first_name", firstName);
        formData.append("client_last_name", lastName);
        if (clientEmail) formData.append("client_email", clientEmail);
        formData.append("client_phone", clientPhone);
        if (clientDob) formData.append("client_dob", clientDob);
      }

      formData.append("payer_name", payerName);
      formData.append("product", product);
      if (serviceDescription)
        formData.append("service_description", serviceDescription);
      formData.append("amount_expected", amountExpected);
      formData.append("discount", discount || "0");
      formData.append("amount_paid", amountPaid);
      formData.append("payment_date", paymentDate);
      formData.append("payment_method", paymentMethod);
      if (outstandingPaymentId)
        formData.append("outstanding_payment_id", outstandingPaymentId);

      // Append files
      if (datapageRawFile) {
        formData.append("datapage", datapageRawFile);
      }
      if (proofRawFile) {
        formData.append("proof_of_payment", proofRawFile);
      }

      const { createPaymentConfirmationAction } =
        await import("@/lib/actions/payment-confirmations");
      const result = await createPaymentConfirmationAction(formData);

      if (!result.success) {
        throw new Error(result.error || "Submission failed");
      }

      toast.success("Payment confirmation submitted!");
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payment confirmation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const pendingOutstanding = outstandingPayments.filter(
    (op) => op.status === "pending",
  );
  const selectedOutstanding = pendingOutstanding.find(
    (op) => op.id === outstandingPaymentId,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Payment Confirmation
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Confirmation</DialogTitle>
          <DialogDescription>
            Submit a new payment confirmation for account department review.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Link to Outstanding Payment (installment) */}
          {pendingOutstanding.length > 0 && (
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <Label htmlFor="pc-outstanding" className="text-sm font-medium">
                Link to Outstanding Payment
              </Label>
              <Select
                value={outstandingPaymentId || "__none__"}
                onValueChange={handleOutstandingPaymentChange}
              >
                <SelectTrigger id="pc-outstanding">
                  <SelectValue placeholder="None - this is a fresh payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None - fresh payment</SelectItem>
                  {pendingOutstanding.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.client?.name || "Unknown client"} - Balance: N
                      {Number(op.balance).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting an outstanding fee auto-fills the client details
                below.
              </p>

              {selectedOutstanding && (
                <div className="space-y-1 rounded-md border bg-background p-2 text-xs text-muted-foreground">
                  <p>
                    Product:{" "}
                    {selectedOutstanding.original_confirmation?.product ||
                      selectedOutstanding.client?.service ||
                      "-"}
                  </p>
                  <p>
                    Original amount billed: N
                    {Number(
                      selectedOutstanding.original_confirmation
                        ?.amount_expected ??
                        selectedOutstanding.total_expected_amount,
                    ).toLocaleString()}
                  </p>
                  <p>
                    Amount already paid: N
                    {Number(
                      selectedOutstanding.total_paid_amount,
                    ).toLocaleString()}
                  </p>
                  <p>
                    Current balance: N
                    {Number(selectedOutstanding.balance).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Client Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Client Information
              </h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Client Mode Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={clientMode === "existing" ? "default" : "outline"}
                onClick={() => setClientMode("existing")}
                className="gap-1.5"
              >
                <User className="h-3.5 w-3.5" />
                Existing Client
              </Button>
              <Button
                type="button"
                size="sm"
                variant={clientMode === "new" ? "default" : "outline"}
                onClick={() => setClientMode("new")}
                className="gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                New Client
              </Button>
            </div>

            {clientMode === "existing" && (
              <div className="space-y-2 relative">
                <Label>Search Existing Client *</Label>
                <Input
                  placeholder="Type client name, email or phone..."
                  value={clientSearch}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  onFocus={() => clientSearch && setShowDropdown(true)}
                  autoComplete="off"
                />
                {showDropdown && (searchResults.length > 0 || isSearching) && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
                    {isSearching ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : (
                      searchResults.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex flex-col"
                          onClick={() => handleSelectClient(client)}
                        >
                          <span className="font-medium">{client.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {client.email || client.phone}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedClient && (
                  <div className="p-2 rounded-md bg-primary/5 border text-xs text-muted-foreground">
                    ✓ Selected: <strong>{selectedClient.name}</strong>
                    {selectedClient.email ? ` · ${selectedClient.email}` : ""}
                    {selectedClient.phone ? ` · ${selectedClient.phone}` : ""}
                  </div>
                )}
              </div>
            )}

            {/* Client fields — auto-populated for existing, manual for new */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-first-name">First Name *</Label>
                <Input
                  id="pc-first-name"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  readOnly={clientMode === "existing" && !!selectedClient}
                  required={clientMode === "new"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-last-name">Last Name *</Label>
                <Input
                  id="pc-last-name"
                  placeholder="Surname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  readOnly={clientMode === "existing" && !!selectedClient}
                  required={clientMode === "new"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-client-email">Email</Label>
                <Input
                  id="pc-client-email"
                  type="email"
                  placeholder="Client's Email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  readOnly={clientMode === "existing" && !!selectedClient}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-client-phone">Phone Number *</Label>
                <Input
                  id="pc-client-phone"
                  type="tel"
                  placeholder="Client's Phone Number"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  readOnly={clientMode === "existing" && !!selectedClient}
                  required={clientMode === "new"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-client-dob">Date of Birth</Label>
              <Input
                id="pc-client-dob"
                type="date"
                value={clientDob}
                onChange={(e) => setClientDob(e.target.value)}
                readOnly={clientMode === "existing" && !!selectedClient}
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Payment Details
              </h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-payer-name">Payer Name *</Label>
              <Input
                id="pc-payer-name"
                placeholder="Name of person making the payment"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-product">Product *</Label>
                <Select value={product} onValueChange={setProduct} required>
                  <SelectTrigger id="pc-product">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_PRODUCTS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-payment-method">Payment Mode *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  required
                >
                  <SelectTrigger id="pc-payment-method">
                    <SelectValue placeholder="Select Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_BANKS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-service-desc">Description of Service</Label>
              <Textarea
                id="pc-service-desc"
                placeholder="Describe the service being paid for..."
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-amount-billed">Amount Billed *</Label>
                <Input
                  id="pc-amount-billed"
                  type="number"
                  min={0}
                  placeholder="Amount"
                  value={amountExpected}
                  onChange={(e) => setAmountExpected(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-discount">Discount</Label>
                <Input
                  id="pc-discount"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-amount-paid">Amount Paid *</Label>
                <Input
                  id="pc-amount-paid"
                  type="number"
                  min={0}
                  placeholder="Paid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-payment-date">Date of Payment *</Label>
                <Input
                  id="pc-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deal Closer</Label>
                <Input value="Automatically set to submitting staff" readOnly />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Attachments
              </h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-1.5">
              <Label>Attachment (DataPage){!outstandingPaymentId && " *"}</Label>
              <FileUpload
                value={datapageFiles}
                accept=".pdf,.jpg,.jpeg,.png"
                maxFiles={1}
                onUpload={async (file) => {
                  setDatapageRawFile(file);
                  return {
                    id: crypto.randomUUID(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  };
                }}
                onChange={setDatapageFiles}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Attachment (Proof of Payment) *</Label>
              <FileUpload
                value={proofFiles}
                accept=".pdf,.jpg,.jpeg,.png"
                maxFiles={1}
                onUpload={async (file) => {
                  setProofRawFile(file);
                  return {
                    id: crypto.randomUUID(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  };
                }}
                onChange={setProofFiles}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Confirmation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
