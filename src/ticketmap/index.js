/* @flow */
/** @jsx h */

import { h, Component } from 'preact'
import fetch from 'unfetch'
import panzoom from 'panzoom'

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

  constructor (props: any) {
    super(props)
    this.state = {
      mapSvg: '',
      ticketList: '',
      availableSections: [],
      unavailableSections: []
    }
  }

  componentDidMount () {
    // Should be API call to receive available ticket list for event
    // if a map is specified, load it, otherwise load the default (Lakers old court for now)
    const mapURL = window._ticketEvolution.ticketMapId
      ? 'https://storage.googleapis.com/ticketevolution/maps/' +
        window._ticketEvolution.ticketMapId +
        '.svg'
      : 'https://storage.googleapis.com/ticketevolution/maps/196_2656.svg'

    fetch(mapURL)
      .then(response =>
        response.text().then(mapHtmlString => {
          if (response.ok) {
            document
              .getElementById('mapRoot')
              .insertAdjacentHTML('afterbegin', mapHtmlString)
          }
        })
      )
      .then(() => {
        return fetch(
          'https://storage.googleapis.com/ticketevolution/ticketList.json'
        ).then(response => {
          response.json().then(json => {
            if (response.ok) {
              this.setState({
                ticketList: json,
                availableSections: json.filteredTickets.map(
                  list => list.section
                )
              })
            }
          })
        })
      })
      .then(() => this.setupMap())
  }

  /*
      G - Zones
      Paths - Sections
      Desc - Tooltip Text
      Text
      - fontFamily (only)
  */

  setupMap () {
    // set font
    const rootElement = document && document.getElementById('rootElement')
    document
      .querySelectorAll('#rootElement text')
      .forEach(
        elem =>
          (elem.style.fontFamily = `${window._ticketEvolution.mapFontFamily}`)
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
        if (window._ticketEvolution.primaryTicketColor.length) {
          elem.setAttribute('fill', window._ticketEvolution.primaryTicketColor)
        }
      }
      switch (fillColor) {
        // unavailable
        case '#9E9E9E':
          if (window._ticketEvolution.unavailableTicketColor.length) {
            elem.setAttribute(
              'fill',
              window._ticketEvolution.unavailableTicketColor
            )
          }
      }
    })

    // add hover styling, which includes tooltip

    document &&
      rootElement &&
      rootElement.addEventListener(
        'mouseover',
        ({ target }: SyntheticInputEvent<*>) => {
          const fillColor = target.attributes.getNamedItem('fill')
          const strokeColor = target.attributes.getNamedItem('stroke')
          if (fillColor && strokeColor) {
            // ensure we're hovering over a section && the section isn't selected
            if (
              ['#7ddaff'].includes(fillColor.nodeValue) &&
              strokeColor.nodeValue !== '#0125AC'
            ) {
              return target.setAttribute(
                'fill',
                window._ticketEvolution.hoverTicketColor
              )
            }
          }
        }
      )

    // hover cleanup
    document
      .getElementById('rootElement')
      .addEventListener('mouseout', ({ target }: SyntheticInputEvent<*>) => {
        const fillColor = target.attributes.getNamedItem('fill')
        const strokeColor = target.attributes.getNamedItem('stroke')
        // ensure we're hovering over a section && the section isn't selected
        if (fillColor && strokeColor) {
          if (
            fillColor.nodeValue === window._ticketEvolution.hoverTicketColor &&
            strokeColor.nodeValue !== '#0125AC'
          ) {
            target.setAttribute(
              'fill',
              window._ticketEvolution.primaryTicketColor
            )
          }
        }
      })

    // activate/deactivate section
    document
      .getElementById('rootElement')
      .addEventListener('click', ({ target }: SyntheticInputEvent<*>) => {
        const fillColor = target.attributes.getNamedItem('fill')

        if (fillColor) {
          // don't want to select an unavailable section
          if (fillColor !== '#6f6f6f') {
            if (
              [
                window._ticketEvolution.primaryTicketColor,
                window._ticketEvolution.selectedTicketColor
              ].includes(fillColor.nodeValue)
            ) {
              const isSectionSelected =
                target.attributes.getNamedItem('stroke').nodeValue === '#0125AC'
              target.setAttribute(
                'fill',
                isSectionSelected
                  ? window._ticketEvolution.primaryTicketColor
                  : window._ticketEvolution.selectedTicketColor
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
    panzoom(document.getElementById('rootElement'), {
      zoomSpeed: 0.1,
      zoomDoubleClickSpeed: 3,
      maxZoom: 10,
      minZoom: 1
    })
  }

  zoom (isZoomIn?: boolean) {
    let mapElement = document.getElementById('mapRoot')
    if (mapElement) {
      const currentZoom = parseFloat(mapElement.style.zoom)

      if (isZoomIn) {
        if (currentZoom) {
          mapElement.style.zoom = currentZoom + 0.6
        } else {
          mapElement.style.zoom = 1.6
        }
      } else {
        if (currentZoom && currentZoom > 1) {
          mapElement.style.zoom = currentZoom - 0.6
        }
      }
    }
  }

  render () {
    return (
      <div style={{ width: '100%', display: 'flex' }}>
        <div
          style={{
            position: 'relative',
            float: 'right',
            display: 'inline-block'
          }}
        >
          <div
            style={{
              width: '30px',
              zIndex: '10',
              borderRadius: '2px',
              boxShadow: '0 1px 2px rgba(0,0,0,.1)'
            }}
          >
            <a
              onClick={() => this.zoom(true)}
              style={{
                background: '#fff',
                color: '#1673e6',
                border: '1px solid #ccc',
                display: 'block',
                textAlign: 'center',
                padding: '7px 0',
                fontSize: '17px',
                textDecoration: 'none',
                fontWeight: '500',
                transition: '.2s',
                borderRadius: '2px 2px 0 0',
                cursor: 'pointer'
              }}
            >
              +
            </a>
            <a
              onClick={() => this.zoom()}
              style={{
                background: '#fff',
                color: '#1673e6',
                border: '1px solid #ccc',
                display: 'block',
                textAlign: 'center',
                padding: '7px 0',
                fontSize: '17px',
                textDecoration: 'none',
                fontWeight: '500',
                transition: '.2s',
                borderRadius: '2px 2px 0 0',
                cursor: 'pointer'
              }}
            >
              ‐
            </a>
          </div>
        </div>
        <div
          id={'mapRoot'}
          style={{
            cursor: '-webkit-grab'
          }}
        />
        {/* Array of Selected Sections // Array of Unavailable Sections */}
        <div>
          <div>Available Sections: </div>
          <ul className='list--tags'>
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
