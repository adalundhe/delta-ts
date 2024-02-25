import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "delta-state",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["use-sync-external-store"],
      output: {
        globals: {
          "use-sync-external-store": "use-sync-external-store"
        }
      },
    },
    minify: false,
  },
  plugins: [dts(), react()],
});
