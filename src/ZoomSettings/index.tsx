import React, { Component } from 'react'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
import ResetZoom from '../../assets/reset-zoom.svg'

interface Props {
  mapSvg: SVGSVGElement
}

const buttonStyle: React.CSSProperties = {
  width: '40px',
  background: 'white',
  color: '#4A4A4A',
  border: '1px solid #E0E0E0',
  borderRadius: '8px',
  display: 'block',
  textAlign: 'center',
  fontSize: '24px',
  textDecoration: 'none',
  fontWeight: 500,
  cursor: 'pointer',
  lineHeight: 1.5,
}


export default class ZoomSettings extends Component<Props> {
  mapZoom: any

  constructor(props: Props) {
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

  render() {
    return (
      <div style={{
        display: 'flex',
        position: 'absolute'
      }}>
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
          style={{ ...buttonStyle, paddingTop: '8px' }}
          onClick={() => this.mapZoom.reset()}
        ><img src={ResetZoom} /></a>
      </div>
    )
  }
}
