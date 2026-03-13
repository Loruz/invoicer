import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default async function ClientsPage() {
  const user = await getAuthenticatedUser();
  const clientList = await db.query.clients.findMany({
    where: eq(clients.userId, user.id),
    orderBy: desc(clients.createdAt),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      {clientList.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No clients yet. Create your first client to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientList.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {client.companyName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client.contactName && (
                    <p className="text-sm text-muted-foreground">
                      {client.contactName}
                    </p>
                  )}
                  {client.email && (
                    <p className="text-sm text-muted-foreground">
                      {client.email}
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
