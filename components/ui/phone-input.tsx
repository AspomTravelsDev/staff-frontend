"use client";

import * as React from "react";
import { IconPhone } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Common country codes
const countryCodes = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+234", country: "NG", flag: "🇳🇬" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+64", country: "NZ", flag: "🇳🇿" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+966", country: "SA", flag: "🇸🇦" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+254", country: "KE", flag: "🇰🇪" },
  { code: "+233", country: "GH", flag: "🇬🇭" },
] as const;

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
}

function PhoneInput({
  value = "",
  onChange,
  placeholder = "Phone number",
  disabled = false,
  className,
  "aria-invalid": ariaInvalid,
}: PhoneInputProps) {
  // Parse value into country code and number
  const parseValue = React.useCallback((val: string) => {
    for (const { code } of countryCodes) {
      if (val.startsWith(code)) {
        return { countryCode: code, number: val.slice(code.length).trim() };
      }
    }
    return { countryCode: "+234", number: val.replace(/^\+\d+\s*/, "") };
  }, []);

  const { countryCode, number } = parseValue(value);

  const handleCountryChange = (newCode: string) => {
    onChange?.(`${newCode} ${number}`.trim());
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d\s-]/g, "");
    onChange?.(`${countryCode} ${newNumber}`.trim());
  };

  return (
    <div className={cn("flex gap-1", className)}>
      <Select
        value={countryCode}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-22.5 shrink-0" aria-invalid={ariaInvalid}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map(({ code, flag }) => (
            <SelectItem key={code} value={code}>
              <span className="flex items-center gap-1.5">
                <span>{flag}</span>
                <span className="text-muted-foreground">{code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative flex-1">
        <IconPhone className="text-muted-foreground absolute left-2 top-1/2 size-3.5 -translate-y-1/2" />
        <Input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className="pl-7"
        />
      </div>
    </div>
  );
}

export { PhoneInput, countryCodes };
