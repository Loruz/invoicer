import { getAuthenticatedUser } from "@/lib/auth";
import { getInvoiceStats, getMonthlyRevenue, getRevenueByClient } from "@/lib/queries/reports";
import { formatCurrency } from "@invoicer/shared";
import { Download } from "lucide-react";
import { ChartBar } from "@/components/reports/chart-bar";

export default async function ReportsPage() {
  const user = await getAuthenticatedUser();
  const userCurrency = user.defaultCurrency ?? "USD";

  const [stats, monthlyRevenue, revenueByClient] = await Promise.all([
    getInvoiceStats(user.id),
    getMonthlyRevenue(user.id),
    getRevenueByClient(user.id),
  ]);

  const totalRevenue = Number(stats?.totalRevenue) || 0;
  const invoiceCount = Number(stats?.invoiceCount) || 0;
  const avgInvoiceValue = invoiceCount > 0 ? Math.round(totalRevenue / invoiceCount) : 0;
  const paidCount = Number(stats?.paidCount) || 0;
  const collectionRate = invoiceCount > 0 ? Math.round((paidCount / invoiceCount) * 1000) / 10 : 0;
  const overdueTotal = Number(stats?.overdueTotal) || 0;
  const overdueCount = Number(stats?.overdueCount) || 0;

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => Number(m.total) || 0), 1);

  const clientColors = ["#1e40af", "#16a34a", "#d97706", "#7c3aed", "#ec4899"];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze your business performance and financial trends.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350]">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(totalRevenue, userCurrency)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Avg. Invoice Value</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(avgInvoiceValue, userCurrency)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Collection Rate</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {collectionRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500">{paidCount} of {invoiceCount} invoices paid</p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-red-500">
            {formatCurrency(overdueTotal, userCurrency)}
          </p>
          <p className="mt-1 text-xs text-red-500">{overdueCount} invoices overdue</p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue Overview */}
        <div className="col-span-2 rounded-xl border border-[#E8ECF1] bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Revenue Overview</h2>
          </div>

          {monthlyRevenue.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No invoice data yet</p>
          ) : (
            <div className="flex items-end justify-between gap-4" style={{ height: "280px" }}>
              {monthlyRevenue.map((month, i) => {
                const totalHeight = Math.max((month.total / maxRevenue) * 100, 2);
                const paidHeight = Math.max((month.paid / maxRevenue) * 100, 0);
                return (
                  <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative w-full flex justify-center gap-1" style={{ height: "240px" }}>
                      <ChartBar
                        height={`${totalHeight}%`}
                        className="bg-blue-100"
                        label={`Total: ${formatCurrency(Number(month.total), userCurrency)}`}
                      />
                      <ChartBar
                        height={`${paidHeight}%`}
                        className="bg-blue-600"
                        label={`Paid: ${formatCurrency(Number(month.paid), userCurrency)}`}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{month.monthLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue by Client */}
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Revenue by Client</h2>
          </div>
          <div className="space-y-5">
            {revenueByClient.map((client, i) => {
              const percentage = totalRevenue > 0 ? Math.round((client.total / totalRevenue) * 1000) / 10 : 0;
              const barWidth = totalRevenue > 0 ? Math.round((client.total / totalRevenue) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: clientColors[i % clientColors.length] }} />
                      <span className="text-sm font-medium text-slate-900">{client.clientName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(client.total, userCurrency)}</span>
                      <span className="ml-2 text-xs text-slate-400">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: clientColors[i % clientColors.length] }} />
                  </div>
                </div>
              );
            })}
            {revenueByClient.length === 0 && (
              <p className="text-center text-sm text-slate-400">No revenue data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
