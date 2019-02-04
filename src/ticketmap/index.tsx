import React, { Component } from 'react'
import { defaultMemoize, createSelectorCreator } from 'reselect'
import { isEqual } from 'lodash-es'
import ZoomSettings from './zoomSettings'
import Tooltip from './tooltip'
import Legend from './legend'

export interface TicketGroup {
  tevo_section_name: string
  retail_price: number
}

export interface NormalizedTicketGroup {
  section: string
  zone?: string
  price: number
}

interface Percentiles {
  [key: string]: string
}

interface SectionZoneMapping {
  [section: string]: {
    sectionName: string
    zone?: string
  }
}

interface DefaultProps {
  isZoneDefault: boolean
  showLegend: boolean
  mapFontFamily?: string
  selectedSections: string[]
  ticketGroups: TicketGroup[]
  sectionPercentiles: Percentiles
  mapsDomain: string
  onSelection(sections: string[]): void
}

export interface Props extends Partial<DefaultProps> {
  venueId: string
  configurationId: string
}

interface State {
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
}

interface PublicApi {
  updateTicketGroups: (ticketGroups: TicketGroup[]) => void
  highlightSection: (section: string) => void
  unhighlightSection: (section?: string) => void
  selectSection: (section: string) => void
  deselectSection: (section?: string) => void
}

interface Manifest {
  sections: {
    [key: string]: {
      zone_name: string
    }
  }
}

interface NormalizedTicketGroupsBySection {
  [section: string]: NormalizedTicketGroup[]
}

interface NormalizedTicketGroupsBySectionByZone {
  [zone: string]: NormalizedTicketGroupsBySection
}

interface CostRange {
  color: string
  min: number
  max: number
  percentile: number
  ticketGroups: TicketGroup[]
}

interface ElementProperties {
  [key: string]: string
}

type PropertiesForElement = (element: Element) => ElementProperties

const $ticketGroups = (state: State) => state.ticketGroups

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual)

const $missingSectionIds = createDeepEqualSelector(
  (state: State) => state.sectionZoneMapping,
  $ticketGroups,
  (sectionZoneMapping, ticketGroups) => ticketGroups
    .map(ticketGroup => ticketGroup.tevo_section_name.toLowerCase())
    .filter(sectionId => sectionZoneMapping[sectionId] === undefined)
)

