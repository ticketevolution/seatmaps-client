import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import inject from "@rollup/plugin-inject";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve("src/index.tsx"), // Entry point to your main file
      name: "Tevomaps", // Global variable name
      fileName: () => `bundle.js`, // Output file name
      formats: ["umd"], // UMD format to make it globally available
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        name: "Tevomaps",
        format: "umd",
        exports: "named",
      },
      plugins: [
        inject({
          process: "process/browser", // Polyfill 'process' for browser environments
        }),
      ],
    },
  },
});
