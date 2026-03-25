"use client";

import { TimerWidget } from "@/components/timer/timer-widget";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-[#E8ECF1] bg-white px-10">
      <TimerWidget />
    </header>
  );
}
