import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  dev: {
    server: {
      port: 3001,
    },
  },
  manifest: {
    name: "Invoicer - Time Tracker",
    description: "Track time and manage projects from your browser",
    permissions: ["alarms", "storage", "cookies", "action"],
    host_permissions: [
      "http://localhost/*",
      "http://localhost:3000/*",
      "https://*.accounts.dev/*",
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
