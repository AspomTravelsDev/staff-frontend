"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddressInput } from "@/lib/validations/visa";
import { cn } from "@/lib/utils";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";

interface AddressFieldProps {
  value?: AddressInput;
  onChange: (value: AddressInput) => void;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<AddressInput>>;
  className?: string;
}

export function AddressField({
  value,
  onChange,
  error,
  className,
}: AddressFieldProps) {
  const handleChange = (field: keyof AddressInput, fieldValue: string) => {
    onChange({
      street: value?.street || "",
      city: value?.city || "",
      state: value?.state || "",
      postal_code: value?.postal_code || "",
      country: value?.country || "",
      [field]: fieldValue,
    });
  };

  const getFieldError = (field: keyof AddressInput) => {
    if (!error) return undefined;
    if (typeof error === "object" && field in error) {
      return (error as Record<string, FieldError>)[field]?.message;
    }
    return undefined;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1.5">
        <Label htmlFor="street" className="text-xs">
          Street Address
        </Label>
        <Input
          id="street"
          value={value?.street || ""}
          onChange={(e) => handleChange("street", e.target.value)}
          placeholder="123 Main Street, Apt 4B"
          aria-invalid={!!getFieldError("street")}
        />
        {getFieldError("street") && (
          <p className="text-destructive text-xs">{getFieldError("street")}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs">
            City
          </Label>
          <Input
            id="city"
            value={value?.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="City"
            aria-invalid={!!getFieldError("city")}
          />
          {getFieldError("city") && (
            <p className="text-destructive text-xs">{getFieldError("city")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state" className="text-xs">
            State / Province
          </Label>
          <Input
            id="state"
            value={value?.state || ""}
            onChange={(e) => handleChange("state", e.target.value)}
            placeholder="State"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="postal_code" className="text-xs">
            Postal / ZIP Code
          </Label>
          <Input
            id="postal_code"
            value={value?.postal_code || ""}
            onChange={(e) => handleChange("postal_code", e.target.value)}
            placeholder="Postal code"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-xs">
            Country
          </Label>
          <Input
            id="country"
            value={value?.country || ""}
            onChange={(e) => handleChange("country", e.target.value)}
            placeholder="Country"
            aria-invalid={!!getFieldError("country")}
          />
          {getFieldError("country") && (
            <p className="text-destructive text-xs">
              {getFieldError("country")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
