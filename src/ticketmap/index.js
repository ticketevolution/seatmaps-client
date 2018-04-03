/* @flow */
/** @jsx h */

import { h, Component } from 'preact'
import fetch from 'unfetch'
import { Spinner } from 'spin.js'
import TicketEvolutionWindow from 'window'
import Toggle from 'react-toggled'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
const COLOR_VARIABLES = [
  'emptySectionFill',
  'primaryTicketFill',
  'cheapSectionFill',
  'expensiveSectionFill',
  'selectedTicketFill',
  'hoverTicketFill'
]

const LIGHT_THEME = {
  emptySectionFill: '#9E9E9E',
  primaryTicketFill: '#B1DDF1',
  cheapSectionFill: '#F7B267',
  expensiveSectionFill: '#6699CC',
  selectedTicketFill: '#F06449',
  hoverTicketFill: '#B5BA72'
}

const DARK_THEME = {
  emptySectionFill: '#E5E5E5',
  primaryTicketFill: '#81A4CD',
  cheapSectionFill: '#C3A995',
  expensiveSectionFill: '#B1DDF1',
  selectedTicketFill: '#F06449',
  hoverTicketFill: '#1D3461'
}

const buttonStyle = {
  width: '40px',
  background: '#fff',
  color: '#007879',
  border: '1px solid #ccc',
  borderRadius: '8px',
  display: 'block',
  textAlign: 'center',
  fontSize: '24px',
  textDecoration: 'none',
  fontWeight: '500',
  cursor: 'pointer'
}

const toggleText = {
  padding: '0 5px',
  fontFamily: 'sans-serif',
  fontSize: '14px'
}

type State = {
  mapSvg: string,
  venueConfiguration: any,
  venueSections: Array<string>,
  availableSections: Array<string>,
  unavailableSections: Array<string>,
  selectedSections: Array<string>,
  isZoneToggled: boolean,
  currentHoveredZone: string
}

type Props = {
  goTo: Function
}

export default class TicketMap extends Component<Props, State> {
  state: State
  tevoWindow = TicketEvolutionWindow
  spinnerContainer = null
  spinner = null
  mapZoom: any = null
  mouseOutTimeout: any

  constructor (props: any) {
    super(props)
    this.state = {
      mapSvg: '',
      venueConfiguration: null,
      venueSections: [],
      availableSections: [],
      unavailableSections: [],
      selectedSections: [],
      isMapLoaded: false,
      isZoneToggled: true,
      currentHoveredZone: ''
    }
    this.mouseOutTimeout = null
  }

  componentDidMount () {
    // show spinner until map is loaded
    this.spinner = new Spinner({
      lines: 10, // The number of lines to draw
      speed: 2, // Rounds per second
      className: 'spinner', // The CSS class to assign to the spinner
      top: '150px', // Top position relative to parent
      left: '50%', // Left position relative to parent
      position: 'relative' // Element positioning
    }).spin(document.getElementById('mapRoot'))

    this.setColorScheme()

    const mapURL = this.tevoWindow.venueId
      ? 'https://storage.googleapis.com/ticketevolution/maps/' + this.tevoWindow.venueId + '.svg'
      : 'https://storage.googleapis.com/ticketevolution/maps/not_available.svg'
    fetch(mapURL)
      .then(response => {
        if (response.ok) {
          response.text().then(mapHtmlString => {
            let mapRoot = document.getElementById('mapRoot')
            if (mapRoot) {
              mapRoot.innerHTML = mapHtmlString
            }
          })
        } else {
          throw Error('There was an error with your request, please try again')
        }
      })
      .then(() => {
        return fetch('https://storage.googleapis.com/ticketevolution/venueDescription.json').then(response => {
          if (response.ok) {
            response.json().then(json => {
              this.setState({
                venueConfiguration: json
              })
            })
          }
        })
      })
      .then(() => {
        // check if a width is set in the config
        if (this.tevoWindow.containerWidth) {
          const mapWidth = this.tevoWindow.containerWidth - 30
          const mapSvg = document.querySelector('#mapRoot > svg')
          if (mapSvg && mapSvg.attributes.length) {
            mapSvg.setAttribute('width', `${mapWidth}`)
            mapSvg.setAttribute(
              'height',
              `${parseInt(mapSvg.attributes.getNamedItem('height').nodeValue) *
                (mapWidth / parseInt(mapSvg.attributes.getNamedItem('height').nodeValue))}`
            )
          }
        }
      })
      .then(() => {
        if (this.tevoWindow.venueId) {
          this.setState({
            venueSections: Object.keys(this.state.venueConfiguration.sectionZoneMetas)
          })
          this.setupMap()
        }
      })
      .catch(e => console.log('Error Message: ', e))
  }

