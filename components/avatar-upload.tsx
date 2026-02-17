"use client";

import { useTransition, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadProfileImage } from "@/app/(admin)/my/profile/actions";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  user: {
    name: string;
    image_url: string | null;
  };
  initials: string;
}

export function AvatarUpload({ user, initials }: AvatarUploadProps) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const result = await uploadProfileImage(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Profile picture updated");
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    });

    // Reset input
    e.target.value = "";
  };

  return (
    <div
      className="group relative h-20 w-20 cursor-pointer"
      onClick={() => !isPending && inputRef.current?.click()}
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/gif"
        onChange={handleFileChange}
        disabled={isPending}
      />

      <Avatar className="h-20 w-20 rounded-lg group-hover:opacity-75 transition-opacity">
        <AvatarImage src={user.image_url || ""} alt={user.name} />
        <AvatarFallback className="rounded-lg text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity",
          isPending ? "opacity-100" : "group-hover:opacity-100",
        )}
      >
        {isPending ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <Upload className="h-6 w-6 text-white" />
        )}
      </div>
    </div>
  );
}
