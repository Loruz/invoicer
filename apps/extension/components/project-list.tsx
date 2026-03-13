import type { Project } from "@invoicer/shared";

interface ProjectListProps {
  projects: Project[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ProjectList({ projects = [], selectedId, onSelect }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-2">
        No projects found. Create one in the web app.
      </p>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select a project...</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className="h-4 w-4 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