  setupMap () {
    // set font
    const rootElement = document && document.getElementById('rootElement')
    document
      .querySelectorAll('#rootElement text')
      .forEach(elem => (elem.style.fontFamily = `${this.tevoWindow.mapFontFamily}`))

    this.state.availableSections.forEach(id => {
      const elem = document.getElementById(id)
      if (elem) {
        const elemFill = elem.attributes.getNamedItem('fill')
        if (elemFill) {
          const fillColor = elemFill.nodeValue

          switch (fillColor) {
            // unavailable
            case '#9E9E9E':
              if (this.tevoWindow.emptySectionFill.length) {
                elem.setAttribute('fill', this.tevoWindow.emptySectionFill)
              }
              break
            case '#666':
              if (this.tevoWindow.primaryTicketFill.length) {
                elem.setAttribute('fill', this.tevoWindow.primaryTicketFill)
              }
              break
          }
        }
      }
    })

    // set color scheme for groups
    document.querySelectorAll('#rootElement g').forEach(elem => {
      const elemFill = elem.attributes.getNamedItem('fill')
      if (elemFill) {
        const fillColor = elemFill.nodeValue

        switch (fillColor) {
          // unavailable
          case '#9E9E9E':
            if (this.tevoWindow.emptySectionFill.length) {
              elem.setAttribute('fill', this.tevoWindow.emptySectionFill)
            }
            break
          case '#666':
            if (this.tevoWindow.primaryTicketFill.length) {
              elem.setAttribute('fill', this.tevoWindow.primaryTicketFill)
            }
            break
        }
      }
    })

    // add hover styling, which includes tooltip
    rootElement &&
      rootElement.addEventListener('mouseover', ({ target }: any) => {
        if (this.isSectionOrZone(target.id)) {
          if (this.state.isZoneToggled) {
            this.setAttrOnTargetedObjects(target.id, this.tevoWindow.hoverTicketFill, 'fill')
            if (this.state.currentHoveredZone === this.state.venueConfiguration.sectionZoneMetas[target.id].zid) {
              clearTimeout(this.mouseOutTimeout)
            }
            this.setState({
              currentHoveredZone: this.state.venueConfiguration.sectionZoneMetas[target.id].zid
            })
          } else {
            return target.setAttribute('fill', this.tevoWindow.hoverTicketFill)
          }
          // check if the parent has an id in the section configuration
        } else if (this.isSectionOrZone(target.parentNode.id)) {
          if (this.state.isZoneToggled) {
            this.setAttrOnTargetedObjects(target.parentNode.id, this.tevoWindow.hoverTicketFill, 'fill')
            if (
              this.state.currentHoveredZone === this.state.venueConfiguration.sectionZoneMetas[target.parentNode.id].zid
            ) {
              clearTimeout(this.mouseOutTimeout)
            }
            this.setState({
              currentHoveredZone: this.state.venueConfiguration.sectionZoneMetas[target.parentNode.id].zid
            })
          } else {
            return target.parentNode.setAttribute('fill', this.tevoWindow.hoverTicketFill)
          }
        }
      })

    // hover cleanup
    rootElement &&
      rootElement.addEventListener('mouseout', ({ target }: any) => {
        this.mouseOutTimeout = setTimeout(() => {
          const fillColor = target.attributes.getNamedItem('fill')
          const parentColor = target.parentNode.attributes.getNamedItem('fill')

          if (this.isSectionOrZone(target.id) && !this.state.selectedSections.includes(target.id)) {
            if (this.state.isZoneToggled) {
              this.setAttrOnTargetedObjects(
                target.id ? target.id : target.parentNode.id,
                this.tevoWindow.primaryTicketFill,
                'fill'
              )
            } else {
              if (fillColor) {
                if (fillColor.nodeValue === this.tevoWindow.hoverTicketFill) {
                  target.setAttribute('fill', this.tevoWindow.primaryTicketFill)
                }
              }
            }
          } else if (
            this.isSectionOrZone(target.parentNode.id) &&
            !this.state.selectedSections.includes(target.parentNode.id)
          ) {
            if (parentColor) {
              if (this.state.isZoneToggled) {
                if (parentColor.nodeValue === this.tevoWindow.hoverTicketFill) {
                  this.setAttrOnTargetedObjects(target.parentNode.id, this.tevoWindow.primaryTicketFill, 'fill')
                }
              } else {
                if (parentColor.nodeValue === this.tevoWindow.hoverTicketFill) {
                  target.parentNode.setAttribute('fill', this.tevoWindow.primaryTicketFill)
                }
              }
            }
          }
        }, 20)
      })

    // activate/deactivate section
    rootElement &&
      rootElement.addEventListener('click', ({ target }: any) => {
        const fillColor = target.attributes.getNamedItem('fill')
        const parentColor = target.parentNode.attributes.getNamedItem('fill')

        // check that we're clicking on a section, and that the section is not
        // currently unavailable
        if (this.state.isZoneToggled) {
          if (this.isSectionOrZone(target.id)) {
            if (fillColor) {
              if (
                [
                  this.tevoWindow.primaryTicketFill,
                  this.tevoWindow.selectedTicketFill,
                  this.tevoWindow.hoverTicketFill
                ].includes(fillColor.nodeValue) &&
                fillColor.nodeValue !== '#6f6f6f'
              ) {
                // don't want to select an unavailable section
                const isSectionSelected = this.state.selectedSections.includes(target.id)

                this.setAttrOnTargetedObjects(target.id, isSectionSelected ? '0.4' : '3', 'stroke-width')
                this.setAttrOnTargetedObjects(
                  target.id,
                  isSectionSelected ? this.tevoWindow.primaryTicketFill : this.tevoWindow.selectedTicketFill,
                  'fill'
                )
                this.setAttrOnTargetedObjects(target.id, isSectionSelected ? '#555' : '#0125AC', 'stroke')

                const matchingSections = Object.keys(this.state.venueConfiguration.sectionZoneMetas).filter(
                  (key, index) => {
                    if (this.state.venueConfiguration.sectionZoneMetas[target.id]) {
                      if (
                        this.state.venueConfiguration.sectionZoneMetas[key].zid ===
                        this.state.venueConfiguration.sectionZoneMetas[target.id].zid
                      ) {
                        return true
                      }
                    }
                  }
                )

                this.setState({
                  selectedSections: isSectionSelected
                    ? this.state.selectedSections.filter(el => !matchingSections.includes(el))
                    : this.state.selectedSections.concat(matchingSections)
                })
              }
            }
          } else if (this.isSectionOrZone(target.parentNode.id)) {
            if (parentColor) {
              if (
                [
                  this.tevoWindow.primaryTicketFill,
                  this.tevoWindow.selectedTicketFill,
                  this.tevoWindow.hoverTicketFill
                ].includes(parentColor.nodeValue) &&
                parentColor.nodeValue !== '#6f6f6f'
              ) {
                // don't want to select an unavailable section
                const isSectionSelected = this.state.selectedSections.includes(target.parentNode.id)

                this.setAttrOnTargetedObjects(target.parentNode.id, isSectionSelected ? '0.4' : '3', 'stroke-width')
                this.setAttrOnTargetedObjects(
                  target.parentNode.id,
                  isSectionSelected ? this.tevoWindow.primaryTicketFill : this.tevoWindow.selectedTicketFill,
                  'fill'
                )
                this.setAttrOnTargetedObjects(target.parentNode.id, isSectionSelected ? '#555' : '#0125AC', 'stroke')

                const matchingSections = Object.keys(this.state.venueConfiguration.sectionZoneMetas).filter(
                  (key, index) => {
                    /* eslint-disable */
                    if (this.state.venueConfiguration.sectionZoneMetas[target.parentNode.id]) {
                      if (
                        this.state.venueConfiguration.sectionZoneMetas[key].zid ===
                        this.state.venueConfiguration.sectionZoneMetas[target.parentNode.id].zid
                      ) {
                        return true
                      }
                      /* eslint-enable */
                    }
                  }
                )

                this.setState({
                  selectedSections: isSectionSelected
                    ? this.state.selectedSections.filter(el => !matchingSections.includes(el))
                    : this.state.selectedSections.concat(matchingSections)
                })
              }
            }
          }
        } else {
          if (this.isSectionOrZone(target.id)) {
            if (fillColor) {
              if (
                [
                  this.tevoWindow.primaryTicketFill,
                  this.tevoWindow.selectedTicketFill,
                  this.tevoWindow.hoverTicketFill
                ].includes(fillColor.nodeValue) &&
                fillColor.nodeValue !== '#6f6f6f'
              ) {
                // don't want to select an unavailable section
                const isSectionSelected = this.state.selectedSections.includes(target.id)
                target.setAttribute(
                  'fill',
                  isSectionSelected ? this.tevoWindow.primaryTicketFill : this.tevoWindow.selectedTicketFill
                )
                target.setAttribute('stroke-width', isSectionSelected ? '0.4' : '3')
                target.setAttribute('stroke', isSectionSelected ? '#555' : '#0125AC')

                this.setState({
                  selectedSections: isSectionSelected
                    ? this.state.selectedSections.filter(e => e !== target.id)
                    : [].concat(this.state.selectedSections, target.id)
                })
              }
            }
          } else if (this.isSectionOrZone(target.parentNode.id)) {
            if (
              [
                this.tevoWindow.primaryTicketFill,
                this.tevoWindow.selectedTicketFill,
                this.tevoWindow.hoverTicketFill
              ].includes(parentColor.nodeValue) &&
              parentColor.nodeValue !== '#6f6f6f'
            ) {
              // don't want to select an unavailable section
              const isSectionSelected = this.state.selectedSections.includes(target.parentNode.id)
              target.setAttribute(
                'fill',
                isSectionSelected ? this.tevoWindow.primaryTicketFill : this.tevoWindow.selectedTicketFill
              )
              target.setAttribute('stroke-width', isSectionSelected ? '0.4' : '3')
              target.setAttribute('stroke', isSectionSelected ? '#555' : '#0125AC')

              this.setState({
                selectedSections: isSectionSelected
                  ? this.state.selectedSections.filter(e => e !== target.parentNode.id)
                  : [].concat(this.state.selectedSections, target.parentNode.id)
              })
            }
          }
        }
      })

    // Setup Zoom on Map
    this.mapZoom = svgPanZoom('#mapRoot > svg', {
      zoomScaleSensitivity: 0.3,
      minZoom: 1,
      maxZoom: 10
    })
  }

