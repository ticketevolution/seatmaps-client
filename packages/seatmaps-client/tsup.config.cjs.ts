import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";
import { umdWrapper } from "esbuild-plugin-umd-wrapper";
import svgr from 'esbuild-plugin-svgr'
import jsx from '@svgr/plugin-jsx';
import { name, dependencies } from "./package.json";

export default defineConfig({
    entryPoints: ['src/index.tsx'],
    // entry: ['src/**/[^.]*.ts(x)'],
    outDir: './cjs',
    target: 'es2020',
    splitting: false,
    treeshake: true,
    metafile: true,
    clean: true,
    dts: true,
    minify: false,
    bundle: true,
    // watch: NODE_ENV === 'development',
  skipNodeModulesBundle: true,
  sourcemap: true,
//   esbuildOptions: (options) => {
//     console.log(options.entryPoints)
//     if (Array.isArray(options.entryPoints)) {
//         options.entryPoints = options.entryPoints.filter((item) => typeof item === 'string' ? !item.includes('.test.') : !item.in.includes('.test.')) as string[] | { in: string; out: string; }[]
//     }
//     // options.entryPoints?.filter((item) => typeof item === 'string' ? item.includes('.test.') : item)
//   },
  esbuildPlugins: [
    svgr(),
  //   {
  // name: 'excludeVendorFromSourceMap',
  // setup(build) {
  //   build.onLoad({ filter: /node_modules/ }, args => {
  //     return {
  //       contents: readFileSync(args.path, 'utf8')
  //         + '\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==',
  //       loader: 'default',
  //     }
  //   })
  // },
// }
  ],
//   external: [/\.test\./],
//   noExternal: Object.keys(dependencies),
  format: ['cjs']
});