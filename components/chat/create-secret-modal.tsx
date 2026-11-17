"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Clock,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { generateStrongPassword } from "@/lib/secret-helpers";
import { createSecret } from "@/lib/api/secrets";
import { toast } from "sonner";

interface CreateSecretModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId?: string;
  recipientName?: string;
  conversationId?: string;
  onSecretCreated?: (secretId: string, title: string, shareUrl: string) => void;
}

export function CreateSecretModal({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  conversationId,
  onSecretCreated,
}: CreateSecretModalProps) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [pin, setPin] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  function handleGeneratePassword() {
    const generated = generateStrongPassword(16);
    setPassword(generated);
    setShowPassword(true);
    toast.success("Generated strong 16-character password.");
  }

  function handleReset() {
    setTitle("");
    setUsername("");
    setPassword("");
    setNotes("");
    setPin("");
    setExpiresInHours(24);
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title or service name.");
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter or generate a password.");
      return;
    }

    setCreating(true);
    try {
      const res = await createSecret({
        title: title.trim(),
        username: username.trim() || undefined,
        password: password.trim(),
        notes: notes.trim() || undefined,
        recipient_id: recipientId,
        conversation_id: conversationId,
        pin: pin.trim() || undefined,
        expires_in_hours: expiresInHours,
      });

      toast.success(
        `Secure credential drop created for ${recipientName || "recipient"}!`
      );
      onSecretCreated?.(res.secret.id, res.secret.title, res.share_url);
      handleReset();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create secret drop.";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!creating) {
          if (!next) handleReset();
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:p-6 sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <KeyRound className="h-5 w-5" />
              </span>
              Send Secure Credential
            </DialogTitle>
            <DialogDescription className="text-xs">
              Credentials are encrypted with AES-256 and{" "}
              <strong className="text-foreground font-semibold">
                permanently destroyed
              </strong>{" "}
              from the database immediately after viewing.
            </DialogDescription>
          </DialogHeader>

          {recipientName && (
            <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs flex items-center justify-between border border-border">
              <span className="text-muted-foreground">Recipient:</span>
              <span className="font-semibold text-foreground">{recipientName}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="secret-title" className="text-xs font-medium">
                Title / Account Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="secret-title"
                placeholder="e.g. Canva Pro, Zoom Admin, WiFi Login"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs mt-1"
                required
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="secret-username" className="text-xs font-medium">
                Username / Email <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="secret-username"
                placeholder="e.g. staff@aspom.com or admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="secret-password" className="text-xs font-medium">
                  Password / Secret Key <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGeneratePassword}
                  className="h-6 text-[11px] px-1.5 text-primary gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Generate Strong
                </Button>
              </div>
              <div className="relative mt-1">
                <Input
                  id="secret-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter or generate password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-8 text-xs pr-8 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="secret-notes" className="text-xs font-medium">
                Additional Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="secret-notes"
                placeholder="e.g. Requires VPN connection or 2FA code from authenticator app"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs mt-1 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <Label htmlFor="secret-expiry" className="text-xs font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  Expiration
                </Label>
                <select
                  id="secret-expiry"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="w-full h-8 text-xs rounded-md border border-input bg-transparent px-2.5 py-1 mt-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={1}>1 hour</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
              </div>

              <div>
                <Label htmlFor="secret-pin" className="text-xs font-medium flex items-center gap-1">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  Access PIN <span className="text-[10px] text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="secret-pin"
                  placeholder="e.g. 1234"
                  maxLength={16}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              The recipient will receive a one-time reveal card. Once they view or copy it, the credentials are permanently erased from the server.
            </span>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={creating}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={creating}
              className="text-xs h-8 gap-1.5"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <KeyRound className="h-3.5 w-3.5" />
              )}
              <span>{creating ? "Encrypting & Sending..." : "Send Secure Drop"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
