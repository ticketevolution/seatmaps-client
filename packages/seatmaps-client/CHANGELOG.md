# @ticketevolution/seatmaps-client

## 4.0.0

### Major Changes

- 7a8d6dd: React upgraded from 18.2.0 to 19.1.1

## 3.5.1

### Patch Changes

- e2ade85: Fixed Legend to Seats color mismatch.

## 3.5.0

### Minor Changes

- 67229cf: Added showLegendOpenAlwaysForDesktop flag to always display the map legend on desktop when this flag is set to true.

### Patch Changes

- 67229cf: Added openLegendInitially flag

## 3.4.0

### Minor Changes

- c8ede68: Added showLegendOpenAlwaysForDesktop flag to always display the map legend on desktop when this flag is set to true.

## 3.3.1

### Patch Changes

- edeaa09: Fix mobile click issues and restrict infinite zooming and panning behavior. Limit zoom in to 10% of the original size and prevent zooming out beyond the original size.

## 3.3.0

### Minor Changes

- 1962bf5: Added the `showZoomHelper` flag to control the visibility of the ZoomHelper overlay. The overlay is displayed on mobile devices only when `mouseControlEnabled` is `true`. The default value of `showZoomHelper` is `true`.

## 3.2.0

### Minor Changes

- 2e3d208: updated files for to improve build ptrocess
- a58fd28: - **Vite Configuration**: Updated `vite.config.ts` to ensure correct UMD module export. Added `@rollup/plugin-inject` to handle `process` polyfill.
  - Added `rollupOptions` to define UMD build settings and inject `process` polyfill.
  - Ensured the `name` and `format` properties are correctly set for UMD build.
  - **Example HTML File**: Provided a sample `index.html` file to demonstrate the correct usage of the built UMD module.
    - Included the built `bundle.js` script.
    - Created an instance of `Tevomaps` and rendered it correctly in the HTML.

- a58fd28: Updated `vite.config.ts` to build the UMD bundle correctly.

  # Created a post-build script `copy-build.js` to copy the built `bundle.js` to the `examples/vite-build-standalone` directory.

  # Updated `package.json` to include new build and serve scripts.

  # Ensured `index.html` in `examples/vite-build-standalone` references `bundle.js`.

  # Ensured `server.js` in `examples/vite-build-standalone` is set up to serve the directory.

## 3.1.1

### Patch Changes

- 73a8b6d: Fixed height and width for empty seat map icon

## 3.1.0

### Minor Changes

- c255500: Removed UFO image and alien mentions.
- c255500: Added SVG react component for missing seatmap.

## 3.0.1

### Patch Changes

- 3343aa4: fix: hiding empty controls containers when controls are disabled

## 3.0.0

### Major Changes

- 0609174: disabled umd build as current build setup for umd breaks with addition of fetch-ponyfill

### Minor Changes

- 0609174: using inline svg icons instead of dependency library, looks slightly changed
- 0609174: unfetch replaced with fetch-ponyfill

### Patch Changes

- 0609174: removed unused dependencies

## 2.1.0

### Minor Changes

- fac296e: Removed UFO image and alien mentions.

## 2.0.0

### Major Changes

- df611b3: Updated dependencies, changed build tools and package structure
