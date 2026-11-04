export type InformationDeskKind = "visa" | "birth-services";
export type InformationCategory = "Checklist" | "Submission Info" | "Embassy Details" | "FAQ" | "Files";
export const INFORMATION_CATEGORIES: InformationCategory[] = ["Checklist", "Submission Info", "Embassy Details", "FAQ"];
export interface InformationEntry {
  id: string; category: InformationCategory; country: string | null; title: string; content: string;
  author_id: string; author?: { id: string; name: string; staff_id: string }; file?: { name: string; size: number }; created_at: string; updated_at: string;
}
export interface InformationInput { category: InformationCategory; country?: string | null; title: string; content: string }
const desks = {
  visa: { title: "Visa Information Desk", subject: "Visa", description: "Reference guides, checklists, and FAQs for visa processing.", basePath: "/visa/information-desk", staffPath: "/my/visa", resource: "/api/visa-information", categories: INFORMATION_CATEGORIES },
  "birth-services": { title: "Birth Services Information Desk", subject: "Birth Services", description: "Frequently asked questions and shared files for Birth Services.", basePath: "/birth-services/information-desk", staffPath: "/my/birth-services", resource: "/api/birth-services-information", categories: ["FAQ", "Files"] as InformationCategory[] },
} as const;
export function informationDesk(kind: InformationDeskKind) {
  if (kind !== "visa" && kind !== "birth-services") throw new Error("Unknown information desk.");
  return desks[kind];
}

export function informationCategoryLabel(desk: InformationDeskKind, category: InformationCategory) {
  return desk === "birth-services" && category === "FAQ" ? "FAQs" : category;
}

export function initialInformationContent(record?: InformationEntry | null) {
  const fallback = { checklist: [""], faqs: [{ question: "", answer: "" }], locations: [{ name: "", address: "", timings: "" }], notes: "" };
  if (!record?.content) return fallback;
  try {
    const parsed = JSON.parse(record.content);
    if (parsed.type === "checklist" && Array.isArray(parsed.items)) return { ...fallback, checklist: parsed.items.length ? parsed.items as string[] : [""] };
    if (parsed.type === "faq" && Array.isArray(parsed.faqs)) return { ...fallback, faqs: parsed.faqs.length ? parsed.faqs as { question: string; answer: string }[] : fallback.faqs };
    if (parsed.type === "locations" && Array.isArray(parsed.locations)) return { ...fallback, locations: parsed.locations.length ? parsed.locations as { name: string; address: string; timings: string }[] : fallback.locations, notes: String(parsed.notes ?? "") };
  } catch { /* Preserve older plain-text Visa entries when editing. */ }
  const escaped = record.content.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>");
  if (record.category === "Checklist") return { ...fallback, checklist: [record.content] };
  if (record.category === "FAQ") return { ...fallback, faqs: [{ question: record.title, answer: `<p>${escaped}</p>` }] };
  return { ...fallback, locations: [{ name: record.title, address: "", timings: "" }], notes: `<p>${escaped}</p>` };
}
