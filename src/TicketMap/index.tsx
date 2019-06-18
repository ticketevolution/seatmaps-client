import React, { Component } from 'react'
import { isEqual, } from 'lodash-es'

import Actions from '../Actions'
import Tooltip from '../Tooltip'
import initializeZoom from '../zoom'

import { TicketGroup, NormalizedTicketGroup } from '../types'
import { State, Props, DefaultProps, Manifest } from './types'

import {
  $availableTicketGroups,
  $missingSectionIds,
  $ticketGroupsBySection,
  $venueSections,
  $costRanges
} from './selectors'

export * from './types'

interface PublicApi {
  updateTicketGroups: (ticketGroups: TicketGroup[]) => void
  highlightSection: (section: string) => void
  unhighlightSection: (section?: string) => void
  selectSection: (section: string) => void
  deselectSection: (section?: string) => void
}

interface ElementProperties {
  [key: string]: string
}

type PropertiesForElement = (element: Element) => ElementProperties

class MapNotFoundError extends Error {
  name = 'MapNotFoundError'
  constructor (message = 'This map is not currently available.') {
    super(message)
  }
}

export default class TicketMap extends Component<Props & DefaultProps, State> {
  publicApi: PublicApi
  mapRoot = React.createRef<HTMLDivElement>()
  container = React.createRef<HTMLDivElement>()

  static defaultProps: DefaultProps = {
    mapsDomain: 'https://maps.ticketevolution.com',
    onSelection: () => { },
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
    showControls: true,
    mouseControlEnabled: true,
    mapFontFamily: 'inherit'
  }

