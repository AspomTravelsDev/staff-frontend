"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, User, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { FileUpload, type UploadedFile } from "@/components/ui/file-upload";

import { getClients } from "@/lib/api/crm";
import { getDollarBillingRateForDate } from "@/lib/api/payment-confirmations";
import { PAYMENT_BANKS, PAYMENT_PRODUCTS } from "./payment-confirmation-constants";
import type { Client } from "@/lib/api/crm-constants";
import type {
  OutstandingPayment,
  PaymentConfirmation,
} from "@/lib/api/payment-confirmations";

export interface StaffOption {
  id: string;
  name: string;
  department?: string;
}

interface PaymentConfirmationDialogProps {
  outstandingPayments?: OutstandingPayment[];
  staffList?: StaffOption[];
  currentUserId?: string;
  defaultDollarRate?: number | null;
  editingConfirmation?: PaymentConfirmation | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function PaymentConfirmationDialog({
  outstandingPayments = [],
  staffList = [],
  currentUserId = "",
  defaultDollarRate = null,
  editingConfirmation = null,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: PaymentConfirmationDialogProps) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  const isEditMode = Boolean(editingConfirmation);
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
  const [customProduct, setCustomProduct] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [numberOfPersons, setNumberOfPersons] = useState("1");
  const [dollarRate, setDollarRate] = useState(
    defaultDollarRate ? String(defaultDollarRate) : "",
  );
  const [amountExpected, setAmountExpected] = useState("");
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dealCloserId, setDealCloserId] = useState(currentUserId);
  const [outstandingPaymentId, setOutstandingPaymentId] = useState("");

  // Files
  const [datapageFiles, setDatapageFiles] = useState<UploadedFile[]>([]);
  const [proofFiles, setProofFiles] = useState<UploadedFile[]>([]);
  const [extraFiles, setExtraFiles] = useState<UploadedFile[]>([]);
  const [datapageRawFile, setDatapageRawFile] = useState<File | null>(null);
  const [proofRawFile, setProofRawFile] = useState<File | null>(null);
  const [extraRawFiles, setExtraRawFiles] = useState<Map<string, File>>(new Map());
  const [removedFileIds, setRemovedFileIds] = useState<string[]>([]);

  const pendingOutstanding = outstandingPayments.filter(
    (op) => op.status === "pending",
  );
  const selectedOutstanding = pendingOutstanding.find(
    (op) => op.id === outstandingPaymentId,
  );

  useEffect(() => {
    if (!editingConfirmation) return;

    const client = editingConfirmation.client ?? null;
    setClientMode("existing");
    setSelectedClient(client);
    setClientSearch(client?.name || "");
    const parts = (client?.name || "").split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setClientEmail(client?.email || "");
    setClientPhone(client?.phone || "");
    setClientDob(getClientDob(client));

    setPayerName(
      editingConfirmation.payer_name === client?.name
        ? ""
        : editingConfirmation.payer_name || "",
    );
    const existingProduct = editingConfirmation.product || "";
    const isListedProduct = (PAYMENT_PRODUCTS as readonly string[]).includes(
      existingProduct,
    );
    if (existingProduct && !isListedProduct) {
      setProduct("Others");
      setCustomProduct(existingProduct);
    } else {
      setProduct(existingProduct);
      setCustomProduct("");
    }
    setServiceDescription(editingConfirmation.service_description || "");
    setNumberOfPersons(
      editingConfirmation.number_of_persons
        ? String(editingConfirmation.number_of_persons)
        : "1",
    );
    setDollarRate(
      editingConfirmation.dollar_rate !== null &&
        editingConfirmation.dollar_rate !== undefined
        ? String(editingConfirmation.dollar_rate)
        : "",
    );
    setAmountExpected(String(editingConfirmation.amount_expected ?? ""));
    setDiscount(
      Number(editingConfirmation.discount || 0) > 0
        ? String(editingConfirmation.discount)
        : "",
    );
    setAmountPaid(String(editingConfirmation.amount_paid ?? ""));
    setPaymentDate(
      editingConfirmation.payment_date
        ? editingConfirmation.payment_date.slice(0, 10)
        : format(new Date(), "yyyy-MM-dd"),
    );
    setPaymentMethod(editingConfirmation.payment_method || "");
    setDealCloserId(
      editingConfirmation.deal_closer_id ||
        editingConfirmation.user_id ||
        currentUserId,
    );
    setOutstandingPaymentId(editingConfirmation.outstanding_payment_id || "");
    setDatapageFiles([]);
    setProofFiles([]);
    setExtraFiles([]);
    setDatapageRawFile(null);
    setProofRawFile(null);
    setExtraRawFiles(new Map());
    setRemovedFileIds([]);
  }, [editingConfirmation, currentUserId, defaultDollarRate]);

