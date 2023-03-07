<p align="center">
  <img src="https://www.ticketevolution.com/wp-content/uploads/2017/04/cropped-ticket-evolution.png" alt="Ticket Evolution logo" height="50" />
</p>

<h1 align="center">Ticket Evolution Seatmaps</h1>

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Known Vulnerabilities](https://snyk.io/test/github/ticketevolution/seatmaps-client/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ticketevolution/seatmaps-client?targetFile=package.json)


A client side JavaScript library that enables users to view seatmaps for available tickets on Ticket Evolution by:

1. Fetching the map SVG and manifest JSON, with the given `venueId` and `configurationId`, from Ticket Evolution AWS S3 buckets using the `mapsDomain` (defaults to maps.ticketevolution.com).
1. Rendering the map in the provided DOM element via the `.build` function which accepts the `id` of the element as an argument (see below for an example DOM setup).
1. Color map sections according to the `sectionPercentile` configurations and the available `ticketGroups` (and any `selectedSections` if provided).
1. Render a tooltip when the user hovers over a section, which will provide quantity and price information.

*Note: Sections will not color and you will not be able to highlight/toggle sections via the map or the API until ticket groups are supplied to the map, either through `ticketGroups` configuration or `updateTicketGroups` API.*

After instantiation, a [public API](#public-api) is available with a limited number of functions to interact with the map.

**Help:** [Ticket Evolution](http://www.ticketevolution.com/contact-us/)

# Installation and Usage Options

## Window Object

### 1. Download `tevomaps.js`

```sh
wget https://raw.githubusercontent.com/ticketevolution/seatmaps-client/master/build/tevomaps.js
```

### 2. Load `tevomaps.js`, create a map root, and build a map

```html
<div id='my-map'></div>
<script src="tevomaps.js"></script>
<script>
  // create a new seatmap
  var seatmap = new Tevomaps({
    venueId: '10',
    configurationId: '1046',
    ticketGroups: [{
      tevo_section_name: 'upper end zone 232',
      retail_price: 100
    }]
  });

  // turn element with ID of 'my-map' into a seatmap for config 1046
  var seatmapApi = seatmap.build('my-map');

  // perform some actions, like highlighting section "upper end zone 232"
  seatmapApi.highlightSection('upper end zone 232');
</script>
```

## CommonJS

### 1. Install via `npm` or `yarn`

```sh
npm install --save @ticketevolution/seatmaps-client
```

or

```sh
yarn add @ticketevolution/seatmaps-client
```

### 2. Create a script that includes `@ticketevolution/seatmaps-client`

```js
// main.js

import Tevomaps from '@ticketevolution/seatmaps-client'

// create a new seatmap
const seatmap = new Tevomaps({
  venueId: '10',
  configurationId: '1046',
  ticketGroups: [{
    tevo_section_name: 'upper end zone 232',
    retail_price: 100
  }]
});

// turn element with ID of 'my-map' into a seatmap for config 1046
const seatmapApi = seatmap.build('my-map');

// perform some actions, like highlighting section "upper end zone 232"
seatmapApi.highlightSection('upper end zone 232')
```

## API Reference

### `class Tevomaps`

#### `new Tevomaps(options: object)`

Options:

| Name                  | Required | Type                           | Default Value                                                                                                                                                                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|-----------------------|----------|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `venueId`             | ✓        | `string`                       |                                                                                                                                                                                                                                                    | Ticket Map Venue ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `configurationId`     | ✓        | `string`                       |                                                                                                                                                                                                                                                    | Ticket Map Configuration ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `sectionPercentiles`  |          | `object`                       | `{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.2': '#FFC515',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.4': '#f2711c',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.6': '#D6226A',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.8': '#a333c8',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'1': '#2A6EBB'`<br>`}` | Define percentiles to color sections based on their average ticket group price. Ticket groups which fall within a given range will display the associated color on the map for their section.<br><br>ie. Given an event with 100 ticket groups, with each ticket group price incrementing by $1 from $100 to $200, a section whose average ticket group price is $110 will be displayed as `#FFC515`, and a section whose average price of $175 will be displayed as `#a333c8`.                                                                                                                                             |
| `mapFontFamily`       |          | `string`                       |                                                                                                                                                                                                                                                    | Set a default font for the map. Native browser fonts available, a list below is provided but results may vary depending upon the browser and browser version.<br><br>• Helvetica<br>• Arial<br>• Times<br>• Times New Roman<br>• Courier<br>• Courier New<br>• Verdana<br>• Tahoma                                                                                                                                                                                                                                                                                                                                          |
| `mapsDomain`          |          | `string`                       | `https://maps.ticketevolution.com`                                                                                                                                                                                                                 | The domain from which map SVGs and manifests will be fetched. To pull maps from the development environment, use `https://maps-dev.ticketevolution.com`                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `onSelection`         |          | `function`                     |                                                                                                                                                                                                                                                    | A function which will be called by Tevomaps when a section of the map has been clicked. It will pass as arguments an array of all currently selected section IDs and expect nothing back.<br><br>`onSelection: function (sectionIds) {`<br>&nbsp;&nbsp;&nbsp;&nbsp;`console.log(sectionIds); //=> ['id-1','id-2']`<br>`}`<br><br>*Note: This method is also called when a section is deselected. If all sections are deselected, the `sectionIds` array will be empty.*<br><br>*Note: This method will always return lower case section names, you will need to take that in consideration when you do string comparisons.* |
| `selectedSections`    |          | `string[]`                     | `[]`                                                                                                                                                                                                                                               | An array of section IDs for the map to initially highlight by default when it is rendered.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `ticketGroups`        |          | [`TicketGroup[]`](#interfaces) | `[]`                                                                                                                                                                                                                                               | An array of ticket groups to be used for section pricing. Expects each ticket group to adhere to the [TicketGroup interface](#interfaces). This API was designed for you to directly pass into the client library the response from the [Ticket Evolution `/v9/listings` endpoint](https://ticketevolution.atlassian.net/wiki/spaces/API/pages/2853797930/Listings+Index).                                                                                                                                                                |
| `showControls`        |          | `boolean`                      | `true`                                                                                                                                                                                                                                             | When set to true, the map controls (the zoom in, zoom out, reset zoom, and clear selection buttons) will be visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `showLegend`          |          | `boolean`                      | `true`                                                                                                                                                                                                                                             | When set to true, the map legend will be visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `mouseControlEnabled` |          | `boolean`                      | `true`                                                                                                                                                                                                                                             | When set to true, the map will respond to mouse events (such as click, move, and hover).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

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

# Interfaces

| Name        | Properties                                                                                                            |
|-------------|-----------------------------------------------------------------------------------------------------------------------|
| TicketGroup | `{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`tevo_section_name: string;`<br>&nbsp;&nbsp;&nbsp;&nbsp;`retail_price: number;`<br>`}` |

# Contributing & Development

The below instructions will get the project up and running on your local machine for development and testing purposes.

## System Prerequisites

- `node`
- `yarn`
- `make`
- `git`

## Using `make`

We've made the startup process simple by using a Makefile for all common workflows.

To see what Makefile commands are available, in your terminal shell run `make` or `make help`. It will list all the available Makefile commands with their descriptions.

| Target    | Effect                                                  |
|-----------|---------------------------------------------------------|
| `help`    | Display all other make targets and their effects        |
| `install` | Install client and server side packages for development |
| `start`   | Start the development server                            |

## Using `yarn` or `npm`

A slew of npm/yarn scripts are also present to make development a bit easier:

| Script    | Effect                                                                              |
|-----------|-------------------------------------------------------------------------------------|
| `build`   | Compiles and bundles all source into `build/tevomaps.js` and `build/tevomaps.js.gz` |
| `watch`   | Builds the project, then watches source files for changes (rebuilds on each change) |
| `start`   | Starts the `using-module` example using `webpack-dev-server`                        |
| `analyze` | Analyses the build process that would create `build/tevomaps.js`                    |
| `lint`    | Uses `eslint` to lint all source code                                               |

# Contributing Cont.

Once you have completed the above steps, contribution to the repository is as follows:

1. Create an issue on GitHub to address your concerns
1. In the issue state the feature request or problem (give exact steps for replicating problems)
1. Give a detailed description of a solution to the problem or the behavior of the feature request
1. If you plan to submit a PR then create a branch named as such `<issue-number>-<brief-branch-description>`
1. <brief-branch-description> should be 2-3 words that can most accurately describe the intent of the code in the branch
1. Write the code to create the feature or address the problem
1. Before opening a PR against master: run `npm run build` and bump the version number in the package.json according to (semantic versioning rules)[https://semver.org]
1. Open a PR of your branch against master
1. Respond to any comments
1. When all checks are passing and you have received a :+1:, squash & merge your PR
