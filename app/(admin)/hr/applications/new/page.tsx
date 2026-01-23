import { CreateApplicationForm } from "../components/create-application-form";

export default function NewApplicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Application</h1>
        <p className="text-muted-foreground">
          Create an onboarding application and invite the applicant
        </p>
      </div>

      <CreateApplicationForm />
    </div>
  );
}
