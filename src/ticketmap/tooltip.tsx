import { Component } from 'react'
import { TicketGroup } from './index'
import { mainContainerStyle } from './styles'

const SCREEN_BUFFER = 100
const TOOLTIP_BUFFER = 250

export const getTooltipX = (clientX: number) =>
  clientX - SCREEN_BUFFER < 0
    ? clientX
    : document.body.clientWidth - TOOLTIP_BUFFER < clientX
      ? clientX - TOOLTIP_BUFFER
      : clientX - 10

export const getTooltipY = (clientY: number) => clientY - SCREEN_BUFFER < 0 ? clientY + 50 : clientY - SCREEN_BUFFER

interface Props {
  isActive: boolean
  ticketGroups: TicketGroup[],
  clientX: number
  clientY: number
  name: string
}

export default class Tooltip extends Component<Props> {
  render() {
    const { isActive, ticketGroups, clientX, clientY, name } = this.props
    const prices = ticketGroups.map(ticketGroup => ticketGroup.price).sort((a, b) => a - b)

    return (
      <div
        style={{
          ...mainContainerStyle,
          left: getTooltipX(clientX),
          top: getTooltipY(clientY),
          transition: 'opacity .3s',
          opacity: isActive ? 1 : 0
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '4px',
            display: 'inlineBlock',
            filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0 2px 2px)',
            fontFamily: 'Open Sans, sans-serif',
            padding: '20px',
            position: 'relative'
          }}
        >
          <div style={{ color: '#181514', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'row', fontSize: '0.75em', padding: '0px' }}>
              <div>
                <div style={{ fontWeight: 400 }}>{name}</div>
                <div style={{ fontWeight: 400 }}>
                  {prices.length} listing{prices.length !== 1 ? 's' : ''}
                  {' ● '}
                  Starting at <span style={{ fontWeight: 700 }}>${prices[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}