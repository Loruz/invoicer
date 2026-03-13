import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatCurrency } from "@invoicer/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  const user = await getAuthenticatedUser();

  const allProjects = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    orderBy: desc(projects.createdAt),
    with: {
      client: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button render={<Link href="/projects/new" />}>
          <Plus data-icon="inline-start" />
          New Project
        </Button>
      </div>

      {allProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No projects yet. Create your first project to start tracking time.
          </p>
          <Button variant="outline" render={<Link href="/projects/new" />}>
            <Plus data-icon="inline-start" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {project.color && (
                      <span
                        className="inline-block size-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <CardTitle className="truncate">{project.name}</CardTitle>
                  </div>
                  <CardAction>
                    <Badge
                      variant={project.isActive ? "default" : "secondary"}
                    >
                      {project.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardAction>
                  <CardDescription className="truncate">
                    {project.client.companyName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.hourlyRate != null ? (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(project.hourlyRate, project.currency)}
                      /hr
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hourly rate set
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
