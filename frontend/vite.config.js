import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        // When VITE_USE_MOCK=false, the real backend is expected on :8000.
        // Proxy keeps the browser same-origin and sidesteps CORS during dev.
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
});
