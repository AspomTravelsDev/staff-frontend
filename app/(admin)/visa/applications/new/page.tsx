import { CreateApplicationForm } from "./components/create-application-form";

export const metadata = {
  title: "Create Visa Application | Aspom Travels",
  description: "Create a new visa application for a client",
};

export default function NewApplicationPage() {
  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create Visa Application</h1>
        <p className="text-muted-foreground mt-1">
          Create a new visa application and share the link with your client
        </p>
      </div>

      <CreateApplicationForm />
    </div>
  );
}
