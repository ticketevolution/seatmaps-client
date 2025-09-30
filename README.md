<p align="center">
  <img src="https://www.ticketevolution.com/wp-content/uploads/2017/04/cropped-ticket-evolution.png" alt="Ticket Evolution logo" height="50" />
</p>

<h1 align="center">Ticket Evolution Seatmaps</h1>

> ⚠️ **React Compatibility Notice**  
> - Use `^3.5.1` if your app is on **React 18**  
> - Use `^4.0.0` if your app is on **React 19+**  

> ⚠️ **Breaking Change in v4.0.0**  
> The `.build()` method now returns a **Promise** instead of directly returning the API. You must use `await` or `.then()` to access the seatmap API.

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Known Vulnerabilities](https://snyk.io/test/github/ticketevolution/seatmaps-client/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ticketevolution/seatmaps-client?targetFile=package.json)

A client side JavaScript library that enables users to view seatmaps for available tickets on Ticket Evolution by:

1. Fetching the map SVG and manifest JSON, with the given `venueId` and `configurationId`, from Ticket Evolution AWS S3 buckets using the `mapsDomain` (defaults to maps.ticketevolution.com).
1. Rendering the map in the provided DOM element via the `.build` function which accepts the `id` of the element as an argument (see below for an example DOM setup).
1. Color map sections according to the `sectionPercentile` configurations and the available `ticketGroups` (and any `selectedSections` if provided).
1. Render a tooltip when the user hovers over a section, which will provide quantity and price information.

_Note: Sections will not color and you will not be able to highlight/toggle sections via the map or the API until ticket groups are supplied to the map, either through `ticketGroups` configuration or `updateTicketGroups` API._

After instantiation, a [public API](#public-api) is available with a limited number of functions to interact with the map.

**Help:** [Ticket Evolution](http://www.ticketevolution.com/contact-us/)

# Installation and Usage Options

## Window Object

### 1. Load the seatmaps client JS from CDN, create a map root, and build a map

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Seatmap Example</title>
    <style>
      body,
      html {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
      }
      #my-map {
        height: 100%;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="my-map"></div>
    <script src="https://cdn.jsdelivr.net/npm/@ticketevolution/seatmaps-client/dist/bundle.js"></script>
    <script>
      // create a new seatmap
      (async () => {
        var seatmap = new Tevomaps.SeatmapFactory({
          venueId: "896",
          configurationId: "14341",
          ticketGroups: [
            {
              tevo_section_name: "lower level corner 104",
              retail_price: 100,
            },
          ],
        });

        // turn element with ID of 'my-map' into a seatmap for config 14341
        // Note: build() now returns a Promise in v4.0.0+
        var seatmapApi = await seatmap.build("my-map");

        // perform some actions, like highlighting section "lower level corner 104"
        if (seatmapApi) {
          seatmapApi.highlightSection("lower level corner 104");
        }
      })();
    </script>
  </body>
</html>
```

### Alternative: Using `.then()` instead of `async/await`

```html
<script>
  var seatmap = new Tevomaps.SeatmapFactory({
    venueId: "896",
    configurationId: "14341",
    ticketGroups: [
      {
        tevo_section_name: "lower level corner 104",
        retail_price: 100,
      },
    ],
  });

  seatmap.build("my-map").then(function (seatmapApi) {
    if (seatmapApi) {
      seatmapApi.highlightSection("lower level corner 104");
    }
  });
</script>
```

## CommonJS

### 1. Install via `npm` or `yarn`

For React <19:
```sh
npm install @ticketevolution/seatmaps-client@^3.5.1

# or

yarn add @ticketevolution/seatmaps-client@^3.5.1
```

For React 19+:
```sh
npm install @ticketevolution/seatmaps-client@^4.0.0

# or

yarn add @ticketevolution/seatmaps-client@^4.0.0
```

### 2. Create a script that includes `@ticketevolution/seatmaps-client`

**For v4.0.0+ (React 19+):**

```js
// main.js

import { SeatmapFactory } from "@ticketevolution/seatmaps-client";

// create a new seatmap
const seatmap = new SeatmapFactory({
  venueId: "896",
  configurationId: "14341",
  ticketGroups: [
    {
      tevo_section_name: "lower level corner 104",
      retail_price: 100,
    },
  ],
});

// turn element with ID of 'my-map' into a seatmap for config 14341
// Note: build() returns a Promise in v4.0.0+
const seatmapApi = await seatmap.build("my-map");

// perform some actions, like highlighting section "lower level corner 104"
if (seatmapApi) {
  seatmapApi.highlightSection("lower level corner 104");
}
```

**For v3.5.1 (React 18):**

```js
// main.js

import { SeatmapFactory } from "@ticketevolution/seatmaps-client";

// create a new seatmap
const seatmap = new SeatmapFactory({
  venueId: "896",
  configurationId: "14341",
  ticketGroups: [
    {
      tevo_section_name: "lower level corner 104",
      retail_price: 100,
    },
  ],
});

// turn element with ID of 'my-map' into a seatmap for config 14341
// Note: build() returns the API directly in v3.5.1
const seatmapApi = seatmap.build("my-map");

// perform some actions, like highlighting section "lower level corner 104"
seatmapApi.highlightSection("lower level corner 104");
```

### In case your app is a React app, you can use the `TicketMap` component

```tsx
import { createRoot } from "react-dom/client";
import { TicketMap } from "@ticketevolution/seatmaps-client";

const rootEl = document.getElementById("my-map");
if (!rootEl) {
  throw new Error("no root element in html");
}

const root = createRoot(rootEl);

root.render(
  <TicketMap
    venueId="896"
    configurationId="14341"
    ticketGroups={[
      {
        tevo_section_name: "lower level corner 104",
        retail_price: 100,
      },
    ]}
  />,
);
```

## API Reference

### `class Tevomaps`

#### `new Tevomaps(options: object)`

Options:

| Name                  | Required | Type                           | Default Value                                                                                                                                                                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | -------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `venueId`             | ✓        | `string`                       |                                                                                                                                                                                                                                                    | Ticket Map Venue ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `configurationId`     | ✓        | `string`                       |                                                                                                                                                                                                                                                    | Ticket Map Configuration ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `sectionPercentiles`  |          | `object`                       | `{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.2': '#FFC515',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.4': '#f2711c',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.6': '#D6226A',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.8': '#a333c8',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'1': '#2A6EBB'`<br>`}` | Define percentiles to color sections based on their average ticket group price. Ticket groups which fall within a given range will display the associated color on the map for their section.<br><br>ie. Given an event with 100 ticket groups, with each ticket group price incrementing by $1 from $100 to $200, a section whose average ticket group price is $110 will be displayed as `#FFC515`, and a section whose average price of $175 will be displayed as `#a333c8`.                                                                                                                                             |
| `mapFontFamily`       |          | `string`                       |                                                                                                                                                                                                                                                    | Set a default font for the map. Native browser fonts available, a list below is provided but results may vary depending upon the browser and browser version.<br><br>• Helvetica<br>• Arial<br>• Times<br>• Times New Roman<br>• Courier<br>• Courier New<br>• Verdana<br>• Tahoma                                                                                                                                                                                                                                                                                                                                          |
| `mapsDomain`          |          | `string`                       | `https://maps.ticketevolution.com`                                                                                                                                                                                                                 | The domain from which map SVGs and manifests will be fetched. To pull maps from the development environment, use `https://maps-dev.ticketevolution.com`                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `onSelection`         |          | `function`                     |                                                                                                                                                                                                                                                    | A function which will be called by Tevomaps when a section of the map has been clicked. It will pass as arguments an array of all currently selected section IDs and expect nothing back.<br><br>`onSelection: function (sectionIds) {`<br>&nbsp;&nbsp;&nbsp;&nbsp;`console.log(sectionIds); //=> ['id-1','id-2']`<br>`}`<br><br>_Note: This method is also called when a section is deselected. If all sections are deselected, the `sectionIds` array will be empty._<br><br>_Note: This method will always return lower case section names, you will need to take that in consideration when you do string comparisons._ |
| `selectedSections`    |          | `string[]`                     | `[]`                                                                                                                                                                                                                                               | An array of section IDs for the map to initially highlight by default when it is rendered.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `ticketGroups`        |          | [`TicketGroup[]`](#interfaces) | `[]`                                                                                                                                                                                                                                               | An array of ticket groups to be used for section pricing. Expects each ticket group to adhere to the [TicketGroup interface](#interfaces). This API was designed for you to directly pass into the client library the response from the [Ticket Evolution `/v9/listings` endpoint](https://ticketevolution.atlassian.net/wiki/spaces/API/pages/2853797930/Listings+Index).                                                                                                                                                                                                                                                  |
| `showControls`        |          | `boolean`                      | `true`                                                                                                                                                                                                                                             | When set to true, the map controls (the zoom in, zoom out, reset zoom, and clear selection buttons) will be visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `showLegend`          |          | `boolean`                      | `true`                                                                                                                                                                                                                                             | When set to true, the map legend will be visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `mouseControlEnabled` |          | `boolean`                      | `true`                                                                                                                                                                                                                                             | When set to true, the map will respond to mouse events (such as click, move, and hover).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `showZoomHelper` |          | `boolean`                      | `true`                                                                                                                                                                                                                                             | When set to `true`, the ZoomHelper overlay will appear when the page loads on mobile devices.<br>**Note:** This flag applies only when `mouseControlEnabled` is set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Public API

After calling `.build()`, the following methods are available on the returned API object:

#### `.build(elementId: string): Promise<PublicApi | undefined>`

**Changed in v4.0.0:** This method now returns a **Promise** that resolves to the PublicApi object.

Renders the seatmap into the DOM element with the given ID. In v4.0.0+, you must use `await` or `.then()` to access the API.

**Example (v4.0.0+):**
```js
const api = await seatmap.build("my-map");
// or
seatmap.build("my-map").then(api => {
  // use api here
});
```

**Example (v3.5.1):**
```js
const api = seatmap.build("my-map");
```

#### `updateTicketGroups(groups: TicketGroup[])`

Changes the collection of ticket groups in the map used to calculate available sections and section prices. Useful if you have a feature for filtering ticket groups and you want the map to update.

#### `highlightSection(section: string)`

Temporarily colors the given section by making it more opaque. This is the same effect used for hovering on a section.

#### `unhighlightSection(section: string)`

Removes the highlight effect of the given section, if it's not selected, by reverting it back to its base transparency. This is the same effect used for hovering off on a section.

#### `selectSection(section: string)`

This is the same effect used for clicking on a section to select it. It colors the section and will not revert back by hovering off it or calling `unhighlightSection`. Calls the `onSelection` callback with the updated array of selected sections.

#### `deselectSection(section: string)`

This is the same effect used for clicking on a section to deselect it. It reverts the color of the section and is the only way to unhighlight a selected section. Calls the `onSelection` callback with the updated array of selected sections.

# Migration Guide

## Migrating from v3.5.1 to v4.0.0

The main breaking change in v4.0.0 is that the `.build()` method now returns a Promise instead of directly returning the API object.

**Before (v3.5.1):**
```js
const seatmapApi = seatmap.build("my-map");
seatmapApi.highlightSection("section-1");
```

**After (v4.0.0):**
```js
// Option 1: async/await
const seatmapApi = await seatmap.build("my-map");
if (seatmapApi) {
  seatmapApi.highlightSection("section-1");
}

// Option 2: .then()
seatmap.build("my-map").then((seatmapApi) => {
  if (seatmapApi) {
    seatmapApi.highlightSection("section-1");
  }
});
```

# Interfaces

| Name        | Properties                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| TicketGroup | `{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`tevo_section_name: string;`<br>&nbsp;&nbsp;&nbsp;&nbsp;`retail_price: number;`<br>`}` |
