export const recruitmentTracks = {
  hr: "HR/Admin",
  operations: "Office operations",
  sales: "Sales & social media",
  visa: "Visa",
  accounts: "Accounts",
  it: "IT & Web",
  compliance: "Compliance",
  graduate: "Graduate trainees",
};

// Keep the vacancy's department aligned with its fixed assessment content.
export function departmentForAssessment(track: string): string {
  const departments: Record<string, string> = {
    hr: "HR",
    operations: "Office Operations",
    sales: "Social Media",
    visa: "Visa",
    accounts: "Accounts",
    it: "IT",
    compliance: "Compliance",
    graduate: "Graduate Trainees",
  };
  return departments[track] ?? "";
}
