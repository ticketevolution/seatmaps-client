import React, { Component } from 'react'
import PropTypes from 'prop-types'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
import { buttonStyle } from './styles'

export const resetZoom = (
  <svg
    version='1.0'
    xmlns='http://www.w3.org/2000/svg'
    width='20'
    height='20'
    viewBox='0 0 200 200'
    preserveAspectRatio='xMidYMid meet'
  >
    <g transform='translate(0.000000,200.000000) scale(0.100000,-0.100000)' fill='#4A4A4A' stroke='none'>
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

export default class ZoomSettings extends Component {
  static propTypes = {
    mapSvg: PropTypes.any.isRequired
  }

  constructor (props) {
    super(props)

    this.mapZoom = svgPanZoom(this.props.mapSvg, {
      zoomScaleSensitivity: 0.8,
      minZoom: 0.8,
      maxZoom: 10,
      center: true,
      fit: true,
      contain: false
    })
  }
  render () {
    return (
      <div style={{ display: 'flex' }}>
        <a
          data-rh='Default'
          data-custom-at='right'
          onClick={() => this.mapZoom.zoomIn()}
          style={buttonStyle}
        >+</a>
        <a
          onClick={() => this.mapZoom.zoomOut()}
          style={buttonStyle}
        >‐</a>
        <a
          style={{ ...buttonStyle, paddingTop: '5px' }}
          onClick={() => this.mapZoom.reset()}
        >{resetZoom}</a>
      </div>
    )
  }
}
