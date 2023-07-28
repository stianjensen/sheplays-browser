import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/sheplays-browser/", // Temporary, before domain is in place
  plugins: [react()],
});
