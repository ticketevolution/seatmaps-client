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

export interface Props {
  venueId: string
  configurationId: string
  isZoneDefault?: boolean
  showLegend?: boolean
  mapFontFamily?: string
  selectedSections?: string[]
  ticketGroups?: TicketGroup[]
  sectionPercentiles?: Percentiles
  mapsDomain?: string
  onSelection?(sections: string[]): void
}

interface State {
  mapSvg: SVGSVGElement
  sectionZoneMapping: any
  ticketGroups: TicketGroup[]
  selectedSections: Set<string>
  isZoneToggled: boolean
  isDragging: boolean
  currentHoveredZone: string
  currentHoveredSection: string
  tooltipActive: boolean
  tooltipSectionName: string
  tooltipZoneId: string
  tooltipX: number
  tooltipY: number,
  isInitializing: boolean,
  cachedTicketGroupsUpdate: TicketGroup[]
}

interface PublicApi {
  updateTicketGroups(ticketGroups: TicketGroup[]): void
  highlightSection(section: string): void
  unhighlightSection(section?: string): void
  selectSection(section: string): void
  deselectSection(section?: string): void
}

interface Manifest {
  sections: {
    [key: string]: {
      zone_name: string
    }
  }
}

interface TicketGroupsBySectionByZone {
  [key: string]: {
    [key: string]: TicketGroup
  }
}