  constructor (props: Props & DefaultProps) {
    super(props)
    this.state = {
      sectionMapping: {},
      selectedSections: new Set(this.props.selectedSections.filter(section => !!section)),
      tooltipActive: false,
      tooltipSectionName: '',
      tooltipX: 0,
      tooltipY: 0,
      ticketGroups: this.props.ticketGroups,
      mapNotFound: false,
      touchStarts: {},
      isTouchDevice: false
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

  async componentDidMount () {
    this.setState({
      isTouchDevice: 'ontouchstart' in document.documentElement
    })

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

  componentDidUpdate (_prevProps: Props, prevState: State) {
    const availableTicketGroupsDidChange = $availableTicketGroups(prevState) !== $availableTicketGroups(this.state)
    const isNoLongerHoveringOnSection = prevState.currentHoveredSection !== undefined && this.state.currentHoveredSection === undefined
    const selectedSectionsDidChange = !isEqual(this.state.selectedSections, prevState.selectedSections)

    if (this.mapRoot.current && (isNoLongerHoveringOnSection || availableTicketGroupsDidChange || selectedSectionsDidChange)) {
      this.updateMap()
    }

    if (selectedSectionsDidChange) {
      this.props.onSelection(Array.from(this.state.selectedSections))
    }

    if ($missingSectionIds(prevState) !== $missingSectionIds(this.state) && $missingSectionIds(this.state).length > 0) {
      console.warn('Unknown section names found in ticket groups: %o', $missingSectionIds(this.state))
    }
  }

  async fetchMap () {
    const mapResponse = await fetch(`${this.configFilePath}/map.svg`)
    if (!mapResponse.ok) {
      throw new MapNotFoundError()
    }
    const mapHtml = await mapResponse.text()
    // Can't use dangerouslySetInnerHTML={{ __html: this.state.mapHtml }} in this case because
    // re-rendering would inject all this HTML again, which would break all the event bindings
    // we set in future methods.
    if (this.mapRoot.current) {
      this.mapRoot.current.innerHTML = mapHtml
      const svg = this.mapRoot.current.querySelector('svg')
      if (svg) {
        initializeZoom(svg)
      }
    }
  }

  async fetchManifest () {
    const manifestResponse = await fetch(`${this.configFilePath}/manifest.json`)
    if (!manifestResponse.ok) {
      throw Error('There was an error fetching the venue map data, please try again')
    }

    const manifest: Manifest = await manifestResponse.json()

    this.setState({
      sectionMapping: Object.keys(manifest.sections)
        .reduce((memo, sectionName) => ({
          ...memo,
          [sectionName.toLowerCase()]: {
            sectionName
          }
        }), {})
    })
  }

  setupMap () {
    if (!this.mapRoot.current) {
      return
    }

    const mapSvg = this.mapRoot.current.querySelector('svg')
    if (!mapSvg) {
      return
    }

    Object.assign(mapSvg.style, {
      position: 'absolute',
      zIndex: 0,
      top: 0,
      left: 0,
      height: '100%',
      width: '100%'
    })

    this.setUnavailableColors()

    mapSvg.querySelectorAll<HTMLElement>('*[data-section-id]').forEach(path => {
      const sectionId = path.getAttribute('data-section-id')
      if (sectionId === null) {
        return
      }
      path.setAttribute('data-section-id', sectionId.toLowerCase())
    })

    mapSvg.querySelectorAll<HTMLElement>('text').forEach(text => {
      text.style.pointerEvents = 'none'
    })

    this.setState({ mapSvg })
  }

  /**
   * Properties
   */

  get configFilePath () {
    return `${this.props.mapsDomain}/${this.props.venueId}/${this.props.configurationId}`
  }

  /**
   * Public Methods
   */

  highlightSection = (section: string) => this.toggleSectionHighlight(section, true)

  unhighlightSection = (section?: string) => {
    if (!section) {
      return this.setState({ currentHoveredSection: undefined })
    }
    return this.toggleSectionHighlight(section, false)
  }

  selectSection = (section: string) => this.toggleSectionSelect(section, true)

  deselectSection = (section?: string) => {
    if (!section) {
      return this.clearSelection()
    }
    return this.toggleSectionSelect(section, false)
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

  getAllPaths = (id?: string) => {
    if (!this.mapRoot.current) {
      return []
    }

    return Array.from(this.mapRoot.current.querySelectorAll(`[data-section-id${id ? `="${id}"` : ''}]`))
      .reduce((memo, element) => {
        const children = element.querySelectorAll('path')
        return memo.concat(children.length ? Array.from(children) : [element])
      }, [] as Element[])
  }

  /**
   * Helpers
   */

  clearSelection = () => {
    this.setState({
      selectedSections: new Set()
    })
  }

  toggleSectionHighlight = (section?: string, shouldHighlight = true) => {
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

  toggleSectionSelect = (section: string, shouldHighlight = true) => {
    if (!section) {
      return
    }

    const sectionId = section.toLowerCase()
    if (!$venueSections(this.state).includes(sectionId)) {
      return
    }

    const selectedSections = new Set(this.state.selectedSections)
    if (shouldHighlight) {
      selectedSections.add(sectionId)
    } else {
      selectedSections.delete(sectionId)
    }

    this.setState({ selectedSections })
  }

  updateMap () {
    this.fillUnavailableColors()
    $venueSections(this.state).forEach(section => {
      this.fillSection(section.toLowerCase(), this.state.selectedSections.has(section))
    })
  }

  fillSection (section: string, shouldHighlight = true) {
    const isAnAvailableSection = $venueSections(this.state).includes(section)
    if (isAnAvailableSection) {
      this.fillPathsForSection(() => ({
        'fill': this.getDefaultColor($ticketGroupsBySection(this.state)[section]),
        'opacity': shouldHighlight ? '1' : '0.6',
        'stroke-width': '1',
        'stroke': shouldHighlight ? '#4a4a4a' : '#FFFFFF',
        'cursor': 'pointer'
      }), section)
    }
  }

  getSectionFromTarget (target: HTMLElement) {
    const element = target.closest('[data-section-id]')
    if (!element) {
      return
    }

    const sectionId = element.getAttribute('data-section-id')
    if (!sectionId) {
      return
    }

    return sectionId.toLowerCase()
  }

  /**
   * Coloring
   */

  getDefaultColor (ticketGroups: NormalizedTicketGroup[] = []): string {
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
   * Interaction Callbacks
   */

  onMouseOver = ({ clientX, clientY, target }: React.MouseEvent<HTMLElement>) =>
    this.doHover(target as HTMLElement, clientX, clientY)

  onMouseOut = ({ relatedTarget }: React.MouseEvent<HTMLElement>) =>
    this.doHoverCleanup(relatedTarget as HTMLElement)

  onMouseMove = ({ nativeEvent }: React.MouseEvent<HTMLElement>) =>
    this.setState({
      tooltipX: nativeEvent.clientX,
      tooltipY: nativeEvent.clientY
    })

  onClick = () => this.doSelect()

  /**
   * Interactions
   */

  doHover (target: HTMLElement, tooltipX?: number, tooltipY?: number) {
    const section = this.getSectionFromTarget(target)
    if (!section) {
      return
    }

    if (!$venueSections(this.state).includes(section)) {
      return
    }

    this.highlightSection(section)
    this.setState({
      tooltipActive: tooltipX !== undefined && tooltipY !== undefined,
      tooltipX: tooltipX !== undefined ? tooltipX : 0,
      tooltipY: tooltipY !== undefined ? tooltipY : 0,
      tooltipSectionName: this.state.sectionMapping[section].sectionName,
      currentHoveredSection: section
    })
  }

  doHoverCleanup (enteringElement: HTMLElement): void {
    const isEnteringText = !!enteringElement && enteringElement.nodeName.toLowerCase() === 'text'
    if (isEnteringText) {
      return
    }

    const enteringSection = this.getSectionFromTarget(enteringElement)
    const isEnteringTheSameSection = !!enteringSection && enteringSection === this.state.currentHoveredSection
    if (isEnteringTheSameSection) {
      return
    }

    this.setState({
      tooltipActive: false,
      currentHoveredSection: undefined
    })
  }

  doSelect (section = this.state.currentHoveredSection) {
    if (!section) {
      return
    }
    this.toggleSectionSelect(section, !this.state.selectedSections.has(section))
  }

  handleZoomIn = () => {
  }

  handleZoomOut = () => {
  }

  handleResetZoom = () => {
  }

  render () {
    if (this.state.mapNotFound) {
      return (
        <div style={{
          left: 0,
          position: 'relative',
          textAlign: 'left'
        }}>
          <div style={{
            color: 'white',
            fontFamily: 'Nunito Sans',
            padding: '50px 30px',
            position: 'absolute',
            textAlign: 'left'
          }}>
            <div style={{
              fontWeight: 600,
              fontSize: '1.375em'
            }}>Seating chart not available.</div>
            <div style={{ fontWeight: 300 }}>(It was abducted by aliens)</div>
          </div>
          <img src='https://maps.ticketevolution.com/maps/not_available.jpg' style={{ width: '100%', textAlign: 'left' }} />
        </div>
      )
    }

    return (
      <div
        ref={this.container}
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
        onMouseMove={this.onMouseMove}
        onClick={this.onClick}
        style={{
          position: 'relative',
          fontFamily: this.props.mapFontFamily,
          height: '100%',
          width: '100%',
          pointerEvents: this.props.mouseControlEnabled ? 'initial' : 'none'
        }}
      >
        {!this.state.isTouchDevice && <Tooltip
          isActive={this.state.tooltipActive}
          x={this.state.tooltipX}
          y={this.state.tooltipY}
          name={this.state.tooltipSectionName}
          color={this.state.currentHoveredSection ? this.getDefaultColor($ticketGroupsBySection(this.state)[this.state.currentHoveredSection]) : ''}
          ticketGroups={$availableTicketGroups(this.state).filter(ticketGroup => ticketGroup.section === this.state.currentHoveredSection)}
        />}
        <div
          ref={this.mapRoot}
          style={{
            cursor: '-webkit-grab',
            opacity: this.state.mapSvg ? 1 : 0
          }}
        />
        {this.state.mapSvg && (
          <Actions
            onClearSelection={this.clearSelection}
            ranges={$costRanges(this.state, this.props)}
            showLegend={this.props.showLegend}
            showControls={this.props.showControls}
            onZoomIn={this.handleZoomIn}
            onZoomOut={this.handleZoomOut}
            onResetZoom={this.handleResetZoom}
          />
        )}
      </div>
    )
  }
}
