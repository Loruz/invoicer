"use client";

import { TimerWidget } from "@/components/timer/timer-widget";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div />
      <TimerWidget />
    </header>
  );
}
