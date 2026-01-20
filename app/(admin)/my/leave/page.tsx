export default function MyLeavePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-2xl font-semibold">My Leave</h1>
      <p className="text-muted-foreground">
        Apply for leave and track your leave balance.
      </p>

      {/* TODO: Implement leave application and history */}
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Leave application interface coming soon
      </div>
    </div>
  );
}
