import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aspom Travels Staff Portal",
    short_name: "Aspom Portal",
    description:
      "Aspom Travels official staff portal for daily tasks, attendance, clock-in, and operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Clock In / Attendance",
        short_name: "Attendance",
        description: "Quickly record daily clock-in or view punctuality",
        url: "/my/attendance",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Daily Tasks & Reports",
        short_name: "Tasks",
        description: "Manage to-do list and submit daily work report",
        url: "/my/tasks",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Request Leave",
        short_name: "Leave",
        description: "Apply for annual or emergency leave",
        url: "/my/leave",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Staff Dashboard",
        short_name: "Dashboard",
        description: "Open the staff portal home screen",
        url: "/dashboard",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
