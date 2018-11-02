/* @flow */

import { h, Component } from 'preact' /** @jsx h */
// here to disable flow errors
import * as React from 'react' //eslint-disable-line
import fetch from 'unfetch'
// hide for now, monitor time to load seatmap in production
// import { Spinner } from 'spin.js'
import Toggle from 'react-toggled/preact'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
import CSSTransition from 'react-transition-group/CSSTransition'
import MOCK_TICKET_ARRAY from '../utils/ticketRequest'

import { buttonStyle, toggleTextStyle, mainContainerStyle } from './styles'
import { COLOR_VARIABLES, LIGHT_THEME, DARK_THEME } from './themes'

const SCREEN_BUFFER = 100
const TOOLTIP_BUFFER = 250

type State = {
  mapHtml: string,
  mapSvg: string,
  venueConfiguration: any,
  venueSections: Array<string>,
  availableTicketBlocks: Array<TicketBlockType>,
  selectedSections: Array<string>,
  isZoneToggled: boolean,
  currentHoveredZone: string,
  activeTooltip: boolean,
  tooltipPrice: number,
  tooltipSectionName: string,
  tooltipX: number,
  tooltipY: number,
  tooltipListingCount: number,
}

const resetZoom = (
  <svg
    version="1.0"
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 200 200"
    preserveAspectRatio="xMidYMid meet"
  >
    <g transform="translate(0.000000,200.000000) scale(0.100000,-0.100000)" fill="#4A4A4A" stroke="none">
      <path
        d="M666 1864 c-93 -20 -176 -56 -257 -110 -71 -47 -188 -164 -214 -214
        l-16 -31 -54 30 c-44 25 -59 29 -79 21 -14 -5 -28 -20 -31 -33 -6 -22 93 -481
        115 -534 13 -31 46 -38 78 -17 26 17 341 308 375 346 21 25 22 61 2 78 -8 7
        -45 14 -82 17 -105 8 -106 12 -36 81 234 229 615 185 795 -92 98 -151 106
        -352 20 -521 -34 -68 -153 -184 -224 -218 -162 -77 -342 -71 -494 18 -23 14
        -47 25 -53 25 -6 0 -45 -26 -86 -58 -97 -75 -99 -91 -13 -149 233 -158 553
        -166 802 -21 l48 29 217 -214 c119 -118 226 -220 238 -226 34 -17 119 -13 161
        8 42 22 70 50 101 101 23 39 29 126 10 163 -6 12 -115 123 -242 248 l-231 225
        22 67 c82 250 38 510 -121 713 -93 118 -234 213 -377 254 -101 29 -279 36
        -374 14z"
      />
    </g>
  </svg>
);

export default class TicketMap extends Component<*, State> {
  state: State
  spinnerContainer = null
  spinner = null
  mapZoom: any = null
  mouseOutTimeout: any = null
  currentTooltip: any = null

  constructor(props: any) {
    super(props)
    this.state = {
      mapHtml: '',
      mapSvg: '',
      venueConfiguration: null,
      venueSections: [],
      availableSections: [],
      availableTicketBlocks: [],
      selectedSections: [],
      isMapLoaded: false,
      isZoneToggled: this.props.isZoneDefault || false,
      currentHoveredZone: '',
      activeTooltip: false,
      tooltipSectionName: '',
      tooltipZoneId: '',
      tooltipPrice: 0,
      tooltipListingCount: 0,
      tooltipX: 0,
      tooltipY: 0,
      ...COLOR_VARIABLES.reduce((memo, colorVar) => {
        const defaultColor = this.props.theme === 'dark' ? DARK_THEME[colorVar] : LIGHT_THEME[colorVar];
        return { ...memo, [colorVar]: this.props[colorVar] || defaultColor };
      }, {})
    }
    this.setupMap = this.setupMap.bind(this)
    this.fetchMap = this.fetchMap.bind(this)
    this.fetchManifest = this.fetchManifest.bind(this)
    this.fetchData = this.fetchData.bind(this)

    this.publicApi = {
      fetchMap: this.fetchMap,
      fetchManifest: this.fetchManifest,
      fetchData: this.fetchData,
    }
  }

  componentDidMount() {
    // show spinner until map is loaded

    // hide for now, monitor time to load seatmap in production
    // this.spinner = new Spinner({
    //   lines: 10, // The number of lines to draw
    //   speed: 2, // Rounds per second
    //   className: 'spinner', // The CSS class to assign to the spinner
    //   top: '150px', // Top position relative to parent
    //   left: '50%', // Left position relative to parent
    //   position: 'relative' // Element positioning
    // }).spin(this.mapRootRef)
    
    this.fetchMap()
      .then(this.fetchManifest)
      .then(this.fetchData)
      .catch(console.log);
  }

