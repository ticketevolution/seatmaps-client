import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";
import umd from "umd";
import svgr from "esbuild-plugin-svgr";
import { peerDependencies, dependencies } from "./package.json";

const INCLUDE_DEPENDENCIES = process.env.INCLUDE_DEPENDENCIES === "true";

const includedDeps = [
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
];

if (INCLUDE_DEPENDENCIES) {
  console.log(
    `INCLUDE_DEPENDENCIES is set to true. UMD bundle will include all peer dependencies [${includedDeps.join(
      ", ",
    )}]`,
  );
}

const customRequireDefinition = `
  if (typeof require !== 'function') {
    var require = function(name) {
      if (window[name]) {
        return window[name];
      } else {
        throw new Error('Module ' + name + ' is not defined globally');
      }
    };
  }
`;

export default defineConfig({
  entryPoints: {
    tevomaps: "src/index.tsx",
  },
  outDir: INCLUDE_DEPENDENCIES ? "./umd/standalone" : "./umd/minimal",
  bundle: true,
  target: "es2020",
  clean: true,
  minify: true,
  metafile: true,
  skipNodeModulesBundle: false,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  sourcemap: true,
  esbuildPlugins: [
    svgr(),
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
  noExternal: INCLUDE_DEPENDENCIES ? includedDeps : Object.keys(dependencies),
  format: ["cjs"],
  cjsInterop: true,
  banner: () => ({
    js:
      customRequireDefinition +
      umd.prelude("ticket-evolution-seatmaps", { commonJS: true }),
  }),
  footer: () => ({
    js:
      umd.postlude("ticket-evolution-seatmaps", { commonJS: true }) +
      "Tevomaps = ticketEvolutionSeatmaps.SeatmapFactory;",
  }),
});
