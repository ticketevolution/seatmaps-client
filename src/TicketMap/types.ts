import { TicketGroup, NormalizedTicketGroup } from '../types'

export interface NormalizedTicketGroupsBySection {
  [section: string]: NormalizedTicketGroup[]
}

export interface NormalizedTicketGroupsBySectionByZone {
  [zone: string]: NormalizedTicketGroupsBySection
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

export interface SectionZoneMapping {
  [section: string]: {
    sectionName: string
    zone?: string
  }
}

export interface DefaultProps {
  isZoneDefault: boolean
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
  sectionZoneMapping: SectionZoneMapping
  ticketGroups: TicketGroup[]
  selectedSections: Set<string>
  isZoneToggled: boolean
  isDragging: boolean
  currentHoveredZone?: string
  currentHoveredSection?: string
  tooltipActive: boolean
  tooltipSectionName: string
  tooltipZoneId: string
  tooltipX: number
  tooltipY: number
  mapNotFound: boolean
}
