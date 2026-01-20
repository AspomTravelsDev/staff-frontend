export default function MyExpensesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-2xl font-semibold">My Expenses</h1>
      <p className="text-muted-foreground">
        Submit expense claims and track reimbursements.
      </p>

      {/* TODO: Implement expense submission and history */}
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Expense submission interface coming soon
      </div>
    </div>
  );
}
