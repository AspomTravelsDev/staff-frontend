import { PlaceholderPage } from "@/components/placeholder-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visa Client List",
  description: "View and manage visa clients",
};

export default function VisaClientsPage() {
  return (
    <PlaceholderPage
      title="Visa Client List"
      description="View and manage visa clients."
    />
  );
}
