import SeatmapFactory from './index'
import ticketGroups from './testdata/ticket-groups-1388953.json'
import './example.scss'

new SeatmapFactory({
  venueId: '1947',
  configurationId: '5842',
  mapFontFamily: 'Open Sans',
  ticketGroups
}).build('root')
