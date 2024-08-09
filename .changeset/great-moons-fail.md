---
"@ticketevolution/seatmaps-client": minor
---

- **Vite Configuration**: Updated `vite.config.ts` to ensure correct UMD module export. Added `@rollup/plugin-inject` to handle `process` polyfill.

  - Added `rollupOptions` to define UMD build settings and inject `process` polyfill.
  - Ensured the `name` and `format` properties are correctly set for UMD build.

- **Example HTML File**: Provided a sample `index.html` file to demonstrate the correct usage of the built UMD module.
  - Included the built `bundle.js` script.
  - Created an instance of `Tevomaps` and rendered it correctly in the HTML.
