import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react"

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve("src", "index.ts"),
      name: "delta-state",
      fileName: "delta-state",
    },
  },
  plugins: [dts(), react()],
});
