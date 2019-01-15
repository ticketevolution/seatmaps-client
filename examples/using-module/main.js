import Tevomaps from '../../src/index'
import ticketGroups from './ticket-groups-1591449'

window.seatmap = new Tevomaps({
  venueId: '896',
  configurationId: '14341',
  ticketGroups
}).build('map')
