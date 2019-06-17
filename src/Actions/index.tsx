import React from 'react'
import { faTimesCircle, faPlus, faMinus, faUndoAlt } from '@fortawesome/free-solid-svg-icons'
import Legend from '../Legend'
import Button from '../Button'
import ActionGroup from './ActionGroup'
import { CostRange } from 'src/TicketMap'

export interface Props {
  onClearSelection?: () => void
  showLegend?: boolean
  showControls?: boolean
  ranges: CostRange[]
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

interface DefaultProps {
  showLegend: boolean,
  showControls: boolean
  onClearSelection(): void
}

interface State {
  isMobile: boolean
}

export default class Actions extends React.Component<Props & DefaultProps, State> {
  container = React.createRef<HTMLDivElement>()
  timer?: number

  state: State = {
    isMobile: true
  }

  static defaultProps: DefaultProps = {
    showLegend: true,
    showControls: true,
    onClearSelection: () => { }
  }

  get styles(): { [key: string]: React.CSSProperties } {
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

  componentDidMount() {
    this.timer = window.setInterval(this.updateIsMobile, 200)
  }

  componentWillUnmount() {
    window.clearInterval(this.timer)
  }

  updateIsMobile = () => {
    if (!this.container.current) {
      return
    }

    const isMobile = this.container.current.clientWidth < 700

    if (this.state.isMobile !== isMobile) {
      this.setState({ isMobile })
    }
  }

  render () {
    const { isMobile } = this.state
    const { showControls, showLegend } = this.props

    return (
      <div style={this.styles.container} ref={this.container}>
        <ActionGroup>
          {showControls && !isMobile && (
            <React.Fragment>
              <Button
                data-rh='Default'
                data-custom-at='right'
                onClick={() => this.props.onZoomIn()}
                icon={faPlus}
                isMobile={isMobile}
                style={{ borderRight: '2px solid lightgray' }}
                name='zoom-in'
              />

              <Button
                onClick={() => this.props.onZoomOut()}
                icon={faMinus}
                isMobile={isMobile}
                style={{ borderRight: '2px solid lightgray' }}
                name='zoom-out'
              />

              <Button
                onClick={() => this.props.onResetZoom()}
                icon={faUndoAlt}
                text='Reset Zoom'
                isMobile={isMobile}
                style={{ borderRight: '2px solid lightgray' }}
                name='reset-zoom'
              />
            </React.Fragment>
          )}
          {showControls && (
            <Button
              onClick={() => this.props.onClearSelection()}
              icon={faTimesCircle}
              text={`Clear${isMobile ? '' : ' All'}`}
              isMobile={isMobile}
              style={{ borderRight: isMobile ? '2px solid lightgray' : undefined }}
              name='clear-selection'
            />
          )}
          {isMobile && showLegend && <Legend isMobile ranges={this.props.ranges} />}
        </ActionGroup>
        {!isMobile && (
          <ActionGroup>
            {showLegend && <Legend ranges={this.props.ranges} />}
          </ActionGroup>
        )}
      </div>
    )
  }
}
