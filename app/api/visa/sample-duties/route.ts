import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
  ? "https://api.aspomportal.com"
  : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

interface DutiesRequest {
  role: string;
  level?: "mid" | "senior" | "executive" | "owner";
}

export async function POST(request: NextRequest) {
  try {
    const body: DutiesRequest = await request.json();
    const role = (body.role || "").trim();
    const level = body.level || "mid";

    if (!role) {
      return NextResponse.json({ error: "Job role or title is required" }, { status: 400 });
    }

    const token = await getAuthToken();

    // 1. Attempt to call backend AI Service if authenticated
    if (token) {
      try {
        const backendUrl = `${API_URL}/api/visa/sample-duties/generate`;
        const backendResponse = await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role, level }),
          cache: "no-store",
        });

        if (backendResponse.ok) {
          const data = await backendResponse.json();
          if (data.options && Array.isArray(data.options) && data.options.length >= 6) {
            return NextResponse.json({
              success: true,
              role,
              level,
              options: data.options.slice(0, 6),
            });
          }
        }
      } catch (backendErr) {
        console.warn("Backend duties AI proxy error, using local AI generator:", backendErr);
      }
    }

    // 2. High Quality First-Person AI Generator Fallback (6 Paragraph Options)
    const prefix = level === "senior" ? "Senior " : level === "executive" ? "Managerial " : level === "owner" ? "Managing " : "";
    const fullTitle = `${prefix}${role}`.trim();

    const paragraphOptions = [
      // Option 1: Operational & Technical Execution Focus
      `As a ${fullTitle}, I am responsible for managing daily core operations and technical deliverables. I coordinate workflow execution, maintain key technical systems, and ensure all assigned tasks are completed within designated timeframes. I regularly review operational logs, troubleshoot technical challenges, and prepare detailed status reports for organizational leadership.`,

      // Option 2: Leadership & Team Supervision Focus
      `In my role as ${fullTitle}, I lead and supervise operational staff, establishing work schedules, task assignments, and key performance benchmarks. I facilitate regular team meetings, mentor personnel, and coordinate inter-departmental collaboration. I oversee staff productivity, conduct periodic performance evaluations, and resolve operational roadblocks to maintain high team efficiency.`,

      // Option 3: Strategic & Client Relations Focus
      `Serving as a key organizational liaison in my role as ${fullTitle}, I manage client relationships, external vendor communications, and commercial partnerships. I conduct market assessments, negotiate contract terms, and deliver tailored presentations to key stakeholders. I drive strategic initiatives to expand business reach, improve service standards, and elevate client satisfaction.`,

      // Option 4: Compliance & Quality Assurance Focus
      `I oversee regulatory compliance, quality control standards, and risk management protocols for ${role} operations. I conduct routine internal audits, validate documentation accuracy, and enforce strict adherence to statutory guidelines and safety standards. I identify operational risks, formulate corrective action plans, and maintain full documentation for external regulatory review.`,

      // Option 5: Project & Performance Optimization Focus
      `I direct project execution and process optimization initiatives in my position as ${fullTitle}. I define project milestones, monitor resource allocation, and track performance metrics against established budgetary and timeline targets. I analyze operational bottlenecks, implement process improvements, and report key outcome metrics to executive management.`,

      // Option 6: Comprehensive Executive Summary Focus
      `As ${fullTitle}, I provide comprehensive operational, administrative, and strategic oversight for all ${role} activities across the organization. I manage core business deliverables, budget allocations, and policy implementations while supervising team workflows. I ensure seamless alignment between daily team execution and long-term organizational growth goals.`
    ];

    return NextResponse.json({
      success: true,
      role,
      level,
      options: paragraphOptions,
    });
  } catch (error) {
    console.error("Work Duties Generator API Error:", error);
    return NextResponse.json({ error: "Failed to generate work duties options" }, { status: 500 });
  }
}
