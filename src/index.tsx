import React from 'react'
import { render } from 'react-dom'
import { union, pick } from 'lodash-es'
import TicketMap, { Props, RequiredProps, DefaultProps } from './TicketMap'

const requiredConfigKeys: (keyof RequiredProps)[] = [
  'venueId',
  'configurationId'
]

const optionalConfigKeys: (keyof DefaultProps)[] = [
  'mapFontFamily',
  'selectedSections',
  'onSelection',
  'ticketGroups',
  'sectionPercentiles',
  'mapsDomain',
  'showControls'
]

export function extractConfigurationFromOptions (options: Props): Props {
  const keys = union(requiredConfigKeys, optionalConfigKeys)
  return pick(options, keys)
}

export function validateOptions (options: Props) {
  for (let key of requiredConfigKeys) {
    if (!options.hasOwnProperty(key)) {
      throw new Error(`Seatmap configuration requires a '${key}' value.`)
    }
  }
}

export default class SeatmapFactory {
  configuration: Props

  constructor (options: Props) {
    validateOptions(options)
    this.configuration = extractConfigurationFromOptions(options)
  }

  build (rootElementId: string) {
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
        {...this.configuration}
        ref={(ref: TicketMap) => { map = ref }} />
    ), rootElement)

    return map.publicApi
  }
}