const $availableTicketGroups = createDeepEqualSelector(
  (state: State) => state.ticketGroups,
  (state: State) => state.sectionZoneMapping,
  (ticketGroups, sectionZoneMapping) => ticketGroups
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

const $sectionPercentiles = (_state: State, props: Props) => props.sectionPercentiles

const $costRanges = createDeepEqualSelector(
  $sectionPercentiles,
  $priceSortedTicketGroups,
  (percentiles = {}, ticketGroups) => {
    const costRanges = Object.entries(percentiles)
      .map(([percentile, color]) => ({
        percentile: parseFloat(percentile),
        color,
        min: 0,
        max: 0,
        ticketGroups: []
      } as CostRange))
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

export default class TicketMap extends Component<Props & DefaultProps, State> {
  publicApi: PublicApi
  mapRootRef!: HTMLElement
  rootRef!: HTMLElement

  static defaultProps: DefaultProps = {
    mapsDomain: 'https://maps.ticketevolution.com',
    onSelection: () => { },
    isZoneDefault: false,
    selectedSections: [],
    sectionPercentiles: {
      '0.2': '#FFC515',
      '0.4': '#f2711c',
      '0.6': '#D6226A',
      '0.8': '#a333c8',
      '1': '#2A6EBB'
    },
    ticketGroups: [],
    showLegend: true
  }

  constructor(props: Props & DefaultProps) {
    super(props)
    this.state = {
      sectionZoneMapping: {} as SectionZoneMapping,
      selectedSections: new Set(this.props.selectedSections.filter(section => !!section)),
      isZoneToggled: this.props.isZoneDefault,
      isDragging: false,
      tooltipActive: false,
      tooltipSectionName: '',
      tooltipZoneId: '',
      tooltipX: 0,
      tooltipY: 0,
      ticketGroups: this.props.ticketGroups
    }

    this.publicApi = {
      updateTicketGroups: this.updateTicketGroups,
      highlightSection: this.highlightSection,
      unhighlightSection: this.unhighlightSection,
      selectSection: this.selectSection,
      deselectSection: this.deselectSection
    }
  }

  /**
   * Lifecycle
   */

  async componentDidMount() {
    try {
      await this.fetchMap()
      this.setupMap()
      await this.fetchManifest()
    } catch (error) {
      console.error(error)
    }
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if ($availableTicketGroups(prevState) !== $availableTicketGroups(this.state)) {
      this.updateMap()
    }

    if (!isEqual(this.state.selectedSections, prevState.selectedSections)) {
      this.props.onSelection(Array.from(this.state.selectedSections))
    }

    if ($missingSectionIds(prevState) !== $missingSectionIds(this.state) && $missingSectionIds(this.state).length > 0) {
      console.warn('Unknown section names found in ticket groups: %o', $missingSectionIds(this.state))
    }
  }

  async fetchMap() {
    const mapSvgUrl = `${this.configFilePath}/map.svg`
    const mapNotAvailableUrl = 'https://maps.ticketevolution.com/maps/not_available.svg' // Only exists on prod
    let mapResponse = await fetch(mapSvgUrl)
    if (!mapResponse.ok) {
      mapResponse = await fetch(mapNotAvailableUrl)
    }
    const mapHtml = await mapResponse.text()
    // Can't use dangerouslySetInnerHTML={{ __html: this.state.mapHtml }} in this case because
    // re-rendering would inject all this HTML again, which would break all the event bindings
    // we set in future methods.
    this.mapRootRef.innerHTML = mapHtml
  }

  async fetchManifest() {
    const manifestResponse = await fetch(`${this.configFilePath}/manifest.json`)
    if (!manifestResponse.ok) {
      throw Error('There was an error fetching the venue map data, please try again')
    }

    const manifest: Manifest = await manifestResponse.json()

    this.setState({
      sectionZoneMapping: Object.entries(manifest.sections)
        .reduce((memo, [sectionName, section]) => ({
          ...memo,
          [sectionName.toLowerCase()]: {
            sectionName,
            zone: section.zone_name ? section.zone_name.toLowerCase() : undefined
          }
        }), {})
    })
  }

  setupMap() {
    const mapSvg = this.mapRootRef.querySelector('svg') as SVGSVGElement
    mapSvg.style.width = '100%'
    mapSvg.style.height = '100%'
    mapSvg.style.minWidth = '100%'
    mapSvg.style.minHeight = '100%'

    this.setUnavailableColors()

    mapSvg.querySelectorAll<HTMLElement>('*[data-section-id]').forEach(path => {
      path.setAttribute('data-section-id', (path.getAttribute('data-section-id') as string).toLowerCase())
    })

    this.setState({ mapSvg })
  }

  /**
   * Properties
   */

  get sortedTicketGroupPrices() {
    return $availableTicketGroups(this.state)
      .map(group => group.price)
      .sort((a, b) => a - b)
  }

  get ticketGroupsBySectionByZone(): NormalizedTicketGroupsBySectionByZone {
    const ticketGroupsBySection = this.ticketGroupsBySection
    return Object.keys(ticketGroupsBySection).reduce((memo, section) => {
      const { zone } = this.state.sectionZoneMapping[section]
      if (!zone) {
        return memo
      }
      return {
        ...memo,
        [zone]: {
          ...(memo[zone] || {}),
          [section]: ticketGroupsBySection[section]
        }
      }
    }, {} as NormalizedTicketGroupsBySectionByZone)
  }

  get ticketGroupsBySection(): NormalizedTicketGroupsBySection {
    return $availableTicketGroups(this.state).reduce((memo, ticketGroup) => {
      const { section } = ticketGroup
      return {
        ...memo,
        [section]: [
          ...(memo[section] || []),
          ticketGroup
        ]
      }
    }, {} as NormalizedTicketGroupsBySection)
  }

  get venueSections() {
    return Object.keys(this.ticketGroupsBySection)
  }

  get configFilePath() {
    return `${this.props.mapsDomain}/${this.props.venueId}/${this.props.configurationId}`
  }

  /**
   * Public Methods
   */

  highlightSection = (section: string) => this.toggleSectionHighlight(section, true)

  unhighlightSection = (section?: string) => {
    if (!section) {
      this.setState({ currentHoveredSection: undefined })
      return this.updateMap()
    }
    return this.toggleSectionHighlight(section, false)
  }

  toggleSectionHighlight = (section: string, shouldHighlight = true) => {
    if (!section) {
      return
    }
    const sectionId = section.toLowerCase()
    const isUnhighlightingSelectedSection = !shouldHighlight && this.state.selectedSections.has(sectionId)
    if (isUnhighlightingSelectedSection) {
      return
    }
    return this.fillSection(sectionId, shouldHighlight)
  }

  selectSection = (section: string) => {
    return this.toggleSectionSelect(section, true)
  }

  deselectSection = (section?: string) => {
    if (!section) {
      this.state.selectedSections.clear()
      return this.updateMap()
    }
    return this.toggleSectionSelect(section, false)
  }

  toggleSectionSelect = (section: string, shouldHighlight = true) => {
    if (!section) {
      return
    }

    const sectionId = section.toLowerCase()
    this.fillSection(sectionId, shouldHighlight)

    const selectedSections = new Set(this.state.selectedSections)
    if (shouldHighlight) {
      selectedSections.add(sectionId)
    } else {
      selectedSections.delete(sectionId)
    }

    this.setState({ selectedSections })
  }

  highlightZone = (zone: string) => {
    return this.toggleZoneHighlight(zone, true)
  }

  unhighlightZone = (zone?: string) => {
    if (!zone) {
      this.setState({ currentHoveredZone: undefined })
      return this.updateMap()
    }
    return this.toggleZoneHighlight(zone, false)
  }

  toggleZoneHighlight = (zone: string, shouldHighlight = true) => {
    if (!zone) {
      return
    }
    const zoneId = zone.toLowerCase()
    const isUnhighlightingSelectedZone = !shouldHighlight && this.areAllSectionsInTheZoneSelected(zoneId)
    if (isUnhighlightingSelectedZone) {
      return
    }
    return this.fillZone(zoneId, shouldHighlight)
  }

  selectZone = (zone: string) => {
    return this.toggleZoneSelect(zone, true)
  }

  deselectZone = (zone?: string) => {
    if (!zone) {
      this.state.selectedSections.clear()
      return this.updateMap()
    }
    return this.toggleZoneSelect(zone, false)
  }

  toggleZoneSelect = (zone: string, shouldHighlight = true) => {
    if (!zone) {
      return
    }

    const zoneId = zone.toLowerCase()
    this.fillZone(zoneId, shouldHighlight)

    const sections = Object.keys(this.ticketGroupsBySectionByZone[zoneId])
    const selectedSections = new Set(this.state.selectedSections)
    if (shouldHighlight) {
      sections.forEach(section => selectedSections.add(section))
    } else {
      sections.forEach(section => selectedSections.delete(section))
    }

    this.setState({ selectedSections })
  }

  updateTicketGroups = (ticketGroups = this.props.ticketGroups) => {
    this.setState({ ticketGroups })
  }

  /**
   * Colors
   */

  setUnavailableColors = () => {
    this.fillPathsForSection(element => ({ 'data-unavailable-color': element.getAttribute('fill') as string }))
  }

  fillUnavailableColors = () => {
    this.fillPathsForSection(element => ({
      'fill': element.getAttribute('data-unavailable-color') as string,
      'opacity': '1',
      'stroke-width': '1',
      'stroke': '#FFFFFF'
    }))
  }

  fillPathsForSection = (propertiesForElement: PropertiesForElement, section?: string): void =>
    this.getAllPaths(section).forEach(element => 
      Object.entries(propertiesForElement(element))
        .forEach(([property, value]) =>
          element.setAttribute(property, value)))

  getAllPaths = (id?: string) =>
    Array.from(this.mapRootRef.querySelectorAll(`[data-section-id${id ? `="${id}"` : ''}]`))
      .reduce((memo, element) => {
        const children = element.querySelectorAll('path');
        return memo.concat(children.length ? Array.from(children) : [element])
      }, [] as Element[])

  /**
   * Helpers
   */

  getAllSectionsInZoneBySectionId(section: string) {
    const zoneMeta = this.state.sectionZoneMapping[section] || {}
    return this.venueSections.filter((venueSection) => this.state.sectionZoneMapping[venueSection].zone === zoneMeta.zone)
  }

  areAllSectionsInTheZoneSelected(zone: string) {
    return Object.keys(this.ticketGroupsBySectionByZone[zone])
      .every(section => this.state.selectedSections.has(section))
  }

  updateMap() {
    this.fillUnavailableColors()
    if (this.state.isZoneToggled) {
      Object.keys(this.ticketGroupsBySectionByZone).forEach(zone => {
        const shouldHighight = this.areAllSectionsInTheZoneSelected(zone)
        this.toggleZoneSelect(zone, shouldHighight)
      })
    } else {
      Object.keys(this.ticketGroupsBySection).forEach(section => {
        const shouldHighight = this.state.selectedSections.has(section)
        this.toggleSectionSelect(section, shouldHighight)
      })
    }
  }

  fillSection(section: string, shouldHighlight = true) {
    const isAnAvailableSection = this.venueSections.includes(section)
    if (isAnAvailableSection) {
      this.fillPathsForSection(element => ({
        'fill': this.getDefaultColor(this.ticketGroupsBySection[section]),
        'opacity': shouldHighlight ? '1' : '0.6',
        'stroke-width': '1',
        'stroke': shouldHighlight ? '#4a4a4a' : '#FFFFFF'
      }), section)
    }
  }

  fillZone(zone: string, shouldHighlight = true) {
    const ticketGroupsBySection = this.ticketGroupsBySectionByZone[zone]
    const allTicketGroupsInZone = Object.values(ticketGroupsBySection)
      .reduce((memo, ticketGroupsInSection) => [...memo, ...ticketGroupsInSection], [])
    Object.keys(ticketGroupsBySection).forEach(section => {
      const isAnAvailableSection = this.venueSections.includes(section)
      if (isAnAvailableSection) {
        this.fillPathsForSection(element => ({
          'fill': this.getDefaultColor(allTicketGroupsInZone),
          'opacity': shouldHighlight ? '1' : '0.6'
        }), section)
      }
    })
  }

  /**
   * Coloring
   */

  getDefaultColor(ticketGroups: NormalizedTicketGroup[]): string {
    const lowestTicketPriceInSection = ticketGroups.map(({ price }) => price).sort((a, b) => a - b)[0]

    const ranges = $costRanges(this.state, this.props)

    for (const range of ranges) {
      if (range.max > lowestTicketPriceInSection) {
        return range.color
      }
    }

    return ranges[ranges.length - 1].color
  }

  /**
   * Interation Callbacks
   */

  onMouseOver = (event: React.MouseEvent<HTMLElement>) => {
    const element = (event.target as HTMLElement).closest('[data-section-id]')
    if (!element) {
      return
    }

    const sectionId = element.getAttribute('data-section-id')
    if (!sectionId) {
      return
    }

    const section = sectionId.toLowerCase()
    if (this.venueSections.includes(section)) {
      return this.doHover(event.clientX, event.clientY, section)
    }
  }

  onMouseOut = (event: React.MouseEvent<HTMLElement>) => {
    const enteringElement = event.relatedTarget as HTMLElement

    const isEnteringText = !!enteringElement && enteringElement.nodeName === 'text'
    if (isEnteringText) {
      return
    }

    const enteringSection = !!enteringElement && enteringElement.closest('[data-section-id]')
    const isEnteringTheSameSection = !!enteringSection &&
      (enteringSection.getAttribute('data-section-id') as string).toLowerCase() === this.state.currentHoveredSection    
    if (isEnteringTheSameSection) {
      return
    }
    
    return this.doHoverCleanup()
  }

  onClick = () => {
    const section = this.state.currentHoveredSection
    if (!section) {
      return
    }
    if (this.venueSections.includes(section)) {
      return this.selectSectionOrZone(section)
    }
  }

  onMouseMove = ({ nativeEvent: { offsetX, offsetY } }: React.MouseEvent<HTMLElement, MouseEvent>) => {
    this.setState({
      tooltipX: offsetX,
      tooltipY: offsetY
    })
  }

  /**
   * Interactions
   */

  doHover(tooltipX: number, tooltipY: number, section: string) {
    const { zone, sectionName } = this.state.sectionZoneMapping[section]

    type NewState =
      Pick<State, 'tooltipActive' | 'tooltipX' | 'tooltipY' | 'tooltipSectionName'> &
      Partial<Pick<State, 'currentHoveredSection' | 'currentHoveredZone'>>

    const newState: NewState = {
      tooltipActive: true,
      tooltipX,
      tooltipY,
      tooltipSectionName: sectionName
    }

    if (this.state.isZoneToggled) {
      if (!!zone) {
        newState.currentHoveredZone = zone
        this.highlightZone(zone)
      }
    } else {
      newState.currentHoveredSection = section
      this.highlightSection(section)
    }

    this.setState(newState)
  }

  doHoverCleanup(): void {
    const section = this.state.currentHoveredSection
    if (!section) {
      return
    }

    this.setState({
      tooltipActive: false,
      currentHoveredZone: undefined,
      currentHoveredSection: undefined
    })

    if (this.state.isZoneToggled) {
      return this.unhighlightZone(this.state.sectionZoneMapping[section].zone)
    }

    this.unhighlightSection(section)
  }

  selectSectionOrZone(section: string) {
    if (this.state.isZoneToggled) {
      const { zone } = this.state.sectionZoneMapping[section]
      if (zone) {
        this.toggleZoneSelect(zone, !this.areAllSectionsInTheZoneSelected(zone))
      }
    } else {
      this.toggleSectionSelect(section, !this.state.selectedSections.has(section))
    }
  }

  render() {
    const containerStyle: React.CSSProperties = {
      height: '100%',
      minHeight: '100%',
      minWidth: '100%',
      position: 'relative'
    }

    if (this.props.mapFontFamily) {
      containerStyle.fontFamily = this.props.mapFontFamily
    }

    return (
      <div
        ref={element => { this.rootRef = element as HTMLElement }}
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
        onMouseMove={this.onMouseMove}
        onClick={this.onClick}
        style={containerStyle}
        onTouchMove={() => this.setState({ isDragging: true })}
        onTouchEnd={event => {
          if (!this.state.isDragging) {
            this.onClick()
          }
          this.setState({ isDragging: false })
        }}
      >
        <Tooltip
          isActive={this.state.tooltipActive}
          x={this.state.tooltipX}
          y={this.state.tooltipY}
          name={this.state.tooltipSectionName}
          color={this.state.currentHoveredSection ? this.getDefaultColor(this.ticketGroupsBySection[this.state.currentHoveredSection]) : ''}
          ticketGroups={$availableTicketGroups(this.state).filter(ticketGroup => ticketGroup.section === this.state.currentHoveredSection)}
        />
        <div style={{ display: 'flex' }}>
          {this.state.mapSvg && <ZoomSettings mapSvg={this.state.mapSvg} />}
          {/* <ZoneToggle
            isZoneToggled={this.state.isZoneToggled}
            onToggle={isZoneToggled => {
              this.setState({ isZoneToggled });
              fillUnavailableColors();
              this.updateMap();
            }}
          /> */}
        </div>
        <div
          ref={element => { this.mapRootRef = element as HTMLElement }}
          style={{
            cursor: '-webkit-grab',
            height: '100%',
            width: '100%',
            minHeight: '100%',
            minWidth: '100%',
            opacity: this.state.mapSvg ? 1 : 0
          }}
        />
        {this.props.showLegend && <Legend ranges={$costRanges(this.state, this.props)} />}
      </div>
    )
  }
}
