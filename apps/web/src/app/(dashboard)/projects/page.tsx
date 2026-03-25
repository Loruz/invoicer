import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { db } from "@/db";
import { clients, projects } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatCurrency } from "@invoicer/shared";

export default async function ProjectsPage() {
  const user = await getAuthenticatedUser();

  const allProjects = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    orderBy: desc(projects.createdAt),
    with: { client: true },
  });

  const [clientCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clients)
    .where(eq(clients.userId, user.id));
  const hasClients = (clientCount?.count || 0) > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track project progress, budgets, and deadlines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-[#E8ECF1] bg-white px-4 py-2 text-sm text-slate-600">
            All Projects
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>

      {allProjects.length === 0 ? (
        <div className="rounded-xl border border-[#E8ECF1] bg-white py-16 text-center">
          {!hasClients ? (
            <>
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-500 mb-1">
                Add a client first — projects belong to clients.
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Once you have a client, you can create projects and start tracking time.
              </p>
              <Link
                href="/clients/new"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#0C3350] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-4">
                No projects yet. Create your first project to start tracking time.
              </p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 rounded-lg border border-[#E8ECF1] px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2">
          {allProjects.map((project) => {
            const statusColors: Record<string, { bg: string; text: string }> = {
              active: { bg: "bg-emerald-50", text: "text-emerald-600" },
              "on hold": { bg: "bg-amber-50", text: "text-amber-600" },
              completed: { bg: "bg-blue-50", text: "text-blue-600" },
              inactive: { bg: "bg-slate-100", text: "text-slate-500" },
            };
            const status = project.isActive ? "active" : "inactive";
            const colors = statusColors[status] || statusColors.active;

            const rate = project.hourlyRate ?? 0;
            const budget = formatCurrency(rate * 120, project.currency); // estimated

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="rounded-xl border border-[#E8ECF1] bg-white p-6 transition-shadow hover:shadow-md">
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {project.client.companyName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Progress
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        —
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "50%",
                          backgroundColor: project.color || "#1e40af",
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 border-t border-[#E8ECF1] pt-4">
                    <div>
                      <p className="text-xs text-slate-400">Budget</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {budget}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Rate</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {project.hourlyRate
                          ? `${formatCurrency(project.hourlyRate, project.currency)}/hr`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
