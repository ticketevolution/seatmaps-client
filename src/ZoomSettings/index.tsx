import React, { Component, CSSProperties } from 'react'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
import Button from '../Button'
import ResetZoom from '../../assets/reset-zoom.svg'

interface Props {
  mapSvg: SVGSVGElement
}

const buttonStyle: CSSProperties = {
  textAlign: 'center',
  fontSize: 24,
  fontWeight: 500
}

export default class ZoomSettings extends Component<Props> {
  mapZoom: any

  constructor(props: Props) {
    super(props)

    this.mapZoom = svgPanZoom(this.props.mapSvg, {
      minZoom: 0.8,
    })
  }

  render() {
    return (
      <div style={{ display: 'flex' }}>
        <Button
          style={buttonStyle}
          data-rh='Default'
          data-custom-at='right'
          onClick={() => this.mapZoom.zoomIn()}
        >+</Button>
        <Button
          style={buttonStyle}
          onClick={() => this.mapZoom.zoomOut()}
        >‐</Button>
        <Button
          style={{ ...buttonStyle, paddingTop: '8px' }}
          onClick={() => this.mapZoom.reset()}
        ><img src={ResetZoom} /></Button>
      </div>
    )
  }
}
