import { Component } from 'react'
import classnames from 'classnames'
import c from './tooltip.scss'

export default class Tooltip extends Component {
  render() {
    const { isActive, name, ticketGroups, className, x, y } = this.props

    const prices = ticketGroups
      .map(ticketGroup => parseFloat(ticketGroup.price))
      .sort((a, b) => a - b)

    const containerStyle = {}

    if (this.container && x !== undefined && y !== undefined) {
      containerStyle.top = y - this.container.clientHeight - 20
      containerStyle.left = x - (this.container.clientWidth / 2)
    }

    return (
      <div
        ref={element => { this.container = element }}
        className={classnames(c.tooltip, isActive && c.visible, className)}
        style={containerStyle}
      >
        <div>{name}</div>
        <div>
          {prices.length} listing{prices.length === 1 ? '' : 's'}
          {' ● '}
          Starting at <span className={c.price}>${prices[0]}</span>
        </div>
      </div>
    )
  }
}
