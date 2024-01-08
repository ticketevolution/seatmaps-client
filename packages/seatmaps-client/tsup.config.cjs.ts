import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/index.tsx"],
  outDir: "./cjs",
  target: "es2020",
  splitting: false,
  treeshake: true,
  metafile: true,
  clean: true,
  dts: true,
  minify: false,
  bundle: true,
  keepNames: true,
  skipNodeModulesBundle: true,
  sourcemap: true,
  format: ["cjs"],
});
