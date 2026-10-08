"use client";

import { forwardRef } from "react";
import type { Invoice } from "@/lib/api/invoices";
import { INVOICE_LOGOS } from "@/lib/constants/invoice-branding";

interface InvoicePreviewProps {
  invoice: Omit<Invoice, "id" | "created_at" | "updated_at" | "created_by_id">;
  id?: string;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ invoice, id = "invoice-document" }, ref) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      try {
        const [year, month, day] = dateStr.split("-");
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
        return new Date(dateStr).toLocaleDateString("en-GB");
      } catch {
        return dateStr;
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
      }).format(amount).replace("NGN", "NGN ");
    };

    // Render Travelatal Logo in SVG
    const renderTravelatalLogo = () => (
      <div className="flex items-center gap-2">
        <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            stroke="#0f4c81" 
            strokeWidth="5" 
            strokeDasharray="180 35" 
            strokeLinecap="round" 
            transform="rotate(-40 50 50)"
          />
          <path 
            d="M50 25 L53.5 45 L76 54 L53.5 54 L50 71 L44 67 L44 62 L26 54 L44 54 L44 45 Z" 
            fill="#e31b23"
            transform="rotate(35 50 50)"
          />
        </svg>
        <div className="text-left leading-none">
          <span className="text-[10px] font-bold tracking-[0.25em] text-slate-400 block uppercase -mb-0.5">
            TRAVEL
          </span>
          <span className="text-2xl font-black tracking-wider text-[#0f4c81] block">
            ATAL
          </span>
        </div>
      </div>
    );

    // Render Company Logo
    const renderLogo = () => {
      const logoSrc = INVOICE_LOGOS[invoice.subsidiary] || INVOICE_LOGOS.aspom;
      let altText = "ASPOM Logo";

      if (invoice.subsidiary === "travelatal") {
        altText = "Travelatal Logo";
      } else if (invoice.subsidiary === "abs") {
        altText = "ABS Health Connect Logo";
      }

      return (
        <img
          src={logoSrc}
          alt={altText}
          className="h-14 object-contain"
          onError={(e) => {
            // Fallback if image isn't available
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      );
    };

    const hasItems = Array.isArray(invoice.items) && invoice.items.length > 0;
    const subtotal = Number(invoice.subtotal);
    const balance = Number(invoice.balance_due);
    const isPaid = invoice.status === "paid" || (subtotal > 0 && balance <= 0 && invoice.status !== "unpaid" && invoice.status !== "partially_paid");

    return (
      <div className="w-full overflow-x-auto p-2 bg-slate-100 rounded-xl border flex justify-center">
        <div
          ref={ref}
          id={id}
          className="w-[800px] min-w-[800px] bg-white text-slate-800 p-12 shadow-2xl relative flex flex-col justify-between select-none"
          style={{ minHeight: "1050px" }}
        >
          {/* Document Content */}
          <div className="space-y-10">
            {/* Header: Company Details & Logo */}
            <div className="flex justify-between items-start">
              <div className="space-y-1.5 text-left">
                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-tight">
                  {invoice.company_name}
                </h2>
                {invoice.company_website && (
                  <p className="text-xs text-slate-500 font-medium">{invoice.company_website}</p>
                )}
                {invoice.company_email && (
                  <p className="text-xs text-slate-500 font-medium">{invoice.company_email}</p>
                )}
                {invoice.company_phone && (
                  <p className="text-xs text-slate-500 font-medium">{invoice.company_phone}</p>
                )}
                {invoice.company_address && (
                  <p className="text-xs text-slate-400 font-medium max-w-[280px] leading-relaxed whitespace-pre-line">
                    {invoice.company_address}
                  </p>
                )}
              </div>
              <div>
                {renderLogo()}
              </div>
            </div>

            {/* Bill To & Invoice Info */}
            <div className="flex justify-between items-start pt-4">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-[0.1em] text-sky-600/90 uppercase leading-none mb-4">
                    Invoice
                  </h1>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1.5">
                    BILL TO
                  </span>
                  <p className="text-base font-black text-slate-800 uppercase tracking-tight">
                    {invoice.client_name || "---"}
                  </p>
                </div>
                {(invoice.client_email || invoice.client_phone || invoice.client_address) && (
                  <div className="text-xs text-slate-500 space-y-0.5 leading-relaxed max-w-[280px] whitespace-pre-line">
                    {invoice.client_email && <p>{invoice.client_email}</p>}
                    {invoice.client_phone && <p>{invoice.client_phone}</p>}
                    {invoice.client_address && <p>{invoice.client_address}</p>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-6">
                  INVOICE
                </span>
                <span className="text-sm font-black text-slate-800 tabular-nums leading-6">
                  {invoice.invoice_number || "---"}
                </span>

                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-6">
                  DATE
                </span>
                <span className="text-sm font-semibold text-slate-700 tabular-nums leading-6">
                  {formatDate(invoice.issue_date)}
                </span>

                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-6">
                  DUE DATE
                </span>
                <span className="text-sm font-semibold text-slate-700 tabular-nums leading-6">
                  {formatDate(invoice.due_date)}
                </span>

                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-6 pt-2">
                  PAYMENT METHOD
                </span>
                <span className="text-sm font-black text-slate-800 leading-6 pt-2">
                  {invoice.payment_method || "BANK TRANSFER"}
                </span>
              </div>
            </div>

            {/* Table of Items */}
            <div className="pt-6">
              <div className="border rounded-sm overflow-hidden border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-sky-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold w-28">DATE</th>
                      <th className="px-4 py-3 text-left font-bold">DESCRIPTION</th>
                      <th className="px-4 py-3 text-right font-bold w-16">QTY</th>
                      <th className="px-4 py-3 text-right font-bold w-32">RATE</th>
                      <th className="px-4 py-3 text-right font-bold w-36">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hasItems ? (
                      invoice.items.map((item, index) => (
                        <tr key={index} className="bg-white hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-600 tabular-nums">
                            {formatDate(item.date)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-600">
                            {item.qty}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            {formatCurrency(Number(item.rate)).replace("NGN", "")}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">
                            {formatCurrency(Number(item.amount)).replace("NGN", "")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                          No items added. Add rows in the form workspace to populate this table.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dotted separator */}
            <div className="border-t border-dashed border-slate-300 w-full pt-4"></div>

            {/* Membership and Totals Section */}
            <div className="flex justify-between items-start gap-12">
              {/* Membership details */}
              <div className="space-y-2 mt-1">
                {(invoice.membership_welcome_text || invoice.membership_number || invoice.membership_points) && (
                  <>
                    {invoice.membership_welcome_text && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-in fade-in whitespace-pre-line">
                        {invoice.membership_welcome_text}
                      </p>
                    )}
                    {invoice.membership_number && (
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider animate-in fade-in">
                        Membership Number: {invoice.membership_number}
                      </p>
                    )}
                    {invoice.membership_points && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-in fade-in">
                        Loyalty Point: {invoice.membership_points}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Financial calculations */}
              <div className="w-80 space-y-3 text-right">
                <div className="grid grid-cols-2 gap-x-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-6">
                    TOTAL
                  </span>
                  <span className="text-sm font-bold text-slate-700 tabular-nums leading-6">
                    {formatCurrency(Number(invoice.subtotal)).replace("NGN", "")}
                  </span>

                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-6">
                    PAID TO DATE
                  </span>
                  <span className="text-sm font-bold text-slate-700 tabular-nums leading-6">
                    {formatCurrency(Number(invoice.deposit)).replace("NGN", "")}
                  </span>
                </div>

                {/* Second Dotted Separator */}
                <div className="border-t border-dashed border-slate-300 w-full my-1"></div>

                <div className="flex items-center justify-between pl-4">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    BALANCE DUE
                  </span>
                  <span className="text-xl font-black text-slate-900 tabular-nums">
                    {formatCurrency(balance)}
                  </span>
                </div>

                {isPaid && (
                  <div className="text-right pt-1">
                    <span className="text-xl font-black text-emerald-600 tracking-[0.15em] border-2 border-emerald-600 px-3 py-0.5 rounded-sm uppercase inline-block rotate-[-3deg] select-none">
                      PAID
                    </span>
                  </div>
                )}
              </div>
            </div>

            {invoice.bank_details && (
              <div className="mt-6 border border-slate-200 rounded-sm p-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Bank Account Details
                </h3>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                  {invoice.bank_details}
                </p>
              </div>
            )}
            
            {/* Background block decoration from image */}
            <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-sm"></div>
          </div>

          {/* Footer: Terms & Conditions */}
          <div className="pt-10 border-t border-slate-100 text-center space-y-2 mt-auto">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Terms & Conditions
            </h4>
            <p className="text-[9px] text-slate-400 leading-relaxed max-w-[650px] mx-auto whitespace-pre-line font-medium">
              {invoice.terms_conditions || "---"}
            </p>
            <p className="text-[9px] text-slate-300 font-bold">
              Page 1 of 1
            </p>
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
