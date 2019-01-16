import { Component, CSSProperties } from 'react'
import { TicketGroup } from './index'
import { FlexDirectionProperty, PositionProperty, PointerEventsProperty } from 'csstype'

interface Props {
  isActive: boolean
  ticketGroups: TicketGroup[],
  x: number
  y: number
  name: string,
  color: string
}

export default class Tooltip extends Component<Props> {
  container: HTMLElement

  render() {
    const { isActive, ticketGroups, x, y, name, color } = this.props
    const prices = ticketGroups.map(ticketGroup => ticketGroup.price).sort((a, b) => a - b)

    const containerStyle: CSSProperties = {
      position: 'fixed',
      transition: 'opacity .3s',
      opacity: isActive ? 1 : 1,
      padding: 5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0 2px 2px)',
      pointerEvents: 'none'
    }

    let renderAboveTarget = true
    let renderRightOfTarget = true
    if (this.container && x !== undefined && x !== undefined) {
      if (x + this.container.clientWidth > this.container.parentElement.clientWidth) {
        renderRightOfTarget = false
      }

      if (y - this.container.clientHeight < 0) {
        renderAboveTarget = false
      }

      if (renderAboveTarget) {
        containerStyle.top = y - this.container.clientHeight
      } else {
        containerStyle.top = y
      }

      if (renderRightOfTarget) {
        containerStyle.left = x
      } else {
        containerStyle.left = x - this.container.clientWidth
      }
    }

    return (
      <div ref={element => {this.container = element}} style={containerStyle}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: 4,
          padding: 20,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              width: 10,
              height: 10,
              backgroundColor: color,
              display: 'inline-block',
              marginrenderRightOfTarget: 5
            }}/>
              {name}
            </div>
          <div>
            {prices.length} listing{prices.length !== 1 ? 's' : ''}
            {' ● '}
            Starting at <span style={{ fontWeight: 700 }}>${prices[0]}</span>
          </div>
        </div>
        {/* <div style={{
          border: '10px solid',
          borderColor: 'white transparent transparent',
          width: 0
        }} /> */}
      </div>
    )
  }
}