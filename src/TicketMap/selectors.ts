import { defaultMemoize, createSelectorCreator } from 'reselect'
import { isEqual } from 'lodash-es'

import { NormalizedTicketGroup } from '../types'
import {
  State,
  Props,
  NormalizedTicketGroupsBySection,
  NormalizedTicketGroupsBySectionByZone,
  CostRange
} from './types'

const $ticketGroups = (state: State) => state.ticketGroups
const $sectionZoneMapping = (state: State) => state.sectionZoneMapping
const $selectedSections = (state: State) => state.selectedSections
const $sectionPercentiles = (_state: State, props: Props) => props.sectionPercentiles

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual)

export const $missingSectionIds = createDeepEqualSelector(
  $sectionZoneMapping,
  $ticketGroups,
  (sectionZoneMapping, ticketGroups) => ticketGroups
    .map(ticketGroup => ticketGroup.tevo_section_name.toLowerCase())
    .filter(sectionId => sectionZoneMapping[sectionId] === undefined)
)

export const $availableTicketGroups = createDeepEqualSelector(
  $ticketGroups,
  $sectionZoneMapping,
  (ticketGroups, sectionZoneMapping) =>
    ticketGroups
      .map((ticketGroup): NormalizedTicketGroup => {
        const section = ticketGroup.tevo_section_name.toLowerCase()
        const zoneMapping = sectionZoneMapping[section]

        return zoneMapping && {
          section,
          zone: zoneMapping.zone,
          price: ticketGroup.retail_price
        }
      }).filter(ticketGroup => ticketGroup)
)

const $priceSortedTicketGroups = createDeepEqualSelector(
  $ticketGroups,
  ticketGroups => ticketGroups.sort((a, b) => a.retail_price - b.retail_price)
)

export const $costRanges = createDeepEqualSelector(
  $sectionPercentiles,
  $priceSortedTicketGroups,
  (percentiles = {}, ticketGroups) => {
    const costRanges = Object.entries(percentiles)
      .map(([percentile, color]): CostRange => ({
        percentile: parseFloat(percentile),
        color,
        min: 0,
        max: 0,
        ticketGroups: []
      }))
      .sort((a, b) => a.percentile - b.percentile)

    for (let i = 0; i < ticketGroups.length; i++) {
      const percentile = i / ticketGroups.length
      for (const costRange of costRanges) {
        if (costRange.percentile > percentile) {
          costRange.ticketGroups.push(ticketGroups[i])
          break
        }
      }
    }

    costRanges.forEach(costRange => {
      if (costRange.ticketGroups.length > 0) {
        costRange.min = costRange.ticketGroups[0].retail_price
        costRange.max = costRange.ticketGroups[costRange.ticketGroups.length - 1].retail_price
      }
    })

    return costRanges
  }
)

export const $ticketGroupsBySection = createDeepEqualSelector(
  $availableTicketGroups,
  (ticketGroups): NormalizedTicketGroupsBySection =>
    ticketGroups.reduce((memo: NormalizedTicketGroupsBySection, ticketGroup) => ({
      ...memo,
      [ticketGroup.section]: [
        ...(memo[ticketGroup.section] || []),
        ticketGroup
      ]
    }), {})
)

export const $ticketGroupsBySectionByZone = createDeepEqualSelector(
  $ticketGroupsBySection,
  $sectionZoneMapping,
  (ticketGroupsBySection, sectionZoneMapping): NormalizedTicketGroupsBySectionByZone =>
    Object.keys(ticketGroupsBySection).reduce((memo: NormalizedTicketGroupsBySectionByZone, section) => {
      const { zone } = sectionZoneMapping[section]
      return !zone ? memo : {
        ...memo,
        [zone]: {
          ...(memo[zone] || {}),
          [section]: ticketGroupsBySection[section]
        }
      }
    }, {})
)

export const $venueSections = createDeepEqualSelector(
  $ticketGroupsBySection,
  Object.keys
)

export const $areAllSectionsInTheZoneSelected = createDeepEqualSelector(
  $ticketGroupsBySectionByZone,
  $selectedSections,
  (ticketGroupsBySectionByZone, selectedSections) =>
    (zone: string) =>
      Object.keys(ticketGroupsBySectionByZone[zone])
        .every(section => selectedSections.has(section))
)
