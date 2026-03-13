import { notFound } from "next/navigation";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { ProjectForm } from "@/components/projects/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { projectId } = await params;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
  });

  if (!project) {
    notFound();
  }

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
