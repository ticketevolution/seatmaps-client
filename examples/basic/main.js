import { Tevomaps } from '@ticketevolution/seatmaps-client'
import ticketGroups from '@-/mock-data/data/ticket-groups-1591449.json'

window.seatmap = new Tevomaps({
  venueId: '896',
  configurationId: '14341',
  ticketGroups
}).build('map')
