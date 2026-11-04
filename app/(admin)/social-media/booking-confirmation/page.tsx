import { Metadata } from "next";
import { BookingConfirmationGenerator } from "@/components/social-media/booking-confirmation/booking-confirmation-generator";

export const metadata: Metadata = {
  title: "Booking Confirmation Generator | Social Media Tools",
  description: "Create and export official booking confirmation documents and PDFs for clients and social media.",
};

export default function BookingConfirmationPage() {
  return (
    <div className="w-full min-w-0 py-2">
      <BookingConfirmationGenerator />
    </div>
  );
}

