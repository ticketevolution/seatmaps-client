import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import inject from "@rollup/plugin-inject";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve("src/index.tsx"),
      name: "Tevomaps",
      fileName: () => `bundle.js`,
      formats: ["umd"],
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
          process: "process/browser",
        }),
      ],
    },
  },
});
