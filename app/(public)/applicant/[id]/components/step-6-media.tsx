"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";

import { AlertCircle } from "lucide-react";

type FormState = {
  error?: string;
  success?: boolean;
  nextStep?: number;
  submittedData?: Record<string, string>;
};

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;

const resolvePreviewUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("/api/")) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    return apiBase ? `${apiBase}${url}` : url;
  }
  return url;
};

export function Step6Media({
  applicationId,
  initialData,
}: {
  applicationId: string;
  initialData?: MediaData;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    resolvePreviewUrl(initialData?.passportPhoto?.storagePath),
  );
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    resolvePreviewUrl(initialData?.signature?.storagePath),
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const shouldClearCanvas = useRef(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [fileError, setFileError] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const [validIdName, setValidIdName] = useState<string | null>(initialData?.validId?.fileName || null);
  const [oLevelName, setOLevelName] = useState<string | null>(initialData?.oLevelResults?.fileName || null);
  const [nyscName, setNyscName] = useState<string | null>(initialData?.nyscCertificate?.fileName || null);
  const [uniName, setUniName] = useState<string | null>(initialData?.universityCertificate?.fileName || null);
  const [birthCertName, setBirthCertName] = useState<string | null>(initialData?.birthCertificate?.fileName || null);
  const [resumeName, setResumeName] = useState<string | null>(initialData?.resumeCv?.fileName || null);

  const [validIdError, setValidIdError] = useState<string | null>(null);
  const [oLevelError, setOLevelError] = useState<string | null>(null);
  const [nyscError, setNyscError] = useState<string | null>(null);
  const [uniError, setUniError] = useState<string | null>(null);
  const [birthCertError, setBirthCertError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const handleOptionalFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setName: (name: string | null) => void,
    setError: (error: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a PDF, PNG, or JPEG. WebP is not supported.");
        setName(null);
        e.target.value = "";
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("Document exceeds 2MB. Please compress and re-upload.");
        setName(null);
        e.target.value = "";
        return;
      }

      setName(file.name);
    } else {
      setName(null);
    }
  };

  const toSubmittedData = (formData: FormData) =>
    Object.fromEntries(
      Array.from(formData.entries()).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );

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

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const message = "Image exceeds 1MB. Please compress and re-upload.";
        setFileError(message);
        toast.error(message);
        setPhotoPreview(null);
        e.target.value = "";
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
    if (canvas) {
      // Canvas is currently in the DOM (drawing mode) — clear it directly
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      // Canvas is not in the DOM yet (preview mode) — flag it to be cleared
      // once the canvas mounts back after signaturePreview is set to null
      shouldClearCanvas.current = true;
    }
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

      const hasNewPhoto = !!(photoFile && photoFile.size > 0 && photoFile.name);
      if (!hasNewPhoto && !photoUrl) {
        return {
          error: "Passport photo is required",
          submittedData: toSubmittedData(formData),
        };
      }

      if (!signaturePreview) {
        return {
          error: "Signature is required",
          submittedData: toSubmittedData(formData),
        };
      }

      // Upload photo to Laravel API if provided
      let photoData = initialData?.passportPhoto;

      if (hasNewPhoto) {
        try {
          const photoResult = await uploadPublicFile(
            applicationId,
            photoFile as File,
            `applicant_pass_${applicationId}`,
          );
          photoData = {
            fileName: (photoFile as File).name,
            uploadedAt: new Date().toISOString(),
            storagePath: photoResult.storagePath,
            fileId: photoResult.fileId,
          };
        } catch (error: any) {
          return {
            error: `Photo upload failed: ${error.message}`,
            submittedData: toSubmittedData(formData),
          };
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
        return {
          error: signatureResult.error,
          submittedData: toSubmittedData(formData),
        };
      }

      const signatureStoragePath = signatureResult.url || "";
      const signatureFileId = signatureResult.fileId;

      // Handle required document uploads
      const validIdFile = formData.get("validId") as File | null;
      const oLevelFile = formData.get("oLevelResults") as File | null;
      const nyscFile = formData.get("nyscCertificate") as File | null;
      const uniFile = formData.get("universityCertificate") as File | null;
      const birthCertFile = formData.get("birthCertificate") as File | null;
      const resumeFile = formData.get("resumeCv") as File | null;

      const hasNewValidId = !!(validIdFile && validIdFile.size > 0 && validIdFile.name);
      const hasNewOLevel = !!(oLevelFile && oLevelFile.size > 0 && oLevelFile.name);
      const hasNewNysc = !!(nyscFile && nyscFile.size > 0 && nyscFile.name);
      const hasNewUni = !!(uniFile && uniFile.size > 0 && uniFile.name);
      const hasNewBirthCert = !!(birthCertFile && birthCertFile.size > 0 && birthCertFile.name);
      const hasNewResume = !!(resumeFile && resumeFile.size > 0 && resumeFile.name);

      const missingItems: string[] = [];
      if (!hasNewValidId && !initialData?.validId?.storagePath) {
        missingItems.push("Valid Means of ID");
      }
      if (!hasNewOLevel && !initialData?.oLevelResults?.storagePath) {
        missingItems.push("O Level Results");
      }
      if (!hasNewNysc && !initialData?.nyscCertificate?.storagePath) {
        missingItems.push("NYSC Certificate");
      }
      if (!hasNewUni && !initialData?.universityCertificate?.storagePath) {
        missingItems.push("University Certificate");
      }
      if (!hasNewBirthCert && !initialData?.birthCertificate?.storagePath) {
        missingItems.push("Birth Certificate / Age Declaration");
      }
      if (!hasNewResume && !initialData?.resumeCv?.storagePath) {
        missingItems.push("Resume / CV");
      }

      if (missingItems.length > 0) {
        return {
          error: `Missing required document(s): ${missingItems.join(", ")}. Please upload them before continuing.`,
          submittedData: toSubmittedData(formData),
        };
      }

      let validIdData = initialData?.validId;
      if (hasNewValidId) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            validIdFile as File,
            `applicant_id_${applicationId}`
          );
          validIdData = {
            fileName: (validIdFile as File).name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
            fileId: result.fileId,
          };
        } catch (error: any) {
          return {
            error: `ID upload failed: ${error.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      let oLevelData = initialData?.oLevelResults;
      if (hasNewOLevel) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            oLevelFile as File,
            `applicant_olevel_${applicationId}`
          );
          oLevelData = {
            fileName: (oLevelFile as File).name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
            fileId: result.fileId,
          };
        } catch (error: any) {
          return {
            error: `O-Level results upload failed: ${error.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      let nyscData = initialData?.nyscCertificate;
      if (hasNewNysc) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            nyscFile as File,
            `applicant_nysc_${applicationId}`
          );
          nyscData = {
            fileName: (nyscFile as File).name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
            fileId: result.fileId,
          };
        } catch (error: any) {
          return {
            error: `NYSC certificate upload failed: ${error.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      let uniData = initialData?.universityCertificate;
      if (hasNewUni) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            uniFile as File,
            `applicant_uni_${applicationId}`
          );
          uniData = {
            fileName: (uniFile as File).name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
            fileId: result.fileId,
          };
        } catch (error: any) {
          return {
            error: `University certificate upload failed: ${error.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      let birthCertData = initialData?.birthCertificate;
      if (hasNewBirthCert) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            birthCertFile as File,
            `applicant_birth_cert_${applicationId}`
          );
          birthCertData = {
            fileName: (birthCertFile as File).name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
            fileId: result.fileId,
          };
        } catch (error: any) {
          return {
            error: `Birth certificate upload failed: ${error.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      let resumeData = initialData?.resumeCv;
      if (hasNewResume) {
        try {
          const result = await uploadPublicFile(
            applicationId,
            resumeFile as File,
            `applicant_resume_${applicationId}`
          );
          resumeData = {
            fileName: (resumeFile as File).name,
            storagePath: result.storagePath,
            uploadedAt: new Date().toISOString(),
            fileId: result.fileId,
          };
        } catch (error: any) {
          return {
            error: `Resume/CV upload failed: ${error.message}`,
            submittedData: toSubmittedData(formData),
          };
        }
      }

      const data = {
        media: {
          passportPhoto: photoData,
          signature: {
            fileName: "signature.png",
            uploadedAt: new Date().toISOString(),
            storagePath: signatureStoragePath,
            fileId: signatureFileId,
          },
          validId: validIdData,
          oLevelResults: oLevelData,
          nyscCertificate: nyscData,
          universityCertificate: uniData,
          birthCertificate: birthCertData,
          resumeCv: resumeData,
        },
      };

      return saveFormStep(applicationId, 6, data);
    } catch (error) {
      return {
        error: "An error occurred during upload. Please try again.",
        submittedData: toSubmittedData(formData),
      };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleSubmitAction,
    null,
  );

  // Clear the canvas after it mounts back into the DOM (when coming from preview mode)
  useEffect(() => {
    if (signaturePreview === null && shouldClearCanvas.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      shouldClearCanvas.current = false;
    }
  }, [signaturePreview]);

  useEffect(() => {
    if (!state?.error || !state.submittedData || !formRef.current) return;

    for (const [name, value] of Object.entries(state.submittedData)) {
      const elements = formRef.current.querySelectorAll(`[name="${name}"]`);
      elements.forEach((element) => {
        if (element instanceof HTMLInputElement) {
          if (element.type === "checkbox") {
            element.checked = value === "on";
          } else if (element.type !== "file") {
            element.value = value;
          }
        } else if (
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          element.value = value;
        }
      });
    }
  }, [state]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state?.error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Media & Signature</h3>
        <p className="text-sm text-muted-foreground">
          Step 6 of 8 - Upload your passport photograph and provide your digital
          signature
        </p>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Upload Action Required</p>
            <p className="text-sm mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Passport Photo Upload */}
        <div className="space-y-3">
          <Label htmlFor="photo" className="text-base font-medium">
            Passport Photograph *
          </Label>
          <p className="text-sm text-muted-foreground">
            Upload a clear passport-size photograph (JPG/PNG, max 1MB)
          </p>

          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/jpeg,image/png"
            onChange={handlePhotoChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
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

          {!photoPreview && initialData?.passportPhoto?.storagePath && (
            <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={resolvePreviewUrl(initialData.passportPhoto.storagePath) || ""}
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

      {/* Supporting Documents (Required) */}
      <Separator />
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-base mb-1">Supporting Documents *</h4>
          <p className="text-sm text-muted-foreground">
            Please upload clear copies of all required credentials and identification. Accepted formats are PDF, PNG, and JPEG up to 2MB each.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Valid ID */}
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="validId" className="text-sm font-medium">Valid Means of ID (Passport, National ID, Voter Card, or Driver License) *</Label>
            <input
              type="file"
              id="validId"
              name="validId"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleOptionalFileChange(e, setValidIdName, setValidIdError)}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {validIdError && <p className="text-xs font-medium text-destructive">{validIdError}</p>}
            {validIdName ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-1">
                <span>✓</span>
                <span>{initialData?.validId?.fileName === validIdName ? "Stored:" : "Selected:"} {validIdName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <span>⚠️</span>
                <span>Required - pending upload</span>
              </div>
            )}
          </div>

          {/* O Level Results */}
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="oLevelResults" className="text-sm font-medium">O Level Results *</Label>
            <input
              type="file"
              id="oLevelResults"
              name="oLevelResults"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleOptionalFileChange(e, setOLevelName, setOLevelError)}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {oLevelError && <p className="text-xs font-medium text-destructive">{oLevelError}</p>}
            {oLevelName ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-1">
                <span>✓</span>
                <span>{initialData?.oLevelResults?.fileName === oLevelName ? "Stored:" : "Selected:"} {oLevelName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <span>⚠️</span>
                <span>Required - pending upload</span>
              </div>
            )}
          </div>

          {/* NYSC Certificate */}
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="nyscCertificate" className="text-sm font-medium">NYSC Certificate *</Label>
            <input
              type="file"
              id="nyscCertificate"
              name="nyscCertificate"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleOptionalFileChange(e, setNyscName, setNyscError)}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {nyscError && <p className="text-xs font-medium text-destructive">{nyscError}</p>}
            {nyscName ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-1">
                <span>✓</span>
                <span>{initialData?.nyscCertificate?.fileName === nyscName ? "Stored:" : "Selected:"} {nyscName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <span>⚠️</span>
                <span>Required - pending upload</span>
              </div>
            )}
          </div>

          {/* University Certificate */}
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="universityCertificate" className="text-sm font-medium">University Certificate / Proof of Completion *</Label>
            <input
              type="file"
              id="universityCertificate"
              name="universityCertificate"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleOptionalFileChange(e, setUniName, setUniError)}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {uniError && <p className="text-xs font-medium text-destructive">{uniError}</p>}
            {uniName ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-1">
                <span>✓</span>
                <span>{initialData?.universityCertificate?.fileName === uniName ? "Stored:" : "Selected:"} {uniName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <span>⚠️</span>
                <span>Required - pending upload</span>
              </div>
            )}
          </div>

          {/* Birth Certificate */}
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="birthCertificate" className="text-sm font-medium">Birth Certificate / Age Declaration *</Label>
            <input
              type="file"
              id="birthCertificate"
              name="birthCertificate"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleOptionalFileChange(e, setBirthCertName, setBirthCertError)}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {birthCertError && <p className="text-xs font-medium text-destructive">{birthCertError}</p>}
            {birthCertName ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-1">
                <span>✓</span>
                <span>{initialData?.birthCertificate?.fileName === birthCertName ? "Stored:" : "Selected:"} {birthCertName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <span>⚠️</span>
                <span>Required - pending upload</span>
              </div>
            )}
          </div>

          {/* Resume/CV */}
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="resumeCv" className="text-sm font-medium">Resume / CV *</Label>
            <input
              type="file"
              id="resumeCv"
              name="resumeCv"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleOptionalFileChange(e, setResumeName, setResumeError)}
              className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {resumeError && <p className="text-xs font-medium text-destructive">{resumeError}</p>}
            {resumeName ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium mt-1">
                <span>✓</span>
                <span>{initialData?.resumeCv?.fileName === resumeName ? "Stored:" : "Selected:"} {resumeName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <span>⚠️</span>
                <span>Required - pending upload</span>
              </div>
            )}
          </div>
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
