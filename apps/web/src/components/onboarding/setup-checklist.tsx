import Link from "next/link";
import {
  Building2,
  Users,
  FolderKanban,
  Clock,
  Check,
  ArrowRight,
} from "lucide-react";

export interface SetupStatus {
  hasCompanyInfo: boolean;
  hasClients: boolean;
  hasProjects: boolean;
  hasTimeEntries: boolean;
}

const STEPS = [
  {
    key: "hasCompanyInfo" as const,
    label: "Set up company info",
    href: "/settings",
    icon: Building2,
  },
  {
    key: "hasClients" as const,
    label: "Add your first client",
    href: "/clients/new",
    icon: Users,
  },
  {
    key: "hasProjects" as const,
    label: "Create a project",
    href: "/projects/new",
    icon: FolderKanban,
  },
  {
    key: "hasTimeEntries" as const,
    label: "Track your first hour",
    href: "/time",
    icon: Clock,
  },
];

export function SetupChecklist({ status }: { status: SetupStatus }) {
  const completedCount = STEPS.filter((s) => status[s.key]).length;

  // Don't render if all steps are complete
  if (completedCount === STEPS.length) return null;

  const progress = (completedCount / STEPS.length) * 100;

  return (
    <div className="mb-8 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-900">
          Complete your setup
        </h2>
        <span className="text-sm text-slate-500">
          {completedCount} of {STEPS.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-200/70 mb-5">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 gap-3">
        {STEPS.map((step) => {
          const done = status[step.key];
          const Icon = step.icon;

          if (done) {
            return (
              <div
                key={step.key}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 shrink-0">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-slate-400 line-through">
                  {step.label}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={step.key}
              href={step.href}
              className="flex items-center gap-3 rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 hover:bg-slate-50 hover:border-blue-200 transition-colors group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 shrink-0 group-hover:bg-blue-100 transition-colors">
                <Icon className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 flex-1">
                {step.label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
