"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { FieldDefinition } from "@/lib/visa/fields";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PhoneInput } from "@/components/ui/phone-input";
import { FileUpload } from "@/components/ui/file-upload";
import { AddressField } from "./address-field";
import { TimelineField } from "./timeline-field";

interface FormFieldProps {
  field: FieldDefinition;
  className?: string;
}

export function FormField({ field, className }: FormFieldProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[field.name];
  const errorMessage = error?.message as string | undefined;

  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.name}
            {...register(field.name)}
            placeholder={field.placeholder}
            aria-invalid={!!error}
          />
        );

      case "email":
        return (
          <Input
            id={field.name}
            type="email"
            {...register(field.name)}
            placeholder={field.placeholder || "email@example.com"}
            aria-invalid={!!error}
          />
        );

      case "tel":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: f }) => (
              <PhoneInput
                value={f.value}
                onChange={f.onChange}
                placeholder={field.placeholder}
                aria-invalid={!!error}
              />
            )}
          />
        );

      case "date":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: f }) => (
              <DatePicker
                value={f.value ? new Date(f.value) : undefined}
                onChange={(date) => f.onChange(date?.toISOString())}
                placeholder={field.placeholder || "Select date"}
                aria-invalid={!!error}
              />
            )}
          />
        );

      case "select":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: f }) => (
              <Select value={f.value} onValueChange={f.onChange}>
                <SelectTrigger aria-invalid={!!error} className="w-full">
                  <SelectValue placeholder={field.placeholder || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );

      case "radio":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: f }) => (
              <RadioGroup
                value={f.value}
                onValueChange={f.onChange}
                className="flex flex-wrap gap-4"
              >
                {field.options?.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`${field.name}-${option.value}`}
                    />
                    <Label
                      htmlFor={`${field.name}-${option.value}`}
                      className="cursor-pointer font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        );

      case "checkbox":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: f }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={f.value}
                  onCheckedChange={f.onChange}
                />
                <Label
                  htmlFor={field.name}
                  className="cursor-pointer font-normal"
                >
                  {field.label}
                </Label>
              </div>
            )}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.name}
            {...register(field.name)}
            placeholder={field.placeholder}
            aria-invalid={!!error}
            rows={4}
          />
        );

      case "file":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: f }) => (
              <FileUpload
                value={f.value}
                onChange={f.onChange}
                aria-invalid={!!error}
              />
            )}
          />
        );

      case "address":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: f }) => (
              <AddressField
                value={f.value}
                onChange={f.onChange}
                error={error}
              />
            )}
          />
        );

      case "timeline":
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: f }) => (
              <TimelineField
                value={f.value}
                onChange={f.onChange}
                config={field.timelineConfig!}
              />
            )}
          />
        );

      default:
        return <Input id={field.name} {...register(field.name)} />;
    }
  };

  // Checkbox renders its own label
  if (field.type === "checkbox") {
    return (
      <div className={cn("space-y-1", className)}>
        {renderField()}
        {errorMessage && (
          <p className="text-destructive text-xs">{errorMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        htmlFor={field.name}
        className={cn(
          "text-sm font-medium",
          field.required &&
            "after:text-destructive after:ml-0.5 after:content-['*']",
        )}
      >
        {field.label}
      </Label>
      {renderField()}
      {field.description && !errorMessage && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
      {errorMessage && (
        <p className="text-destructive text-xs">{errorMessage}</p>
      )}
    </div>
  );
}
