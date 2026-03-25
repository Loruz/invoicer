import { useState, useEffect } from "react";
import { useTimer, useProjects, useRecentEntries } from "../lib/hooks";
import { formatDuration, calculateElapsed } from "@invoicer/shared";

// ─── Icons (inline SVG to avoid extra deps) ─────────────────────

function PlayIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function StopIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function ExternalLinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function BarChartIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────

export function TimerView() {
  const { activeTimer, startTimer, stopTimer, isLoading } = useTimer();
  const { projects } = useProjects();
  const { dayGroups, todayTotal, weekTotal, refresh: refreshEntries } = useRecentEntries();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // Update elapsed time every second when timer is active
  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }
    setElapsed(calculateElapsed(activeTimer.startTime));
    const interval = setInterval(() => {
      setElapsed(calculateElapsed(activeTimer.startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Sync active timer to chrome.storage for badge updates
  useEffect(() => {
    if (activeTimer) {
      chrome.storage.local.set({ activeTimer: { startTime: activeTimer.startTime } });
    } else {
      chrome.storage.local.remove("activeTimer");
      chrome.action?.setBadgeText({ text: "" });
    }
  }, [activeTimer]);

  const handleStart = async () => {
    if (!selectedProjectId) return;
    await startTimer(selectedProjectId, description || null);
    setDescription("");
  };

  const handleStop = async () => {
    await stopTimer();
    refreshEntries();
  };

  const activeProject = activeTimer
    ? projects.find((p) => p.id === activeTimer.projectId)
    : null;

  const isRunning = !!activeTimer;

  // Today total including active timer elapsed
  const displayTodayTotal = todayTotal + (isRunning ? elapsed : 0);

  return (
    <div className="flex flex-col h-full bg-white font-sans text-gray-900">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">I</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">Invoicer</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <button
            onClick={() => window.open(import.meta.env.VITE_APP_URL || "http://localhost:3000")}
            className="hover:text-gray-600 transition-colors"
            title="Open web app"
          >
            <ExternalLinkIcon />
          </button>
        </div>
      </div>

      {/* ── Timer input row ─────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          {/* Description / active timer display */}
          <div className="flex-1 min-w-0">
            {isRunning ? (
              <div>
                <p className="text-sm text-gray-500 truncate">
                  {activeTimer.description || "Timer running…"}
                </p>
                {activeProject && (
                  <p className="text-xs mt-0.5 flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activeProject.color || "#6366f1" }}
                    />
                    <span className="truncate" style={{ color: activeProject.color || "#6366f1" }}>
                      {activeProject.name}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="w-full text-sm text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") handleStart(); }}
              />
            )}
          </div>

          {/* Elapsed time */}
          <span className="text-sm font-mono font-medium text-gray-500 flex-shrink-0 tabular-nums">
            {formatDuration(isRunning ? elapsed : 0)}
          </span>

          {/* Play / Stop button */}
          <button
            onClick={isRunning ? handleStop : handleStart}
            disabled={isLoading || (!isRunning && !selectedProjectId)}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors shadow-sm disabled:opacity-40 ${
              isRunning
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isRunning
              ? <StopIcon size={16} />
              : <PlayIcon size={14} />
            }
          </button>
        </div>

        {/* Project selector — only when not running */}
        {!isRunning && (
          <div className="mt-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-b border-gray-100 flex items-center gap-4 bg-gray-50">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Today</span>
          <span className="text-xs font-mono font-semibold text-gray-700 tabular-nums">
            {formatDuration(displayTodayTotal)}
          </span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">This week</span>
          <span className="text-xs font-mono font-semibold text-gray-700 tabular-nums">
            {formatDuration(weekTotal + (isRunning ? elapsed : 0))}
          </span>
        </div>
        <div className="ml-auto text-gray-300 hover:text-gray-500 transition-colors cursor-default">
          <BarChartIcon />
        </div>
      </div>

      {/* ── Time entries grouped by day ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {dayGroups.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-400 text-center">No tracked time yet</p>
        ) : (
          dayGroups.map((group) => (
            <div key={group.date}>
              {/* Day header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">{group.label}</span>
                <span className="text-sm font-mono font-semibold text-gray-600 tabular-nums">
                  {formatDuration(group.totalDuration)}
                </span>
              </div>

              {/* Entries for this day */}
              {group.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 truncate">
                        {entry.description || (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </p>
                      {entry.project && (
                        <p className="text-xs mt-0.5 flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.project.color || "#6366f1" }}
                          />
                          <span
                            className="truncate font-medium"
                            style={{ color: entry.project.color || "#6366f1" }}
                          >
                            {entry.project.name}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-600 tabular-nums">
                        {entry.duration != null ? formatDuration(entry.duration) : "--:--:--"}
                      </span>
                      {/* Resume button */}
                      <button
                        onClick={async () => {
                          if (isRunning) return;
                          setDescription(entry.description || "");
                          setSelectedProjectId(entry.project ? "" : "");
                          // Find project id from entries — we rely on project name match
                          const proj = projects.find(
                            (p) => p.name === entry.project?.name
                          );
                          if (proj) {
                            setSelectedProjectId(proj.id);
                            await startTimer(proj.id, entry.description);
                          }
                        }}
                        disabled={isRunning}
                        className="text-gray-300 hover:text-blue-500 transition-colors disabled:opacity-30"
                        title="Resume"
                      >
                        <PlayIcon size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
