import { useState, useEffect } from "react";
import { useUser } from "@clerk/chrome-extension";
import { useTimer, useProjects, useRecentEntries } from "../lib/hooks";
import { ProjectList } from "./project-list";
import { formatDuration, calculateElapsed } from "@invoicer/shared";

export function TimerView() {
  const { user } = useUser();
  const { activeTimer, startTimer, stopTimer, isLoading } = useTimer();
  const { projects } = useProjects();
  const { entries, refresh: refreshEntries } = useRecentEntries();

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
      chrome.storage.local.set({
        activeTimer: { startTime: activeTimer.startTime },
      });
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h1 className="text-sm font-semibold text-gray-900">Invoicer</h1>
        <span className="text-xs text-gray-500 truncate max-w-[180px]">
          {user?.primaryEmailAddress?.emailAddress}
        </span>
      </div>

      {/* Timer Section */}
      <div className="px-4 py-4">
        {activeTimer ? (
          <div className="space-y-3">
            {/* Active Timer Display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-mono font-bold text-green-700">
                {formatDuration(elapsed)}
              </p>
              {activeProject && (
                <p className="text-sm text-green-600 mt-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{
                      backgroundColor: activeProject.color || "#6b7280",
                    }}
                  />
                  {activeProject.name}
                </p>
              )}
              {activeTimer.description && (
                <p className="text-xs text-green-500 mt-1">
                  {activeTimer.description}
                </p>
              )}
            </div>

            <button
              onClick={handleStop}
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isLoading ? "Stopping..." : "Stop Timer"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Project Selector */}
            <ProjectList
              projects={projects}
              selectedId={selectedProjectId}
              onSelect={setSelectedProjectId}
            />

            {/* Description Input */}
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleStart();
              }}
            />

            <button
              onClick={handleStart}
              disabled={isLoading || !selectedProjectId}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isLoading ? "Starting..." : "Start Timer"}
            </button>
          </div>
        )}
      </div>

      {/* Recent Entries */}
      <div className="flex-1 border-t border-gray-200">
        <h3 className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
          Recent Entries
        </h3>
        {entries.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-400 text-center">
            No recent entries
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <li key={entry.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{
                          backgroundColor:
                            entry.project?.color || "#6b7280",
                        }}
                      />
                      {entry.project?.name || "Unknown project"}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-mono text-gray-700">
                      {entry.duration != null
                        ? formatDuration(entry.duration)
                        : "--:--:--"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.startTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
