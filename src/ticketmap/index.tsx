import { Component } from 'react'
import { defaultMemoize, createSelectorCreator } from 'reselect'
import { isEqual } from 'lodash'
import ZoomSettings from './zoomSettings'
import Tooltip from './tooltip'

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
  updateTicketGroups: any
  highlightSection: any
  unhighlightSection: any
  selectSection: any
  deselectSection: any
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

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual)

const $missingSectionIds = createDeepEqualSelector(
  (state: State) => state.ticketGroups,
  (state: State) => state.sectionZoneMapping,
  (ticketGroups, sectionZoneMapping) => ticketGroups
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
    }
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
      ticketGroups: []
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

    if (this.state.selectedSections !== prevState.selectedSections) {
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
    mapSvg.style.width = 'inherit'
    mapSvg.style.height = 'inherit'
    mapSvg.style.minWidth = '100%'
    mapSvg.style.minHeight = 'inherit'

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

  highlightSection = (section: string) => this.toggleSectionHighlight(section, true)

  unhighlightSection = (section: string) => this.toggleSectionHighlight(section, false)

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

  deselectSection = (section: string) => {
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

  unhighlightZone = (zone: string) => {
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

  deselectZone = (zone: string) => {
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
      .reduce((memo, element) => [...memo, element, ...element.querySelectorAll('path')], [])

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
      this.fillPath(section, this.getDefaultColor(this.ticketGroupsBySection[section]), 'fill')
      this.fillPath(section, shouldHighlight ? '1' : '0.6', 'opacity')
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

  getDefaultColor(ticketGroups: TicketGroup[]) {
    const { sectionPercentiles } = this.props
    const lowestTicketPriceInSection = ticketGroups.map(({ price }) => price).sort((a, b) => a - b)[0]
    const percentile = this.sortedTicketGroupPrices.indexOf(lowestTicketPriceInSection) / this.sortedTicketGroupPrices.length
    const sectionPercentileKeys = Object.keys(sectionPercentiles).map(key => +key).sort()
    for (const key of sectionPercentileKeys) {
      if (percentile <= key) {
        return sectionPercentiles[key]
      }
    }
  }

  /**
   * Interation Callbacks
   */

  onMouseOver = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.target as HTMLElement
    if (element.hasAttribute('data-section-id')) {
      const section = element.getAttribute('data-section-id').toLowerCase()
      if (this.venueSections.includes(section)) {
        return this.doHover(event.clientX, event.clientY, section)
      }
    } else if (element !== this.rootRef) {
      return this.onMouseOver({
        ...event,
        target: element.parentNode
      })
    }
  }

  onMouseOut = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.target as HTMLElement
    if (event.relatedTarget && event.relatedTarget.nodeName === 'text') {
      return
    }
    if (element.hasAttribute('data-section-id')) {
      const section = element.getAttribute('data-section-id').toLowerCase()
      if (this.venueSections.includes(section)) {
        return this.doHoverCleanup(section)
      }
    } else if (element !== this.rootRef) {
      return this.onMouseOut({
        ...event,
        target: element.parentNode
      })
    }
  }

  onClick = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
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

  doHoverCleanup(section: string): void {
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
    const containerStyle: React.CSSProperties  = {
      height: 'inherit',
      minHeight: 'inherit',
      minWidth: 'inherit',
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
            height: 'inherit',
            width: 'inherit',
            minHeight: 'inherit',
            minWidth: 'inherit',
            opacity: this.state.mapSvg ? 1 : 0
          }}
        />
      </div>
    )
  }
}
