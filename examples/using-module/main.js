import Tevomaps from '../../src/index'
import ticketGroups from './ticket-groups-1591449'

window.seatmap = new Tevomaps({
  venueId: '4797',
  configurationId: '4543',
  ticketGroups
}).build('map')
