<p align="center">
  <img src="https://storage.googleapis.com/ticketevolution/logo.jpg" alt="Ticket Evolution logo" height="200" />
</p>

<h1 align="center">Ticket Evolution Seatmaps</h1>

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A client side JavaScript plugin that enables users to view seatmaps in relation to available tickets for Ticket Evolution events.

Once instantiated, this plugin will

1. Fetch the map SVG and manifest JSON, with the given `venueId` and `configurationId`, from Ticket Evolution AWS S3 buckets using the `mapsDomain`.
2. Render the map in the provided DOM element.
3. Color map sections according to the `sectionPercentile` configurations and the available `ticketGroups` (and any `selectedSections` if provided).
4. Render a tooltip when the user hovers over a section, which will provide quantity and price information.

After Instantiation, a [public API](#public-api) is available with a limited number of functions to interact with the map.

**Help:** [Ticket Evolution](http://www.ticketevolution.com/contact-us/)

# Installation

## Load Seatmaps via `<script>` tag:

```html
<!-- Development -->
<script src="https://maps.ticketevolution.com/dev/tevomaps.js"></script>

<!-- Production -->
<script src="https://maps.ticketevolution.com/tevomaps.js"></script>
```
> **NOTE:** We are working on a CI/CD pipeline to push the build to a publicly accessible S3 bucket, for now if you wish to embed in the browser you can download the build file [here](build/tevomaps.js) or the gzip [here](build/tevomaps.js.gz)

## CommonJS

### 1. Install via NPM

```bash
npm install --save ticketevolution/ticket-evolution-seatmaps
```

### 2. Import into modules

```javascript
import Tevomaps from 'ticket-evolution-seatmaps';
```

# Instantiation

```javascript
var seatmap = new Tevomaps({
  venueId: '10',
  configurationId: '1046',
});
var seatmapApi = seatmap.build('map-root-element-id');
seatmapApi.highlightSection('section-id');
```

*Note: The value provided to `build` is an element ID used in `document.getElementById`. The map will be rendered inside this element.*

# Configuration

| Name | Required | Default Value | Description |
| - | :-: | - | - |
| venueId | X | | Ticket Map Venue ID |
| configurationId | X | | Ticket Map Configuration ID |
| sectionPercentiles | |  `{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.2': '#FFC515',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.4': '#f2711c',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.6': '#D6226A',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'0.8': '#a333c8',`<br>&nbsp;&nbsp;&nbsp;&nbsp;`'1': '#2A6EBB'`<br>`}` | Define percentiles to color sections based on their average ticket group price. Ticket groups which fall within a given range will display the associated color on the map for their section.<br><br>ie. Given an event with 100 ticket groups, with each ticket group price incrementing by $1 from $100 to $200, a section whose average ticket group price is $110 will be displayed as `#FFC515`, and a section whose average price of $175 will be displayed as `#a333c8`. |
| mapFontFamily | | | Set a default font for the map. Native browser fonts available, a list below is provided but results may vary depending upon the browser and browser version.<br><br>• Helvetica<br>• Arial<br>• Times<br>• Times New Roman<br>• Courier<br>• Courier New<br>• Verdana<br>• Tahoma |
| mapsDomain | | `https://maps.ticketevolution.com` | The domain from which map SVGs and manifests will be fetched. |
| onSelection | | `() => void` | A function which will be called by Tevomaps when a section of the map has been clicked. It will pass as arguments an array of all currently selected section IDs and expect nothing back.<br><br>`onSelection: function (sectionIds) {`<br>&nbsp;&nbsp;&nbsp;&nbsp;`console.log(sectionIds); //=> ['id-1','id-2']`<br>`}`<br><br>*Note: This method is also called when a section is deselected. If all sections are deselected, the `sectionIds` array will be empty.* |
| selectedSections | | `[]` | An array of section IDs for the map to initially highlight by default when it is rendered. |
| ticketGroups | | `[]` | An array of ticket groups to be used for section pricing. Expects each ticket group to adhere to the [TicketGroup interface](#interfaces). |

# Public API

| Name | Input | Output | Notes
| - | - | - | - |
| updateTicketGroups | `TicketGroup[]` | `void` | Changes the collection of ticket groups in the map used to calculate available sections and section prices. Useful if you have a feature for filtering ticket groups and you want the map to update.
| highlightSection | `Section` | `void` | Temporarily colors the given section by making it more opaque. This is the same effect used for hovering on a section. |
| unhighlightSection | `Section` | `void` | Removes the highlight effect of the given section, if it's not selected, by reverting it back to its base transparency. This is the same effect used for hovering off on a section. |
| selectSection | `Section` | `void` | This is the same effect used for clicking on a section to select it. It colors the section and will not revert back by hovering off it or calling `unhighlightSection`. Calls the `onSelection` callback with the updated array of selected sections. |
| deselectSection | `Section` | `void` | This is the same effect used for clicking on a section to deselect it. It reverts the color of the section and is the only way to unhighlight a selected section. Calls the `onSelection` callback with the updated array of selected sections. |

# Interfaces

| Name | Properties |
| - | - |
| TicketGroup | `{`<br>&nbsp;&nbsp;&nbsp;&nbsp;`tevo_section_name: string;`<br>&nbsp;&nbsp;&nbsp;&nbsp;`retail_price: number;`<br>`}` |
| Section | `string` |

# Contributing
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Prerequisites
- Node

## Getting Started
We've made the startup process simple by using a Makefile for all common workflows.

To see what Makefile commands are available, in your terminal shell run `make` or `make help`. It will list all the available Makefile commands with their descriptions, such as
```Makefile
install                        Install client and server side packages for development
start                          Start the development server
```
