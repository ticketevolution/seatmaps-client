import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/index.tsx"],
  outDir: "./esm",
  target: "es2020",
  splitting: false,
  treeshake: true,
  metafile: true,
  clean: true,
  dts: false,
  minify: false,
  keepNames: true,
  bundle: true,
  skipNodeModulesBundle: true,
  sourcemap: true,
  esbuildPlugins: [
    {
      name: "excludeVendorFromSourceMap",
      setup(build) {
        build.onLoad({ filter: /node_modules/ }, (args) => {
          return {
            contents:
              readFileSync(args.path, "utf8") +
              "\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==",
            loader: "default",
          };
        });
      },
    },
  ],
  format: ["esm"],
});
