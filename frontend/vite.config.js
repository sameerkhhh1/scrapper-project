import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standard Vite + React config - kuch fancy nahi
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
