<p align="center">
  <img src="https://storage.googleapis.com/ticketevolution/logo.jpg" alt="Ticket Evolution logo" height="200" />
</p>

<h1 align="center">Ticket Evolution Seatmaps</h1>

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A client side JavaScript plugin that enables users to view seatmaps in relation to available tickets for Ticket Evolution events.

* **Help:** [TicketEvolution](http://www.ticketevolution.com/contact-us/)

# Quick Look

```html
<!-- Ticket Evolution Seatmaps -->
<script src="https://storage.googleapis.com/ticketevolution-dev/main.js"></script>
<script type="text/javascript">
  window._ticketEvolution = {
    accessToken: '<access_token>',
    apiVersion: '11',
    ticketMapId: '110_8888881',
    rootId: 'root'
  }
</script>
<!-- End Ticket Evolution Seatmaps -->
```

# Loading and utilizing Ticket Evolution Seatmaps

### 1. Load Seatmaps via `<script>` tag:

```html
<!-- Development -->
<script src="https://storage.googleapis.com/ticketevolution-dev/main.js"></script>

<!-- Production -->
<script src="https://storage.googleapis.com/ticketevolution/main.js"></script>
```

### 2. Include the Ticket Evolution window object on your page

# Configuration

## Required Configuration

```javascript
window._ticketEvolution = {
  // Ticket Map ID List
  // can be found in your Tevo Settings
  ticketMapId: '110_8888881',

  // Api Version to be utilized
  apiVersion: '11',

  // Root Element ID where the map will be
  // rendered in your HTML (should be unique)
  rootId: 'root',

  // This id is utilized to query the Ticket Evolution API
  // for available tickets for this event and render the proper
  // venue ticket map
  eventId: '12345678'
}
```

## Additional Configuration

```javascript
window._ticketEvolution = {
  // Access Token found in your Ticket Evolution settings
  //  allowing you to utilize the client library
  accessToken: '<access_token>',

  // Api Version to be utilized
  apiVersion: '11',

  // Root Element ID where the map will be
  // rendered in your HTML (should be unique)
  rootId: 'root'

  // This id is utilized to query the Ticket Evolution API
  // for available tickets for this event and render the proper
  // venue ticket map
  eventId: '12345678',

  // It is inferred that the width that is provided is in pixels
  // i.e. below would equal 500px
  width: '500',

  // if you would like to use a color palette our Ticket Evolution Design team
  // has tested and optimized, please select from ('light' or 'dark')
  // if you would like to override any of the color variables defined in the themes
  // you may override them by simply including their hex value below
  theme: 'light',
  // Color customization options for the different tiers of tickets available
  // Please use Hex Color format i.e (#B1DDF1)
  emptySectionFill: '#9E9E9E',
  primarySectionFill: '#B1DDF1',
  cheapSectionFill: '#F7B267',
  expensiveSectionFill: '#6699CC',
  selectedSectionFill: '#F06449',
  hoverSectionFill: '#B5BA72'
}
```
