import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
    base: "./",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@domain": path.resolve(__dirname, "src/domain"),
            "@application": path.resolve(__dirname, "src/application"),
            "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
            "@presentation": path.resolve(__dirname, "src/presentation"),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
    build: {
        outDir: "dist",
        sourcemap: true,
        target: "es2022",
    },
});