  isSectionOrZone (id: string) {
    return this.state.venueConfiguration.sectionZoneMetas[id]
  }

  setAttrOnTargetedObjects (target: number, color: string, type: string) {
    const matchingSections = Object.keys(this.state.venueConfiguration.sectionZoneMetas).filter((key, index) => {
      if (this.state.venueConfiguration.sectionZoneMetas[target]) {
        if (
          this.state.venueConfiguration.sectionZoneMetas[key].zid ===
          this.state.venueConfiguration.sectionZoneMetas[target].zid
        ) {
          return this.state.venueConfiguration.sectionZoneMetas[key]
        }
      }
    })

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

  setColorScheme () {
    COLOR_VARIABLES.forEach(attr => {
      if (!this.tevoWindow[attr].length) {
        this.tevoWindow[attr] = this.tevoWindow.theme === 'dark' ? DARK_THEME[attr] : LIGHT_THEME[attr]
      }
    })
  }

  renderHomeIcon () {
    return (
      <svg
        version='1.0'
        xmlns='http://www.w3.org/2000/svg'
        width='20'
        height='20'
        viewBox='0 0 200 200'
        preserveAspectRatio='xMidYMid meet'
      >
        <g transform='translate(0.000000,200.000000) scale(0.100000,-0.100000)' fill='#007879' stroke='none'>
          <path
            d='M666 1864 c-93 -20 -176 -56 -257 -110 -71 -47 -188 -164 -214 -214
      l-16 -31 -54 30 c-44 25 -59 29 -79 21 -14 -5 -28 -20 -31 -33 -6 -22 93 -481
      115 -534 13 -31 46 -38 78 -17 26 17 341 308 375 346 21 25 22 61 2 78 -8 7
      -45 14 -82 17 -105 8 -106 12 -36 81 234 229 615 185 795 -92 98 -151 106
      -352 20 -521 -34 -68 -153 -184 -224 -218 -162 -77 -342 -71 -494 18 -23 14
      -47 25 -53 25 -6 0 -45 -26 -86 -58 -97 -75 -99 -91 -13 -149 233 -158 553
      -166 802 -21 l48 29 217 -214 c119 -118 226 -220 238 -226 34 -17 119 -13 161
      8 42 22 70 50 101 101 23 39 29 126 10 163 -6 12 -115 123 -242 248 l-231 225
      22 67 c82 250 38 510 -121 713 -93 118 -234 213 -377 254 -101 29 -279 36
      -374 14z'
          />
        </g>
      </svg>
    )
  }

  render () {
    return (
      <div
        style={{
          width: `${this.tevoWindow.containerWidth}px`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div ref={spinnerContainer => (this.spinnerContainer = spinnerContainer)} />
        <div
          style={{
            display: 'flex'
          }}
        >
          <a onClick={() => this.mapZoom.zoomIn()} style={buttonStyle}>
            +
          </a>
          <a onClick={() => this.mapZoom.zoomOut()} style={buttonStyle}>
            ‐
          </a>
          <a style={Object.assign({}, buttonStyle, { paddingTop: '5px' })} onClick={() => this.mapZoom.reset()}>
            {this.renderHomeIcon()}
          </a>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div
              style={Object.assign({}, toggleText, {
                color: this.state.isZoneToggled ? '#007879' : 'gray'
              })}
            >
              Zone
            </div>
            <Toggle onToggle={on => this.setState({ isZoneToggled: !on })}>
              {({ on, getTogglerProps }) => (
                <span
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '60px',
                    height: '36px'
                  }}
                >
                  <input
                    type='checkbox'
                    style={{
                      width: '100%',
                      height: '100%',
                      margin: 0
                    }}
                    {...getTogglerProps()}
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
                      pointerEvents: 'none'
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '10px',
                        background: 'gray'
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
                        transform: on ? 'translateX(32px)' : 'translateX(2px)'
                      }}
                    />
                  </span>
                </span>
              )}
            </Toggle>
            <div
              style={Object.assign({}, toggleText, {
                color: this.state.isZoneToggled ? 'gray' : '#007879'
              })}
            >
              Section
            </div>
          </div>
        </div>
        <div
          id={'mapRoot'}
          style={{
            cursor: '-webkit-grab',
            width: this.tevoWindow.containerWidth
          }}
        />
        <div>
          Selected Sections:
          <ul className='list--tags'>{this.state.selectedSections.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
      </div>
    )
  }
}
