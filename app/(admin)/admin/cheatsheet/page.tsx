import { CheatsheetAdminClient } from "./components/cheatsheet-admin-client";
import {
  getCheatsheetAnalytics,
  getCheatsheetItems,
  getCheatsheetQuestions,
  getCheatsheetSources,
} from "@/lib/api/cheatsheet-admin";

export const metadata = {
  title: "Cheatsheet Admin | Aspom Portal",
  description: "Manage cheatsheet sources and quiz questions.",
};

export default async function CheatsheetAdminPage() {
  const [sources, items, questions, analytics] = await Promise.all([
    getCheatsheetSources({ limit: 50 }),
    getCheatsheetItems({ limit: 50 }),
    getCheatsheetQuestions({ limit: 50 }),
    getCheatsheetAnalytics(),
  ]);

  return (
    <CheatsheetAdminClient
      initialSources={sources.items}
      initialItems={items.items}
      initialQuestions={questions.items}
      analytics={analytics}
    />
  );
}
