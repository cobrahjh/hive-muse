import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    proxy: {
      "/draw": "http://localhost:8799",
      "/status": "http://localhost:8799",
      "/gallery": "http://localhost:8799",
      "/abort": "http://localhost:8799",
      "/queue": "http://localhost:8799",
      "/calibrate": "http://localhost:8799",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
