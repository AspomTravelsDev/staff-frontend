import { renderDataPage } from "@/lib/api/render-data-page";
import { getAnonymousComments, markAnonymousCommentsViewed } from "@/lib/api/anonymous-comments";
import { AnonymousCommentsClient } from "./components/anonymous-comments-client";

export const metadata = {
  title: "Anonymous Comments | HR",
  description: "View and manage anonymous feedback and suggestions from staff.",
};

export default async function HRAnonymousCommentsPage() {
  return renderDataPage(async () => {
  const comments = await getAnonymousComments();
  // Mark comments as viewed so that the notification badge clears
  await markAnonymousCommentsViewed().catch(() => {});

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anonymous Comments</h1>
          <p className="text-sm text-muted-foreground">
            Review honest feedback, suggestions, and concerns submitted by staff.
          </p>
        </div>
      </div>

      <AnonymousCommentsClient initialComments={comments} />
    </div>
  );

  }, "Unable to load anonymous feedback");
}
