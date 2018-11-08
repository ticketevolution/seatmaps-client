/* @flow */

import { h, Component } from 'preact';
import * as React from 'react';
import fetch from 'unfetch';
// hide for now, monitor time to load seatmap in production
// import { Spinner } from 'spin.js'
import Toggle from 'react-toggled/preact';
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js';
import CSSTransition from 'react-transition-group/CSSTransition';

import MOCK_TICKET_ARRAY from '../utils/ticketRequest'
import { buttonStyle, toggleTextStyle, mainContainerStyle } from './styles'
import { COLOR_VARIABLES, LIGHT_THEME, DARK_THEME, getSectionColor } from './themes'
import resetZoom from './resetZoom';

const SCREEN_BUFFER = 100
const TOOLTIP_BUFFER = 250
const DOMAIN = 'https://maps-dev.ticketevolution.com';

type State = {
  mapHtml: string,
  mapSvg: string,
  venueConfiguration: any,
  availableTicketGroups: Array<TicketGroupType>,
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

export default class TicketMap extends Component<*, State> {
  state: State
  spinnerContainer = null
  spinner = null
  mapZoom: any = null
  currentTooltip: any = null

  static defaultProps = {
    onSelection: () => undefined,
    // this mimics the client setting the array of tickets available.
    // this request plays off of the following request:
    // https://friends.ticketevolution.com/api/v9/ticket_groups?event_id=1294624&order_by=retail_price&type=event
    // it includes a new field: section_id, which is what we need
    ticketGroups: MOCK_TICKET_ARRAY.ticket_groups
  }

  constructor(props: any) {
    super(props)

    const sortedTicketGroupPrices =
      this.props.ticketGroups
        .map(group => group.retail_price)
        .sort((a, b) => a - b);

    this.state = {
      mapHtml: '',
      mapSvg: '',
      venueConfiguration: null,
      availableSections: [],
      availableTicketGroups: [],
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
      upperPriceBound: sortedTicketGroupPrices.pop(),
      lowerPriceBound: sortedTicketGroupPrices.shift(),
      ...COLOR_VARIABLES.reduce((memo, colorVar) => {
        const defaultColor = this.props.theme === 'dark' ? DARK_THEME[colorVar] : LIGHT_THEME[colorVar];
        return { ...memo, [colorVar]: this.props[colorVar] || defaultColor };
      }, {})
    }
    this.setupMap = this.setupMap.bind(this);
    this.fetchMap = this.fetchMap.bind(this);
    this.fetchManifest = this.fetchManifest.bind(this);
    this.updateTicketGroups = this.updateTicketGroups.bind(this);
    this.highlightSection = this.highlightSection.bind(this);
    this.unhighlightSection = this.unhighlightSection.bind(this);

    this.publicApi = {
      fetchMap: this.fetchMap,
      fetchManifest: this.fetchManifest,
      fetchData: this.fetchData,
      updateTicketGroups: this.updateTicketGroups,
      highlightSection: this.highlightSection,
      unhighlightSection: this.unhighlightSection
    }
  }

  async componentDidMount() {
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

    try {
      await this.fetchMap()
      await this.fetchManifest()
      await this.setupMap()
      await this.updateTicketGroups()
    } catch (error) {
      console.error(error);
    }
  }

  get venueSectionMetas() {
    if (!this.state.venueConfiguration) {
      return {};
    }
    return this.state.venueConfiguration.sectionZoneMetas;
  }

  get venueSections() {
    return Object.keys(this.venueSectionMetas);
  }

  get configFilePath() {
    return `${DOMAIN}/${this.props.venueId}/${this.props.configurationId}`;
  }

  async fetchMap() {
    const mapSvgUrl = `${this.configFilePath}/map.svg`;
    const mapNotAvailableUrl = `${DOMAIN}/maps/not_available.svg`;
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
    const manifestResponse = await fetch(`${this.configFilePath}/manifest.json`);
    if (!manifestResponse.ok) {
      throw Error('There was an error fetching the venue map data, please try again')
    }
    const venueConfiguration = await manifestResponse.json();
    this.setState({ venueConfiguration });
  }

  unhighlightSection(id) {
    const isAnAvailableSectionToHighlight = !!id && !!this.getAvailableTicketGroup(id);
    const isNotSelected = !!id && !this.state.selectedSections.includes(id);
    if (isAnAvailableSectionToHighlight && isNotSelected) {
      this.fillSection(id, this.getDefaultColor(id));
    }
  }

  highlightSection(id) {
    const isAnAvailableSectionToHighlight = !!id && !!this.getAvailableTicketGroup(id);
    const isNotSelected = !!id && !this.state.selectedSections.includes(id);
    if (isAnAvailableSectionToHighlight && isNotSelected) {
      this.fillSection(id, this.state.hoverSectionFill);
    }
  }

  getAvailableTicketGroups = (availableTickets = []) => availableTickets.reduce((memo, block) => {
    const sectionZoneMeta = this.venueSectionMetas[block.tevo_section_name];
    if (sectionZoneMeta) {
      memo.push({
        sectionId: block.tevo_section_name,
        ticketType: block.ticket_type,
        price: block.retail_price,
        zoneId: sectionZoneMeta.zid,
      });
      console.log(`Section ${block.tevo_section_name} was successfully mapped!`)
    } else {
      console.warn(`Section ${block.tevo_section_name} not found. Please verify it exists in the venue manifest`)
    }
    return memo;
  }, []);

  updateTicketGroups = (ticketGroups: any = this.props.ticketGroups) => {
    const availableTicketGroups = this.getAvailableTicketGroups(ticketGroups);
    if (JSON.stringify(this.state.availableTicketGroups) !== JSON.stringify(availableTicketGroups)) {
      this.updateMap(availableTicketGroups)
      this.setState({ availableTicketGroups })
    }
  }

  removeDuplicateProps(arr: Array<TicketGroupType>, prop: string): Array<TicketGroupType> {
    return arr.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
    })
  }

  fillSection(id, color, type = 'fill') {
    if (!color) {
      throw Error('Color is undefined for this section.');
    }
    const elem = document.querySelector(`[data-section-id="${id}"]`);
    // const elem = document.getElementById(`${id}`);
    if (elem) {
      elem.setAttribute(type, color);
      elem.querySelectorAll('path').forEach(path => path.setAttribute(type, color));
    }
  }

  colorIn(id: number, lowestTicketPrice: number): void {
    this.fillSection(id, getSectionColor.call(this, lowestTicketPrice));
  }

  colorZones(availableTicketGroups: Array<TicketGroupType>): void {
    this.removeDuplicateProps(availableTicketGroups, 'zoneId')
      .forEach(zoneBlock =>
        this.matchingZoneSectionsBySectionId(zoneBlock.sectionId)
          .forEach(id =>
            this.colorIn(id, zoneBlock.price)))
  }

  getAvailableTicketGroup(id) {
    return this.state.availableTicketGroups.find(block => id === block.sectionId);
  }

  getDefaultColor(id) {
    return getSectionColor.call(this, this.getAvailableTicketGroup(id).price)
  }

  setAttrOnTargetedObjects(targetId: string, color: string, type: string): void {
    this.matchingZoneSectionsBySectionId(targetId)
      .forEach(sectionId => this.fillSection(sectionId, color, type));
  }

  matchingZoneSectionsBySectionId(sectionId: number): Array<string> {
    const zoneMeta = this.venueSectionMetas[sectionId];
    if (!zoneMeta) {
      return [];
    }
    return this.venueSections.filter((key) => this.venueSectionMetas[key].zid === zoneMeta.zid)
  }

  updateMap(availableTicketGroups: Array<TicketGroupType> = this.state.availableTicketGroups): void {
    // does not take in to account same section blocks
    // i.e. if one is marked as cheap and one expensive, the last ticket_type
    // in the array will take precedent

    if (this.state.isZoneToggled) {
      this.colorZones(availableTicketGroups)
    } else {
      availableTicketGroups.forEach(block => this.colorIn(block.sectionId, block.price))
    }
  }

  doHover(clientX: any, clientY: any, id: string): void {
    // console.log('hover');
    const { zid, name } = this.venueSectionMetas[id];
    if (this.state.isZoneToggled) {
      this.setAttrOnTargetedObjects(id, this.state.hoverSectionFill, 'fill')
      // if (this.state.currentHoveredZone === zid) {
      //   clearTimeout(this.mouseOutTimeout)
      // }

      const matchingListings = this.state.availableTicketGroups.filter(section => section.zoneId === zid)
      const lowestPrice = matchingListings.reduce((min, section) => (section.price < min) ? section.price : min, matchingListings[0].price);
      return this.setState({
        activeTooltip: true,
        tooltipSectionName: name,
        tooltipPrice: lowestPrice,
        tooltipX: this.getTooltipX(clientX),
        tooltipY: this.getTooltipY(clientY),
        currentHoveredZone: zid,
        tooltipListingCount: matchingListings.length,
      });
    }

    const matchingListings = this.state.availableTicketGroups.filter(block => block.sectionId === id)
    const lowestPrice = matchingListings.reduce((min, section) => (section.price < min) ? section.price : min, matchingListings[0].price);
    this.setState({
      activeTooltip: true,
      tooltipSectionName: name,
      tooltipPrice: lowestPrice,
      tooltipX: this.getTooltipX(clientX),
      tooltipY: this.getTooltipY(clientY),
      tooltipListingCount: matchingListings.length,
    });

    this.highlightSection(id);
  }

  getTooltipX = (clientX) => {
    return clientX - SCREEN_BUFFER < 0
      ? clientX
      : document.body.clientWidth - TOOLTIP_BUFFER < clientX
        ? clientX - TOOLTIP_BUFFER
        : clientX - 10;
  }

  getTooltipY = (clientY) => {
    return clientY - SCREEN_BUFFER < 0 ? clientY + 50 : clientY - SCREEN_BUFFER;
  }

  doHoverCleanup(target: HTMLElement, id: string): void {
    const fillColor = target.attributes.getNamedItem('fill')
    this.setState({ activeTooltip: false })

    if (!fillColor) {
      return;
    }
    if (this.state.isZoneToggled) {
      return this.colorZones(this.state.availableTicketGroups);
    }
    if (fillColor.nodeValue === this.state.hoverSectionFill) {
      const section = this.state.availableTicketGroups.find(block => id === block.sectionId)
      this.colorIn(id, section.price)
    }
  }

  isSectionOrZoneAvailable(id: any): boolean {
    return this.venueSectionMetas && this.state.availableTicketGroups.some(block => {
      if (!this.state.isZoneToggled) {
        return id === block.sectionId;
      }
      return this.venueSectionMetas[block.sectionId] && this.venueSectionMetas[id] && this.venueSectionMetas[block.sectionId].zid === this.venueSectionMetas[id].zid;
    })
  }

  resetMap() {
    this.venueSections.forEach(id => this.fillSection(id, this.state.emptySectionFill));
  }

  setFont() {
    // set font if specified in config, if none is specified, leave as default
    // font in the map
    if (this.props.mapFontFamily) {
      this.rootRef
        .querySelectorAll('text')
        .forEach(elem => (elem.style.fontFamily = `${this.props.mapFontFamily}`))
    }
  }

  onMouseOver = ({ clientX, clientY, target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const id = target.getAttribute('data-section-id');
      if (this.isSectionOrZoneAvailable(id)) {
        return this.doHover(clientX, clientY, id)
      }
    } else if (target !== this.rootRef) {
      return this.onMouseOver({ clientX, clientY, target: target.parentNode });
    }
  }

  onMouseOut = ({ target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const id = target.getAttribute('data-section-id');
      if (this.isSectionOrZoneAvailable(id) && !this.state.selectedSections.includes(id)) {
        return this.doHoverCleanup(target, id)
      }
    } else if (target !== this.rootRef) {
      return this.onMouseOut({ target: target.parentNode });
    }
  }

  onClick = ({ target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const id = target.getAttribute('data-section-id');
      if (this.isSectionOrZoneAvailable(id)) {
        return this.selectSectionOrZone(target);
      }
    } else if (target !== this.rootRef) {
      return this.onClick({ target: target.parentNode });
    }
  }

  setupMap(): void {
    const mapSvg = this.mapRootRef.querySelector('svg');
    mapSvg.style.width = 'inherit';
    mapSvg.style.height = 'inherit';
    mapSvg.style.minWidth = 'inherit';
    mapSvg.style.minHeight = 'inherit';

    this.setFont();
    this.resetMap();

    this.mapZoom = svgPanZoom(mapSvg, {
      zoomScaleSensitivity: 0.3,
      minZoom: 0.8,
      maxZoom: 10,
      center: true,
      fit: true,
      contain: false,
    })

    // Fix the image paths embedded in the SVGs
    mapSvg.querySelectorAll('image').forEach(image => image.setAttribute('xlink:href', `${this.configFilePath}/${image.getAttribute('xlink:href')}`));

    this.setState({ isMapLoaded: true });
  }

  selectSectionOrZone(target: HTMLElement): void {
    const fillColor = target.attributes.getNamedItem('fill')
    if (!fillColor || this.isSectionUnavailable(fillColor.nodeValue)) {
      return;
    }
    const id = target.getAttribute('data-section-id');
    // don't want to select an unavailable section
    const isCurrentlyDeselecting = this.state.selectedSections.includes(id)

    const matchingSections = this.state.isZoneToggled ? this.matchingZoneSectionsBySectionId(id) : [id];
    const defaultColor = this.getDefaultColor(id);

    matchingSections.forEach(sectionId => {
      this.fillSection(sectionId, isCurrentlyDeselecting ? defaultColor : this.state.selectedSectionFill, 'fill')
      this.fillSection(sectionId, isCurrentlyDeselecting ? '0.4' : '2', 'stroke-width')
      this.fillSection(sectionId, isCurrentlyDeselecting ? '#fff' : '#2f343b', 'stroke')
    });

    const selectedSections = isCurrentlyDeselecting
      ? this.state.selectedSections.filter(section => !matchingSections.includes(section))
      : this.state.selectedSections.concat(matchingSections)

    this.props.onSelection(selectedSections);
    this.setState({ selectedSections });
  }

  isSectionUnavailable = (fillColor) => [this.state.selectedSectionFill, this.state.hoverSectionFill, '#6f6f6f'].includes(fillColor.nodeValue);

  render(): ?React$Element<any> {
    return (
      <div
        ref={element => this.rootRef = element}
        onMouseOver={this.onMouseOver.bind(this)}
        onMouseOut={this.onMouseOut.bind(this)}
        onClick={this.onClick.bind(this)}
        style={{
          height: 'inherit',
          width: 'inherit',
          minHeight: 'inherit',
          minWidth: 'inherit'
        }}
      >
        <CSSTransition in={this.state.activeTooltip} timeout={300} classNames="message" unmountOnExit>
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
                position: 'relative'
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
              onToggle={isZoneToggled => {
                this.setState({ isZoneToggled });
                this.resetMap();
                this.updateMap();
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
            height: 'inherit',
            width: 'inherit',
            minHeight: 'inherit',
            minWidth: 'inherit',
            opacity: this.state.isMapLoaded ? 1 : 0
          }}
        />
      </div>
    )
  }
}
