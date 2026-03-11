"use client";

import { useActionState, useRef, useState } from "react";
import {
  saveFormStep,
  redirectToPreviousStep,
  uploadPassportPhoto,
} from "../actions";
import { uploadPublicFile } from "@/lib/api/hr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MediaData } from "@/lib/types/form-data";

type FormState = {
  error?: string;
  success?: boolean;
  nextStep?: number;
};

export function Step6Media({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: MediaData;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    initialData?.passportPhoto?.storagePath || null,
  );
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    initialData?.signature?.storagePath || null,
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [fileError, setFileError] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setFileError(
          "Please upload a PNG or JPEG image. WebP is not supported for PDF generation.",
        );
        setPhotoPreview(null);
        e.target.value = ""; // Clear input
        return;
      }

      // Preview only - upload will happen on form submit
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = async () => {
    await redirectToPreviousStep(applicationId, 6);
  };

  const getCoordinates = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Smooth drawing
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Prevent scrolling on touch devices
    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignaturePreview(null);
    setSignatureError(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is empty (simplified check)
    const ctx = canvas.getContext("2d");
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasDrawing = imageData?.some((channel) => channel !== 0);

    if (!hasDrawing) {
      setSignatureError("Please draw your signature before confirming.");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");
    setSignaturePreview(signatureData);
    setSignatureError(null);
  };

  const handleSubmitAction = async (
    _prevState: FormState | null,
    formData: FormData,
  ): Promise<FormState> => {
    try {
      const photoFile = formData.get("photo") as File | null;

      if (!photoFile || photoFile.size === 0) {
        return { error: "Passport photo is required" };
      }

      if (!signaturePreview) {
        return { error: "Signature is required" };
      }

      // Upload photo to Laravel API
      let photoPublicUrl = photoUrl;

      if (photoFile && photoFile.size > 0 && photoFile.name) {
        try {
          const photoResult = await uploadPublicFile(
            applicationId,
            photoFile,
            `applicant_pass_${applicationId}`,
          );
          photoPublicUrl = photoResult.storagePath;
        } catch (error: any) {
          return { error: `Photo upload failed: ${error.message}` };
        }
      }

      // Convert signature dataURL to blob and upload using action
      const signatureResult = await uploadPassportPhoto(
        applicationId,
        `applicant_signature_${applicationId}`,
        signaturePreview,
        "signature.png",
      );

      if (signatureResult.error) {
        return { error: signatureResult.error };
      }

      const data = {
        media: {
          passportPhoto: photoFile && photoFile.size > 0
            ? {
                fileName: photoFile.name,
                uploadedAt: new Date().toISOString(),
                storagePath: photoPublicUrl || "",
              }
            : initialData?.passportPhoto,
          signature: {
            fileName: "signature.png",
            uploadedAt: new Date().toISOString(),
            storagePath: signatureResult.url || "",
          },
        },
      };

      return saveFormStep(applicationId, 6, data);
    } catch (error) {
      return { error: "An error occurred during upload. Please try again." };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Media & Signature</h3>
        <p className="text-sm text-muted-foreground">
          Step 6 of 7 - Upload your passport photograph and provide your digital
          signature
        </p>
      </div>

      <div className="space-y-6">
        {/* Passport Photo Upload */}
        <div className="space-y-3">
          <Label htmlFor="photo" className="text-base font-medium">
            Passport Photograph *
          </Label>
          <p className="text-sm text-muted-foreground">
            Upload a clear passport-size photograph (JPG/PNG, max 5MB)
          </p>

          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/jpeg,image/png"
            onChange={handlePhotoChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            required
          />

          {fileError && (
            <p className="text-sm font-medium text-destructive">{fileError}</p>
          )}

          {photoPreview && (
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium mb-3">Preview:</p>
              <img
                src={photoPreview}
                alt="Passport preview"
                className="h-40 w-32 rounded border border-muted-foreground object-cover"
              />
            </div>
          )}

          {!photoPreview && photoUrl && (
            <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={photoUrl}
                  alt="Current passport"
                  className="h-20 w-16 rounded border object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    ✓ Passport photo stored
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-500/80">
                    You can upload a new one to replace it.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Digital Signature */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Digital Signature *</Label>
          <p className="text-sm text-muted-foreground">
            Draw your signature in the box below. This will be used on all
            official documents.
          </p>

          {!signaturePreview ? (
            <div className="rounded-lg border bg-muted/50 dark:bg-muted/20 p-4">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 touch-none"
              />
              <div className="flex gap-3 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSignature}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={saveSignature}
                  className="flex-1"
                >
                  Confirm Signature
                </Button>
              </div>
              {signatureError && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {signatureError}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/50 dark:bg-muted/20 p-4">
              <p className="text-xs font-medium mb-3">Your Signature:</p>
              <img
                src={signaturePreview}
                alt="Signature preview"
                className="border border-muted-foreground rounded"
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

      {/* Submission Note */}
      <div className="space-y-4">
        <Separator />
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
          <p className="text-sm">
            <strong>Note:</strong> Your passport photo and digital signature
            will be used on all official documents and agreements.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Separator />
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
          {state.error}
        </div>
      )}
      <div className="flex justify-between gap-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          type="submit"
          disabled={
            (!photoPreview && !photoUrl) || !signaturePreview || isPending
          }
        >
          {isPending ? "Saving..." : "Next: Download Documents"}
        </Button>
      </div>
    </form>
  );
}
