"use client";

import { useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import type { MessageAttachment } from "@/types/chat";

export function ChatImageAttachment({ attachment }: { attachment: MessageAttachment }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const src = `/api/proxy-file?url=${encodeURIComponent(`${baseUrl}/api/attachments/${attachment.id}`)}&inline=true`;

  if (failed) return <div className="flex h-32 items-center justify-center gap-2 rounded-md bg-muted text-xs text-muted-foreground"><ImageOff className="size-4" />Preview unavailable. Use download below.</div>;

  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" aria-label={`Preview ${attachment.original_name}`} className={`relative block w-fit max-w-[min(60vw,320px)] overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${loaded ? "" : "min-h-32 min-w-32 bg-muted"}`}>
        {!loaded && <span className="absolute inset-0 flex items-center justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" aria-label="Loading image" /></span>}
        {/* Authenticated attachment URLs are served through the file proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={attachment.original_name} loading="lazy" decoding="async" className="block h-auto max-h-80 w-auto max-w-full" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      </button>
    </DialogTrigger>
    <DialogContent className="w-fit max-w-[calc(100vw-2rem)] gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-[calc(100vw-2rem)] [&>button]:rounded-full [&>button]:bg-background/90 [&>button]:p-1">
      <DialogHeader className="sr-only"><DialogTitle>{attachment.original_name}</DialogTitle><DialogDescription>Image attachment</DialogDescription></DialogHeader>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={attachment.original_name} className="block h-auto max-h-[85dvh] w-auto max-w-full rounded-lg" />
    </DialogContent>
  </Dialog>;
}
