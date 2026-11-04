"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Crown,
  Cake,
  Gift,
  Heart,
  Trophy,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { parseISO, differenceInYears, differenceInMonths } from "date-fns";
import { Employee } from "@/lib/api/employees";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getAnniversarySubtitle(
  joinDateStr: string | null | undefined,
): string {
  if (!joinDateStr) return "Celebrating a career milestone!";
  const joinDate = parseISO(joinDateStr);
  const now = new Date();
  const years = differenceInYears(now, joinDate);
  if (years >= 1) {
    return `Celebrating ${years} year${years > 1 ? "s" : ""} at ASPOM!`;
  }
  const months = differenceInMonths(now, joinDate);
  if (months === 1) return "Celebrating 1 month milestone!";
  if (months === 3) return "Celebrating 3 months milestone!";
  if (months === 6) return "Celebrating 6 months milestone!";
  if (months > 0) return `Celebrating ${months} months milestone!`;
  return "Celebrating a career milestone!";
}

interface DashboardCelebrationCardProps {
  monthlyAwards?: {
    id: string;
    name: string;
    role: string;
    image?: string | null;
    initials: string;
    awardName: string;
  }[];
  todayBirthdays: Employee[];
  todayAnniversaries: Employee[];
  className?: string;
}

export function DashboardCelebrationCard({
  monthlyAwards,
  todayBirthdays,
  todayAnniversaries,
  className,
}: DashboardCelebrationCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [];

  // 1. Birthday Slide
  if (todayBirthdays.length > 0) {
    const primaryBirthday = todayBirthdays[0];
    const birthdayNames = todayBirthdays.map((e) => e.firstName).join(" & ");
    slides.push({
      type: "birthday",
      content: (
        <div className="flex flex-1 flex-col items-center justify-center p-4 pb-12 text-center sm:p-6 sm:pb-14 w-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="relative mb-4 group sm:mb-6">
            <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full scale-110 animate-pulse" />
            <Cake className="absolute -top-8 left-1/2 -translate-x-1/2 h-10 w-10 text-pink-500 animate-bounce z-10 drop-shadow-md" />
            <Gift className="absolute -left-6 top-0 h-6 w-6 text-pink-500 animate-pulse" />
            <Heart className="absolute -left-2 bottom-0 h-4 w-4 text-pink-500 animate-pulse delay-150" />
            <Avatar className="h-36 w-36 rounded-xl ring-4 ring-pink-500 ring-offset-4 ring-offset-background shadow-2xl relative z-0 sm:h-44 sm:w-44">
              <AvatarImage
                src={toProxiedImageUrl(primaryBirthday.image_url)}
                className="object-cover object-top"
              />
              <AvatarFallback className="bg-pink-100 text-pink-700 text-2xl font-bold">
                {primaryBirthday.firstName[0]}
                {primaryBirthday.lastName[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <Badge className="mb-2 bg-pink-500">TODAY&apos;S BIRTHDAY! 🎂</Badge>
          <CardTitle className="text-center mb-1">Happy Birthday!</CardTitle>
          <h3 className="max-w-full wrap-break-word font-bold text-xl text-pink-700 mb-1">
            {birthdayNames}
          </h3>
          <p className="text-sm text-muted-foreground">
            Celebrating an awesome colleague today!
          </p>
        </div>
      ),
      borderColor: "border-pink-200",
      bgColor: "bg-linear-to-b from-white to-pink-50/30",
    });
  }

  // 2. Anniversary Slide
  if (todayAnniversaries.length > 0) {
    const primaryAnniversary = todayAnniversaries[0];
    const anniversaryNames = todayAnniversaries
      .map((e) => e.firstName)
      .join(" & ");
    const subtitle = getAnniversarySubtitle(primaryAnniversary.joinDate);
    slides.push({
      type: "anniversary",
      content: (
        <div className="flex flex-1 flex-col items-center justify-center p-4 pb-12 text-center sm:p-6 sm:pb-14 w-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="relative mb-4 group sm:mb-6">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-110 animate-pulse" />
            <Trophy className="absolute -top-8 left-1/2 -translate-x-1/2 h-10 w-10 text-amber-500 animate-bounce z-10 drop-shadow-md" />
            <PartyPopper className="absolute -left-2 bottom-0 h-4 w-4 text-amber-500 animate-pulse delay-150" />
            <Avatar className="h-36 w-36 rounded-xl ring-4 ring-amber-500 ring-offset-4 ring-offset-background shadow-2xl relative z-0 sm:h-44 sm:w-44">
              <AvatarImage
                src={toProxiedImageUrl(primaryAnniversary.image_url)}
                className="object-cover object-top"
              />
              <AvatarFallback className="bg-amber-100 text-amber-700 text-2xl font-bold">
                {primaryAnniversary.firstName[0]}
                {primaryAnniversary.lastName[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <Badge className="mb-2 bg-amber-500">WORK ANNIVERSARY! 🏆</Badge>
          <CardTitle className="text-center mb-1">Congratulations!</CardTitle>
          <h3 className="max-w-full wrap-break-word font-bold text-xl text-amber-700 mb-1">
            {anniversaryNames}
          </h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      ),
      borderColor: "border-amber-200",
      bgColor: "bg-linear-to-b from-white to-amber-50/30",
    });
  }

  // 3. Monthly Awards Slides
  if (monthlyAwards && monthlyAwards.length > 0) {
    monthlyAwards.forEach((award) => {
      slides.push({
        type: `award-${award.id}`,
        content: (
          <div className="flex flex-1 flex-col items-center justify-center p-4 pb-12 text-center sm:p-6 sm:pb-14 w-full animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="relative mb-4 group sm:mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110 animate-pulse" />
              <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-10 w-10 text-primary fill-primary animate-bounce z-10 drop-shadow-md" />
              <Avatar className="h-36 w-36 rounded-xl ring-4 ring-primary ring-offset-4 ring-offset-background shadow-2xl relative z-0 sm:h-44 sm:w-44">
                <AvatarImage
                  src={award.image || ""}
                  alt={award.name}
                  className="object-cover object-top"
                />
                <AvatarFallback>{award.initials}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-center">{award.awardName}</CardTitle>
            <h3 className="max-w-full wrap-break-word font-bold text-lg">
              {award.name}
            </h3>
            <p className="text-sm text-muted-foreground">{award.role}</p>
          </div>
        ),
        borderColor: "border-border",
        bgColor: "bg-background",
      });
    });
  } else {
    slides.push({
      type: "no-awards",
      content: (
        <div className="flex flex-1 flex-col items-center justify-center p-4 pb-12 text-center sm:p-6 sm:pb-14 w-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="relative mb-4 group sm:mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110 animate-pulse" />
            <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-10 w-10 text-primary fill-primary animate-bounce z-10 drop-shadow-md" />
            <Avatar className="h-36 w-36 rounded-xl ring-4 ring-primary ring-offset-4 ring-offset-background shadow-2xl relative z-0 sm:h-44 sm:w-44">
              <AvatarFallback className="bg-muted">
                <Crown className="h-12 w-12 text-primary/40" />
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-center">Employee of the Month</CardTitle>
          <h3 className="font-bold text-lg">To be announced</h3>
          <p className="text-sm text-muted-foreground">
            Keep up the great work!
          </p>
        </div>
      ),
      borderColor: "border-border",
      bgColor: "bg-background",
    });
  }

  // Auto-cycle effect
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const activeSlide = slides[currentSlide];

  return (
    <Card
      className={cn(
        "relative flex w-full h-full min-h-[460px] sm:min-h-[480px] flex-col justify-between overflow-hidden transition-all duration-500",
        activeSlide.borderColor,
        activeSlide.bgColor,
        className,
      )}
    >
      <CardContent className="p-0 h-full flex flex-col items-center justify-center relative">
        {slides.map((slide, index) => (
          <div
            key={slide.type}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center transition-all duration-500",
              index === currentSlide
                ? "opacity-100 scale-100 pointer-events-auto visible"
                : "opacity-0 scale-95 pointer-events-none invisible",
            )}
          >
            {slide.content}
          </div>
        ))}

        {/* Navigation Controls */}
        {slides.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-1 flex items-center z-10">
              <Button
                aria-label="Previous celebration"
                title="Previous celebration"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full opacity-100 hover:opacity-100 transition-opacity md:h-8 md:w-8 md:opacity-20"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute inset-y-0 right-1 flex items-center z-10">
              <Button
                aria-label="Next celebration"
                title="Next celebration"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full opacity-100 hover:opacity-100 transition-opacity md:h-8 md:w-8 md:opacity-20"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 sm:bottom-4 sm:gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show celebration ${i + 1}`}
                  aria-current={i === currentSlide ? "true" : undefined}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  onClick={() => setCurrentSlide(i)}
                >
                  <span
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === currentSlide
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-muted-foreground/30",
                    )}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
