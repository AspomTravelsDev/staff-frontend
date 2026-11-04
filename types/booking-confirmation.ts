export type BookingPlatform = "airbnb" | "booking" | "vrbo" | "aspom";

export interface BookingConfirmationData {
  platform: BookingPlatform;
  listingTitle: string;
  checkInDate: string; // e.g. "Fri, Oct 30"
  checkInTime: string; // e.g. "2:00 PM"
  checkOutDate: string; // e.g. "Sun, Nov 29"
  checkOutTime: string; // e.g. "11:00 AM"
  hostPhone: string; // e.g. "+1 246-231-9028"
  guestCountText: string; // e.g. "1 guest"
  guestNames: string; // e.g. "Adibe Chiamaka Loveline"
  confirmationCode: string; // e.g. "HMSE4A3T3B"
  location: string; // e.g. "Bridgetown, Saint Michael, Barbados"
  hostName: string; // e.g. "Zahra"
  customLogoUrl?: string;
}

export const SAMPLE_BOOKING_DATA: BookingConfirmationData = {
  platform: "airbnb",
  listingTitle: "Berecah Apartment on Government Hill, St. Michael",
  checkInDate: "Fri, Oct 30",
  checkInTime: "2:00 PM",
  checkOutDate: "Sun, Nov 29",
  checkOutTime: "11:00 AM",
  hostPhone: "+1 246-231-9028",
  guestCountText: "1 guest",
  guestNames: "Adibe Chiamaka Loveline",
  confirmationCode: "HMSE4A3T3B",
  location: "Bridgetown, Saint Michael, Barbados",
  hostName: "Zahra",
};

export const EMPTY_BOOKING_DATA: BookingConfirmationData = {
  platform: "airbnb",
  listingTitle: "",
  checkInDate: "",
  checkInTime: "2:00 PM",
  checkOutDate: "",
  checkOutTime: "11:00 AM",
  hostPhone: "",
  guestCountText: "1 guest",
  guestNames: "",
  confirmationCode: "",
  location: "",
  hostName: "",
};

export function generateBookingConfirmationCode(prefix = "HM", length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable chars without ambiguous 0/O 1/I
  const randomLength = Math.max(1, length - prefix.length);
  let randomPart = "";
  for (let i = 0; i < randomLength; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${randomPart}`;
}

