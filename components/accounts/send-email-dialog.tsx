"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Send } from "lucide-react";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRecipientEmail: string;
  subsidiaryEmail: string;
  subsidiaryName: string;
  onSend: (recipient: string, customNote: string) => Promise<void>;
  isSending: boolean;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  defaultRecipientEmail,
  subsidiaryEmail,
  subsidiaryName,
  onSend,
  isSending,
}: SendEmailDialogProps) {
  const [recipient, setRecipient] = useState(defaultRecipientEmail);
  const [customNote, setCustomNote] = useState("");

  // Sync recipient state when default value changes
  useEffect(() => {
    setRecipient(defaultRecipientEmail);
  }, [defaultRecipientEmail]);

  // Reset fields on modal open/close
  useEffect(() => {
    if (!open) {
      setCustomNote("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) return;
    await onSend(recipient, customNote);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-800 uppercase tracking-tight">
            <Mail className="h-5 w-5 text-sky-600" />
            Send Invoice via Email
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Dispatch this invoice directly to your client. It will be sent via the <strong>{subsidiaryName}</strong> SMTP server.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Recipient Address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Client Email (Recipient)</Label>
            <Input
              type="email"
              placeholder="client@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              disabled={isSending}
              className="text-xs bg-background focus:ring-primary/20"
            />
          </div>

          {/* CC Addresses Information */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">CC Recipients (Copy list)</Label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border rounded-lg max-h-20 overflow-y-auto select-none">
              <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-100 cursor-default">
                account@aspomtravels.com
              </Badge>
              {subsidiaryEmail && (
                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-100 cursor-default">
                  {subsidiaryEmail} (brand)
                </Badge>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground italic leading-normal">
              Note: A copy of this invoice email will automatically copy the finance department and the subsidiary's contact inbox.
            </p>
          </div>

          {/* Custom Message Note */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Custom Email Message (Optional)</Label>
            <Textarea
              placeholder="Hi, please find the invoice for your bookings attached..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              disabled={isSending}
              rows={4}
              className="text-xs bg-background resize-none focus:ring-primary/20"
            />
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSending || !recipient}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
