import React from 'react'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'
import { faTimesCircle, faPlus, faMinus, faUndoAlt } from '@fortawesome/free-solid-svg-icons'
import Legend from '../Legend'
import Button from '../Button'
import ActionGroup from './ActionGroup'
import { CostRange } from 'src/TicketMap'

export interface Props {
  mapSvg: SVGSVGElement
  onClearSelection?: () => void
  showLegend?: boolean
  ranges: CostRange[]
}

interface DefaultProps {
  showLegend: boolean,
  onClearSelection(): void
}

interface State {
  isMobile: boolean
}

export default class Actions extends React.Component<Props & DefaultProps, State> {
  container?: HTMLDivElement | null
  mapZoom: any // eslint-disable-line @typescript-eslint/no-explicit-any
  timer?: number

  state: State = {
    isMobile: true
  }

  static defaultProps: DefaultProps = {
    showLegend: true,
    onClearSelection: () => {}
  }

  constructor (props: Props & DefaultProps) {
    super(props)

    this.mapZoom = svgPanZoom(this.props.mapSvg, {
      minZoom: 0.8
    })
  }

  get styles (): { [key: string]: React.CSSProperties } {
    return {
      container: {
        position: 'absolute',
        top: this.state.isMobile ? 0 : 10,
        left: this.state.isMobile ? 0 : 10,
        right: this.state.isMobile ? 0 : 10,
        bottom: this.state.isMobile ? 0 : 10,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        opacity: 0.9,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        fontSize: '0.75em'
      },
      icon: {
        display: 'inline-block',
        fontSize: 'inherit',
        height: '1.333333333em',
        overflow: 'visible',
        verticalAlign: '-0.125em'
      }
    }
  }

  componentDidMount () {
    this.timer = window.setInterval(this.updateIsMobile, 200)
  }

  componentWillUnmount () {
    window.clearInterval(this.timer)
  }

  updateIsMobile = () => {
    if (!this.container) {
      return
    }

    const isMobile = this.container.clientWidth < 700

    if (this.state.isMobile !== isMobile) {
      this.setState({ isMobile })
    }
  }

  render () {
    const { isMobile } = this.state

    return (
      <div style={this.styles.container} ref={ref => { this.container = ref }}>
        <ActionGroup>
          <Button
            data-rh='Default'
            data-custom-at='right'
            onClick={() => this.mapZoom.zoomIn()}
            icon={faPlus}
            isMobile={isMobile}
            style={{ borderRight: '2px solid lightgray' }}
          />

          <Button
            onClick={() => this.mapZoom.zoomOut()}
            icon={faMinus}
            isMobile={isMobile}
            style={{ borderRight: '2px solid lightgray' }}
          />

          <Button
            onClick={() => this.mapZoom.reset()}
            icon={faUndoAlt}
            text='Reset Zoom'
            isMobile={isMobile}
            style={{ borderRight: '2px solid lightgray' }}
          />

          <Button
            onClick={() => this.props.onClearSelection()}
            icon={faTimesCircle}
            text={`Clear${isMobile ? '' : ' All'}`}
            isMobile={isMobile}
            style={{ borderRight: isMobile ? '2px solid lightgray' : undefined }}
          />

          {isMobile && this.props.showLegend && <Legend isMobile ranges={this.props.ranges} />}
        </ActionGroup>
        {!isMobile && (
          <ActionGroup>
            {this.props.showLegend && <Legend ranges={this.props.ranges} />}
          </ActionGroup>
        )}
      </div>
    )
  }
}
