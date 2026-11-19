"use client";

import * as React from "react";
import { IconUpload, IconFile, IconX, IconLoader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface FileUploadProps {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  onUpload?: (file: File) => Promise<UploadedFile>;
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function FileUpload({
  value = [],
  onChange,
  onUpload,
  accept = "image/*,.pdf,.doc,.docx",
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  disabled = false,
  className,
  "aria-invalid": ariaInvalid,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      // Check max files
      if (value.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Check file size
      if (file.size > maxSize) {
        setError(
          `File "${file.name}" exceeds ${formatFileSize(maxSize)} limit`,
        );
        continue;
      }

      if (onUpload) {
        setIsUploading(true);
        try {
          const uploaded = await onUpload(file);
          newFiles.push(uploaded);
        } catch {
          setError(`Failed to upload "${file.name}"`);
        } finally {
          setIsUploading(false);
        }
      } else {
        // Create local file reference
        newFiles.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        });
      }
    }

    if (newFiles.length > 0) {
      onChange?.([...value, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    onChange?.(value.filter((f) => f.id !== id));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        aria-invalid={ariaInvalid}
        className={cn(
          "border-input bg-input/10 hover:bg-input/20 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging && "border-primary bg-primary/5",
          disabled && "pointer-events-none opacity-50",
          ariaInvalid && "border-destructive",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          disabled={disabled || isUploading}
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
        {isUploading ? (
          <IconLoader2 className="text-muted-foreground size-8 animate-spin" />
        ) : (
          <IconUpload className="text-muted-foreground size-8" />
        )}
        <p className="text-muted-foreground mt-2 text-center text-xs">
          <span className="text-primary font-medium">Click to upload</span> or
          drag and drop
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Max {formatFileSize(maxSize)} per file • {maxFiles} files max
        </p>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}

      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((file) => (
            <li
              key={file.id}
              className="bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5"
            >
              <IconFile className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-xs">
                {file.name}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatFileSize(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => handleRemove(file.id)}
              >
                <IconX className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { FileUpload, type UploadedFile };