  useEffect(() => {
    if (!open || !paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      return;
    }
    if (
      isEditMode &&
      editingConfirmation?.payment_date?.slice(0, 10) === paymentDate
    ) {
      return;
    }

    let active = true;
    void getDollarBillingRateForDate(paymentDate)
      .then((rate) => {
        if (!active) return;
        setDollarRate(rate !== null ? String(rate) : "");
      })
      .catch(() => {
        if (active) setDollarRate("");
      });

    return () => {
      active = false;
    };
  }, [open, paymentDate, isEditMode, editingConfirmation]);

  useEffect(() => {
    if (!clientSearch.trim() || isEditMode) {
      setSearchResults([]);
      return;
    }

    let active = true;
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await getClients({
          search: clientSearch,
          limit: 10,
          lookup: true,
        });
        if (active) {
          setSearchResults(resp.items ?? []);
        }
      } catch {
        if (active) {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [clientSearch, isEditMode]);

  function getClientDob(client: Client | null): string {
    if (!client) return "";
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
  }

  const handleClientSearchChange = (val: string) => {
    setClientSearch(val);
    setSelectedClient(null);
    setShowDropdown(true);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowDropdown(false);
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

    const op = pendingOutstanding.find((item) => item.id === nextOutstandingId);
    if (!op?.client) {
      return;
    }

    setClientMode("existing");
    handleSelectClient(op.client);

    const originalProduct = op.original_confirmation?.product;
    const fallbackProduct = op.client.service;
    const resolvedOriginalProduct = originalProduct || fallbackProduct || "";
    const isListedProduct = (PAYMENT_PRODUCTS as readonly string[]).includes(
      resolvedOriginalProduct,
    );
    if (resolvedOriginalProduct && !isListedProduct) {
      setProduct("Others");
      setCustomProduct(resolvedOriginalProduct);
    } else {
      setProduct(resolvedOriginalProduct);
      setCustomProduct("");
    }
    if (op.original_confirmation?.number_of_persons) {
      setNumberOfPersons(String(op.original_confirmation.number_of_persons));
    }
    const originalAmountBilled = op.original_confirmation?.amount_expected;

    if (op.original_confirmation?.service_description) {
      setServiceDescription(op.original_confirmation.service_description);
    }
    setAmountExpected(
      String(originalAmountBilled ?? op.total_expected_amount),
    );
  };

  function resetForm() {
    if (editingConfirmation) return;
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
    setCustomProduct("");
    setServiceDescription("");
    setNumberOfPersons("1");
    setDollarRate(defaultDollarRate ? String(defaultDollarRate) : "");
    setAmountExpected("");
    setDiscount("");
    setAmountPaid("");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("");
    setDealCloserId(currentUserId);
    setOutstandingPaymentId("");
    setDatapageFiles([]);
    setProofFiles([]);
    setExtraFiles([]);
    setDatapageRawFile(null);
    setProofRawFile(null);
    setExtraRawFiles(new Map());
    setRemovedFileIds([]);
  }

  const existingFiles = (editingConfirmation?.files ?? []).filter(
    (f) => !removedFileIds.includes(f.id),
  );
  const hasExistingProof = existingFiles.some((f) =>
    f.filename?.startsWith("proof/"),
  );
  const hasExistingDatapage = existingFiles.some((f) =>
    f.filename?.startsWith("datapage/"),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isEditMode && clientMode === "existing" && !selectedClient) {
      toast.error("Please select or search for an existing client.");
      return;
    }

    const resolvedProduct =
      product === "Others" ? customProduct.trim() : product;
    if (!resolvedProduct) {
      toast.error(
        product === "Others"
          ? "Please enter the custom product name."
          : "Please select a product.",
      );
      return;
    }

    const expected = Number(amountExpected);
    const paid = Number(amountPaid);
    const disc = Number(discount || 0);

    if (!Number.isFinite(expected) || expected <= 0) {
      toast.error("Amount billed must be greater than 0.");
      return;
    }
    if (!Number.isFinite(paid) || paid <= 0) {
      toast.error("Amount paid must be greater than 0.");
      return;
    }
    if (disc > expected) {
      toast.error("Discount cannot be greater than the amount expected.");
      return;
    }

    const netExpected = Math.max(0, expected - disc);
    if (!outstandingPaymentId && paid > netExpected) {
      toast.error(
        "Amount paid cannot exceed the net amount billed. Please record any excess toward another deal.",
      );
      return;
    }

    if (
      !isEditMode &&
      selectedOutstanding &&
      paid > Number(selectedOutstanding.balance)
    ) {
      toast.error(
        "Amount paid cannot exceed the remaining outstanding balance. Please record any excess toward another deal.",
      );
      return;
    }

    const needsDatapage = !outstandingPaymentId;
    if (needsDatapage && !datapageRawFile && !hasExistingDatapage) {
      toast.error("Please upload the client's DataPage.");
      return;
    }

    if (!proofRawFile && !hasExistingProof) {
      toast.error("Please upload the Proof of Payment.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (!isEditMode) {
        if (clientMode === "existing" && selectedClient) {
          formData.append("client_id", selectedClient.id);
          if (!selectedClient.email && clientEmail.trim()) {
            formData.append("client_email", clientEmail.trim());
          }
          if (!selectedClient.phone && clientPhone.trim()) {
            formData.append("client_phone", clientPhone.trim());
          }
          if (!getClientDob(selectedClient) && clientDob) {
            formData.append("client_dob", clientDob);
          }
        } else {
          formData.append("client_first_name", firstName);
          formData.append("client_last_name", lastName);
          if (clientEmail) formData.append("client_email", clientEmail);
          formData.append("client_phone", clientPhone);
          if (clientDob) formData.append("client_dob", clientDob);
        }
        if (outstandingPaymentId) {
          formData.append("outstanding_payment_id", outstandingPaymentId);
        }
      }

      if (payerName.trim()) {
        formData.append("payer_name", payerName.trim());
      }
      formData.append("product", resolvedProduct);
      if (serviceDescription.trim()) {
        formData.append("service_description", serviceDescription.trim());
      }
      if (numberOfPersons) {
        formData.append("number_of_persons", numberOfPersons);
      }
      if (dollarRate) {
        formData.append("dollar_rate", dollarRate);
      }
      formData.append("amount_expected", amountExpected);
      formData.append("discount", discount || "0");
      formData.append("amount_paid", amountPaid);
      formData.append("payment_date", paymentDate);
      formData.append("payment_method", paymentMethod);
      if (dealCloserId) {
        formData.append("deal_closer_id", dealCloserId);
      }

      if (datapageRawFile) {
        formData.append("datapage", datapageRawFile);
      }
      if (proofRawFile) {
        formData.append("proof_of_payment", proofRawFile);
      }
      extraFiles.forEach((item) => {
        const raw = extraRawFiles.get(item.id);
        if (raw) {
          formData.append("additional_attachments[]", raw);
        }
      });

      if (isEditMode && editingConfirmation) {
        removedFileIds.forEach((id) => {
          formData.append("removed_file_ids[]", id);
        });
        const { updatePaymentConfirmationAction } = await import(
          "@/lib/actions/payment-confirmations"
        );
        const result = await updatePaymentConfirmationAction(
          editingConfirmation.id,
          formData,
        );
        if (!result.success) {
          throw new Error(result.error || "Update failed");
        }
        toast.success(
          editingConfirmation.status === "rejected"
            ? "Payment confirmation corrected and resubmitted!"
            : "Payment confirmation updated!",
        );
      } else {
        const { createPaymentConfirmationAction } = await import(
          "@/lib/actions/payment-confirmations"
        );
        const result = await createPaymentConfirmationAction(formData);
        if (!result.success) {
          throw new Error(result.error || "Submission failed");
        }
        toast.success("Payment confirmation submitted!");
      }

      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit payment confirmation.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Payment Confirmation
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? editingConfirmation?.status === "rejected"
                ? "Edit & Resubmit Payment Confirmation"
                : "Edit Payment Confirmation"
              : "Payment Confirmation"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details or attachments and resubmit to Accounts for review."
              : "Submit a new payment confirmation for account department review."}
          </DialogDescription>
        </DialogHeader>

        {isEditMode &&
          editingConfirmation?.status === "rejected" &&
          editingConfirmation.rejection_reason && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <p className="text-xs font-semibold text-destructive mb-1">
                Declined by Accounts — Reason
              </p>
              <p>{editingConfirmation.rejection_reason}</p>
            </div>
          )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Link to Outstanding Payment (installment) */}
          {!isEditMode && pendingOutstanding.length > 0 && (
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
                      {op.client?.name || "Unknown client"}
                      {op.original_confirmation?.product
                        ? ` (${op.original_confirmation.product})`
                        : ""}{" "}
                      - Balance: ₦{Number(op.balance).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting an outstanding fee auto-fills the client details below.
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
                    Original amount billed: ₦
                    {Number(
                      selectedOutstanding.original_confirmation?.amount_expected ??
                        selectedOutstanding.total_expected_amount,
                    ).toLocaleString()}
                  </p>
                  <p>
                    Amount already paid: ₦
                    {Number(selectedOutstanding.total_paid_amount).toLocaleString()}
                  </p>
                  <p className="font-medium text-foreground">
                    Current balance: ₦
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
                Customer Information
              </h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            {!isEditMode && !outstandingPaymentId && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={clientMode === "existing" ? "default" : "outline"}
                  onClick={() => setClientMode("existing")}
                  className="gap-1.5"
                >
                  <User className="h-3.5 w-3.5" />
                  Existing Customer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={clientMode === "new" ? "default" : "outline"}
                  onClick={() => setClientMode("new")}
                  className="gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  New Customer
                </Button>
              </div>
            )}

            {!isEditMode && clientMode === "existing" && (
              <div className="space-y-2 relative">
                <Label>Search Existing Customer *</Label>
                <Input
                  placeholder="Type customer name, email or phone..."
                  value={clientSearch}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  onFocus={() => clientSearch && setShowDropdown(true)}
                  disabled={Boolean(outstandingPaymentId)}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-first-name">First Name *</Label>
                <Input
                  id="pc-first-name"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  readOnly={isEditMode || (clientMode === "existing" && !!selectedClient)}
                  required={clientMode === "new" && !isEditMode}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-last-name">Last Name *</Label>
                <Input
                  id="pc-last-name"
                  placeholder="Surname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  readOnly={isEditMode || (clientMode === "existing" && !!selectedClient)}
                  required={clientMode === "new" && !isEditMode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-client-email">Email (optional)</Label>
                <Input
                  id="pc-client-email"
                  type="email"
                  placeholder="Customer's Email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  readOnly={isEditMode || (clientMode === "existing" && !!selectedClient?.email)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-client-phone">Phone Number *</Label>
                <Input
                  id="pc-client-phone"
                  type="tel"
                  placeholder="Customer's Phone Number"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  readOnly={isEditMode || (clientMode === "existing" && !!selectedClient?.phone)}
                  required={!isEditMode && (clientMode === "new" || (clientMode === "existing" && !!selectedClient && !selectedClient.phone))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-client-dob">Date of Birth (optional)</Label>
              <Input
                id="pc-client-dob"
                type="date"
                value={clientDob}
                onChange={(e) => setClientDob(e.target.value)}
                readOnly={isEditMode || (clientMode === "existing" && !!getClientDob(selectedClient))}
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Deal &amp; Payment Details
              </h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-payer-name">
                Payer&apos;s Name (if different from customer)
              </Label>
              <Input
                id="pc-payer-name"
                placeholder="Leave blank if customer made the payment"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-product">Product *</Label>
                <Select
                  value={product}
                  onValueChange={(val) => {
                    setProduct(val);
                    if (val !== "Others") setCustomProduct("");
                  }}
                  disabled={Boolean(outstandingPaymentId)}
                  required
                >
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
                <Label htmlFor="pc-payment-method">Payment Mode / Channel *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  required
                >
                  <SelectTrigger id="pc-payment-method">
                    <SelectValue placeholder="Select Bank / Channel" />
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

            {product === "Others" && (
              <div className="space-y-1.5">
                <Label htmlFor="pc-custom-product">Specify Product *</Label>
                <Input
                  id="pc-custom-product"
                  placeholder="Enter product or service name"
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  readOnly={Boolean(outstandingPaymentId)}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-persons">Number of Persons</Label>
                <Input
                  id="pc-persons"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="1"
                  value={numberOfPersons}
                  onChange={(e) => setNumberOfPersons(e.target.value)}
                  readOnly={Boolean(outstandingPaymentId)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-dollar-rate">
                  Dollar Billing Rate Used (if applicable)
                </Label>
                <Input
                  id="pc-dollar-rate"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 1650"
                  value={dollarRate}
                  onChange={(e) => setDollarRate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-service-desc">
                Description &amp; Notes for Assigned Officer
              </Label>
              <Textarea
                id="pc-service-desc"
                placeholder="Describe what was paid for and any extra info the assigned officer should have..."
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pc-amount-billed">Amount Billed *</Label>
                <Input
                  id="pc-amount-billed"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount"
                  value={amountExpected}
                  onChange={(e) => setAmountExpected(e.target.value)}
                  readOnly={Boolean(outstandingPaymentId)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-discount">Discount</Label>
                <Input
                  id="pc-discount"
                  type="number"
                  min={0}
                  step="0.01"
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
                  min="0.01"
                  step="0.01"
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
                <Label htmlFor="pc-deal-closer">Deal Closer</Label>
                {staffList.length > 0 ? (
                  <Select value={dealCloserId} onValueChange={setDealCloserId}>
                    <SelectTrigger id="pc-deal-closer">
                      <SelectValue placeholder="Select Deal Closer" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                          {staff.id === currentUserId ? " (You)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value="Automatically set to submitting staff" readOnly />
                )}
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

            {isEditMode && existingFiles.length > 0 && (
              <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Existing Attachments
                </p>
                {existingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-2 rounded border bg-background px-2.5 py-1.5 text-xs"
                  >
                    <span className="truncate">
                      {file.original_name || file.filename || "Attachment"}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-destructive hover:text-destructive"
                      onClick={() =>
                        setRemovedFileIds((prev) => [...prev, file.id])
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>
                Attachment (DataPage)
                {!outstandingPaymentId && !hasExistingDatapage && " *"}
              </Label>
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
                onChange={(files) => {
                  setDatapageFiles(files);
                  if (files.length === 0) setDatapageRawFile(null);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Attachment (Payment Receipt){!hasExistingProof && " *"}
              </Label>
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
                onChange={(files) => {
                  setProofFiles(files);
                  if (files.length === 0) setProofRawFile(null);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Additional Attachments (optional)</Label>
              <FileUpload
                value={extraFiles}
                accept=".pdf,.jpg,.jpeg,.png"
                maxFiles={10}
                onUpload={async (file) => {
                  const id = crypto.randomUUID();
                  setExtraRawFiles((prev) => new Map(prev).set(id, file));
                  return {
                    id,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  };
                }}
                onChange={(files) => {
                  setExtraFiles(files);
                  const keptIds = new Set(files.map((f) => f.id));
                  setExtraRawFiles((prev) => {
                    const next = new Map<string, File>();
                    prev.forEach((v, k) => {
                      if (keptIds.has(k)) next.set(k, v);
                    });
                    return next;
                  });
                }}
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
              {isSubmitting
                ? "Submitting..."
                : isEditMode
                  ? editingConfirmation?.status === "rejected"
                    ? "Save & Resubmit"
                    : "Save Changes"
                  : "Submit Confirmation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