  async fetchMap() {
    const mapSvgUrl = `https://maps.ticketevolution.com/${this.props.venueId}/${this.props.configurationId}/map.svg`;
    const mapNotAvailableUrl = 'https://maps.ticketevolution.com/maps/not_available.svg';
    const mapResponse = await fetch(this.props.configurationId ? mapSvgUrl : mapNotAvailableUrl);
    if (!mapResponse.ok) {
      throw Error('There was an error fetching the venue map, please try again')
    }
    const mapHtml = await mapResponse.text();
    this.setState({ mapHtml });
    // Can't use dangerouslySetInnerHTML={{ __html: this.state.mapHtml }} in this case because
    // re-rendering would inject all this HTML again, which would break all the event bindings
    // we set in future methods.
    this.mapRootRef.innerHTML = mapHtml;
  }

  async fetchManifest() {
    const manifestResponse = await fetch(`https://maps.ticketevolution.com/maps/${this.props.venueId}/${this.props.configurationId}/manifest.json`);
    if (!manifestResponse.ok) {
      throw Error('There was an error fetching the venue map data, please try again')
    }
    const venueConfiguration = await manifestResponse.json();
    this.setState({ venueConfiguration });
  }

  async fetchData() {
    // check if a seatmaps container width is set in the config then resize the map accordingly
    const mapWidth = this.props.containerWidth ? this.props.containerWidth : window.innerWidth
    const mapSvg = this.mapRootRef.querySelector('svg')
    const originalHeight = parseInt(mapSvg.attributes.getNamedItem('height').nodeValue);
    mapSvg.setAttribute('width', `${mapWidth}`)
    mapSvg.setAttribute('height', `${originalHeight * (mapWidth / originalHeight)}`)

    if (this.props.configurationId) {
      this.setState({
        venueSections: Object.keys(this.state.venueConfiguration.sectionZoneMetas),
      })
      this.setupMap()
    }

    // this mimics the client setting the array of tickets available.
    // this request plays off of the following request:
    // https://friends.ticketevolution.com/api/v9/ticket_groups?event_id=1294624&order_by=retail_price&type=event
    // it includes a new field: section_id, which is what we need
    this.setAvailableTicketsToBeDisplayed(MOCK_TICKET_ARRAY.ticket_groups)
  }

  setAvailableTicketsToBeDisplayed = (availableTickets: any) => {
    const cleanAvailableTicketBlocks = availableTickets.reduce((data, block) => {
      if (this.state.venueConfiguration.sectionZoneMetas[block.section_id]) {
        data.push({
          sectionId: block.section_id,
          ticketType: block.ticket_type,
          price: block.retail_price,
          zoneId: this.state.venueConfiguration.sectionZoneMetas[block.section_id].zid,
        });
      } else {
        console.log(`Section _${block.section_id}_ not found. Please verify it exists in the venue manifest`)
      }
      return data;
    }, [])
    this.updateMap(cleanAvailableTicketBlocks)
    this.setState({ availableTicketBlocks: cleanAvailableTicketBlocks })
  }

