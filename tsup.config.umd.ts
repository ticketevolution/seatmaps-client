import { defineConfig } from "tsup";
import { umdWrapper } from "esbuild-plugin-umd-wrapper";
import svgr from 'esbuild-plugin-svgr'
import jsx from '@svgr/plugin-jsx';
import { peerDependencies, dependencies } from "./package.json";
import { Format } from "tsup";

const INCLUDE_DEPENDENCIES = process.env.INCLUDE_DEPENDENCIES === 'true';

const includedDeps = [...Object.keys(dependencies), ...Object.keys(peerDependencies)];

if (INCLUDE_DEPENDENCIES) {
  console.log(`INCLUDE_DEPENDENCIES is set to true. UMD bundle will include all peer dependencies [${includedDeps.join(" , ")}]`)
}

export default defineConfig({
    entryPoints: {
      'tevomaps': 'src/index.tsx'
    },
    outDir: INCLUDE_DEPENDENCIES ? './umd/standalone' : './umd/minimal',
    target: 'es2020',
    clean: true,
    dts: false,
    minify: true,
    bundle: true,
    metafile: true,
  skipNodeModulesBundle: true,
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  sourcemap: true,
  esbuildPlugins: [
    svgr(),
    umdWrapper({
      libraryName: 'ticket-evolution-seatmaps',
    }),
  ],
  noExternal: INCLUDE_DEPENDENCIES ? includedDeps : [],
  format: ['umd' as Format]
});