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
      left: x,
      top: y,
      transition: 'opacity .3s',
      opacity: isActive ? 1 : 0,
      padding: '5px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0 2px 2px)',
      pointerEvents: 'none'
    }

    if (this.container && x !== undefined && x !== undefined) {
      containerStyle.top = y - this.container.clientHeight
      containerStyle.left = x - Math.floor(this.container.clientWidth / 2)
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
              marginRight: 5
            }}/>
              {name}
            </div>
          <div>
            {prices.length} listing{prices.length !== 1 ? 's' : ''}
            {' ● '}
            Starting at <span style={{ fontWeight: 700 }}>${prices[0]}</span>
          </div>
        </div>
        <div style={{
          border: '10px solid',
          borderColor: 'white transparent transparent',
          width: 0
        }} />
      </div>
    )
  }
}