import { LucideIcon, Lock } from "lucide-react";
import Link from "next/link";

interface QuickLinkButtonProps {
  icon: LucideIcon;
  title: string;
  url: string;
  color?: string;
  target?: "_blank" | "_self";
  disabled?: boolean;
}

export function QuickLinkButton({
  icon: Icon,
  title,
  url,
  color = "blue",
  target = "_blank",
  disabled = false,
}: QuickLinkButtonProps) {
  const colorStyles = {
    blue: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100",
    green:
      "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100",
    purple:
      "text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-100",
    orange:
      "text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-100",
    indigo:
      "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-100",
    rose: "text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100",
    sky: "text-sky-600 hover:text-sky-700 hover:bg-sky-50 border-sky-100",
    red: "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100",
    amber:
      "text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200",
  };

  const buttonContent = (
    <button
      type="button"
      disabled={disabled}
      className={`h-10 px-4 rounded-md border flex items-center justify-center gap-2 transition-all text-sm font-medium ${
        disabled
          ? "opacity-50 grayscale border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
          : `${colorStyles[color as keyof typeof colorStyles]} cursor-pointer`
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-semibold">{title}</span>
      {disabled && <Lock className="h-3 w-3 text-red-500" />}
    </button>
  );

  if (disabled) {
    return <div className="flex items-center gap-2">{buttonContent}</div>;
  }

  return (
    <Link href={url} target={target} className="flex items-center gap-2">
      {buttonContent}
    </Link>
  );
}
