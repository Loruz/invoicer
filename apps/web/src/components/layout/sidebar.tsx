"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  FolderKanban,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  CheckSquare,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/time", label: "Time Tracking", icon: Clock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="flex w-60 flex-col border-r border-[#E8ECF1] bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 pt-6 pb-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F766E]">
          <CheckSquare className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Invoicer
        </span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-0.5 px-4">
        {mainNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto border-t border-[#E8ECF1] px-4 pt-3 pb-4">
        {/* Settings */}
        <Link
          href="/settings"
          className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "bg-blue-50 text-blue-700"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings
            className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
              pathname === "/settings" || pathname.startsWith("/settings/")
                ? "text-blue-600"
                : "text-slate-400 group-hover:text-slate-600"
            }`}
          />
          Settings
        </Link>

        {/* User profile */}
        <div className="mt-3 flex items-center gap-2.5 px-3">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-slate-900">
              {user?.fullName || "User"}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
