/* @flow */

import { Component } from 'react'
import fetch from 'unfetch'
import { fillSection, setUnavailableColors } from './colors'
import ZoomSettings from './zoomSettings'
import Tooltip from './tooltip'
import Legend from './Legend'
import c from './TicketMap.scss'

type State = {
  mapSvg: string,
  sectionZoneMapping: any,
  availableTicketGroups: Array<TicketGroupType>,
  selectedSections: Set<string>,
  isZoneToggled: boolean,
  currentHoveredZone: string,
  currentHoveredSection: string,
  activeTooltip: boolean,
  tooltipSectionName: string,
  tooltipZoneId: string,
  tooltipX: number,
  tooltipY: number,
}

export default class TicketMap extends Component<*, State> {
  state: State
  mapZoom: any = null

  static defaultProps = {
    mapsDomain: 'https://maps.ticketevolution.com',
    onSelection: () => undefined,
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

  constructor (props: any) {
    super(props)
    this.state = {
      mapSvg: '',
      sectionZoneMapping: {},
      availableTicketGroups: [],
      selectedSections: new Set(this.props.selectedSections.filter(section => !!section)),
      isZoneToggled: this.props.isZoneDefault,
      currentHoveredZone: null,
      currentHoveredSection: null,
      activeTooltip: false,
      tooltipSectionName: '',
      tooltipZoneId: '',
      tooltipX: 0,
      tooltipY: 0
    }

    this.publicApi = {
      updateTicketGroups: this.updateTicketGroups.bind(this),
      highlightSection: this.highlightSection.bind(this),
      unhighlightSection: this.unhighlightSection.bind(this),
      selectSection: this.selectSection.bind(this),
      deselectSection: this.deselectSection.bind(this)
    }
  }

  /**
   * Lifecycle
   */

  async componentDidMount () {
    try {
      await this.fetchMap()
      await this.setupMap()
      await this.fetchManifest()
      await this.updateTicketGroups()
    } catch (error) {
      console.error(error)
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (JSON.stringify(this.state.availableTicketGroups) !== JSON.stringify(prevState.availableTicketGroups)) {
      this.updateMap()
    }
    if (this.state.selectedSections !== prevState.selectedSections) {
      this.props.onSelection(Array.from(this.state.selectedSections))
    }
  }

  async fetchMap () {
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

  async fetchManifest () {
    const manifestResponse = await fetch(`${this.configFilePath}/manifest.json`)
    if (!manifestResponse.ok) {
      throw Error('There was an error fetching the venue map data, please try again')
    }
    const { sections } = await manifestResponse.json()
    this.setState({
      sectionZoneMapping: Object.entries(sections)
        .reduce((memo, [sectionName, section]) => ({
          ...memo,
          [sectionName.toLowerCase()]: {
            sectionName,
            zone: section.zone_name ? section.zone_name.toLowerCase() : undefined
          }
        }), {})
    })
  }

  setupMap (): void {
    const mapSvg = this.mapRootRef.querySelector('svg')
    mapSvg.style.width = 'inherit'
    mapSvg.style.height = 'inherit'
    mapSvg.style.minWidth = '100%'
    mapSvg.style.minHeight = 'inherit'

    this.setFont()
    setUnavailableColors()

    // Fix the image paths embedded in the SVGs
    mapSvg.querySelectorAll('image').forEach(image => {
      let uri = image.getAttribute('xlink:href')
      if (!uri.startsWith('http') && !uri.startsWith('data:')) {
        image.setAttribute('xlink:href', `${this.configFilePath}/${uri}`)
      }
    })

    for (const path of mapSvg.querySelectorAll('*[data-section-id]')) {
      path.setAttribute('data-section-id', path.getAttribute('data-section-id').toLowerCase())
    }

    this.setState({ mapSvg })
  }

  /**
   * Properties
   */

  get sortedTicketGroupPrices () {
    return this.state.availableTicketGroups
      .map(group => group.price)
      .sort((a, b) => a - b)
  }

  get ticketGroupsBySectionByZone () {
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

  get ticketGroupsBySection () {
    return this.state.availableTicketGroups.reduce((memo, ticketGroup) => {
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

  get venueSections () {
    return Object.keys(this.ticketGroupsBySection)
  }

  get configFilePath () {
    return `${this.props.mapsDomain}/${this.props.venueId}/${this.props.configurationId}`
  }

  /**
   * Public Methods
   */

  highlightSection (section) {
    return this.toggleSectionHighlight(section, true)
  }

  unhighlightSection (section) {
    return this.toggleSectionHighlight(section, false)
  }

  toggleSectionHighlight (section, shouldHighlight = true) {
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

  selectSection (section) {
    return this.toggleSectionSelect(section, true)
  }

  deselectSection (section) {
    return this.toggleSectionSelect(section, false)
  }

  toggleSectionSelect (section, shouldHighlight = true) {
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

  highlightZone (zone) {
    return this.toggleZoneHighlight(zone, true)
  }

  unhighlightZone (zone) {
    return this.toggleZoneHighlight(zone, false)
  }

  toggleZoneHighlight (zone, shouldHighlight = true) {
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

  selectZone (zone) {
    return this.toggleZoneSelect(zone, true)
  }

  deselectZone (zone) {
    return this.toggleZoneSelect(zone, false)
  }

  toggleZoneSelect (zone, shouldHighlight = true) {
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

  updateTicketGroups = (ticketGroups: any = this.props.ticketGroups) => {
    const availableTicketGroups = this.getAvailableTicketGroups(ticketGroups)
    this.setState({ availableTicketGroups })
  }

  /**
   * Helpers
   */

  getAvailableTicketGroups = (availableTicketGroups = []) =>
    availableTicketGroups.reduce((memo, { tevo_section_name, retail_price: price }) => {
      const section = tevo_section_name.toLowerCase()
      const sectionZoneMeta = this.state.sectionZoneMapping[section]
      if (sectionZoneMeta) {
        memo.push({ section, price, zone: sectionZoneMeta.zone })
      } else {
        console.warn(`Section ${section} not found. Please verify it exists in the venue manifest`)
      }
      return memo
    }, []);

  getAllSectionsInZoneBySectionId (section: number): Array<string> {
    const zoneMeta = this.state.sectionZoneMapping[section] || {}
    return this.venueSections.filter((venueSection) => this.state.sectionZoneMapping[venueSection].zone === zoneMeta.zone)
  }

  areAllSectionsInTheZoneSelected (zone: number): boolean {
    return Object.keys(this.ticketGroupsBySectionByZone[zone])
      .every(section => this.state.selectedSections.has(section))
  }

  updateMap (): void {
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

  setFont () {
    if (this.props.mapFontFamily) {
      this.rootRef
        .querySelectorAll('text')
        .forEach(elem => {
          elem.style.fontFamily = `${this.props.mapFontFamily}`
        })
    }
  }

  fillSection (section, shouldHighlight = true) {
    const isAnAvailableSection = this.venueSections.includes(section)
    if (isAnAvailableSection) {
      fillSection(section, this.getDefaultColor(this.ticketGroupsBySection[section]), 'fill')
      fillSection(section, shouldHighlight ? '1' : '0.6', 'opacity')
    }
  }

  fillZone (zone, shouldHighlight = true) {
    const ticketGroupsBySection = this.ticketGroupsBySectionByZone[zone]
    const allTicketGroupsInZone = Object.values(ticketGroupsBySection).reduce((memo, ticketGroupsInSection) => [...memo, ...ticketGroupsInSection], [])
    Object.keys(ticketGroupsBySection).forEach(section => {
      const isAnAvailableSection = this.venueSections.includes(section)
      if (isAnAvailableSection) {
        fillSection(section, this.getDefaultColor(allTicketGroupsInZone), 'fill')
        fillSection(section, shouldHighlight ? '1' : '0.6', 'opacity')
      }
    })
  }

  /**
   * Coloring
   */

  getDefaultColor (ticketGroups) {
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

  onMouseOver = ({ clientX, clientY, target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const section = target.getAttribute('data-section-id').toLowerCase()
      if (this.venueSections.includes(section)) {
        return this.doHover(clientX, clientY, section)
      }
    } else if (target !== this.rootRef) {
      return this.onMouseOver({ clientX, clientY, target: target.parentNode })
    }
  }

  onMouseOut = ({ target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const section = target.getAttribute('data-section-id').toLowerCase()
      if (this.venueSections.includes(section)) {
        return this.doHoverCleanup(section)
      }
    } else if (target !== this.rootRef) {
      return this.onMouseOut({ target: target.parentNode })
    }
  }

  onClick = ({ target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const section = target.getAttribute('data-section-id').toLowerCase()
      if (this.venueSections.includes(section)) {
        return this.selectSectionOrZone(section)
      }
    } else if (target !== this.rootRef) {
      return this.onClick({ target: target.parentNode })
    }
  }

  /**
   * Interactions
   */

  doHover (tooltipX: any, tooltipY: any, section: string): void {
    const { zone, sectionName } = this.state.sectionZoneMapping[section]

    const newState = {
      activeTooltip: true,
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

  doHoverCleanup (section: string): void {
    this.setState({ activeTooltip: false })

    if (this.state.isZoneToggled) {
      return this.unhighlightZone(this.state.sectionZoneMapping[section].zone)
    }

    this.unhighlightSection(section)
  }

  selectSectionOrZone (section: string): void {
    if (this.state.isZoneToggled) {
      const { zone } = this.state.sectionZoneMapping[section]
      this.toggleZoneSelect(zone, !this.areAllSectionsInTheZoneSelected(zone))
    } else {
      this.toggleSectionSelect(section, !this.state.selectedSections.has(section))
    }
  }

  render (): ?React$Element<any> {
    const costRanges = Object.entries(this.props.sectionPercentiles)
      .map(([percentile, color]) => ({
        percentile,
        color,
        min: 0,
        max: 0
      }))
      .sort((a, b) => a.percentile - b.percentile)

    return (
      <div
        ref={element => { this.rootRef = element }}
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
        onClick={this.onClick}
        onTouchMove={() => this.setState({ isDragging: true })}
        onTouchEnd={(event) => {
          if (!this.state.isDragging) {
            this.onClick(event)
          }
          this.setState({ isDragging: false })
        }}
        className={c.map}
      >
        <Tooltip
          isActive={this.state.activeTooltip}
          clientX={this.state.tooltipX}
          clientY={this.state.tooltipY}
          name={this.state.tooltipSectionName}
          ticketGroups={this.state.availableTicketGroups.filter(ticketGroup => ticketGroup.section === this.state.currentHoveredSection)}
        />
        <Legend className={c.legend} costRanges={costRanges} />
        {this.state.mapSvg && <ZoomSettings mapSvg={this.state.mapSvg} className={c.zoom} />}
        {/* <ZoneToggle
            isZoneToggled={this.state.isZoneToggled}
            onToggle={isZoneToggled => {
              this.setState({ isZoneToggled });
              fillUnavailableColors();
              this.updateMap();
            }}
          /> */}
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
