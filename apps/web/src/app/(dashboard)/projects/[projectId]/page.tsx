import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Clock, ArrowLeft } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";
import { getProjectDetail, getProjectTimeEntries } from "@/lib/queries/projects";
import { formatCurrency, formatDurationShort } from "@invoicer/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { projectId } = await params;

  const project = await getProjectDetail(projectId, user.id);
  if (!project) notFound();

  const recentEntries = await getProjectTimeEntries(projectId, user.id);

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/projects" />}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to Projects
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {project.color && (
            <span
              className="inline-block size-4 rounded-full shrink-0"
              style={{ backgroundColor: project.color }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Link
              href={`/clients/${project.clientId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {project.client.companyName}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href={`/projects/${project.id}/edit`} />}
          >
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm">{project.description}</p>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Hourly Rate
                </p>
                <p className="text-sm">
                  {project.hourlyRate != null
                    ? formatCurrency(project.hourlyRate, project.currency) +
                      "/hr"
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Currency
                </p>
                <p className="text-sm">{project.currency}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Status
              </p>
              <Badge variant={project.isActive ? "default" : "secondary"}>
                {project.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="mb-6" />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recent Time Entries</h2>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No time entries recorded for this project yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Billable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {entry.description || "No description"}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.startTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {entry.duration != null
                      ? formatDurationShort(entry.duration)
                      : "Running"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={entry.billable ? "default" : "outline"}
                    >
                      {entry.billable ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
