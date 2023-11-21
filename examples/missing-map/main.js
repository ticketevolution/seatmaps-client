import { Tevomaps } from '@ticketevolution/seatmaps-client'

window.seatmap = new Tevomaps({
  venueId: "1",
  configurationId: "1",
  mapFontFamily: '"Open Sans", sans-sarif',
}).build("map");