  removeDuplicateProps(arr: Array<TicketBlockType>, prop: string): Array<TicketBlockType> {
    return arr.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
    })
  }

  colorIn(id: number, ticketType: string): void {
    const elem = document.getElementById(`${id}`)
    if (elem) {
      switch (ticketType) {
        case 'primary':
          elem.setAttribute('fill', this.state.primarySectionFill)
          break
        case 'cheap':
          elem.setAttribute('fill', this.state.cheapSectionFill)
          break
        case 'expensive':
          elem.setAttribute('fill', this.state.expensiveSectionFill)
          break
        case 'empty':
          elem.setAttribute('fill', this.state.emptySectionFill)
          break
        case 'hover':
          elem.setAttribute('fill', this.state.hoverSectionFill)
          break
        default:
          console.log('no color defined')
      }
    }
  }

  matchingZoneSectionsBySectionId(sectionId: number): Array<string> {
    return Object.keys(this.state.venueConfiguration.sectionZoneMetas).filter((key) => {
      return this.state.venueConfiguration.sectionZoneMetas[sectionId] &&
          this.state.venueConfiguration.sectionZoneMetas[key].zid ===
          this.state.venueConfiguration.sectionZoneMetas[sectionId].zid;
    })
  }

  colorZones(availableTicketBlocks: Array<TicketBlockType>): void {
    const availableZones = this.removeDuplicateProps(availableTicketBlocks, 'zoneId')
    availableZones.forEach(zoneBlock =>
      this.matchingZoneSectionsBySectionId(zoneBlock.sectionId).forEach(id =>
        this.colorIn(parseInt(id), zoneBlock.ticketType))
    )
  }

  updateMap(availableTicketBlocks: Array<TicketBlockType>): void {
    // does not take in to account same section blocks
    // i.e. if one is marked as cheap and one expensive, the last ticket_type
    // in the array will take precedent

    if (this.state.isZoneToggled) {
      this.colorZones(availableTicketBlocks)
    } else {
      availableTicketBlocks.forEach(block => this.colorIn(block.sectionId, block.ticketType))
    }
  }

  doHover(event: any, id: string): void {
    if (this.state.isZoneToggled) {
      this.setAttrOnTargetedObjects(id, this.state.hoverSectionFill, 'fill')
      if (this.state.currentHoveredZone === this.state.venueConfiguration.sectionZoneMetas[id].zid) {
        clearTimeout(this.mouseOutTimeout)
      }

      const matchingZoneListings = this.state.availableTicketBlocks.filter(section => {
        return section.zoneId === this.state.venueConfiguration.sectionZoneMetas[id].zid
      })

      this.setTooltipProps(
        event,
        this.state.venueConfiguration.sectionZoneMetas[id].name,
        // lowest price
        matchingZoneListings.reduce(
          (min, section) => (section.price < min ? section.price : min),
          matchingZoneListings[0].price
        ),
        matchingZoneListings.length,
        this.state.venueConfiguration.sectionZoneMetas[id].zid
      )
    } else {
      const matchingSectionListings = this.state.availableTicketBlocks.filter(block => block.sectionId === parseInt(id))
      this.setTooltipProps(
        event,
        this.state.venueConfiguration.sectionZoneMetas[id].name,
        matchingSectionListings.reduce(
          (min, section) => (section.price < min ? section.price : min),
          matchingSectionListings[0].price
        ),
        matchingSectionListings.length
      )

      return this.colorIn(parseInt(id), 'hover')
    }
  }

  setTooltipProps(event: any, name: string, price: number, count: number, zid?: string): void {
    return this.setState({
      activeTooltip: true,
      tooltipSectionName: name,
      tooltipPrice: price,
      tooltipX:
        event.clientX - SCREEN_BUFFER < 0
          ? event.clientX
          : // $FlowFixMe
            document.body.clientWidth - TOOLTIP_BUFFER < event.clientX
            ? event.clientX - TOOLTIP_BUFFER
            : event.clientX - 10,
      tooltipY: event.clientY - SCREEN_BUFFER < 0 ? event.clientY + 50 : event.clientY - SCREEN_BUFFER,
      currentHoveredZone: zid,
      tooltipListingCount: count,
    })
  }

  doHoverCleanup(target: HTMLElement, id: string): void {
    const fillColor = target.attributes.getNamedItem('fill')
    this.setState({
      activeTooltip: false,
    })

    if (fillColor) {
      if (this.state.isZoneToggled) {
        this.colorZones(this.state.availableTicketBlocks)
      } else {
        if (fillColor) {
          if (fillColor.nodeValue === this.state.hoverSectionFill) {
            const section = this.state.availableTicketBlocks.find(block => {
              return parseInt(id) === block.sectionId
            })
            // $FlowFixMe
            this.colorIn(id, section.ticketType)
          }
        }
      }
    }
  }

  isSectionOrZoneAvailable(id: number): boolean {
    return this.state.availableTicketBlocks.some(block => {
      const { sectionZoneMetas } = this.state.venueConfiguration;
      if (sectionZoneMetas[block.sectionId] && sectionZoneMetas[id] && this.state.isZoneToggled) {
        return sectionZoneMetas[block.sectionId].zid === sectionZoneMetas[id].zid;
      }
      return id === block.sectionId;
    })
  }

  setAttrOnTargetedObjects(targetId: string, color: string, type: string): void {
    const matchingSections = this.matchingZoneSectionsBySectionId(parseInt(targetId))

    if (matchingSections) {
      matchingSections.forEach(sectionId => {
        const elem = document.getElementById(`${sectionId}`)
        if (elem) {
          // $FlowFixMe
          document.getElementById(`${sectionId}`).setAttribute(type, color)
        } else {
          console.log('id not found: ', sectionId)
        }
      })
    }
  }

  setupMap(): void {
    // set font if specified in config, if none is specified, leave as default
    // font in the map
    if (this.props.mapFontFamily) {
      this.rootRef
        .querySelectorAll('text')
        .forEach(elem => (elem.style.fontFamily = `${this.props.mapFontFamily}`))
    }

    // set all sections as empty/unavailable first, regardless of zone/sections
    this.state.venueSections.forEach(id => this.colorIn(parseInt(id), 'empty'))

    // add hover styling, which includes tooltip
    this.rootRef.addEventListener('mouseover', ((event: any) => {
      if (this.isSectionOrZoneAvailable(parseInt(event.target.id))) {
        this.doHover(event, event.target.id)
        // check if the parent has an id in the section configuration
      } else if (this.isSectionOrZoneAvailable(parseInt(event.target.parentNode.id))) {
        this.doHover(event, event.target.parentNode.id)
      }
    }).bind(this))

    // hover cleanup, which includes remove of tooltip
    this.rootRef.addEventListener('mouseout', ({ target }: any) => {
        this.mouseOutTimeout = setTimeout(() => {
          if (this.isSectionOrZoneAvailable(parseInt(target.id)) && !this.state.selectedSections.includes(target.id)) {
            this.doHoverCleanup(target, target.id)
          } else if (
            this.isSectionOrZoneAvailable(parseInt(target.parentNode.id)) &&
            !this.state.selectedSections.includes(target.parentNode.id)
          ) {
            this.doHoverCleanup(target.parentNode, target.parentNode.id)
          }
        }, 20)
      })

    // activate/deactivate section
    // needs cleanup
    this.rootRef.addEventListener('click', ({ target }: any) => {
        // const fillColor = target.attributes.getNamedItem('fill')
        // const parentColor = target.parentNode.attributes.getNamedItem('fill')

        // check that we're clicking on a section, and that the section is not
        // currently unavailable
        if (this.state.isZoneToggled) {
          if (this.isSectionOrZoneAvailable(parseInt(target.id))) {
            this.selectSectionOrZone(target)
          } else if (this.isSectionOrZoneAvailable(parseInt(target.parentNode.id))) {
            this.selectSectionOrZone(target.parentNode)
          }
        } else {
          if (this.isSectionOrZoneAvailable(parseInt(target.id))) {
            this.selectZone(target)
          } else if (this.isSectionOrZoneAvailable(parseInt(target.parentNode.id))) {
            this.selectZone(target.parentNode)
          }
        }
      })

    // Experimenting with zoom boundaries

    // const beforePan = function(oldPan, newPan) {
    //   let stopHorizontal = false,
    //     stopVertical = false,
    //     gutterWidth = 100,
    //     gutterHeight = 100,
    //     // Computed letiables
    //     sizes = this.getSizes(),
    //     leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth,
    //     rightLimit = sizes.width - gutterWidth - sizes.viewBox.x * sizes.realZoom,
    //     topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight,
    //     bottomLimit = sizes.height - gutterHeight - sizes.viewBox.y * sizes.realZoom
    //   let customPan = {}
    //   customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x))
    //   customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y))
    //   return customPan
    // }

    this.mapZoom = svgPanZoom(this.mapRootRef.querySelector('svg'), {
      zoomScaleSensitivity: 0.3,
      minZoom: 0.8,
      maxZoom: 10,
      // beforePan: beforePan,
      center: true,
      fit: true,
      contain: false,
    })
  }

  selectZone(target: HTMLElement): void {
    const fillColor = target.attributes.getNamedItem('fill')
    if (
      [
        this.state.primarySectionFill,
        this.state.selectedSectionFill,
        this.state.hoverSectionFill,
      ].includes(fillColor.nodeValue) &&
      fillColor.nodeValue !== '#6f6f6f'
    ) {
      // don't want to select an unavailable section
      const isSectionSelected = this.state.selectedSections.includes(target.id)
      target.setAttribute(
        'fill',
        isSectionSelected ? this.state.primarySectionFill : this.state.selectedSectionFill
      )
      target.setAttribute('stroke-width', isSectionSelected ? '0.4' : '2')
      target.setAttribute('stroke', isSectionSelected ? '#555' : '#2f343b')
      const selectedSections = isSectionSelected
        ? this.state.selectedSections.filter(e => e !== target.id)
        : [].concat(this.state.selectedSections, target.id)
      this.setState({
        selectedSections,
      })
    }
  }

  selectSectionOrZone(target: HTMLElement): void {
    const fillColor = target.attributes.getNamedItem('fill')
    if (fillColor) {
      if (
        [
          this.state.primarySectionFill,
          this.state.selectedSectionFill,
          this.state.hoverSectionFill,
        ].includes(fillColor.nodeValue) &&
        fillColor.nodeValue !== '#6f6f6f'
      ) {
        // don't want to select an unavailable section
        const isSectionSelected = this.state.selectedSections.includes(target.id)

        this.setAttrOnTargetedObjects(target.id, isSectionSelected ? '0.4' : '2', 'stroke-width')
        this.setAttrOnTargetedObjects(
          target.id,
          isSectionSelected ? this.state.primarySectionFill : this.state.selectedSectionFill,
          'fill'
        )
        this.setAttrOnTargetedObjects(target.id, isSectionSelected ? '#555' : '#2f343b', 'stroke')

        const matchingSections = this.matchingZoneSectionsBySectionId(parseInt(target.id))
        const selectedSections = isSectionSelected
          ? this.state.selectedSections.filter(el => !matchingSections.includes(el))
          : this.state.selectedSections.concat(matchingSections)

        if (typeof this.props.onTicketsSelected === 'function') {
          this.props.onSelection(selectedSections)
        }
        this.setState({
          selectedSections,
        })
      }
    }
  }

  render(): ?React$Element<any> {
    return (
      <div
        style={{
          width: `${this.props.containerWidth}px`,
          display: 'flex',
          flexDirection: 'column',
        }}
        ref={element => this.rootRef = element}
      >
        <CSSTransition in={this.state.activeTooltip} timeout={300} classNames="message" unmountOnExit>
          {state => (
            <div
              style={Object.assign({}, mainContainerStyle, { left: this.state.tooltipX, top: this.state.tooltipY })}
              className={'tooltip'}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  display: 'inlineBlock',
                  filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0 2px 2px)',
                  fontFamily: 'Open Sans, sans-serif',
                  padding: '20px',
                  position: 'relative',
                  width: '12.5em',
                }}
              >
                <div style={{ color: '#181514', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', fontSize: '0.75em', padding: '0px' }}>
                    <div>
                      <div style={{ fontWeight: '400' }}>{this.state.tooltipSectionName}</div>
                      <div style={{ fontWeight: '400' }}>
                        <span>
                          {this.state.tooltipListingCount} listing{this.state.tooltipListingCount > 1 ? 's' : ''}
                        </span>{' '}
                        &#9679;{' '}
                        <span>
                          Starting at <span style={{ fontWeight: '700' }}>{this.state.tooltipPrice}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CSSTransition>
        <div ref={spinnerContainer => (this.spinnerContainer = spinnerContainer)} />
        <div
          style={{
            display: 'flex',
          }}
        >
          <a
            data-rh={'Default'}
            data-custom-at={'right'}
            onClick={() => this.mapZoom.zoomIn()}
            style={Object.assign({}, buttonStyle)}
          >
            +
          </a>
          <a onClick={() => this.mapZoom.zoomOut()} style={Object.assign({}, buttonStyle)}>
            ‐
          </a>
          <a style={Object.assign({}, buttonStyle, { paddingTop: '5px' })} onClick={() => this.mapZoom.reset()}>
            {resetZoom}
          </a>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={Object.assign({}, toggleTextStyle, {
                color: this.state.isZoneToggled ? '#181514' : '#3D5A80',
              })}
            >
              Section
            </div>

            <Toggle
              defaultOn={this.state.isZoneToggled}
              onToggle={on => {
                this.setState({ isZoneToggled: on })
                // reset map
                this.state.venueSections.forEach(id => this.colorIn(parseInt(id), 'empty'))
                this.updateMap(this.state.availableTicketBlocks)
              }}
            >
              {({ on, getTogglerProps }) => (
                <span
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '60px',
                    height: '36px',
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      width: '100%',
                      height: '100%',
                      margin: 0,
                      cursor: 'pointer',
                    }}
                    {...getTogglerProps({ id: 'sectionZone' })}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '10px',
                        background: '#9A9A9A',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        width: '26px',
                        height: '30px',
                        borderRadius: '8px',
                        background: 'white',
                        transition: 'transform 0.5s',
                        transform: on ? 'translateX(32px)' : 'translateX(2px)',
                      }}
                    />
                  </span>
                </span>
              )}
            </Toggle>
            <div
              style={Object.assign({}, toggleTextStyle, {
                color: this.state.isZoneToggled ? '#3D5A80' : '#181514',
              })}
            >
              Zone
            </div>
          </div>
        </div>
        <div
          ref={element => this.mapRootRef = element}
          style={{
            cursor: '-webkit-grab',
            width: this.props.containerWidth,
          }}
        />
      </div>
    )
  }
}
