"use client";

import React, { forwardRef } from "react";
import { BookingConfirmationData } from "@/types/booking-confirmation";
import { IconBrandAirbnb, IconBrandBooking, IconPhoneFilled } from "@tabler/icons-react";

interface BookingPreviewDocumentProps {
  data: BookingConfirmationData;
  className?: string;
}

export const BookingPreviewDocument = forwardRef<HTMLDivElement, BookingPreviewDocumentProps>(
  function BookingPreviewDocument({ data, className = "" }, ref) {
    const {
      platform,
      listingTitle,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      hostPhone,
      guestCountText,
      guestNames,
      confirmationCode,
      location,
      hostName,
      customLogoUrl,
    } = data;

    return (
      <div
        ref={ref}
        id="booking-document-root"
        className={`bg-white text-[#222222] shadow-xl select-text border border-[#E5E7EB] rounded-sm print:border-none print:shadow-none print:rounded-none w-[620px] min-h-[877px] px-12 pt-12 pb-14 flex flex-col justify-between ${className}`}
        style={{
          colorScheme: "light",
          backgroundColor: "#ffffff",
          color: "#222222",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* TOP CONTENT AREA */}
        <div className="w-full">
          {/* LOGO HEADER */}
          <div className="mb-6 flex items-center">
            {platform === "airbnb" && (
              <div className="text-[#FF385C]" aria-label="Airbnb Logo">
                <IconBrandAirbnb size={38} stroke={2.2} color="#FF385C" />
              </div>
            )}

            {platform === "booking" && (
              <div className="flex items-center gap-2">
                <div className="bg-[#003580] text-white p-1 rounded">
                  <IconBrandBooking size={24} stroke={2} />
                </div>
                <span className="text-[#003580] font-black tracking-tight text-xl">
                  Booking.com
                </span>
              </div>
            )}

            {platform === "vrbo" && (
              <div className="text-[#002f6c] font-black text-2xl tracking-tighter">
                vrbo
              </div>
            )}

            {platform === "aspom" && (
              <div className="flex items-center gap-2">
                {customLogoUrl ? (
                  <img
                    src={customLogoUrl}
                    alt="Custom Logo"
                    className="h-9 object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E51B24] flex items-center justify-center text-white font-bold text-sm">
                      A
                    </div>
                    <span className="font-bold text-base tracking-tight text-[#1a1a1a]">
                      ASPOM TRAVELS
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LISTING TITLE */}
          <h1 className="text-[25px] font-bold text-[#222222] leading-[1.25] tracking-[-0.015em] mb-6">
            {listingTitle || "Berecah Apartment on Government Hill, St. Michael"}
          </h1>

          {/* DIVIDER 1 */}
          <div className="w-full border-b border-[#EBEBEB] my-5" />

          {/* CHECK-IN & CHECKOUT SECTION */}
          <div className="w-full">
            <div className="flex justify-between items-start">
              {/* Check-in */}
              <div>
                <div className="text-[14.5px] font-bold text-[#222222] leading-tight mb-1">
                  Check-in
                </div>
                <div className="text-[14px] font-normal text-[#222222] leading-[1.35]">
                  {checkInTime || "2:00 PM"}
                </div>
                <div className="text-[14px] font-normal text-[#222222] leading-[1.35]">
                  {checkInDate || "Fri, Oct 30"}
                </div>
              </div>

              {/* Checkout */}
              <div className="text-right">
                <div className="text-[14.5px] font-bold text-[#222222] leading-tight mb-1">
                  Checkout
                </div>
                <div className="text-[14px] font-normal text-[#222222] leading-[1.35]">
                  {checkOutTime || "11:00 AM"}
                </div>
                <div className="text-[14px] font-normal text-[#222222] leading-[1.35]">
                  {checkOutDate || "Sun, Nov 29"}
                </div>
              </div>
            </div>

            {/* CALL HOST ROW */}
            <div className="mt-5 flex items-center gap-2.5 text-[#008489]">
              <IconPhoneFilled size={15} color="#008489" className="shrink-0" />
              <span className="text-[14px] font-bold text-[#008489]">
                Call host: {hostPhone || "+1 246-231-9028"}
              </span>
            </div>
          </div>

          {/* DIVIDER 2 */}
          <div className="w-full border-b border-[#EBEBEB] my-5" />

          {/* WHO'S COMING SECTION */}
          <div className="w-full">
            <div className="text-[14.5px] font-bold text-[#222222] leading-tight mb-1">
              Who&apos;s coming
            </div>
            <div className="text-[14px] font-normal text-[#222222] leading-[1.35]">
              {guestCountText || "1 guest"}
            </div>
            <div className="text-[14px] font-normal text-[#222222] leading-[1.35] whitespace-pre-line">
              {guestNames || "Adibe Chiamaka Loveline"}
            </div>
          </div>

          {/* DIVIDER 3 */}
          <div className="w-full border-b border-[#EBEBEB] my-5" />

          {/* CONFIRMATION CODE SECTION */}
          <div className="w-full">
            <div className="text-[14.5px] font-bold text-[#222222] leading-tight mb-1">
              Confirmation code
            </div>
            <div className="text-[14px] font-normal text-[#222222] leading-[1.35] tracking-[0.02em] uppercase">
              {confirmationCode || "HMSE4A3T3B"}
            </div>
          </div>

          {/* DIVIDER 4 */}
          <div className="w-full border-b border-[#EBEBEB] my-5" />

          {/* LOCATION SECTION */}
          <div className="w-full">
            <div className="text-[14px] font-bold text-[#222222] leading-[1.35]">
              {location || "Bridgetown, Saint Michael, Barbados"}
            </div>
          </div>

          {/* DIVIDER 5 */}
          <div className="w-full border-b border-[#EBEBEB] my-5" />

          {/* HOSTED BY SECTION */}
          <div className="w-full">
            <div className="text-[14px] font-bold text-[#222222] leading-[1.35]">
              {hostName ? (
                hostName.toLowerCase().startsWith("hosted by") ? (
                  hostName
                ) : (
                  `Hosted by ${hostName}`
                )
              ) : (
                "Hosted by Zahra"
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM WHITESPACE (Clean A4 margin matching reference document) */}
        <div className="mt-12 flex-1" />
      </div>
    );
  }
);
