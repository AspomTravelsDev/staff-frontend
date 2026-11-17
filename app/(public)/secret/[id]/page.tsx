"use client";

import { useEffect, useState, use } from "react";
import {
  KeyRound,
  Flame,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Loader2,
  AlertTriangle,
  User,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SecureSecretMetadata, RevealedSecretData } from "@/types/secret";
import { getSecretMetadata, revealSecret } from "@/lib/api/secrets";
import { toast } from "sonner";

interface PublicSecretPageProps {
  params: Promise<{ id: string }>;
}

export default function PublicSecretPage({ params }: PublicSecretPageProps) {
  const { id } = use(params);
  const [metadata, setMetadata] = useState<SecureSecretMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pin, setPin] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealedData, setRevealedData] = useState<RevealedSecretData | null>(null);

  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSecretMetadata(id, true)
      .then((data) => {
        if (active) {
          setMetadata(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load secret drop");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleReveal(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!metadata) return;

    if (metadata.has_pin && !pin.trim()) {
      toast.error("Please enter the security PIN.");
      return;
    }

    setRevealing(true);
    try {
      const res = await revealSecret(id, pin || undefined, true);
      setRevealedData(res);
      setMetadata((prev) =>
        prev
          ? {
              ...prev,
              is_destroyed: true,
              viewed_at: new Date().toISOString(),
            }
          : null
      );
      toast.success("Credential decrypted. Payload permanently erased from database.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to decrypt secret.";
      toast.error(msg);
    } finally {
      setRevealing(false);
    }
  }

  async function handleCopyPassword(password: string) {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setCopiedPassword(false), 2500);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  }

  async function handleCopyUsername(username: string) {
    try {
      await navigator.clipboard.writeText(username);
      setCopiedUsername(true);
      toast.success("Username copied to clipboard!");
      setTimeout(() => setCopiedUsername(false), 2500);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Decrypting metadata...</p>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className="mx-auto max-w-md pt-8">
        <Card className="border-destructive/30 bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Secret Unavailable</CardTitle>
            <CardDescription className="text-xs">
              {error || "This credential drop does not exist or may have already been purged."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isBurned = metadata.is_destroyed;
  const isExpired = metadata.is_expired;

  return (
    <div className="mx-auto max-w-lg px-2 pt-4 sm:pt-8">
      <Card className="border-border shadow-md">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isBurned
                    ? "bg-destructive/15 text-destructive"
                    : isExpired
                    ? "bg-muted text-muted-foreground"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {isBurned ? (
                  <Flame className="h-5 w-5" />
                ) : isExpired ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <KeyRound className="h-5 w-5" />
                )}
              </span>
              <div>
                <CardTitle className="text-base sm:text-lg">{metadata.title}</CardTitle>
                <CardDescription className="text-xs">
                  {metadata.sender?.name ? `Shared by ${metadata.sender.name} (IT)` : "IT Secure Credential Drop"}
                </CardDescription>
              </div>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isBurned
                  ? "bg-destructive/15 text-destructive"
                  : isExpired
                  ? "bg-muted text-muted-foreground"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              }`}
            >
              {isBurned ? "Burned" : isExpired ? "Expired" : "Active Drop"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Burned State */}
          {isBurned && !revealedData && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-destructive">This Secret Has Been Burned</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {metadata.viewed_at
                  ? `This credential was revealed on ${new Date(metadata.viewed_at).toLocaleString()} and has been destroyed.`
                  : "This credential was revealed and has been destroyed."}{" "}
                The encrypted payload was permanently erased from the server. If you still require access, please request IT to issue a new drop.
              </p>
            </div>
          )}

          {/* Expired State */}
          {isExpired && !isBurned && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">Credential Expired</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This credential was not accessed within its validity period and was automatically expired. Please contact IT support.
              </p>
            </div>
          )}

          {/* Active Reveal Form */}
          {!isBurned && !isExpired && !revealedData && (
            <form onSubmit={handleReveal} className="space-y-4">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <strong className="font-semibold">Burn-After-Reading Protection:</strong>
                  <p className="mt-0.5 text-muted-foreground">
                    This credential can only be decrypted once. Immediately after viewing, the payload will be permanently wiped from the database.
                  </p>
                </div>
              </div>

              {metadata.has_pin && (
                <div className="space-y-1.5">
                  <Label htmlFor="pin" className="text-xs font-medium flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Enter Security PIN
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter 4-digit PIN provided by IT"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={16}
                    autoFocus
                    required
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    IT configured a secondary PIN for this credential.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={revealing || (metadata.has_pin && !pin.trim())}
                className="w-full h-11 text-sm font-medium gap-2 shadow-sm"
              >
                {revealing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Decrypting & Burning...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Reveal Credential</span>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Revealed Payload (Strictly Masked Password as per user requirement) */}
          {revealedData && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <Flame className="h-4 w-4 text-red-500" />
                  Burned: Payload erased from database
                </span>
                <span className="text-[10px] opacity-80">Decrypted</span>
              </div>

              {/* Username row */}
              {revealedData.username && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Username / Account ID
                  </Label>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
                    <span className="flex-1 font-mono text-sm select-all break-all font-medium">
                      {revealedData.username}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyUsername(revealedData.username!)}
                      className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
                    >
                      {copiedUsername ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Password row: strictly masked, never plain text on screen */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Password
                </Label>
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg tracking-widest text-muted-foreground select-none">
                      ••••••••••••••••
                    </span>
                    <span className="text-[10px] text-muted-foreground italic">
                      Hidden for security
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="default"
                    variant="default"
                    onClick={() => handleCopyPassword(revealedData.password)}
                    className="w-full h-10 text-xs font-medium gap-2 shadow-xs"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-300" />
                        <span>Password Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Click to Copy Password</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Notes row */}
              {revealedData.notes && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Additional Instructions / Notes
                  </Label>
                  <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-xs leading-relaxed whitespace-pre-wrap">
                    {revealedData.notes}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center pt-2">
                Make sure you save or use this password now. It will not be accessible once this page is refreshed or closed.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border/40 text-[11px] text-muted-foreground justify-between py-3">
          <span>Protected by AES-256-GCM</span>
          <span>Aspom Travels IT Security</span>
        </CardFooter>
      </Card>
    </div>
  );
}
