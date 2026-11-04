'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function AssetPhotoField({ existingUrl, disabled, onChange }: {
  existingUrl?: string | null;
  disabled: boolean;
  onChange: (file: File | null, remove: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const source = preview || (!removed ? existingUrl : null);

  function choose(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG, or WebP image up to 5 MB.');
      if (input.current) input.current.value = '';
      return;
    }
    setError(''); setPreview(URL.createObjectURL(file)); setRemoved(false); onChange(file, false);
  }

  return <div className="space-y-3">
    <Label htmlFor="asset-photo">Asset photo (optional)</Label>
    {source && <Image src={source} alt="Asset photo preview" width={480} height={240} unoptimized className="max-h-60 w-full rounded-md border object-contain" />}
    <input ref={input} id="asset-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} className="sr-only" aria-describedby="asset-photo-help" onChange={e => choose(e.target.files?.[0])} />
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={disabled} onClick={() => input.current?.click()}>{source ? 'Replace photo' : 'Upload photo'}</Button>
      {source && <Button type="button" variant="ghost" disabled={disabled} onClick={() => {
        setPreview(null); setRemoved(true); setError(''); onChange(null, true); if (input.current) input.current.value = '';
      }}>Remove photo</Button>}
    </div>
    <p id="asset-photo-help" className="text-xs text-muted-foreground">JPG, PNG, or WebP, up to 5 MB. Photo changes are applied when you save the asset.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
