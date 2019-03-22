import { TicketGroup, NormalizedTicketGroup } from '../types'

export interface NormalizedTicketGroupsBySection {
  [section: string]: NormalizedTicketGroup[]
}

export interface CostRange {
  color: string
  min: number
  max: number
  percentile: number
  ticketGroups: TicketGroup[]
}

export interface Percentiles {
  [key: string]: string
}

export interface SectionMapping {
  [section: string]: {
    sectionName: string
  }
}

export interface DefaultProps {
  showLegend: boolean
  mapFontFamily: string
  selectedSections: string[]
  ticketGroups: TicketGroup[]
  sectionPercentiles: Percentiles
  mapsDomain: string
  onSelection(sections: string[]): void
}

export interface RequiredProps {
  venueId: string
  configurationId: string
}

export type Props = Partial<DefaultProps> & RequiredProps

export interface State {
  mapSvg?: SVGSVGElement
  sectionMapping: SectionMapping
  ticketGroups: TicketGroup[]
  selectedSections: Set<string>
  isDragging: boolean
  currentHoveredSection?: string
  tooltipActive: boolean
  tooltipSectionName: string
  tooltipX: number
  tooltipY: number
  mapNotFound: boolean
}
