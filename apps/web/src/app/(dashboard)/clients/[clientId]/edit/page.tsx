import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getAuthenticatedUser();
  const { clientId } = await params;

  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.userId, user.id)),
  });

  if (!client) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Client</h1>
      <ClientForm
        clientId={clientId}
        initialData={{
          companyName: client.companyName,
          contactName: client.contactName ?? undefined,
          email: client.email ?? undefined,
          phone: client.phone ?? undefined,
          address: client.address ?? undefined,
          city: client.city ?? undefined,
          country: client.country ?? undefined,
          postalCode: client.postalCode ?? undefined,
          taxId: client.taxId ?? undefined,
          notes: client.notes ?? undefined,
        }}
      />
    </div>
  );
}
