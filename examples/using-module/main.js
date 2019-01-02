import Tevomaps from '../../src/index'
import ticketGroups from './ticket-groups-138953'

window.seatmap = new Tevomaps({
  venueId: '1947',
  configurationId: '5842',
  ticketGroups
}).build('map')
