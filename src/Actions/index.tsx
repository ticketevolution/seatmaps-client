import React from 'react'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle, faPlus, faMinus, faUndoAlt } from '@fortawesome/free-solid-svg-icons'
import Legend from '../Legend'
import Button from '../Button'
import ActionGroup from './ActionGroup'
import { CostRange } from 'src/TicketMap'

interface Props {
  mapSvg: SVGSVGElement
  onClearSelection(): void
  showLegend: boolean
  ranges: CostRange[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface State {
  isMobile: boolean
}

const styles = {
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    opacity: 0.9,
    pointerEvents: 'none',
    whiteSpace: 'nowrap'
  },
  icon: {
    display: 'inline-block',
    fontSize: 'inherit',
    height: '1.333333333em',
    overflow: 'visible',
    verticalAlign: '-0.125em'
  }
}

export default class Actions extends React.Component<Props, State> {
  container?: HTMLDivElement | null
  mapZoom: any // eslint-disable-line @typescript-eslint/no-explicit-any
  timer?: number

  constructor (props: Props) {
    super(props)

    this.mapZoom = svgPanZoom(this.props.mapSvg, {
      minZoom: 0.8
    })
  }

  componentDidMount () {
    this.timer = window.setInterval(this.updateIsMobile, 200)
  }

  componentWillUnmount () {
    window.clearInterval(this.timer)
  }

  updateIsMobile = () => {
    this.setState({
      isMobile: this.container && this.container.clientWidth < 560
    })
  }

  render () {
    const { isMobile } = this.state

    return (
      <div style={styles.container} ref={ref => { this.container = ref }}>
        <ActionGroup>
          <Button
            data-rh='Default'
            data-custom-at='right'
            onClick={() => this.mapZoom.zoomIn()}
            style={{ borderRight: '2px solid lightgray' }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </Button>

          <Button
            onClick={() => this.mapZoom.zoomOut()}
            style={{ borderRight: '2px solid lightgray' }}
          >
            <FontAwesomeIcon icon={faMinus} />
          </Button>

          <Button
            onClick={() => this.mapZoom.reset()}
            style={{ borderRight: '2px solid lightgray' }}
          >
            <FontAwesomeIcon icon={faUndoAlt} style={{ marginRight: 8 }} />
            Reset Zoom
          </Button>

          <Button
            onClick={() => this.props.onClearSelection()}
            style={{ borderRight: isMobile ? '2px solid lightgray' : undefined }}
          >
            <FontAwesomeIcon icon={faTimesCircle} style={{ marginRight: 8 }} />
            <span>Clear All</span>
          </Button>

          {isMobile && this.props.showLegend && <Legend ranges={this.props.ranges} />}
        </ActionGroup>
        {!isMobile && <ActionGroup>
          {this.props.showLegend && <Legend ranges={this.props.ranges} />}
        </ActionGroup>}
      </div>
    )
  }
}
