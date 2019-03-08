import React, { Component, CSSProperties } from 'react'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import Button from '../Button'
import ResetZoom from '../../assets/reset-zoom.svg'

interface Props {
  mapSvg: SVGSVGElement
  onClearSelection(): void
}

const buttonStyle: CSSProperties = {
  textAlign: 'center',
  fontSize: 24,
  fontWeight: 500
}

export default class Actions extends Component<Props> {
  mapZoom: any // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor (props: Props) {
    super(props)

    this.mapZoom = svgPanZoom(this.props.mapSvg, {
      minZoom: 0.8
    })
  }

  render () {
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
        <Button onClick={() => this.props.onClearSelection()}>
          <FontAwesomeIcon icon={faTimesCircle} style={{ marginRight: 5 }} />
          <span>Clear All</span>
        </Button>
      </div>
    )
  }
}
