import { PlaceholderPage } from "@/components/placeholder-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Information Desk",
  description: "IT Information Desk",
};

export default function InformationDeskPage() {
  return (
    <PlaceholderPage
      title="Information Desk"
      description="IT Information Desk and resources."
    />
  );
}
