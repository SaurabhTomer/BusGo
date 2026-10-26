import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev me /api aur /socket.io backend ko forward hote hain (cookie aur CORS ka jhanjhat nahi)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_BACKEND_URL || "http://localhost:8000"; // apna backend port
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target: backend, changeOrigin: true },
        "/socket.io": { target: backend, ws: true, changeOrigin: true },
      },
    },
  };
});
