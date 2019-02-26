import React, { Component } from 'react'
import { isEqual } from 'lodash-es'

import ZoomSettings from '../ZoomSettings'
import Tooltip from '../Tooltip'
import Legend from '../Legend'

import { TicketGroup, NormalizedTicketGroup } from '../types'

export * from './types'
import { State, Props, DefaultProps, SectionZoneMapping } from './types'

import {
  $availableTicketGroups,
  $missingSectionIds,
  $areAllSectionsInTheZoneSelected,
  $ticketGroupsBySectionByZone,
  $ticketGroupsBySection,
  $venueSections,
  $costRanges
} from './selectors'

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

interface ElementProperties {
  [key: string]: string
}

type PropertiesForElement = (element: Element) => ElementProperties

class MapNotFoundError extends Error {
  name = 'MapNotFoundError'
  constructor(message = 'This map is not currently available.') {
    super(message)
  }
}

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
    showLegend: true,
    mapFontFamily: 'inherit'
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
      ticketGroups: this.props.ticketGroups,
      mapNotFound: false
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
      if (error.name === 'MapNotFoundError') {
        this.setState({ mapNotFound: true })
      }
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
    const mapResponse = await fetch(`${this.configFilePath}/map.svg`)
    if (!mapResponse.ok) {
      throw new MapNotFoundError();
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
    const [x, y, width, height] = (mapSvg.getAttribute('viewBox') || '0 0 100% 100%').split(' ')
    mapSvg.setAttribute('width', width)
    mapSvg.setAttribute('height', height)
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

  selectSection = (section: string) => this.toggleSectionSelect(section, true)

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

  highlightZone = (zone: string) => this.toggleZoneHighlight(zone, true)

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
    const isUnhighlightingSelectedZone = !shouldHighlight && $areAllSectionsInTheZoneSelected(this.state)(zoneId)
    if (isUnhighlightingSelectedZone) {
      return
    }

    return this.fillZone(zoneId, shouldHighlight)
  }

  toggleZoneSelect = (zone: string, shouldHighlight = true) => {
    if (!zone) {
      return
    }

    const zoneId = zone.toLowerCase()
    this.fillZone(zoneId, shouldHighlight)

    const sections = Object.keys($ticketGroupsBySectionByZone(this.state)[zoneId])
    const selectedSections = new Set(this.state.selectedSections)
    if (shouldHighlight) {
      sections.forEach(section => selectedSections.add(section))
    } else {
      sections.forEach(section => selectedSections.delete(section))
    }

    this.setState({ selectedSections })
  }

  updateTicketGroups = (ticketGroups = this.props.ticketGroups) =>
    this.setState({ ticketGroups })

  /**
   * Colors
   */

  setUnavailableColors = () =>
    this.fillPathsForSection(element =>
      ({ 'data-unavailable-color': element.getAttribute('fill') as string }))

  fillUnavailableColors = () =>
    this.fillPathsForSection(element => ({
      'fill': element.getAttribute('data-unavailable-color') as string,
      'opacity': '1',
      'stroke-width': '1',
      'stroke': '#FFFFFF'
    }))

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

  updateMap() {
    this.fillUnavailableColors()
    if (this.state.isZoneToggled) {
      Object.keys($ticketGroupsBySectionByZone(this.state)).forEach(zone => {
        const shouldHighight = $areAllSectionsInTheZoneSelected(this.state)(zone)
        this.toggleZoneSelect(zone, shouldHighight)
      })
    } else {
      Object.keys($ticketGroupsBySection(this.state)).forEach(section => {
        const shouldHighight = this.state.selectedSections.has(section)
        this.toggleSectionSelect(section, shouldHighight)
      })
    }
  }

  fillSection(section: string, shouldHighlight = true) {
    const isAnAvailableSection = $venueSections(this.state).includes(section)
    if (isAnAvailableSection) {
      this.fillPathsForSection(element => ({
        'fill': this.getDefaultColor($ticketGroupsBySection(this.state)[section]),
        'opacity': shouldHighlight ? '1' : '0.6',
        'stroke-width': '1',
        'stroke': shouldHighlight ? '#4a4a4a' : '#FFFFFF'
      }), section)
    }
  }

  fillZone(zone: string, shouldHighlight = true) {
    const ticketGroupsBySection = $ticketGroupsBySectionByZone(this.state)[zone]
    const allTicketGroupsInZone = Object.values(ticketGroupsBySection)
      .reduce((memo, ticketGroupsInSection) => [...memo, ...ticketGroupsInSection], [])
    Object.keys(ticketGroupsBySection).forEach(section => {
      const isAnAvailableSection = $venueSections(this.state).includes(section)
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
    if ($venueSections(this.state).includes(section)) {
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
    if ($venueSections(this.state).includes(section)) {
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
        this.toggleZoneSelect(zone, !$areAllSectionsInTheZoneSelected(this.state)(zone))
      }
    } else {
      this.toggleSectionSelect(section, !this.state.selectedSections.has(section))
    }
  }

  render() {
    if (this.state.mapNotFound) {
      return <img src="https://maps.ticketevolution.com/maps/not_available.jpg" style={{ width: '100%' }} />
    }

    return (
      <div
        ref={element => { this.rootRef = element as HTMLElement }}
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
        onMouseMove={this.onMouseMove}
        onClick={this.onClick}
        style={{
          position: 'relative',
          fontFamily: this.props.mapFontFamily
        }}
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
          color={this.state.currentHoveredSection ? this.getDefaultColor($ticketGroupsBySection(this.state)[this.state.currentHoveredSection]) : ''}
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
            opacity: this.state.mapSvg ? 1 : 0
          }}
        />
        {this.props.showLegend && <Legend ranges={$costRanges(this.state, this.props)} />}
      </div>
    )
  }
}
