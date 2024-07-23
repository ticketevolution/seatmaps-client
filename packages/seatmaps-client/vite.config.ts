import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import inject from "@rollup/plugin-inject";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "Tevomaps", // Global variable name for your library
      fileName: () => `bundle.js`,
      formats: ["umd"],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        name: "Tevomaps", // Ensure this matches the global variable
        format: "umd", // Ensure the esm format
        exports: "named", // Explicitly specify named exports
      },
      plugins: [
        inject({
          process: "process/browser",
        }),
      ],
    },
  },
  server: {
    cors: true,
  },
});
