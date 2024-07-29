const fs = require("fs");
const path = require("path");

// Source and destination paths
const src = path.resolve(__dirname, "packages/seatmaps-client/dist/bundle.js");
const dest = path.resolve(
  __dirname,
  "examples/vite-build-standalone/bundle.js",
);

// Ensure the destination directory exists
fs.mkdirSync(path.dirname(dest), { recursive: true });

// Copy the file
fs.copyFileSync(src, dest);

console.log("Build file copied to examples/vite-build-standalone");
