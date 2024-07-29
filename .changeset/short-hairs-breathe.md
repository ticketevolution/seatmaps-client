---
"@ticketevolution/seatmaps-client": minor
---

Updated `vite.config.ts` to build the UMD bundle correctly.

# Created a post-build script `copy-build.js` to copy the built `bundle.js` to the `examples/vite-build-standalone` directory.

# Updated `package.json` to include new build and serve scripts.

# Ensured `index.html` in `examples/vite-build-standalone` references `bundle.js`.

# Ensured `server.js` in `examples/vite-build-standalone` is set up to serve the directory.
