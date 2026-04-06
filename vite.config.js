import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: true,
    headers: {
      // Improved COOP policy for Firebase Auth
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      // Additional headers to prevent auth issues
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  },
  define: {
    // Ensure global is defined for Firebase compatibility
    global: "globalThis",
  },
});
