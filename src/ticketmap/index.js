/* @flow */
/** @jsx h */

import { h, Component } from 'preact'
import fetch from 'unfetch'
import panzoom from 'panzoom'
import { Spinner } from 'spin.js'
import TicketEvolutionWindow from 'window'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'

type State = {
  mapSvg: string,
  ticketList: any,
  availableSections: Array<String>,
  unavailableSections: Array<String>
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

  constructor(props: any) {
    super(props)
    this.state = {
      mapSvg: '',
      ticketList: '',
      availableSections: [],
      unavailableSections: [],
      isMapLoaded: false
    }
  }

  componentDidMount() {
    // show spinner until map is loaded
    this.spinner = new Spinner({
      lines: 10, // The number of lines to draw
      speed: 2, // Rounds per second
      className: 'spinner', // The CSS class to assign to the spinner
      top: '150px', // Top position relative to parent
      left: '50%', // Left position relative to parent
      position: 'relative' // Element positioning
    }).spin(document.getElementById('mapRoot'))

    const mapURL = this.tevoWindow.venueId
      ? 'https://storage.googleapis.com/ticketevolution/maps/' +
        this.tevoWindow.venueId +
        '.svg'
      : 'https://storage.googleapis.com/ticketevolution/maps/not_available.svg'
    fetch(mapURL)
      .then(response =>
        response.text().then(mapHtmlString => {
          if (response.ok) {
            let mapRoot = document.getElementById('mapRoot')
            if (mapRoot) {
              mapRoot.innerHTML = mapHtmlString
            }
          } else {
            throw Error(
              'There was an error with your request, please try again'
            )
          }
        })
      )
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
                (mapWidth /
                  parseInt(
                    mapSvg.attributes.getNamedItem('height').nodeValue
                  ))}`
            )
          }
        }
      })
      .then(() => {
        if (this.tevoWindow.venueId) {
          this.setupMap()
        }
      })
      .catch(e => console.log('Message: ', e))
  }

  /*
      G - Zones
      Paths - Sections
      Desc - Tooltip Text
      Text
      - fontFamily (only)
  */

  setupMap() {
    // set font
    const rootElement = document && document.getElementById('rootElement')
    document
      .querySelectorAll('#rootElement text')
      .forEach(
        elem => (elem.style.fontFamily = `${this.tevoWindow.mapFontFamily}`)
      )

    // set color scheme
    document.querySelectorAll('#rootElement path').forEach(elem => {
      const fillColor = elem.attributes.getNamedItem('fill').nodeValue
      // primary (multiple primary cases here, should be removed once maps are standardized)
      if (
        [
          '#1f6b6b',
          '#067677',
          '#007879',
          '#156f6f',
          '#1f6b6b',
          '#176e6e',
          '#0c7374',
          '#0a7475',
          '#226a69',
          '#047778',
          '#0b7475',
          '#117172',
          '#1d6c6c',
          '#117171',
          '#097576',
          '#147070',
          '#077677',
          '#0d7374'
        ].includes(fillColor)
      ) {
        if (this.tevoWindow.primaryTicketFill.length) {
          elem.setAttribute('fill', this.tevoWindow.primaryTicketFill)
        }
      }
      switch (fillColor) {
        // unavailable
        case '#9E9E9E':
          if (this.tevoWindow.emptySectionFill.length) {
            elem.setAttribute('fill', this.tevoWindow.emptySectionFill)
          }
      }
    })

    // add hover styling, which includes tooltip
    rootElement &&
      rootElement.addEventListener('mouseover', ({ target }: any) => {
        const fillColor = target.attributes.getNamedItem('fill')
        const strokeColor = target.attributes.getNamedItem('stroke')
        if (fillColor && strokeColor) {
          // ensure we're hovering over a section && the section isn't selected
          if (
            ['#7ddaff'].includes(fillColor.nodeValue) &&
            strokeColor.nodeValue !== '#0125AC'
          ) {
            return target.setAttribute('fill', this.tevoWindow.hoverTicketFill)
          }
        }
      })

    // hover cleanup
    rootElement &&
      rootElement.addEventListener('mouseout', ({ target }: any) => {
        const fillColor = target.attributes.getNamedItem('fill')
        const strokeColor = target.attributes.getNamedItem('stroke')
        // ensure we're hovering over a section && the section isn't selected
        if (fillColor && strokeColor) {
          if (
            fillColor.nodeValue === this.tevoWindow.hoverTicketFill &&
            strokeColor.nodeValue !== '#0125AC'
          ) {
            target.setAttribute('fill', this.tevoWindow.primaryTicketFill)
          }
        }
      })

    // activate/deactivate section
    rootElement &&
      rootElement.addEventListener('click', ({ target }: any) => {
        const fillColor = target.attributes.getNamedItem('fill')

        if (fillColor) {
          // don't want to select an unavailable section
          if (fillColor !== '#6f6f6f') {
            if (
              [
                this.tevoWindow.primaryTicketFill,
                this.tevoWindow.selectedTicketFill
              ].includes(fillColor.nodeValue)
            ) {
              const isSectionSelected =
                target.attributes.getNamedItem('stroke').nodeValue === '#0125AC'
              target.setAttribute(
                'fill',
                isSectionSelected
                  ? this.tevoWindow.primaryTicketFill
                  : this.tevoWindow.selectedTicketFill
              )
              target.setAttribute(
                'stroke-width',
                isSectionSelected ? '0.4' : '3'
              )
              target.setAttribute(
                'stroke',
                isSectionSelected ? '#555' : '#0125AC'
              )
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

  renderHomeIcon() {
    return (
      <svg
        version="1.0"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          transform="translate(0.000000,200.000000) scale(0.100000,-0.100000)"
          fill="#007879"
          stroke="none"
        >
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
    )
  }

  render() {
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
    return (
      <div
        style={{
          width: `${this.tevoWindow.containerWidth}px`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          ref={spinnerContainer => (this.spinnerContainer = spinnerContainer)}
        />
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
          <a style={buttonStyle} onClick={() => this.mapZoom.reset()}>
            {this.renderHomeIcon()}
          </a>
        </div>
        <div
          id={'mapRoot'}
          style={{
            cursor: '-webkit-grab',
            width: this.tevoWindow.containerWidth
          }}
        />
        {/* Array of Selected Sections // Array of Unavailable Sections */}
        <div>
          <div>Available Sections: </div>
          <ul className="list--tags">
            {this.state.availableSections.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div>Unavailable Sections: {this.state.unavailableSections}</div>
        <div>Selected Sections: {this.state.unavailableSections}</div>
      </div>
    )
  }
}
