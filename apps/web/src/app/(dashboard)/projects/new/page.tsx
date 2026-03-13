import { ProjectForm } from "@/components/projects/project-form";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const clientId = typeof params.clientId === "string" ? params.clientId : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Project</h1>
      <ProjectForm defaultClientId={clientId} />
    </div>
  );
}
