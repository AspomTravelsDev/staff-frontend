import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/session";

const defaultApiUrl = process.env.NODE_ENV === "production"
  ? "https://api.aspomportal.com"
  : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

interface EnhanceTextRequest {
  type: "home_ties" | "source_of_funds" | "purpose_narrative" | "sponsorship";
  raw_text: string;
  category?: string;
  selected_tags?: string[];
  applicant_name?: string;
  job_title?: string;
  company_name?: string;
  destination_country?: string;
}

// Clean and normalize rough input for natural syntactic insertion
function cleanSnippet(text: string): string {
  let cleaned = text.trim();
  // Remove leading introductory phrases like "e.g.", "note:", "details:"
  cleaned = cleaned.replace(/^(e\.g\.?|details?:|notes?:|i have|my|stated:)\s*/i, "");
  // Remove trailing period if present so it integrates into sentences
  cleaned = cleaned.replace(/[.;,]+$/, "").trim();
  return cleaned || text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhanceTextRequest = await request.json();
    const rawText = (body.raw_text || "").trim();
    const type = body.type || "home_ties";
    const category = body.category || "";
    const applicantName = body.applicant_name?.trim() || "the applicant";
    const jobTitle = body.job_title?.trim() || "Professional";
    const companyName = body.company_name?.trim() || "my employer";
    const destinationCountry = body.destination_country?.trim() || "the destination country";

    if (!rawText) {
      return NextResponse.json({ error: "Please enter some brief notes or points to enhance." }, { status: 400 });
    }

    const token = await getAuthToken();

    // 1. Attempt backend AI call if authenticated and available
    if (token) {
      try {
        const backendResponse = await fetch(`${API_URL}/api/visa/enhance-text/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          cache: "no-store",
        });

        if (backendResponse.ok) {
          const data = await backendResponse.json();
          if (data.options && Array.isArray(data.options)) {
            return NextResponse.json({ success: true, options: data.options });
          }
        }
      } catch (backendErr) {
        console.warn("Backend AI enhancement proxy error, using intelligent fallback generator:", backendErr);
      }
    }

    const snippet = cleanSnippet(rawText);
    const lowerText = rawText.toLowerCase();

    // 2. High Quality Contextual Consular Generator (3 distinct options per type)
    let options: Array<{ label: string; badge: string; text: string }> = [];

    if (type === "source_of_funds") {
      // Determine financial source category
      const isSalary = category === "salary" || /(salary|monthly|payroll|wage|allowance|remuneration|earned|bonus)/i.test(lowerText);
      const isBusiness = category === "business" || /(business|sales|profit|turnover|contract|commerce|enterprise|invoices|client)/i.test(lowerText);
      const isLumpSum = category === "lump_sum" || /(lump|sale of|sold|car|vehicle|land|liquidation|severance|gratuity|inheritance|gift)/i.test(lowerText);
      const isInvestment = category === "investments" || /(rent|tenant|shares|dividends|stock|crypto|treasury|mutual|asset yield)/i.test(lowerText);

      if (isSalary) {
        options = [
          {
            label: "Regular Employment Remuneration & Savings",
            badge: "Salary & Career Savings",
            text: `The financial resources demonstrated in my bank statement reflect regular monthly salary income and personal savings accumulated through my sustained employment as ${jobTitle} at ${companyName}. Over time, I have maintained disciplined financial management, and my compensation—principally ${snippet}—is credited directly into my salary account, providing unencumbered personal liquidity fully sufficient to cover all travel, accommodation, and incidental expenses for this journey.`,
          },
          {
            label: "Disciplined Accumulation & Liquid Savings Focus",
            badge: "Organic Savings Growth",
            text: `I will be self-sponsoring this visit entirely from personal funds earned through my professional career at ${companyName}. My primary source of funds stems from ${snippet}, complemented by prudent personal savings accrued over several years of continuous employment. These funds are readily available in liquid form in my personal bank account and will comfortably sustain my planned itinerary without financial strain or third-party recourse.`,
          },
          {
            label: "Verifiable Payroll & Documented Income Standard",
            badge: "Official Pay Records Backed",
            text: `The funds evidenced in my accompanying financial statement represent legitimate earned income derived from my position as ${jobTitle}, specifically ${snippet}. In support of this explanation, I have submitted my official bank statements, recent pay slips, and employment confirmation, attesting to the steady, verifiable origin of my closing balance and financial self-sufficiency for this visit.`,
          },
        ];
      } else if (isBusiness) {
        options = [
          {
            label: "Commercial Operations & Retained Earnings",
            badge: "Business Operations & Turnover",
            text: `The financial resources presented in my account statement represent legitimate business profits and operational proceeds derived from ${snippet}, alongside my professional earnings with ${companyName}. These funds have been built organically through regular commercial transactions, maintaining strong liquid reserves to finance all aspects of my visit to ${destinationCountry}.`,
          },
          {
            label: "Enterprise Revenue & Financial Growth",
            badge: "Commercial Cashflow",
            text: `My travel expenditures will be self-funded from personal savings and dividends derived from verified commercial operations, specifically ${snippet}. Through consistent enterprise turnover and prudent financial management, I maintain a healthy closing balance that comfortably covers flights, lodging, and living costs throughout my stay.`,
          },
          {
            label: "Documented Commercial Origin Focus",
            badge: "CAC & Corporate Records",
            text: `The capital reflected in my submitted account statements has been built through verifiable enterprise transactions (${snippet}). Enclosed with this application are relevant business registration documents and comprehensive bank statements, substantiating the lawful, unencumbered provenance of my funds.`,
          },
        ];
      } else if (isLumpSum) {
        options = [
          {
            label: "Transparent Asset Liquidation Explanation",
            badge: "Documented Asset Sale",
            text: `Regarding the notable credit transaction reflected on my bank statement, I wish to confirm that the funds originate from the lawful liquidation of personal property—specifically ${snippet}. This capital disposition complements my steady employment earnings as ${jobTitle} at ${companyName}, resulting in a clear, legitimate balance that fully finances my upcoming trip.`,
          },
          {
            label: "Specific Inflow & Supporting Proof Focus",
            badge: "Stamped Inflow Origin",
            text: `To provide complete transparency regarding my account statement, the substantial credit on record represents genuine proceeds realized from ${snippet}. These funds are personal, unencumbered, and fully accessible for my travel commitments, with supporting documentation enclosed to verify the transaction.`,
          },
          {
            label: "Capital Realization & Cumulative Savings Synergy",
            badge: "Combined Capital & Savings",
            text: `The closing balance on my financial statement combines ongoing personal savings with the proceeds from ${snippet}. This transaction represents genuine realization of personal capital, and when joined with my regular professional remuneration from ${companyName}, demonstrates unquestionable financial capacity for my visit to ${destinationCountry}.`,
          },
        ];
      } else if (isInvestment) {
        options = [
          {
            label: "Investment Portfolio & Yield Returns",
            badge: "Asset Yields & Rental",
            text: `The funds evidenced in my account statement derive from legitimate investment earnings and commercial yields—notably ${snippet}—alongside remuneration from my role as ${jobTitle} at ${companyName}. These diversified income streams ensure sustained financial liquidity, comfortably supporting all expenses related to my stay in ${destinationCountry}.`,
          },
          {
            label: "Balanced Income Portfolio & Liquidity Focus",
            badge: "Diversified Cashflow",
            text: `My financial capacity for this trip is supported by a combination of earned professional income and verified investment returns (${snippet}). The accumulated balance reflects organic financial growth and dependable cash flow, leaving ample disposable funds to cover all travel costs without financial hardship.`,
          },
          {
            label: "Verified Asset Returns & Documentation",
            badge: "Documented Proof of Yield",
            text: `I have accumulated the funds presented in my bank statements through diversified lawful income—notably ${snippet}—in tandem with my employment at ${companyName}. All underlying investment records and bank statements are attached to confirm the legitimate provenance of these funds.`,
          },
        ];
      } else {
        // Mixed or general
        options = [
          {
            label: "Comprehensive Self-Funding Explanation",
            badge: "Verified Personal Funds",
            text: `The financial resources evidenced in my bank account represent legitimate personal savings accumulated through ${snippet}, supplemented by my professional remuneration as ${jobTitle} at ${companyName}. These funds are unencumbered, liquid, and sufficient to cover all aspects of my planned visit to ${destinationCountry}.`,
          },
          {
            label: "Disciplined Financial Accumulation Narrative",
            badge: "Organic Savings Narrative",
            text: `I am fully self-funding this journey from personal financial reserves built over time through ${snippet}. My financial history demonstrates consistent economic activity, and the closing balance on my submitted account is fully accessible for my travel commitments.`,
          },
          {
            label: "Documented Provenance & Compliance Standard",
            badge: "Compliance & Origin Focus",
            text: `All funds reflected on my accompanying financial statement originate from verified, lawful sources (${snippet}). Enclosed with this application are official financial statements and supporting documentation attesting that the account balance is active, personal, and sufficient for my stay.`,
          },
        ];
      }
    } else if (type === "home_ties") {
      // Determine ties nature
      const hasFamily = /(married|spouse|wife|husband|child|children|kids|family|son|daughter|dependents?|parents?)/i.test(lowerText);
      const hasProperty = /(property|house|land|home|estate|real estate|apartment|bungalow|landed)/i.test(lowerText);
      const hasJob = /(job|career|work|project|employment|manager|company|role|lead|team|director|supervise|resumption|leave|contract)/i.test(lowerText);

      options = [
        {
          label: "Comprehensive Multi-Pillar Ties (Family, Career & Assets)",
          badge: "Full Ties Anchor",
          text: `I maintain deep personal, economic, and familial roots in Nigeria that mandate my return upon the conclusion of my visit. In my professional capacity as ${jobTitle} at ${companyName}, I hold critical operational responsibilities, while my domestic life is firmly anchored in Nigeria through ${snippet}. These multifaceted ties ensure that my trip to ${destinationCountry} is strictly temporary and that I will promptly return to Nigeria to fulfill my ongoing personal and professional commitments.`,
        },
        {
          label: "Executive Career Continuity & Operational Indispensability",
          badge: "Career & Resumption Obligations",
          text: `My primary economic anchor is my career as ${jobTitle} at ${companyName}, where I actively oversee key deliverables, coordinate field initiatives, and lead vital responsibilities (${snippet}). Having secured an approved leave of absence for the exact duration of this visit, I am contractually and professionally bound to resume my duties in Nigeria immediately following my travels.`,
        },
        {
          label: "Domestic Anchor & Family Responsibility Focus",
          badge: "Family & Social Anchors",
          text: `My most significant home ties are centered on my family and domestic responsibilities in Nigeria (${snippet}), which represent an unbreakable personal anchor. Supported by my established employment at ${companyName} and local economic commitments, my personal and social obligations in Nigeria ensure my strict adherence to all visa guidelines and guaranteed return home.`,
        },
      ];
    } else if (type === "sponsorship") {
      options = [
        {
          label: "Full Financial Undertaking Focus",
          badge: "All Expenses Covered",
          text: `I confirm that all expenses for this upcoming trip to ${destinationCountry}—including round-trip flight tickets, accommodation, meals, and incidental expenses—will be fully sponsored through ${snippet}. Supporting financial documentation and account statements have been attached to demonstrate financial capacity.`,
        },
        {
          label: "Spousal / Family Sponsorship Focus",
          badge: "Family Support",
          text: `This proposed trip is fully funded by my sponsor (${snippet}), who will bear total financial responsibility for flights, lodging, and daily upkeep throughout the visit to ${destinationCountry}. All funds are readily accessible for the duration of the trip.`,
        },
        {
          label: "Corporate / Business Sponsorship Focus",
          badge: "Organization Covered",
          text: `All travel-related expenditures for this visit to ${destinationCountry} are guaranteed and funded through ${snippet}. Official sponsorship documentation and financial records have been submitted in support of this application.`,
        },
      ];
    } else {
      // purpose_narrative
      options = [
        {
          label: "Tourism & Leisure Exploration Focus",
          badge: "Leisure Vacation",
          text: `The primary objective of my visit to ${destinationCountry} is strictly for tourism, relaxation, and leisure (${snippet}). I intend to explore notable cultural and historical landmarks during my stay before returning to Nigeria to resume my duties.`,
        },
        {
          label: "Cultural & Sightseeing Focus",
          badge: "Cultural Tour",
          text: `I am traveling to ${destinationCountry} for a short vacation to experience the rich culture, hospitality, and tourist attractions of the region (${snippet}). All arrangements for accommodation and local transport have been organized.`,
        },
        {
          label: "Vacation & Personal Refresh Focus",
          badge: "Holiday Visit",
          text: `This trip represents a scheduled vacation to ${destinationCountry} for personal relaxation (${snippet}). My visit is entirely temporary, and I look forward to taking this holiday before returning to my professional commitments in Nigeria.`,
        },
      ];
    }

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error("AI enhance text API error:", error);
    return NextResponse.json({ error: "Failed to enhance text using AI" }, { status: 500 });
  }
}