interface CostRange {
  color: string
  min: number
  max: number
  percentile: number
  ticketGroups: TicketGroup[]
}

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
  (percentiles, ticketGroups) => {
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

const areSetsEqual = (setA: Set, setB: Set): boolean => {
  if (setA.size !== setB.size) {
    return false
  }
  for (const element of setA) {
    if (!setB.has(element)) {
      return false
    }
  }
  return true
}

export default class TicketMap extends Component<Props, State> {
  publicApi: PublicApi
  mapRootRef: HTMLElement
  rootRef: HTMLElement

  static defaultProps = {
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

  constructor(props: Props) {
    super(props)
    this.state = {
      mapSvg: undefined,
      sectionZoneMapping: {},
      selectedSections: new Set(this.props.selectedSections.filter(section => !!section)),
      isZoneToggled: this.props.isZoneDefault,
      isDragging: false,
      currentHoveredZone: null,
      currentHoveredSection: null,
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
    if ($availableTicketGroups(prevState) != $availableTicketGroups(this.state)) {
      this.updateMap()
    }

    if (!areSetsEqual(this.state.selectedSections, prevState.selectedSections)) {
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
      isInitializing: false,
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
    const mapSvg = this.mapRootRef.querySelector('svg')
    mapSvg.style.width = '100%'
    mapSvg.style.height = '100%'
    mapSvg.style.minWidth = '100%'
    mapSvg.style.minHeight = '100%'

    this.setUnavailableColors()

    for (const path of mapSvg.querySelectorAll('*[data-section-id]')) {
      path.setAttribute('data-section-id', path.getAttribute('data-section-id').toLowerCase())
    }

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

  get ticketGroupsBySectionByZone(): TicketGroupsBySectionByZone {
    const ticketGroupsBySection = this.ticketGroupsBySection
    return Object.keys(ticketGroupsBySection).reduce((memo, section) => {
      const { zone } = this.state.sectionZoneMapping[section]
      return {
        ...memo,
        [zone]: {
          ...(memo[zone] || {}),
          [section]: ticketGroupsBySection[section]
        }
      }
    }, {})
  }

  get ticketGroupsBySection() {
    return $availableTicketGroups(this.state).reduce((memo, ticketGroup) => {
      const { section } = ticketGroup
      return {
        ...memo,
        [section]: [
          ...(memo[section] || []),
          ticketGroup
        ]
      }
    }, {})
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

  highlightSection = (section: string): void => this.toggleSectionHighlight(section, true)

  unhighlightSection = (section?: string): void => {
    if (!section) {
      this.setState({ currentHoveredSection: null })
      return this.updateMap()
    }
    return this.toggleSectionHighlight(section, false)
  }

  toggleSectionHighlight = (section?: string, shouldHighlight: boolean = true): void => {
    if (!section) {
      return
    }

    const sectionId: string = section.toLowerCase()
    const isUnhighlightingSelectedSection: boolean = !shouldHighlight && this.state.selectedSections.has(sectionId)
    if (isUnhighlightingSelectedSection) {
      return
    }

    return this.fillSection(sectionId, shouldHighlight)
  }

  selectSection = (section: string): void => this.toggleSectionSelect(section, true)

  deselectSection = (section?: string): void => {
    if (!section) {
      this.state.selectedSections.clear()
      return this.updateMap()
    }
    return this.toggleSectionSelect(section, false)
  }

  toggleSectionSelect = (section: string, shouldHighlight: boolean = true): void => {
    if (!section) {
      return
    }

    const sectionId: string = section.toLowerCase()
    this.fillSection(sectionId, shouldHighlight)

    const selectedSections: Set<string> = new Set(this.state.selectedSections)
    if (shouldHighlight) {
      selectedSections.add(sectionId)
    } else {
      selectedSections.delete(sectionId)
    }

    this.setState({ selectedSections })
  }

  highlightZone = (zone: string): void => this.toggleZoneHighlight(zone, true)

  unhighlightZone = (zone: string): void => this.toggleZoneHighlight(zone, false)

  toggleZoneHighlight = (zone: string, shouldHighlight: boolean = true): void => {
    if (!zone) {
      return
    }

    const zoneId: string = zone.toLowerCase()
    const isUnhighlightingSelectedZone: boolean = !shouldHighlight && this.areAllSectionsInTheZoneSelected(zoneId)
    if (isUnhighlightingSelectedZone) {
      return
    }

    return this.fillZone(zoneId, shouldHighlight)
  }

  selectZone = (zone: string): void => this.toggleZoneSelect(zone, true)

  deselectZone = (zone: string): void => this.toggleZoneSelect(zone, false)

  toggleZoneSelect = (zone: string, shouldHighlight = true): void => {
    if (!zone) {
      return
    }

    const zoneId: string = zone.toLowerCase()
    this.fillZone(zoneId, shouldHighlight)

    const sections: string[] = Object.keys(this.ticketGroupsBySectionByZone[zoneId])
    const selectedSections: Set<string> = new Set(this.state.selectedSections)
    if (shouldHighlight) {
      sections.forEach((section: string): void => selectedSections.add(section))
    } else {
      sections.forEach((section: string): void => selectedSections.delete(section))
    }

    this.setState({ selectedSections })
  }

  updateTicketGroups = (ticketGroups: TicketGroup[] = this.props.ticketGroups): void => {
    this.setState({ ticketGroups })
  }

  /**
   * Colors
   */

  fillPath = (id, color, type = 'fill') => {
    if (!color) {
      throw Error('Color is undefined for this section.')
    }
    this.getAllPaths(id).forEach(element => element.setAttribute(type, color))
  }

  setUnavailableColors = () => {
    this.getAllPaths().forEach(element => element.setAttribute('data-unavailable-color', element.getAttribute('fill')))
  }

  fillUnavailableColors = () => {
    this.getAllPaths().forEach(element => {
      element.setAttribute('fill', element.getAttribute('data-unavailable-color'))
      element.setAttribute('opacity', 1)
    })
  }

  getAllPaths = (id) =>
    Array.from(this.mapRootRef.querySelectorAll(`[data-section-id${id ? `="${id}"` : ''}]`))
      .reduce((memo, element) => {
        const children = element.querySelectorAll('path');
        return children.length ? [...memo, ...children] : [...memo, element]
      }, [])

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

  fillSection(section: string, shouldHighlight = true): void {
    const isAnAvailableSection = this.venueSections.includes(section)
    if (isAnAvailableSection) {
      this.fillPath(section, this.getDefaultColor(this.ticketGroupsBySection[section]), 'fill')
      this.fillPath(section, shouldHighlight ? '1' : '0.6', 'opacity')
      this.fillPath(section, '1' , 'stroke-width')
      this.fillPath(section, shouldHighlight ? '#4a4a4a' : '#FFFFFF', 'stroke')
    }
  }

  fillZone(zone: string, shouldHighlight = true) {
    const ticketGroupsBySection = this.ticketGroupsBySectionByZone[zone]
    const allTicketGroupsInZone = Object.values(ticketGroupsBySection)
      .reduce((memo, ticketGroupsInSection) => [...memo, ...ticketGroupsInSection], [])
    Object.keys(ticketGroupsBySection).forEach(section => {
      const isAnAvailableSection = this.venueSections.includes(section)
      if (isAnAvailableSection) {
        this.fillPath(section, this.getDefaultColor(allTicketGroupsInZone), 'fill')
        this.fillPath(section, shouldHighlight ? '1' : '0.6', 'opacity')
      }
    })
  }

  /**
   * Coloring
   */

  getDefaultColor(ticketGroups: TicketGroup[]): string {
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
    const element = event.target.closest('[data-section-id]')
    
    const isEnteringASection = !!element
    if (!isEnteringASection) {
      return
    }

    const section = element.getAttribute('data-section-id').toLowerCase()
    if (this.venueSections.includes(section)) {
      return this.doHover(event.clientX, event.clientY, section)
    }
  }

  onMouseOut = (event: React.MouseEvent<HTMLElement>) => {
    const enteringElement = event.relatedTarget

    const isEnteringText = !!enteringElement && enteringElement.nodeName === 'text'
    if (isEnteringText) {
      return
    }

    const enteringSection = !!enteringElement && enteringElement.closest('[data-section-id]')
    const isEnteringTheSameSection = !!enteringSection &&
      enteringSection.getAttribute('data-section-id').toLowerCase() === this.state.currentHoveredSection    
    if (isEnteringTheSameSection) {
      return
    }
    
    return this.doHoverCleanup()
  }

  onClick = () => {
    const section = this.state.currentHoveredSection
    if (this.venueSections.includes(section)) {
      return this.selectSectionOrZone(section)
    }
  }

  onMouseMove = ({ offsetX, offsetY }: React.MouseEvent<HTMLElement>) => {
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

    const newState: any = {
      tooltipActive: true,
      tooltipX,
      tooltipY,
      tooltipSectionName: sectionName
    }

    if (this.state.isZoneToggled) {
      newState.currentHoveredZone = zone
      this.highlightZone(zone)
    } else {
      newState.currentHoveredSection = section
      this.highlightSection(section)
    }

    this.setState(newState)
  }

  doHoverCleanup(): void {
    const section = this.state.currentHoveredSection

    this.setState({
      tooltipActive: false,
      currentHoveredZone: null,
      currentHoveredSection: null
    })

    if (this.state.isZoneToggled) {
      return this.unhighlightZone(this.state.sectionZoneMapping[section].zone)
    }

    this.unhighlightSection(section)
  }

  selectSectionOrZone(section: string) {
    if (this.state.isZoneToggled) {
      const { zone } = this.state.sectionZoneMapping[section]
      this.toggleZoneSelect(zone, !this.areAllSectionsInTheZoneSelected(zone))
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
        ref={element => { this.rootRef = element }}
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
        onMouseMove={this.onMouseMove}
        onClick={this.onClick}
        style={containerStyle}
        onTouchMove={() => this.setState({ isDragging: true })}
        onTouchEnd={event => {
          if (!this.state.isDragging) {
            this.onClick(event)
          }
          this.setState({ isDragging: false })
        }}
      >
        <Tooltip
          isActive={this.state.tooltipActive}
          x={this.state.tooltipX}
          y={this.state.tooltipY}
          name={this.state.tooltipSectionName}
          color={this.state.currentHoveredSection && this.getDefaultColor(this.ticketGroupsBySection[this.state.currentHoveredSection])}
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
          ref={element => { this.mapRootRef = element }}
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
