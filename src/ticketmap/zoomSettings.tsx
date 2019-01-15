import { Component } from 'react'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
import ResetZoom from '../../assets/reset-zoom.svg'
import { buttonStyle } from './styles'

interface Props {
  mapSvg: SVGSVGElement
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
          style={{ ...buttonStyle, paddingTop: '5px' }}
          onClick={() => this.mapZoom.reset()}
        ><img src={ResetZoom} /></a>
      </div>
    )
  }
}
