"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicantStore, MediaData } from "@/lib/store/applicant-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function Step6Media() {
  const router = useRouter();
  const { formData, updateFormData, setStep, completeStep } =
    useApplicantStore();
  const initialData = formData.media || {};
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData.passportPhoto || null,
  );
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    initialData.signature || initialData.socialHandles?.signature || null,
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) =>
        setPhotoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignaturePreview(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSignaturePreview(canvas.toDataURL());
    }
  };

  const handleBack = () => {
    setStep(5);
    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "5";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/5`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    // Mock save
    const mediaData: MediaData = {
      passportPhoto: photoPreview || undefined,
      signature: signaturePreview || undefined,
      socialHandles: {},
    };

    await new Promise((resolve) => setTimeout(resolve, 500));

    updateFormData("media", mediaData);
    completeStep(6);
    setStep(7);

    const pathSegments = window.location.pathname.split("/");
    if (pathSegments.length >= 4) {
      pathSegments[pathSegments.length - 1] = "7";
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/applicant/demo/7`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Media & Signature</h3>
        <p className="text-sm text-muted-foreground">
          Step 6 of 8 - Passport and Signature
        </p>
      </div>

      <div className="space-y-6">
        {/* Passport Photo Upload */}
        <div className="space-y-3">
          <Label htmlFor="photo" className="text-base font-medium">
            Passport Photograph *
          </Label>
          <input
            type="file"
            id="photo"
            accept="image/*"
            onChange={handlePhotoChange}
            className="block w-full text-sm"
          />
          {photoPreview && (
            <div className="rounded-lg border p-4">
              <img
                src={photoPreview}
                alt="Passport preview"
                className="h-40 w-32 object-cover rounded border"
              />
            </div>
          )}
        </div>

        {/* Signature */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Digital Signature *</Label>
          {!signaturePreview ? (
            <div className="rounded-lg border bg-muted p-4">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-40 bg-white border cursor-crosshair"
              />
              <Button
                type="button"
                onClick={saveSignature}
                className="w-full mt-3"
              >
                Confirm Signature
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted p-4">
              <img
                src={signaturePreview}
                alt="Signature"
                className="h-20 border bg-white"
              />
              <Button
                type="button"
                variant="outline"
                onClick={clearSignature}
                className="w-full mt-3"
              >
                Clear & Redraw
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          type="submit"
          disabled={isPending || !photoPreview || !signaturePreview}
        >
          {isPending ? "Saving..." : "Next: Download Documents"}
        </Button>
      </div>
    </form>
  );
}
