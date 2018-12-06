/* @flow */

import { h, Component } from 'preact';
import * as React from 'react';
import fetch from 'unfetch';

import { UNAVAILABLE_COLOR, fillSection } from './colors'
import ZoomSettings from './zoomSettings';
import Tooltip from './tooltip';
import ZoneToggle from './zoneToggle';

type State = {
  mapSvg: string,
  venueConfiguration: any,
  availableTicketGroups: Array<TicketGroupType>,
  selectedSections: Array<string>,
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
    mapsDomain: 'https://maps-dev.ticketevolution.com',
    onSelection: () => undefined,
    isZoneDefault: false,
    emptySectionFill: UNAVAILABLE_COLOR,
    selectedSections: [],
    sectionPercentiles: {
      '0.2': '#FFC515',
      '0.4': '#f2711c',
      '0.6': '#D6226A',
      '0.8': '#a333c8',
      '1': '#2A6EBB',
    }
  }

  constructor(props: any) {
    super(props);
    this.state = {
      mapSvg: '',
      venueConfiguration: null,
      availableTicketGroups: [],
      selectedSections: this.props.selectedSections,
      isZoneToggled: this.props.isZoneDefault,
      currentHoveredZone: null,
      currentHoveredSection: null,
      activeTooltip: false,
      tooltipSectionName: '',
      tooltipZoneId: '',
      tooltipX: 0,
      tooltipY: 0
    }

    this.updateTicketGroups = this.updateTicketGroups.bind(this);
    this.highlightSection = this.highlightSection.bind(this);
    this.unhighlightSection = this.unhighlightSection.bind(this);
    this.toggleSection = this.toggleSection.bind(this);
    this.highlightZone = this.highlightZone.bind(this);
    this.unhighlightZone = this.unhighlightZone.bind(this);
    this.toggleZone = this.toggleZone.bind(this);

    this.publicApi = {
      updateTicketGroups: this.updateTicketGroups,
      highlightSection: this.highlightSection,
      unhighlightSection: this.unhighlightSection,
      toggleSection: this.toggleSection,
      highlightZone: this.highlightZone,
      unhighlightZone: this.unhighlightZone,
      toggleZone: this.toggleZone
    }
  }

  /**
   * Lifecycle
   */

  async componentDidMount() {
    try {
      await this.fetchMap()
      await this.fetchManifest()
      await this.setupMap()
      await this.updateTicketGroups()
    } catch (error) {
      console.error(error);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (JSON.stringify(this.state.availableTicketGroups) !== JSON.stringify(prevState.availableTicketGroups)) {
      this.updateMap()
    }
  }

  async fetchMap() {
    const mapSvgUrl = `${this.configFilePath}/map.svg`;
    const mapNotAvailableUrl = `${this.props.mapsDomain}/maps/not_available.svg`;
    const mapResponse = await fetch(this.props.configurationId ? mapSvgUrl : mapNotAvailableUrl);
    if (!mapResponse.ok) {
      throw Error('There was an error fetching the venue map, please try again')
    }
    const mapHtml = await mapResponse.text();
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

  setupMap(): void {
    const mapSvg = this.mapRootRef.querySelector('svg');
    mapSvg.style.width = 'inherit';
    mapSvg.style.height = 'inherit';
    mapSvg.style.minWidth = 'inherit';
    mapSvg.style.minHeight = 'inherit';

    this.setFont();
    this.resetMap();

    // Fix the image paths embedded in the SVGs
    mapSvg.querySelectorAll('image').forEach(image => {
      let uri = image.getAttribute('xlink:href');
      if (!uri.startsWith('http') && !uri.startsWith('data:')) {
        image.setAttribute('xlink:href', `${this.configFilePath}/${uri}`);
      }
    });

    this.setState({ mapSvg });
  }

  /**
   * Properties
   */

  get sortedTicketGroupPrices() {
    return this.state.availableTicketGroups
      .map(group => group.price)
      .sort((a, b) => a - b);
  }

  get ticketGroupsBySectionByZone() {
    const ticketGroupsBySection = this.ticketGroupsBySection;
    return this.venueSections.reduce((memo, sectionId) => {
      const zoneId = this.venueSectionMetas[sectionId].zid;
      if (!memo.hasOwnProperty(zoneId)) {
        memo[zoneId] = {};
      }
      return {
        ...memo,
        [zoneId]: {
          ...memo[zoneId],
          [sectionId]: ticketGroupsBySection[sectionId]
        }
      };
    }, {});
  }

  get ticketGroupsBySection() {
    return this.state.availableTicketGroups.reduce((memo, ticketGroup) => {
      const { sectionId } = ticketGroup;
      if (!memo.hasOwnProperty(sectionId)) {
        memo[sectionId] = [];
      }
      memo[sectionId].push(ticketGroup);
      return memo;
    }, {});
  }

  get venueSectionMetas() {
    if (!this.state.venueConfiguration) {
      return {};
    }
    // return this.state.venueConfiguration.sectionZoneMetas;
    return Object.values(this.state.venueConfiguration.sectionZoneMetas).reduce((memo, section) => ({ ...memo, [section.name]: section }), {});
  }

  get venueSections() {
    return Object.keys(this.ticketGroupsBySection);
  }

  get configFilePath() {
    return `${this.props.mapsDomain}/${this.props.venueId}/${this.props.configurationId}`;
  }

  /**
   * Public Methods
   */

  highlightSection(sectionId, ticketGroups) {
    return this.toggleSection(sectionId, true, ticketGroups);
  }

  unhighlightSection(sectionId, ticketGroups) {
    return this.toggleSection(sectionId, false, ticketGroups);
  }

  toggleSection(sectionId, shouldHighlight = true, ticketGroups) {
    if (!sectionId) {
      return;
    }
    const isAnAvailableSection = this.venueSections.includes(sectionId);
    if (isAnAvailableSection) {
      fillSection(sectionId, this.getDefaultColor(sectionId, ticketGroups), 'fill');
      fillSection(sectionId, shouldHighlight ? '1' : '0.6', 'opacity');
    }
  }

  highlightZone(zoneId) {
    return this.toggleZone(zoneId, true);
  }

  unhighlightZone(zoneId) {
    return this.toggleZone(zoneId, false);
  }

  toggleZone(zoneId, shouldHighlight = true) {
    const ticketGroupsBySection = this.ticketGroupsBySectionByZone[zoneId];
    const allTicketGroupsInZone = Object.values(ticketGroupsBySection).reduce((memo, ticketGroupsInSection) => [...memo, ...ticketGroupsInSection], []);
    Object.keys(ticketGroupsBySection).forEach(sectionId => this.toggleSection(sectionId, shouldHighlight, allTicketGroupsInZone));
  }

  updateTicketGroups = (ticketGroups: any = this.props.ticketGroups) => {
    const availableTicketGroups = this.getAvailableTicketGroups(ticketGroups);
    this.setState({ availableTicketGroups })
  }

  /**
   * Helpers
   */

  getAvailableTicketGroups = (availableTicketGroups = []) =>
    availableTicketGroups.reduce((memo, { tevo_section_name, retail_price }) => {
      const sectionZoneMeta = this.venueSectionMetas[tevo_section_name];
      if (sectionZoneMeta) {
        memo.push({
          sectionId: tevo_section_name,
          price: retail_price,
          zoneId: sectionZoneMeta.zid,
        });
        console.log(`Section ${tevo_section_name} was successfully mapped!`)
      } else {
        console.warn(`Section ${tevo_section_name} not found. Please verify it exists in the venue manifest`)
      }
      return memo;
    }, []);

  getAllSectionsInZoneBySectionId(sectionId: number): Array<string> {
    const zoneMeta = this.venueSectionMetas[sectionId] || {};
    return this.venueSections.filter((sectionId) => this.venueSectionMetas[sectionId].zid === zoneMeta.zid)
  }

  areAllSectionsInTheZoneSelected(zoneId: number): boolean {
    return Object.keys(this.ticketGroupsBySectionByZone[zoneId])
      .every(sectionId => this.state.selectedSections.includes(sectionId));
  }

  updateMap(): void {
    if (this.state.isZoneToggled) {
      Object.keys(this.ticketGroupsBySectionByZone).forEach(zoneId => {
        const shouldHighight = this.areAllSectionsInTheZoneSelected(zoneId);
        this.toggleZone(zoneId, shouldHighight);
      });
    } else {
      Object.keys(this.ticketGroupsBySection).forEach(sectionId => {
        const shouldHighight = this.state.selectedSections.includes(sectionId);
        this.toggleSection(sectionId, shouldHighight);
      });
    }
  }

  resetMap() {
    this.venueSections.forEach(id => fillSection(id, this.props.emptySectionFill));
  }

  setFont() {
    if (this.props.mapFontFamily) {
      this.rootRef
        .querySelectorAll('text')
        .forEach(elem => (elem.style.fontFamily = `${this.props.mapFontFamily}`))
    }
  }

  /**
   * Coloring
   */

  getDefaultColor(sectionId, ticketGroups) {
    const { sectionPercentiles } = this.props;
    ticketGroups = Array.isArray(ticketGroups) ? ticketGroups : this.ticketGroupsBySection[sectionId];
    const lowestTicketPriceInSection = ticketGroups.map(({ price }) => price).sort((a, b) => a - b)[0];
    const percentile = this.sortedTicketGroupPrices.indexOf(lowestTicketPriceInSection) / this.sortedTicketGroupPrices.length;
    const sectionPercentileKeys = Object.keys(sectionPercentiles).map(key => +key).sort();
    for (const key of sectionPercentileKeys) {
      if (percentile <= key) {
        return sectionPercentiles[key];
      }
    }
  }

  /**
   * Interation Callbacks
   */

  onMouseOver = ({ clientX, clientY, target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const id = target.getAttribute('data-section-id');
      if (this.venueSections.includes(id)) {
        return this.doHover(clientX, clientY, id)
      }
    } else if (target !== this.rootRef) {
      return this.onMouseOver({ clientX, clientY, target: target.parentNode });
    }
  }

  onMouseOut = ({ target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const id = target.getAttribute('data-section-id');
      if (this.venueSections.includes(id)) {
        return this.doHoverCleanup(id)
      }
    } else if (target !== this.rootRef) {
      return this.onMouseOut({ target: target.parentNode });
    }
  }

  onClick = ({ target }: any) => {
    if (target.hasAttribute('data-section-id')) {
      const id = target.getAttribute('data-section-id');
      if (this.venueSections.includes(id)) {
        return this.selectSectionOrZone(id);
      }
    } else if (target !== this.rootRef) {
      return this.onClick({ target: target.parentNode });
    }
  }

  /**
   * Interactions
   */

  doHover(tooltipX: any, tooltipY: any, id: string): void {
    const { zid, name: tooltipSectionName } = this.venueSectionMetas[id];

    const newState = {
      activeTooltip: true,
      tooltipX,
      tooltipY,
      tooltipSectionName
    };

    if (this.state.isZoneToggled) {
      newState.currentHoveredZone = zid;
      this.highlightZone(zid);
    } else {
      newState.currentHoveredSection = id;
      this.highlightSection(id);
    }

    this.setState(newState);
  }

  doHoverCleanup(id: string): void {
    this.setState({ activeTooltip: false })

    if (this.state.selectedSections.includes(id)) {
      return;
    }

    if (this.state.isZoneToggled) {
      return this.unhighlightZone(this.venueSectionMetas[id].zid);
    }

    this.unhighlightSection(id);
  }

  selectSectionOrZone(sectionId: string): void {
    const zoneId = this.venueSectionMetas[sectionId].zid;

    const matchingSections = this.state.isZoneToggled ? this.getAllSectionsInZoneBySectionId(sectionId) : [sectionId];
    const isCurrentlyDeselecting = matchingSections.every(sectionId => this.state.selectedSections.includes(sectionId));

    if (this.state.isZoneToggled) {
      this.toggleZone(zoneId, !isCurrentlyDeselecting);
    } else {
      this.toggleSection(sectionId, !isCurrentlyDeselecting);
    }

    const selectedSections = isCurrentlyDeselecting
      ? this.state.selectedSections.filter(section => !matchingSections.includes(section))
      : this.state.selectedSections.concat(matchingSections)

    this.props.onSelection(selectedSections);
    this.setState({ selectedSections });
  }

  render(): ?React$Element<any> {
    return (
      <div
        ref={element => this.rootRef = element}
        onMouseOver={this.onMouseOver.bind(this)}
        onMouseOut={this.onMouseOut.bind(this)}
        onClick={this.onClick.bind(this)}
        style={{
          height: 'inherit',
          minHeight: 'inherit',
          minWidth: 'inherit'
        }}
      >
        <Tooltip
          isActive={this.state.activeTooltip}
          clientX={this.state.tooltipX}
          clientY={this.state.tooltipY}
          name={this.state.tooltipSectionName}
          ticketGroups={this.state.availableTicketGroups.filter(ticketGroup => ticketGroup.sectionId === this.state.currentHoveredSection)}
        />
        <div style={{ display: 'flex' }}>
          {this.state.mapSvg && <ZoomSettings mapSvg={this.state.mapSvg} />}
          {/* <ZoneToggle
            isZoneToggled={this.state.isZoneToggled}
            onToggle={isZoneToggled => {
              this.setState({ isZoneToggled });
              this.resetMap();
              this.updateMap();
            }}
          /> */}
        </div>
        <div
          ref={element => this.mapRootRef = element}
          style={{
            cursor: '-webkit-grab',
            height: 'inherit',
            width: 'inherit',
            minHeight: 'inherit',
            minWidth: 'inherit',
            opacity: !!this.state.mapSvg ? 1 : 0
          }}
        />
      </div>
    )
  }
}
