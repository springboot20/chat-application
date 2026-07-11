import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 3000,
  },
  resolve: {
    alias: [
      {
        find: "next/navigation",
        replacement: path.join(process.cwd(), "src/mocks/next-navigation.ts"),
      },
    ],
  },
  ssr: {
    noExternal: ["nextstepjs", "motion"],
  },
});
