import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || "localhost,127.0.0.1")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
  const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:3000";
  const devHost = env.VITE_DEV_HOST || "0.0.0.0";
  const devPort = Number(env.VITE_DEV_PORT || 5175);
  const previewPort = Number(env.VITE_PREVIEW_PORT || 4175);

  return {
    appType: "spa",
    plugins: [react()],
    server: {
      allowedHosts,
      host: devHost,
      port: devPort,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        },
        "/r/": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: devHost,
      port: previewPort
    },
    build: {
      target: "esnext",
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }

            if (
              id.includes("/react/")
              || id.includes("/react-dom/")
            ) {
              return "react-vendor";
            }

            if (
              id.includes("/axios/")
              || id.includes("/@tanstack/")
              || id.includes("/date-fns/")
            ) {
              return "data-vendor";
            }

            if (id.includes("/lucide-react/")) {
              return "icons-vendor";
            }

            if (id.includes("/sonner/")) {
              return "feedback-vendor";
            }

            if (id.includes("/recharts/")) {
              return "recharts-vendor";
            }

            if (
              id.includes("/d3-")
              || id.includes("/victory-vendor/")
              || id.includes("/internmap/")
              || id.includes("/robust-predicates/")
            ) {
              return "charts-vendor";
            }

            return undefined;
          }
        }
      }
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "axios",
        "@tanstack/react-query",
        "date-fns",
        "recharts",
        "sonner",
        "lucide-react"
      ]
    }
  };
});
