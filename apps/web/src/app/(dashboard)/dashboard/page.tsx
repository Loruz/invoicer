import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { clients, invoices, projects, timeEntries } from "@/db/schema";
import { eq, and, sql, desc, gte, isNotNull } from "drizzle-orm";
import { formatCurrency } from "@invoicer/shared";
import { SetupChecklist, type SetupStatus } from "@/components/onboarding/setup-checklist";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const userCurrency = user.defaultCurrency ?? "USD";

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Revenue this month vs last month
  const [revenueStats] = await db
    .select({
      thisMonth: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.paidAt} >= ${startOfMonth} THEN ${invoices.total} ELSE 0 END), 0)`,
      lastMonth: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.paidAt} >= ${startOfLastMonth} AND ${invoices.paidAt} < ${startOfMonth} THEN ${invoices.total} ELSE 0 END), 0)`,
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
      pendingAmount: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('sent', 'draft') THEN ${invoices.total} ELSE 0 END), 0)`,
      pendingCount: sql<number>`COUNT(CASE WHEN ${invoices.status} IN ('sent', 'draft') THEN 1 END)`,
    })
    .from(invoices)
    .where(eq(invoices.userId, user.id));

  // Client stats
  const [clientStats] = await db
    .select({
      totalClients: sql<number>`COUNT(*)`,
      newThisMonth: sql<number>`COUNT(CASE WHEN ${clients.createdAt} >= ${startOfMonth} THEN 1 END)`,
    })
    .from(clients)
    .where(eq(clients.userId, user.id));

  // Time tracked this month vs last month
  const [timeStats] = await db
    .select({
      thisMonth: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntries.startTime} >= ${startOfMonth} THEN ${timeEntries.duration} ELSE 0 END), 0)`,
      lastMonth: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntries.startTime} >= ${startOfLastMonth} AND ${timeEntries.startTime} < ${startOfMonth} THEN ${timeEntries.duration} ELSE 0 END), 0)`,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, user.id),
        isNotNull(timeEntries.duration)
      )
    );

  const totalHours = Math.floor((timeStats?.thisMonth || 0) / 3600);
  const totalMinutes = Math.floor(((timeStats?.thisMonth || 0) % 3600) / 60);

  // Compute month-over-month changes
  function pctChange(current: number | string, previous: number | string): string {
    const cur = Number(current) || 0;
    const prev = Number(previous) || 0;
    if (prev === 0 && cur === 0) return "0%";
    if (prev === 0) return "New";
    const pct = ((cur - prev) / prev * 100).toFixed(1);
    return `${Number(pct) >= 0 ? "+" : ""}${pct}%`;
  }

  const revenueChange = pctChange(revenueStats?.thisMonth ?? 0, revenueStats?.lastMonth ?? 0);
  const timeChange = pctChange(timeStats?.thisMonth ?? 0, timeStats?.lastMonth ?? 0);
  const newClientsThisMonth = clientStats?.newThisMonth || 0;

  // Recent invoices
  const recentInvoices = await db.query.invoices.findMany({
    where: eq(invoices.userId, user.id),
    with: { client: true },
    orderBy: [desc(invoices.createdAt)],
    limit: 4,
  });

  // Active projects
  const activeProjects = await db.query.projects.findMany({
    where: and(eq(projects.userId, user.id), eq(projects.isActive, true)),
    with: { client: true },
    limit: 4,
  });

  // Time entry count for setup status
  const [entryCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(timeEntries)
    .where(eq(timeEntries.userId, user.id));

  const setupStatus: SetupStatus = {
    hasCompanyInfo: !!user.businessName,
    hasClients: (clientStats?.totalClients || 0) > 0,
    hasProjects: activeProjects.length > 0,
    hasTimeEntries: (entryCount?.count || 0) > 0,
  };

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div>
      {/* Setup Checklist */}
      <SetupChecklist status={setupStatus} />

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(revenueStats?.totalRevenue || 0, userCurrency)}
          </p>
          {revenueChange && (
            <p className={`mt-1 text-xs ${(revenueStats?.thisMonth || 0) >= (revenueStats?.lastMonth || 0) ? "text-emerald-600" : "text-red-500"}`}>
              {revenueChange} from last month
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Hours Tracked</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalHours}h{totalMinutes > 0 ? ` ${totalMinutes}m` : ""}
          </p>
          {timeChange && (
            <p className={`mt-1 text-xs ${(timeStats?.thisMonth || 0) >= (timeStats?.lastMonth || 0) ? "text-emerald-600" : "text-red-500"}`}>
              {timeChange} from last month
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Pending Invoices</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">
            {formatCurrency(revenueStats?.pendingAmount || 0, userCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {revenueStats?.pendingCount || 0} invoices awaiting
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Active Clients</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {clientStats?.totalClients || 0}
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            {newClientsThisMonth > 0 ? `+${newClientsThisMonth} new this month` : "No new clients this month"}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Invoices */}
        <div className="col-span-2 rounded-xl border border-[#E8ECF1] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Invoices
            </h2>
            <Link
              href="/invoices"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-0">
            {recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="flex items-center justify-between border-b border-slate-100 py-4 last:border-b-0 hover:bg-slate-50 -mx-2 px-2 rounded"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {invoice.invoiceNumber} - {invoice.client?.companyName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {invoice.issueDate
                      ? new Date(invoice.issueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                  <StatusBadge status={invoice.status} />
                </div>
              </Link>
            ))}
            {recentInvoices.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                No invoices yet
              </p>
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Active Projects
            </h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-5">
            {activeProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    {project.name}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mb-1">{project.client.companyName}</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "100%",
                      backgroundColor: project.color || "#1e40af",
                    }}
                  />
                </div>
              </Link>
            ))}
            {activeProjects.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                No active projects
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-50 text-blue-600",
    paid: "bg-emerald-50 text-emerald-600",
    overdue: "bg-red-50 text-red-600",
    cancelled: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] || styles.draft
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
