import React, { render } from 'react-dom'
import TicketMap, { Props } from './TicketMap'

export default class SeatmapFactory {
  options: Props

  constructor(options: Props) {
    this.options = options
  }

  build(rootElementId: string) {
    if (!rootElementId) {
      throw new Error('Seatmaps must be initialized with a DOM element.')
    }

    const rootElement = document.getElementById(rootElementId)
    if (!rootElement) {
      throw new Error('Seatmaps must be initialized with a DOM element.')
    }

    let map!: TicketMap

    render((
      <TicketMap
        {...this.options}
        ref={(ref: TicketMap) => { map = ref }}
      />
    ), rootElement)

    return map.publicApi
  }
}
