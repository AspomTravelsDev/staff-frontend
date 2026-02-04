"use client";

import { useState } from "react";
import { LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clockOut } from "@/lib/api/clock-in";
import { toast } from "sonner";

export function ClockInWidget() {
  const [loading, setLoading] = useState(false);

  const handleClockOut = async () => {
    try {
      setLoading(true);
      const response = await clockOut();
      if (response.success) {
        toast.success("Successfully clocked out");
        // Optional: Show duration or summary in toast
        if (response.data.data.duration_minutes) {
          const hours = Math.floor(response.data.data.duration_minutes / 60);
          const minutes = response.data.data.duration_minutes % 60;
          toast.info(`Total duration: ${hours}h ${minutes}m`);
        }
      } else {
        toast.error(response.error?.error || "Failed to clock out");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClockOut}
      disabled={loading}
      variant="destructive"
      size="sm"
      className="gap-2"
    >
      <Clock className="h-4 w-4" />
      <span>{loading ? "Clocking Out..." : "Clock Out"}</span>
    </Button>
  );
}
