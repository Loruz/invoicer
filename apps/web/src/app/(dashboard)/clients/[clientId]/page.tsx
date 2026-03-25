import { getAuthenticatedUser } from "@/lib/auth";
import { getClientDetail, getClientProjects } from "@/lib/queries/clients";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, FolderKanban, Plus } from "lucide-react";
import { DeleteClientButton } from "@/components/clients/delete-client-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { clientId } = await params;

  const client = await getClientDetail(clientId, user.id);
  if (!client) notFound();

  const projectList = await getClientProjects(clientId, user.id);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1">{client.companyName}</h1>
        <Link href={`/clients/${clientId}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
        <DeleteClientButton clientId={clientId} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.contactName && (
              <p>
                <span className="text-muted-foreground">Contact:</span>{" "}
                {client.contactName}
              </p>
            )}
            {client.email && (
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                {client.email}
              </p>
            )}
            {client.phone && (
              <p>
                <span className="text-muted-foreground">Phone:</span>{" "}
                {client.phone}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.address && <p>{client.address}</p>}
            {(client.city || client.postalCode) && (
              <p>
                {[client.city, client.postalCode].filter(Boolean).join(", ")}
              </p>
            )}
            {client.country && <p>{client.country}</p>}
            {client.taxId && (
              <p>
                <span className="text-muted-foreground">Tax ID:</span>{" "}
                {client.taxId}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projects
          </h2>
          <Link href={`/projects/new?clientId=${clientId}`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
        {projectList.length === 0 ? (
          <p className="text-muted-foreground">
            No projects for this client yet.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {projectList.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {project.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <Badge
                      variant={project.isActive ? "default" : "secondary"}
                    >
                      {project.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
