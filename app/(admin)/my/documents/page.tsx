export default function MyDocumentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <p className="text-muted-foreground">
        Access company documents and resources.
      </p>

      {/* TODO: Implement document library */}
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Document library interface coming soon
      </div>
    </div>
  );
}
