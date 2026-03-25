import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track and manage payment transactions.
        </p>
      </div>

      <div className="rounded-xl border border-[#E8ECF1] bg-white py-16 text-center">
        <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-400">
          Payment tracking coming soon.
        </p>
      </div>
    </div>
  );
}
