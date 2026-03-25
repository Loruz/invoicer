import Link from "next/link";
import { Clock, FileText, Users, BarChart3, Zap, Shield } from "lucide-react";

// ── Nav ────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Invoicer</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="transition-colors hover:text-slate-900">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-slate-900">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ───────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-16 sm:pt-24">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(to right, #0f172a 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      {/* Blue glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-100 opacity-40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
          <Zap className="h-3.5 w-3.5" />
          Time tracking built for freelancers
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Track time.{" "}
          <span className="relative whitespace-nowrap text-blue-600">
            Get paid.
          </span>
          {" "}Stay sane.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
          Invoicer makes it easy to track billable hours and turn them into
          professional invoices — all in one place.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Start for free
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            View dashboard
          </Link>
        </div>

        {/* Mock dashboard preview */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-200">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto flex-1 max-w-xs rounded-md border border-slate-100 bg-slate-50 px-3 py-1 text-center text-xs text-slate-400">
                app.invoicer.io/dashboard
              </div>
            </div>
            {/* Fake dashboard content */}
            <div className="flex h-72 overflow-hidden">
              {/* Sidebar stub */}
              <div className="hidden w-48 border-r border-slate-200 bg-white px-3 py-4 sm:block">
                <div className="mb-6 flex items-center gap-2 px-2">
                  <div className="h-6 w-6 rounded-md bg-blue-600" />
                  <div className="h-3 w-16 rounded bg-slate-200" />
                </div>
                {[80, 60, 70, 55, 65, 50].map((w, i) => (
                  <div key={i} className={`mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 0 ? "bg-blue-50" : ""}`}>
                    <div className={`h-3 w-3 rounded ${i === 0 ? "bg-blue-200" : "bg-slate-200"}`} />
                    <div className={`h-2 rounded ${i === 0 ? "bg-blue-200" : "bg-slate-100"}`} style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
              {/* Main area stub */}
              <div className="flex-1 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-5 w-32 rounded-md bg-slate-200" />
                  <div className="h-7 w-24 rounded-md bg-blue-100" />
                </div>
                {/* Calendar grid stub */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-8 rounded-md ${
                        i === 10 || i === 11 || i === 17 || i === 18
                          ? "bg-blue-100"
                          : i === 15
                          ? "bg-blue-500"
                          : "bg-slate-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────
const features = [
  {
    icon: Clock,
    title: "One-click time tracking",
    description:
      "Start a timer from the web app or the browser extension. Your time syncs everywhere automatically.",
  },
  {
    icon: FileText,
    title: "Professional invoices",
    description:
      "Turn tracked hours into polished PDF invoices in seconds. Customise rates, taxes, and discounts.",
  },
  {
    icon: Users,
    title: "Clients & projects",
    description:
      "Organise your work by client and project. Track billable vs non-billable time at a glance.",
  },
  {
    icon: BarChart3,
    title: "Time reports",
    description:
      "See exactly where your time goes with a monthly calendar view and filterable entry list.",
  },
  {
    icon: Zap,
    title: "Browser extension",
    description:
      "Track time without switching tabs. The Chrome extension keeps your timer a click away.",
  },
  {
    icon: Shield,
    title: "Secure by default",
    description:
      "Your data is protected by Clerk authentication and a fully isolated database per account.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to bill your clients
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            A focused set of tools that covers the full freelance billing workflow
            — nothing more, nothing less.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────
const steps = [
  { number: "01", title: "Add your clients & projects", description: "Create a client, then add projects with hourly rates." },
  { number: "02", title: "Track your time", description: "Hit Start in the header or the Chrome extension whenever you're working." },
  { number: "03", title: "Generate an invoice", description: "Select a client and date range — Invoicer builds the invoice line by line." },
  { number: "04", title: "Export & get paid", description: "Download a PDF and send it. Mark it paid when the money arrives." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From first hour tracked to invoice paid
          </h2>
          <p className="mt-4 text-lg text-slate-500">Four steps is all it takes.</p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, title, description }) => (
            <div key={number} className="relative">
              <div className="mb-4 text-4xl font-bold text-slate-100">{number}</div>
              <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="bg-blue-600 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-lg text-blue-100">
          Create your free account and start tracking time today.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
          >
            Create free account
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg border border-blue-400 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
            <Clock className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Invoicer</span>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Invoicer. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
