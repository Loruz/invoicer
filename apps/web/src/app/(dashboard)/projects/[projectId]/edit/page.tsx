import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { getProjectForEdit } from "@/lib/queries/projects";
import { ProjectForm } from "@/components/projects/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { projectId } = await params;

  const project = await getProjectForEdit(projectId, user.id);
  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      <ProjectForm
        projectId={project.id}
        initialData={{
          name: project.name,
          clientId: project.clientId,
          description: project.description ?? "",
          hourlyRate: project.hourlyRate ?? undefined,
          currency: project.currency,
          color: project.color ?? "",
          isActive: project.isActive,
        }}
      />
    </div>
  );
}
