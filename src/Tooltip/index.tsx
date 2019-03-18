import React, { Component, CSSProperties } from 'react'
import { NormalizedTicketGroup } from '../types'

const formatCurrency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD'
}).format

interface Props {
  isActive: boolean
  ticketGroups: NormalizedTicketGroup[],
  x: number
  y: number
  name: string,
  color: string
}

export default class Tooltip extends Component<Props> {
  container!: HTMLElement

  render () {
    const { isActive, ticketGroups, x, y, name, color } = this.props
    const prices = ticketGroups.map(ticketGroup => ticketGroup.price).sort((a, b) => a - b)

    const containerStyle: CSSProperties = {
      position: 'absolute',
      zIndex: 1,
      transition: 'top .1s, left .1s',
      opacity: isActive ? 1 : 0,
      padding: 5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      filter: 'drop-shadow(rgba(0, 0, 0, 0.5) 0 2px 2px)',
      pointerEvents: 'none'
    }

    let renderAboveTarget = true
    let renderRightOfTarget = true
    if (this.container && x !== undefined && y !== undefined) {
      if (this.container.parentElement && x + this.container.clientWidth > this.container.parentElement.clientWidth) {
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
        containerStyle.alignItems = 'flex-end'
      }
    }

    const tipStyle = {
      width: 0,
      height: 0,
      borderStyle: 'solid'
    }

    return (
      <div ref={element => { this.container = element as HTMLElement }} style={containerStyle}>
        {!renderAboveTarget && <div style={{
          ...tipStyle,
          borderWidth: renderRightOfTarget ? '10px 0 0 10px' : '0 0 10px 10px',
          borderColor: renderRightOfTarget ? 'transparent transparent transparent white' : 'transparent transparent white transparent'
        }} /> }
        <div style={{
          backgroundColor: 'white',
          padding: 20
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
            }} />
            {name}
          </div>
          <div>
            {prices.length} listing{prices.length !== 1 ? 's' : ''}
            {' ● '}
            Starting at <span style={{ fontWeight: 700 }}>{formatCurrency(prices[0])}</span>
          </div>
        </div>
        {renderAboveTarget && <div style={{
          ...tipStyle,
          borderWidth: renderRightOfTarget ? '10px 10px 0 0' : '0 10px 10px 0',
          borderColor: renderRightOfTarget ? 'white transparent transparent transparent' : 'transparent white transparent transparent'
        }} /> }
      </div>
    )
  }
}
