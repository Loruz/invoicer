import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { clients, projects, invoices } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { formatCurrency } from "@invoicer/shared";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const userCurrency = user.defaultCurrency ?? "USD";
  const { q } = await searchParams;

  const allClients = await db.query.clients.findMany({
    where: eq(clients.userId, user.id),
    orderBy: desc(clients.createdAt),
    with: { projects: true, invoices: true },
  });

  // Client-side search filter
  const clientList = q
    ? allClients.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q.toLowerCase()) ||
          c.contactName?.toLowerCase().includes(q.toLowerCase()) ||
          c.email?.toLowerCase().includes(q.toLowerCase())
      )
    : allClients;

  // Stats (always from allClients, not filtered)
  const totalClients = allClients.length;
  const activeProjectCount = allClients.reduce(
    (sum, c) => sum + (c.projects?.filter((p) => p.isActive)?.length || 0),
    0
  );
  const totalRevenue = allClients.reduce(
    (sum, c) =>
      sum +
      (c.invoices?.reduce(
        (s, inv) => s + (inv.status === "paid" ? inv.total : 0),
        0
      ) || 0),
    0
  );
  const outstanding = allClients.reduce(
    (sum, c) =>
      sum +
      (c.invoices?.reduce(
        (s, inv) =>
          s + (inv.status === "sent" || inv.status === "overdue" ? inv.total : 0),
        0
      ) || 0),
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your client relationships and contact details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form method="GET" className="flex items-center gap-2 rounded-lg border border-[#E8ECF1] bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search clients..."
              className="border-0 bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none"
            />
          </form>
          <Link
            href="/clients/new"
            className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Total Clients</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalClients}</p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Active Projects</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {activeProjectCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(totalRevenue, userCurrency)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">
            {formatCurrency(outstanding, userCurrency)}
          </p>
        </div>
      </div>

      {/* Client Table */}
      <div className="rounded-xl border border-[#E8ECF1] bg-white">
        {clientList.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            No clients yet. Create your first client to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8ECF1]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Billed
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {clientList.map((client) => {
                const initials = getInitials(client.companyName);
                const projectCount = client.projects?.length || 0;
                const totalBilled =
                  client.invoices?.reduce((s, inv) => s + inv.total, 0) || 0;
                const hasActiveProjects =
                  client.projects?.some((p) => p.isActive) ?? false;

                return (
                  <tr
                    key={client.id}
                    className="border-b border-[#E8ECF1] last:border-b-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/clients/${client.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {initials}
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {client.companyName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {client.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {projectCount} project{projectCount !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(totalBilled, userCurrency)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          hasActiveProjects
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {hasActiveProjects ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
