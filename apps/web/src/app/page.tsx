import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Invoicer
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Time tracking and invoicing for freelancers and small teams.
        </p>
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
